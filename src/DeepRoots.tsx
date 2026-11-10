import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  PER_DAY, SECONDS, TIERS, TIER_ORDER, answerById, berkeleyDay, feetOf, loadRun, loadStreak, match, promptById, promptsFor, saveRun,
} from './deepRootsData'
import type { Pick, Prompt, Tier } from './deepRootsData'
import { confetti, gsap, prefersReduced } from './motion'
import { FUSE_MAX, FUSE_MIN, PartyRoom, cleanCode, newCode, partyConfigured } from './deepRootsParty'
import type { PartyView } from './deepRootsParty'

/* Deep Roots: seven campus prompts a day. The rarer your answer, the deeper your roots grow. */

type Mode = { kind: 'home' } | { kind: 'party' } | { kind: 'play'; day: number | null; prompts: Prompt[] } | { kind: 'done'; day: number | null; picks: Pick[] }

export default function DeepRoots() {
  const today = useMemo(() => berkeleyDay(), [])
  const [mode, setMode] = useState<Mode>(() => {
    const saved = loadRun(today)
    return saved ? { kind: 'done', day: today, picks: saved.picks } : { kind: 'home' }
  })
  const streak = loadStreak(today)

  const startDaily = () => {
    const saved = loadRun(today)
    if (saved) setMode({ kind: 'done', day: today, picks: saved.picks })
    else setMode({ kind: 'play', day: today, prompts: promptsFor(today) })
  }
  const startPractice = () => setMode({ kind: 'play', day: null, prompts: promptsFor(Math.floor(Math.random() * 1e9)) })
  const finish = (day: number | null, picks: Pick[]) => {
    if (day !== null) saveRun({ day, picks })
    setMode({ kind: 'done', day, picks })
  }

  return (
    <div className="roots-game">
      {mode.kind === 'home' && (
        <div className="rg-home">
          <RootsView picks={[]} />
          <div className="rg-home__copy">
          <p className="rg-lede">Seven prompts about campus. 25 seconds each. Name something that fits. The rarer your answer, the deeper your roots grow.</p>
          <div className="rg-actions">
            <button type="button" className="rg-btn" onClick={startDaily}>Grow today’s roots</button>
            <button type="button" className="rg-btn rg-btn--ghost" onClick={startPractice}>Practice round</button>
            <button type="button" className="rg-btn rg-btn--ghost" onClick={() => setMode({ kind: 'party' })}>Pass the acorn 🌰</button>
          </div>
          <p className="rg-meta">day #{today - DAY_ZERO} · streak {streak.current} · best {streak.best}</p>
          </div>
        </div>
      )}
      {mode.kind === 'party' && <Party onExit={() => setMode({ kind: 'home' })} />}
      {mode.kind === 'play' && <Round key={mode.prompts.map((p) => p.id).join()} prompts={mode.prompts} practice={mode.day === null} onDone={(picks) => finish(mode.day, picks)} />}
      {mode.kind === 'done' && (
        <Results
          picks={mode.picks}
          day={mode.day}
          streak={mode.day === null ? null : loadStreak(today)}
          onPractice={startPractice}
          onHome={() => setMode({ kind: 'home' })}
        />
      )}
    </div>
  )
}

/* Day #1 is the day Deep Roots opened. */
const DAY_ZERO = berkeleyDay(new Date('2026-11-08T20:00:00Z'))

/* ---------- one run of seven prompts ---------- */
function Round({ prompts, practice, onDone }: { prompts: Prompt[]; practice: boolean; onDone: (picks: Pick[]) => void }) {
  const [i, setI] = useState(0)
  const [picks, setPicks] = useState<Pick[]>([])
  const [guess, setGuess] = useState('')
  const [left, setLeft] = useState(SECONDS)
  const [flash, setFlash] = useState<{ text: string; tier: Tier | null } | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const deadline = useRef(Date.now() + SECONDS * 1000)
  const prompt = prompts[i]

  useEffect(() => {
    input.current?.focus({ preventScroll: true })
  }, [i])

  const lock = (text: string) => {
    if (flash) return
    const a = text.trim() ? match(prompt, text) : null
    const pick: Pick = { promptId: prompt.id, guess: text.trim(), answerId: a?.id ?? null }
    const next = [...picks, pick]
    setPicks(next)
    setFlash(a ? { text: `${a.name} · ${TIERS[a.tier].label} · +${TIERS[a.tier].ft} ft`, tier: a.tier } : { text: text.trim() ? `“${text.trim()}” isn’t on our list` : 'time’s up', tier: null })
    if (!prefersReduced() && !a && input.current) gsap.fromTo(input.current, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' })
    window.setTimeout(() => {
      setFlash(null)
      setGuess('')
      if (next.length >= prompts.length) return onDone(next)
      deadline.current = Date.now() + SECONDS * 1000
      setLeft(SECONDS)
      setI((n) => n + 1)
    }, a ? 1300 : 1500)
  }

  useEffect(() => {
    if (flash) return
    const id = window.setInterval(() => {
      const s = Math.max(0, (deadline.current - Date.now()) / 1000)
      setLeft(s)
      if (s <= 0) lock(input.current?.value ?? '')
    }, 200)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, flash])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (guess.trim()) lock(guess)
  }

  return (
    <div className="rg-play">
      <RootsView picks={picks} />
      <div className="rg-q">
        <p className="rg-meta">{practice ? 'practice · ' : ''}prompt {i + 1} of {prompts.length}</p>
        <h4 className="rg-prompt">{prompt.text}</h4>
        <div className="rg-timer" aria-hidden="true"><span style={{ width: `${(left / SECONDS) * 100}%` }} className={left < 6 ? 'is-low' : ''} /></div>
        <form className="rg-form" onSubmit={submit}>
          <label className="sr-only" htmlFor="rg-guess">Your answer</label>
          <input
            id="rg-guess" ref={input} className="rg-input" value={guess} onChange={(e) => setGuess(e.target.value)}
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} maxLength={60} disabled={!!flash} placeholder="type an answer"
          />
          <button type="submit" className="rg-btn" disabled={!!flash || !guess.trim()}>Plant it</button>
        </form>
        <div className="rg-foot">
          <p className={`rg-flash ${flash?.tier ? `is-${flash.tier}` : flash ? 'is-miss' : ''}`} role="status" aria-live="polite">
            {flash ? flash.text : `${Math.ceil(left)}s left`}
          </p>
          <button type="button" className="link-btn" onClick={() => lock('')} disabled={!!flash}>Skip</button>
        </div>
      </div>
    </div>
  )
}

/* ---------- results ---------- */
const SQUARE: Record<Tier, string> = { topsoil: '🟫', loam: '🟧', clay: '🟥', bedrock: '🟦', taproot: '🟨' }

function Results({ picks, day, streak, onPractice, onHome }: {
  picks: Pick[]; day: number | null; streak: { current: number; best: number } | null; onPractice: () => void; onHome: () => void
}) {
  const ft = feetOf(picks)
  const head = useRef<HTMLParagraphElement>(null)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (head.current && ft >= 250) confetti(head.current)
  }, [ft])

  const squares = picks.map((k) => {
    const a = answerById(promptById(k.promptId), k.answerId)
    return a ? SQUARE[a.tier] : '⬛'
  }).join('')
  const share = async () => {
    const text = `Deep Roots${day !== null ? ` #${day - DAY_ZERO}` : ' (practice)'}: ${ft} ft\n${squares}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      window.prompt('Copy your roots:', text)
    }
  }

  return (
    <div className="rg-play rg-done">
      <RootsView picks={picks} />
      <div className="rg-q">
        <p className="rg-meta">{day === null ? 'practice round' : `day #${day - DAY_ZERO}`}{streak ? ` · streak ${streak.current} · best ${streak.best}` : ''}</p>
        <p className="rg-total" ref={head}><b>{ft}</b> ft of roots</p>
        <p className="rg-squares" aria-hidden="true">{squares}</p>
        <ol className="rg-list">
          {picks.map((k) => {
            const p = promptById(k.promptId)
            const a = answerById(p, k.answerId)
            const rare = p.answers.filter((x) => x.tier === 'taproot' && x.id !== a?.id)[0] ?? p.answers.filter((x) => x.tier === 'bedrock')[0]
            return (
              <li key={k.promptId}>
                <span className="rg-list__p">{p.text}</span>
                <span className={`rg-list__a ${a ? `is-${a.tier}` : 'is-miss'}`}>
                  {a ? `${a.name} · ${TIERS[a.tier].label} +${TIERS[a.tier].ft}` : k.guess ? `“${k.guess}” · no root` : 'skipped'}
                </span>
                {rare && <span className="rg-list__rare">deep pick: {rare.name}</span>}
              </li>
            )
          })}
        </ol>
        <div className="rg-actions">
          <button type="button" className="rg-btn" onClick={share}>{copied ? 'Copied' : 'Share your roots'}</button>
          <button type="button" className="rg-btn rg-btn--ghost" onClick={onPractice}>Practice round</button>
          <button type="button" className="link-btn" onClick={onHome}>Back</button>
        </div>
        {day !== null && <p className="rg-meta">new prompts at midnight, Berkeley time.</p>}
      </div>
    </div>
  )
}

/* ---------- the cross-section: soil strata, a sprout, one root per answer ---------- */
const W = 320, GROUND = 46, H = 330
const depthOf = (ft: number) => 26 + ft * 2.6

export function RootsView({ picks, total = PER_DAY }: { picks: Pick[]; total?: number }) {
  return (
    <svg className="rg-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${picks.length} of ${total} roots grown, ${feetOf(picks)} feet deep`}>
      <defs>
        <linearGradient id="rg-soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b3f6e" />
          <stop offset="1" stopColor="#001a33" />
        </linearGradient>
      </defs>
      <rect x="0" y={GROUND} width={W} height={H - GROUND} fill="url(#rg-soil)" />
      {TIER_ORDER.map((t) => {
        const y = GROUND + depthOf(TIERS[t].ft)
        return (
          <g key={t} className="rg-stratum">
            <line x1="0" x2={W} y1={y} y2={y} />
            <text x={W - 6} y={y - 4} textAnchor="end">{TIERS[t].label.toLowerCase()}</text>
          </g>
        )
      })}
      <path className="rg-ground" d={`M0 ${GROUND} C ${W * 0.3} ${GROUND - 4}, ${W * 0.6} ${GROUND + 4}, ${W} ${GROUND - 1}`} />
      <g className="rg-sprout">
        <path d={`M160 ${GROUND} C 158 ${GROUND - 14}, 162 ${GROUND - 22}, 160 ${GROUND - 30}`} />
        <path className="rg-leaf" d={`M160 ${GROUND - 26} C 146 ${GROUND - 40}, 132 ${GROUND - 30}, 134 ${GROUND - 22} C 146 ${GROUND - 18}, 154 ${GROUND - 20}, 160 ${GROUND - 26} Z`} />
        <path className="rg-leaf" d={`M160 ${GROUND - 30} C 172 ${GROUND - 46}, 190 ${GROUND - 38}, 188 ${GROUND - 30} C 178 ${GROUND - 24}, 168 ${GROUND - 26}, 160 ${GROUND - 30} Z`} />
      </g>
      {picks.map((k, i) => {
        const a = answerById(promptById(k.promptId), k.answerId)
        const n = Math.max(total, picks.length)
        const len = a ? depthOf(TIERS[a.tier].ft) : 14
        const endX = 160 + ((i - (n - 1) / 2) * 40 + (i % 2 ? 8 : -8)) * Math.min(1, 0.35 + len / 160)
        const y1 = GROUND + 2
        const y2 = GROUND + len
        const d = `M160 ${y1} C 160 ${y1 + len * 0.35}, ${endX} ${y1 + len * 0.4}, ${endX} ${y2}`
        const fork = a && (a.tier === 'bedrock' || a.tier === 'taproot')
        return (
          <g key={i} className={`rg-root ${a ? `is-${a.tier}` : 'is-miss'}`}>
            <path d={d} pathLength={1} />
            {fork && <path d={`M${endX} ${y2 - len * 0.35} q ${i % 2 ? 16 : -16} 10 ${i % 2 ? 22 : -22} 30`} pathLength={1} className="rg-fork" />}
          </g>
        )
      })}
    </svg>
  )
}

/* ---------- Pass the Acorn: the party mode ---------- */
const NAME_KEY = 'deeproots:name'
const savedName = () => {
  try {
    return localStorage.getItem(NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

function Party({ onExit }: { onExit: () => void }) {
  const [seat, setSeat] = useState<{ code: string; name: string } | null>(null)
  const [room, setRoom] = useState<PartyRoom | null>(null)
  const [view, setView] = useState<PartyView | null>(null)
  const [name, setName] = useState(savedName)
  const [code, setCode] = useState(() => cleanCode(new URLSearchParams(location.search).get('acorn') ?? ''))

  /* The room lives exactly as long as this effect, so StrictMode's double run can't strand it. */
  useEffect(() => {
    if (!seat) return
    const r = new PartyRoom(seat.code, seat.name)
    setRoom(r)
    const off = r.subscribe(setView)
    return () => {
      off()
      r.leave()
      setRoom(null)
      setView(null)
    }
  }, [seat])

  if (!partyConfigured) {
    return (
      <div className="rg-party">
        <h4 className="rg-prompt">Pass the acorn</h4>
        <p className="rg-lede">Party mode needs a realtime backend. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env.local</code> and rebuild. Single-player works without them.</p>
        <div className="rg-actions"><button type="button" className="link-btn" onClick={onExit}>Back</button></div>
      </div>
    )
  }

  const join = (c: string) => {
    const n = name.trim().slice(0, 16) || 'bear'
    try {
      localStorage.setItem(NAME_KEY, n)
    } catch { /* fine */ }
    setSeat({ code: c, name: n })
  }

  if (!room || !view) {
    return (
      <div className="rg-party">
        <h4 className="rg-prompt">Pass the acorn</h4>
        <p className="rg-lede">One category. Name something that fits and hasn’t been said, and the acorn moves on. A hidden fuse ({FUSE_MIN} to {FUSE_MAX} seconds) is ticking. Holding the acorn when it drops? You’re out.</p>
        <label className="rg-field"><span className="rg-meta">your name</span>
          <input className="rg-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={16} placeholder="oski fan #1" />
        </label>
        <div className="rg-actions">
          <button type="button" className="rg-btn" onClick={() => join(newCode())}>Start a room</button>
          <span className="rg-or">or</span>
          <input className="rg-input rg-input--code" value={code} onChange={(e) => setCode(cleanCode(e.target.value))} placeholder="CODE" aria-label="Room code" />
          <button type="button" className="rg-btn rg-btn--ghost" disabled={code.length !== 4} onClick={() => join(code)}>Join</button>
        </div>
        <div className="rg-actions"><button type="button" className="link-btn" onClick={onExit}>Back</button></div>
      </div>
    )
  }

  return <PartyTable room={room} view={view} onLeave={() => setSeat(null)} />
}

function PartyTable({ room, view, onLeave }: { room: PartyRoom; view: PartyView; onLeave: () => void }) {
  const { state: s, me, players, hostId, status, code } = view
  const [guess, setGuess] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const acorn = useRef<HTMLSpanElement>(null)
  const mine = s.phase === 'playing' && s.holder === me
  const isHost = hostId === me
  const nameOf = (id: string | null) => (id ? s.names[id] ?? players.find((p) => p.id === id)?.name ?? 'someone' : 'nobody')
  const prompt = promptById(s.promptId)

  useEffect(() => {
    if (mine) input.current?.focus({ preventScroll: true })
  }, [mine])
  useEffect(() => {
    if (!s.beat || !acorn.current || prefersReduced()) return
    if (s.beat.kind === 'ok') gsap.fromTo(acorn.current, { y: -18, rotation: -30 }, { y: 0, rotation: 0, duration: 0.5, ease: 'bounce.out' })
    if (s.beat.kind === 'drop') gsap.fromTo(acorn.current, { scale: 1.8 }, { scale: 1, duration: 0.6, ease: 'back.out(3)' })
    if (s.beat.kind === 'win') confetti(acorn.current)
  }, [s.seq, s.beat])

  const beat = !s.beat ? '' : {
    start: `${nameOf(s.beat.by)} starts with the acorn.`,
    ok: `${nameOf(s.beat.by)}: ${s.beat.text} ✓`,
    nope: `${nameOf(s.beat.by)}: “${s.beat.text}” doesn’t count.`,
    dupe: `${nameOf(s.beat.by)}: ${s.beat.text} was already said.`,
    drop: `The acorn dropped on ${nameOf(s.beat.by)}. Out!`,
    left: `${nameOf(s.beat.by)} left the room.`,
    win: `${nameOf(s.beat.by)} is the last one standing.`,
  }[s.beat.kind]

  const submit = (e: FormEvent) => {
    e.preventDefault()
    room.answer(guess)
    setGuess('')
  }
  const share = async () => {
    const url = `${location.origin}${location.pathname}?acorn=${code}#games`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      window.prompt('Share this link:', url)
    }
  }

  return (
    <div className="rg-party">
      <div className="rg-party__top">
        <p className="rg-meta">room <b className="rg-code">{code}</b> · {status === 'live' ? `${players.length} here` : status === 'error' ? 'connection lost' : 'connecting…'}</p>
        <div className="rg-actions">
          <button type="button" className="link-btn" onClick={share}>Copy invite link</button>
          <button type="button" className="link-btn" onClick={onLeave}>Leave</button>
        </div>
      </div>
      <ul className="rg-seats">
        {(s.phase === 'lobby' ? players.map((p) => p.id) : s.order).map((id) => {
          const out = s.phase !== 'lobby' && !s.alive.includes(id)
          return (
            <li key={id} className={`rg-seat ${out ? 'is-out' : ''} ${s.holder === id ? 'is-holder' : ''} ${id === me ? 'is-me' : ''}`}>
              {s.holder === id && <span className="rg-acorn" ref={acorn} aria-label="has the acorn">🌰</span>}
              {s.phase === 'over' && s.winner === id && <span className="rg-acorn" ref={acorn} aria-label="winner">🏆</span>}
              <span>{nameOf(id)}{id === me ? ' (you)' : ''}</span>
              {id === hostId && <span className="rg-seat__tag">host</span>}
            </li>
          )
        })}
      </ul>

      {s.phase === 'lobby' && (
        <div className="rg-q">
          <p className="rg-lede">Share the code <b>{code}</b> with friends. The game starts once two or more people are in.</p>
          {isHost
            ? <div className="rg-actions"><button type="button" className="rg-btn" disabled={players.length < 2} onClick={() => room.start()}>Start the game</button></div>
            : <p className="rg-meta">{hostId ? `waiting for ${nameOf(hostId)} to start…` : status === 'error' ? 'couldn’t reach the party server. try again in a bit.' : 'joining the room…'}</p>}
        </div>
      )}

      {s.phase === 'playing' && (
        <div className="rg-q">
          <p className="rg-meta">round {s.round} · {s.alive.length} still standing</p>
          <h4 className="rg-prompt">{prompt.text}</h4>
          <form className="rg-form" onSubmit={submit}>
            <label className="sr-only" htmlFor="rg-party-guess">Your answer</label>
            <input
              id="rg-party-guess" ref={input} className="rg-input" value={guess} onChange={(e) => setGuess(e.target.value)} disabled={!mine}
              autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} maxLength={60}
              placeholder={mine ? 'quick, name one!' : `${nameOf(s.holder)} has the acorn`}
            />
            <button type="submit" className="rg-btn" disabled={!mine || !guess.trim()}>Pass it</button>
          </form>
          <p className={`rg-flash ${s.beat?.kind === 'ok' ? 'is-loam' : s.beat ? 'is-miss' : ''}`} role="status" aria-live="polite">{beat}</p>
          {s.used.length > 0 && (
            <p className="rg-used">said: {s.used.map((id) => prompt.answers.find((a) => a.id === id)?.name).filter(Boolean).join(' · ')}</p>
          )}
        </div>
      )}

      {s.phase === 'over' && (
        <div className="rg-q">
          <p className="rg-total"><b>{nameOf(s.winner)}</b> wins</p>
          <p className="rg-flash" role="status">{beat}</p>
          {isHost
            ? <div className="rg-actions"><button type="button" className="rg-btn" onClick={() => room.reset()}>Back to the lobby</button></div>
            : <p className="rg-meta">waiting for {nameOf(hostId)} to start another…</p>}
        </div>
      )}
    </div>
  )
}
