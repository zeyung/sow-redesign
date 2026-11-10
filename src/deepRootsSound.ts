import type { Tier } from './deepRootsData'

/* Deep Roots sound effects, synthesized with Web Audio (no audio files to download).
   Each rarity climbs: a soft blip for Common up to a two-octave rainbow run for Prismatic.
   The mute choice is remembered in this browser. */

const MUTE_KEY = 'deeproots:muted'
let ctx: AudioContext | null = null
let master: GainNode | null = null

export function isMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}
export function setMuted(m: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, m ? '1' : '0')
  } catch { /* fine */ }
}

function audio() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.32
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/* Call from a click or key handler so browsers allow sound later on (timeouts included). */
export function unlockSound() {
  if (!isMuted()) audio()
}

type Note = { f: number; at: number; dur: number; type?: OscillatorType; vol?: number; glide?: number; vibrato?: number }

function play(notes: Note[]) {
  const c = audio()
  if (!c || !master) return
  const t0 = c.currentTime + 0.01
  for (const n of notes) {
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = n.type ?? 'sine'
    const start = t0 + n.at
    o.frequency.setValueAtTime(n.f, start)
    if (n.glide) o.frequency.exponentialRampToValueAtTime(n.glide, start + n.dur)
    if (n.vibrato) {
      const lfo = c.createOscillator()
      const depth = c.createGain()
      lfo.frequency.value = 7
      depth.gain.value = n.vibrato
      lfo.connect(depth).connect(o.frequency)
      lfo.start(start)
      lfo.stop(start + n.dur + 0.05)
    }
    const v = n.vol ?? 0.5
    g.gain.setValueAtTime(0.0001, start)
    g.gain.exponentialRampToValueAtTime(v, start + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, start + n.dur)
    o.connect(g).connect(master)
    o.start(start)
    o.stop(start + n.dur + 0.05)
  }
}

/* note helper: semitones above A4 */
const hz = (semi: number) => 440 * 2 ** (semi / 12)
const C5 = 3, D5 = 5, E5 = 7, G5 = 10, A5 = 12, B5 = 14, C6 = 15, E6 = 19, G6 = 22, C7 = 27
const arp = (notes: number[], step: number, dur: number, type: OscillatorType = 'triangle', vol = 0.45, from = 0): Note[] =>
  notes.map((s, i) => ({ f: hz(s), at: from + i * step, dur, type, vol }))

const SOUNDS: Record<Tier | 'miss', Note[]> = {
  miss: [{ f: 196, glide: 98, at: 0, dur: 0.22, type: 'sine', vol: 0.45 }, { f: 147, glide: 82, at: 0.08, dur: 0.22, type: 'triangle', vol: 0.2 }],
  common: [{ f: hz(C5), at: 0, dur: 0.16, type: 'sine', vol: 0.4 }],
  uncommon: arp([C5, E5], 0.08, 0.18, 'sine', 0.42),
  rare: arp([C5, E5, G5], 0.07, 0.22, 'triangle', 0.4),
  epic: [...arp([C5, E5, G5, B5], 0.065, 0.28, 'triangle', 0.4), { f: hz(B5 - 24), at: 0, dur: 0.4, type: 'sine', vol: 0.3 }],
  legendary: [
    { f: hz(C5 - 24), at: 0, dur: 0.5, type: 'sine', vol: 0.5, glide: hz(C5 - 26) },
    ...arp([C5, E5, G5, C6], 0.06, 0.32, 'square', 0.14),
    ...arp([C5, E5, G5, C6], 0.06, 0.34, 'triangle', 0.36),
  ],
  exotic: [
    ...arp([E5, B5, E6, G6], 0.07, 0.4, 'sine', 0.38),
    { f: hz(E6 + 12), at: 0.3, dur: 0.6, type: 'sine', vol: 0.22, vibrato: 18 },
    { f: hz(E6 + 12) * 1.006, at: 0.3, dur: 0.6, type: 'sine', vol: 0.18, vibrato: 14 },
  ],
  mythic: [
    { f: hz(C5 - 24), at: 0, dur: 0.8, type: 'sine', vol: 0.5 },
    ...arp([G5 - 12, C5, E5, G5], 0.09, 0.7, 'sawtooth', 0.09),
    ...arp([G5 - 12, C5, E5, G5], 0.09, 0.75, 'triangle', 0.32),
    { f: hz(C7), at: 0.4, dur: 0.9, type: 'sine', vol: 0.2 },
    { f: hz(G6), at: 0.4, dur: 0.9, type: 'sine', vol: 0.16 },
  ],
  prismatic: [
    { f: hz(C5 - 24), at: 0, dur: 1.2, type: 'sine', vol: 0.45 },
    ...arp([C5, D5, E5, G5, A5, C6, D5 + 12, E6, G6, A5 + 12, C7], 0.045, 0.5, 'triangle', 0.3),
    ...arp([C5, E5, G5, C6], 0, 1.3, 'sawtooth', 0.06, 0.5),
    ...arp([C5, E5, G5, C6, E6], 0, 1.3, 'sine', 0.16, 0.5),
    ...[0.62, 0.78, 0.9, 1.05, 1.2].map((at, i) => ({ f: hz(C7 + [0, 4, 7, 12, 7][i]), at, dur: 0.18, type: 'sine' as OscillatorType, vol: 0.14 })),
  ],
}

export function playTier(tier: Tier | null) {
  if (isMuted()) return
  play(SOUNDS[tier ?? 'miss'])
}
