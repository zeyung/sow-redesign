import { useEffect, useRef, useState } from 'react'
import { usePaused, useReduced } from './motion'

/* Hand-drawn SVG pieces. Everything here is decoration: aria-hidden, no words that matter. */

/* The "boiling line" filter: a shimmer that makes ink look hand-drawn frame to frame. */
export function InkDefs() {
  const ref = useRef<SVGSVGElement>(null)
  const paused = usePaused()
  const reduced = useReduced()
  useEffect(() => {
    const s = ref.current
    if (!s) return
    if (paused || reduced) s.pauseAnimations()
    else s.unpauseAnimations()
  }, [paused, reduced])
  return (
    <svg ref={ref} width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="boil" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="1" result="n">
            <animate attributeName="seed" values="1;4;7;2" dur="0.6s" calcMode="discrete" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3" />
        </filter>
        <filter id="crayon">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="g" />
          <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.25" result="m" />
          <feComposite in="SourceGraphic" in2="m" operator="in" />
        </filter>
      </defs>
    </svg>
  )
}

export type Kind = 'pip' | 'mo' | 'juno' | 'sprout'
const FACE: Record<Kind, string> = { pip: '#ffd12e', mo: '#6fb6ff', juno: '#ff8cc6', sprout: '#7be0a6' }

/* faces: pupils follow the pointer, lids blink on their own */
export function Face({ kind, look, className = '' }: { kind: Kind; look: { x: number; y: number }; className?: string }) {
  const ref = useRef<SVGSVGElement>(null)
  const [blink, setBlink] = useState(false)
  const reduced = useReduced()
  const paused = usePaused()
  useEffect(() => {
    if (reduced || paused) return
    let id = 0
    const loop = () => {
      id = window.setTimeout(() => {
        setBlink(true)
        window.setTimeout(() => setBlink(false), 130)
        loop()
      }, 2200 + Math.random() * 3200)
    }
    loop()
    return () => clearTimeout(id)
  }, [reduced, paused])
  const r = ref.current?.getBoundingClientRect()
  const cx = r ? r.left + r.width / 2 : 0
  const cy = r ? r.top + r.height / 2 : 0
  const a = Math.atan2(look.y - cy, look.x - cx)
  const d = r ? Math.min(1, Math.hypot(look.x - cx, look.y - cy) / 220) : 0
  const dx = Math.cos(a) * 5 * d
  const dy = Math.sin(a) * 4.5 * d
  const body = {
    pip: <circle cx="50" cy="52" r="42" />,
    mo: <rect x="10" y="12" width="80" height="80" rx="24" />,
    juno: <path d="M50 8c9 0 14 9 14 9s10-5 17 2 2 17 2 17 9 5 9 14-9 14-9 14 5 10-2 17-17 2-17 2-5 9-14 9-14-9-14-9-10 5-17-2-2-17-2-17-9-5-9-14 9-14 9-14-5-10 2-17 17-2 17-2 5-9 14-9Z" />,
    sprout: <path d="M50 16c24 0 40 16 40 38s-16 38-40 38-40-16-40-38 16-38 40-38Z" />,
  }[kind]
  const brow = kind === 'mo' ? 'M28 30l14 3M58 33l14-5' : kind === 'juno' ? 'M28 33q7-5 14 0M58 33q7-5 14 0' : 'M28 32q7-6 14-1M58 31q7-5 14 1'
  return (
    <svg ref={ref} viewBox="0 -14 100 114" className={`face is-${kind} ${className}`} style={{ ['--face' as string]: FACE[kind] }} aria-hidden="true">
      {kind === 'sprout' && (
        <g className="face__leaf">
          <path d="M50 18 C50 8 50 2 50 -2" />
          <path d="M50 4 C40 -8 26 -6 24 -2 C30 6 42 8 50 4Z" />
          <path d="M50 0 C60 -12 74 -10 76 -6 C70 2 58 4 50 0Z" />
        </g>
      )}
      <g className="face__body">{body}</g>
      <path className="face__brow" d={brow} />
      {[36, 64].map((x) => (
        <g key={x}>
          <ellipse className="face__white" cx={x} cy="48" rx="10" ry={blink ? 1 : 11} />
          {!blink && <circle className="face__pupil" cx={x + dx} cy={48 + dy} r="4.6" />}
        </g>
      ))}
      <path className="face__mouth" d={kind === 'mo' ? 'M40 72h20' : kind === 'sprout' ? 'M36 68q14 14 28 0' : 'M38 68q12 10 24 0'} />
      {kind === 'juno' && <g className="face__cheek"><circle cx="26" cy="64" r="5" /><circle cx="74" cy="64" r="5" /></g>}
    </svg>
  )
}

export function Plane({ className = '' }: { className?: string }) {
  return (
    <svg className={`plane ${className}`} viewBox="0 0 120 80" aria-hidden="true">
      <path d="M4 40 L116 6 L76 74 L56 50 Z" fill="#fff" />
      <path d="M56 50 L116 6 M56 50 L60 70 L70 58" fill="none" />
    </svg>
  )
}

/* Scribble shapes that draw themselves. `data-draw` hooks them to drawOnView. */
export const SCRIBBLE = {
  circle: 'M12 40 C10 14 60 4 110 8 C160 12 192 26 188 46 C184 70 120 80 70 76 C26 72 6 58 14 36 C20 22 50 14 80 12',
  underline: 'M4 14 C40 6 90 4 140 8 C170 10 190 12 196 10 M30 20 C80 14 130 14 170 18',
  arrow: 'M6 10 C30 40 60 54 96 52 M80 40 L98 52 L82 64',
  zigzag: 'M4 20 L18 6 L32 20 L46 6 L60 20 L74 6 L88 20 L102 6 L116 20',
  loop: 'M4 40 C30 40 40 10 60 10 C80 10 80 40 60 40 C40 40 50 10 90 12 C120 14 130 30 150 30',
  star: 'M50 6 L61 38 L95 38 L67 58 L78 92 L50 72 L22 92 L33 58 L5 38 L39 38 Z',
  cross: 'M8 8 C30 30 60 58 92 90 M90 8 C64 32 36 62 8 92',
  check: 'M8 30 L28 50 L70 6',
}

export function Scribble({ d, view = '0 0 200 80', className = '', dur, delay, stroke }: { d: keyof typeof SCRIBBLE; view?: string; className?: string; dur?: number; delay?: number; stroke?: string }) {
  return (
    <svg className={`scribble ${className}`} viewBox={view} aria-hidden="true" preserveAspectRatio="none">
      <path d={SCRIBBLE[d]} data-draw data-dur={dur} data-delay={delay} style={stroke ? { stroke } : undefined} />
    </svg>
  )
}

export function Tape({ className = '' }: { className?: string }) {
  return <span className={`tape ${className}`} aria-hidden="true" />
}

/* the "no filming" door sticker from the rules */
export function NoFilm() {
  return (
    <svg className="nofilm" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="54" className="nofilm__disc" />
      <rect x="30" y="44" width="44" height="32" rx="6" className="nofilm__cam" />
      <path d="M74 54 L92 44 V76 L74 66 Z" className="nofilm__cam" />
      <circle cx="60" cy="60" r="44" className="nofilm__ring" />
      <path d="M29 29 L91 91" className="nofilm__ring" />
    </svg>
  )
}

/* Deep Roots: a sprout whose roots keep growing */
export function Roots() {
  return (
    <svg className="roots" viewBox="0 0 240 200" aria-hidden="true">
      <path className="roots__ground" d="M0 70 C40 64 80 74 120 68 C160 62 200 72 240 66" />
      <path className="roots__stem" d="M120 68 C120 50 118 40 120 24" />
      <path className="roots__leafL" d="M120 36 C104 20 88 24 86 30 C96 40 110 42 120 36Z" />
      <path className="roots__leafR" d="M120 28 C136 12 152 16 154 22 C144 32 130 34 120 28Z" />
      <g className="roots__lines">
        <path d="M120 68 C118 100 96 120 70 150 C56 166 40 176 24 190" />
        <path d="M120 68 C124 104 150 124 172 156 C182 170 196 182 216 192" />
        <path d="M120 68 C120 110 122 150 118 196" />
        <path d="M96 118 C80 120 62 118 46 128" />
        <path d="M150 124 C170 120 188 124 204 116" />
        <path d="M120 140 C108 150 98 166 92 184" />
      </g>
    </svg>
  )
}

/* Campus patches for Bearings: little hand-drawn landmarks, one per patch */
export function Landmark({ i }: { i: number }) {
  const g = [
    <><path d="M10 60 Q40 40 70 60" /><circle cx="26" cy="40" r="8" /><circle cx="54" cy="36" r="10" /><path d="M26 48 V58 M54 46 V58" /></>,
    <><path d="M12 62 H68 M16 54 H64 M20 46 H60" /><path d="M24 46 V24 H56 V46 M24 24 L40 12 L56 24" /></>,
    <><ellipse cx="40" cy="54" rx="26" ry="8" /><path d="M40 52 V30 M40 30 C34 22 30 26 28 34 M40 30 C46 22 50 26 52 34 M40 30 C40 20 40 18 40 14" /></>,
    <><path d="M32 64 V20 L40 8 L48 20 V64 Z" /><circle cx="40" cy="28" r="5" /><path d="M24 64 H56" /></>,
    <><path d="M14 64 V30 Q40 6 66 30 V64" /><path d="M26 64 V38 Q40 24 54 38 V64" /></>,
    <><path d="M6 40 C20 30 30 50 44 40 C58 30 66 48 76 40" /><path d="M6 54 C20 44 30 64 44 54 C58 44 66 62 76 54" /></>,
    <><rect x="14" y="26" width="52" height="36" rx="3" /><path d="M14 26 L40 12 L66 26 M34 62 V46 H46 V62" /></>,
    <><ellipse cx="40" cy="44" rx="32" ry="20" /><ellipse cx="40" cy="44" rx="18" ry="9" /><path d="M8 44 H72" /></>,
    <><path d="M10 62 L30 20 M70 62 L50 20 M30 20 H50" /><path d="M24 34 H56 M18 48 H62" /></>,
  ][i]
  return <svg viewBox="0 0 80 72" className="landmark" aria-hidden="true">{g}</svg>
}

/* Phone and notification stickers for the "why" section */
export function Bell() {
  return (
    <svg viewBox="0 0 24 24" className="bell" aria-hidden="true">
      <path d="M6 17 V11 a6 6 0 0 1 12 0 V17 L20 19 H4 Z" />
      <path d="M10 21 a2 2 0 0 0 4 0" />
    </svg>
  )
}
