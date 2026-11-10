import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { PROMPTS, match, promptById, shuffled } from './deepRootsData'

/* Pass the Acorn: Deep Roots' party mode. Everyone in a room shares one category. Whoever holds
   the acorn names an answer that fits and hasn't been said yet, and the acorn moves on. A hidden
   fuse is ticking the whole time; whoever is holding the acorn when it drops is out. Last one
   standing wins.

   Runs on Supabase Realtime from the browser (the site is static): presence keeps the player
   list, broadcast carries answers and game state. The earliest player in the room is the host:
   it owns the fuse, checks answers and broadcasts the state, so every client agrees. */

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
export const partyConfigured = Boolean(URL && KEY)
let client: SupabaseClient | null = null
/* Loaded on first use so single-player visitors never download the Supabase client. */
export const supabase = async () => (client ??= (await import('@supabase/supabase-js')).createClient(URL!, KEY!))

export const FUSE_MIN = 10
export const FUSE_MAX = 30
export const GRACE = 4 /* a fresh holder always gets at least this many seconds */
const BREATHER = 3 /* pause after a drop before the next fuse starts counting */

export type Player = { id: string; name: string; joinedAt: number }
export type Beat = { kind: 'start' | 'ok' | 'nope' | 'dupe' | 'drop' | 'left' | 'win'; by: string; text?: string }
export type PartyState = {
  phase: 'lobby' | 'playing' | 'over'
  order: string[]
  alive: string[]
  holder: string | null
  promptId: string
  used: string[]
  round: number
  beat: Beat | null
  winner: string | null
  names: Record<string, string>
  seq: number
}
export type PartyView = {
  status: 'connecting' | 'live' | 'error'
  me: string
  code: string
  players: Player[]
  hostId: string | null
  state: PartyState
}

const LOBBY: PartyState = { phase: 'lobby', order: [], alive: [], holder: null, promptId: PROMPTS[0].id, used: [], round: 0, beat: null, winner: null, names: {}, seq: 0 }

const CODE_ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ'
export const newCode = () => Array.from({ length: 4 }, () => CODE_ABC[Math.floor(Math.random() * CODE_ABC.length)]).join('')
export const cleanCode = (s: string) => s.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2))

export class PartyRoom {
  readonly me = uid()
  private channel: RealtimeChannel | null = null
  private gone = false
  private view: PartyView
  private listeners = new Set<(v: PartyView) => void>()
  private fuseTimer = 0
  private fuseAt = 0
  private joinedAt = Date.now()

  constructor(readonly code: string, private name: string) {
    this.view = { status: 'connecting', me: this.me, code, players: [], hostId: null, state: LOBBY }
    void this.connect()
  }

  private async connect() {
    let sb: SupabaseClient
    try {
      sb = await supabase()
    } catch {
      return this.set({ status: 'error' })
    }
    if (this.gone) return
    const ch = sb.channel(`deeproots-party-${this.code}`, { config: { broadcast: { self: true }, presence: { key: this.me } } })
    this.channel = ch
    ch
      .on('presence', { event: 'sync' }, () => this.onPresence())
      .on('broadcast', { event: 'state' }, ({ payload }) => this.onState(payload as PartyState))
      .on('broadcast', { event: 'answer' }, ({ payload }) => this.onAnswer(payload as { from: string; text: string }))
      .on('broadcast', { event: 'hello' }, () => this.isHost() && this.publish(this.view.state))
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await ch.track({ id: this.me, name: this.name, joinedAt: this.joinedAt } satisfies Player)
          this.set({ status: 'live' })
          void ch.send({ type: 'broadcast', event: 'hello', payload: {} })
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.set({ status: 'error' })
        }
      })
  }

  subscribe(fn: (v: PartyView) => void) {
    this.listeners.add(fn)
    fn(this.view)
    return () => void this.listeners.delete(fn)
  }

  leave() {
    this.gone = true
    clearTimeout(this.fuseTimer)
    this.listeners.clear()
    const ch = this.channel
    if (ch) void ch.untrack().finally(() => client?.removeChannel(ch))
  }

  /* ---------- anyone ---------- */
  answer(text: string) {
    const t = text.trim().slice(0, 60)
    if (t) void this.channel?.send({ type: 'broadcast', event: 'answer', payload: { from: this.me, text: t } })
  }

  start() {
    if (!this.isHost() || this.view.players.length < 2) return
    const order = this.view.players.map((p) => p.id)
    const names = Object.fromEntries(this.view.players.map((p) => [p.id, p.name]))
    const holder = order[Math.floor(Math.random() * order.length)]
    this.publish({ ...this.view.state, phase: 'playing', order, alive: order, holder, names, round: 1, used: [], promptId: this.pickPrompt(), winner: null, beat: { kind: 'start', by: holder } })
    this.lightFuse(0)
  }

  reset() {
    if (!this.isHost()) return
    clearTimeout(this.fuseTimer)
    this.publish({ ...LOBBY, seq: this.view.state.seq })
  }

  /* ---------- incoming ---------- */
  private onPresence() {
    if (!this.channel) return
    const raw = this.channel.presenceState<Player>()
    const players = Object.values(raw)
      .map((list) => list[0])
      .filter(Boolean)
      .map(({ id, name, joinedAt }) => ({ id, name, joinedAt }))
      .sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id))
    const wasHost = this.isHost()
    this.set({ players, hostId: players[0]?.id ?? null })
    if (!this.isHost()) return
    const s = this.view.state
    /* players who left mid-game drop out */
    if (s.phase === 'playing') {
      const here = new Set(players.map((p) => p.id))
      const gone = s.alive.filter((id) => !here.has(id))
      if (gone.length) {
        const alive = s.alive.filter((id) => here.has(id))
        const holder = s.holder && here.has(s.holder) ? s.holder : this.nextAfter(s.holder, s.order, alive)
        if (alive.length <= 1) return this.finish({ ...s, alive }, alive[0] ?? null)
        this.publish({ ...s, alive, holder, beat: { kind: 'left', by: gone[0] } })
        if (holder !== s.holder) this.lightFuse(0, true)
      }
      if (!wasHost) this.lightFuse(0) /* the old host left and took its fuse with it */
    } else {
      this.publish(s)
    }
  }

  private onState(s: PartyState) {
    if (s.seq <= this.view.state.seq) return
    this.set({ state: s })
  }

  private onAnswer({ from, text }: { from: string; text: string }) {
    if (!this.isHost()) return
    const s = this.view.state
    if (s.phase !== 'playing' || from !== s.holder) return
    const a = match(promptById(s.promptId), text)
    if (!a) return this.publish({ ...s, beat: { kind: 'nope', by: from, text } })
    if (s.used.includes(a.id)) return this.publish({ ...s, beat: { kind: 'dupe', by: from, text: a.name } })
    const holder = this.nextAfter(from, s.order, s.alive)
    this.publish({ ...s, used: [...s.used, a.id], holder, beat: { kind: 'ok', by: from, text: a.name } })
    if (this.fuseAt - Date.now() < GRACE * 1000) this.lightFuse(0, true)
  }

  /* ---------- host only ---------- */
  private lightFuse(delay: number, graceOnly = false) {
    clearTimeout(this.fuseTimer)
    const ms = graceOnly ? GRACE * 1000 : delay * 1000 + (FUSE_MIN + Math.random() * (FUSE_MAX - FUSE_MIN)) * 1000
    this.fuseAt = Date.now() + ms
    this.fuseTimer = window.setTimeout(() => this.drop(), ms)
  }

  private drop() {
    if (!this.isHost()) return
    const s = this.view.state
    if (s.phase !== 'playing' || !s.holder) return
    const out = s.holder
    const alive = s.alive.filter((id) => id !== out)
    if (alive.length <= 1) return this.finish({ ...s, alive, beat: { kind: 'drop', by: out } }, alive[0] ?? null)
    const holder = this.nextAfter(out, s.order, alive)
    this.publish({ ...s, alive, holder, round: s.round + 1, used: [], promptId: this.pickPrompt(s.promptId), beat: { kind: 'drop', by: out } })
    this.lightFuse(BREATHER)
  }

  private finish(s: PartyState, winner: string | null) {
    clearTimeout(this.fuseTimer)
    this.publish({ ...s, phase: 'over', holder: null, winner, beat: winner ? { kind: 'win', by: winner } : s.beat })
  }

  private pickPrompt(not?: string) {
    return shuffled(PROMPTS.filter((p) => p.id !== not), Math.floor(Math.random() * 1e9))[0].id
  }

  private nextAfter(id: string | null, order: string[], alive: string[]) {
    if (!alive.length) return null
    const start = id ? order.indexOf(id) : -1
    for (let k = 1; k <= order.length; k++) {
      const cand = order[(start + k + order.length) % order.length]
      if (alive.includes(cand)) return cand
    }
    return alive[0]
  }

  private publish(s: PartyState) {
    const next = { ...s, seq: Math.max(s.seq, this.view.state.seq) + 1 }
    this.set({ state: next })
    void this.channel?.send({ type: 'broadcast', event: 'state', payload: next })
  }

  private isHost() {
    return this.view.hostId === this.me
  }

  private set(patch: Partial<PartyView>) {
    this.view = { ...this.view, ...patch }
    this.listeners.forEach((l) => l(this.view))
  }
}
