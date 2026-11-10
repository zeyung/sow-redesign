import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import {
  JOIN_EVENT, PER_DAY, SECONDS, STRATA, TIERS, answerById, berkeleyDay, bestOf, bonusPrompts, dayOver, feetOf, loadBonus, loadRun, loadStreak,
  markShared, match, onWaitlist, promptById, promptsFor, saveRun, spendBonus,
} from './deepRootsData'
import type { BonusKind, Pick, Prompt, Tier } from './deepRootsData'
import { confetti, gsap, prefersReduced, usePaused, useReduced } from './motion'
import { BOARD_EVENT, boardOnline, placeholderBoard, postScore, postedToday, todayBoard } from './deepRootsBoard'
import type { BoardRow } from './deepRootsBoard'
import { isMuted, playTier, setMuted, unlockSound } from './deepRootsSound'
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
    unlockSound()
    const saved = loadRun(today)
    if (saved) setMode({ kind: 'done', day: today, picks: saved.picks })
    else setMode({ kind: 'play', day: today, prompts: promptsFor(today) })
  }
  const startPractice = () => {
    unlockSound()
    setMode({ kind: 'play', day: null, prompts: promptsFor(Math.floor(Math.random() * 1e9)) })
  }
  const retry = (kind: BonusKind) => {
    unlockSound()
    spendBonus(today, kind) /* spent when it starts, so leaving mid-run doesn't hand it back */
    setMode({ kind: 'play', day: today, prompts: bonusPrompts(today, kind) })
  }
  const finish = (day: number | null, picks: Pick[]) => {
    if (day !== null) {
      saveRun({ day, picks })
      window.dispatchEvent(new Event(BOARD_EVENT))
    }
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
          <SoundToggle />
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
          onRetry={retry}
          onHome={() => setMode({ kind: 'home' })}
        />
      )}
    </div>
  )
}

/* The whole Deep Roots card: title, leaderboard, game, drifting background, and a full-screen mode. */
const MOTES = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  size: 3 + ((i * 7) % 5),
  dur: 9 + ((i * 13) % 11),
  delay: -((i * 5) % 17),
  leaf: i % 4 === 0,
}))

export function DeepRootsCard() {
  const card = useRef<HTMLElement>(null)
  const [full, setFull] = useState(false)
  useEffect(() => {
    if (!full) return
    const root = document.documentElement
    const prev = root.style.overflow
    root.style.overflow = 'hidden'
    root.classList.add('rg-full')
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setFull(false)
    const exit = () => setFull(false)
    window.addEventListener('deeproots:exitfull', exit)
    const sync = () => !document.fullscreenElement && setFull(false)
    window.addEventListener('keydown', esc)
    document.addEventListener('fullscreenchange', sync)
    return () => {
      root.style.overflow = prev
      root.classList.remove('rg-full')
      window.removeEventListener('keydown', esc)
      window.removeEventListener('deeproots:exitfull', exit)
      document.removeEventListener('fullscreenchange', sync)
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
    }
  }, [full])
  const toggle = () => {
    if (full) return setFull(false)
    setFull(true)
    /* real full screen where the browser allows it; the fixed overlay covers the rest (e.g. iPhone) */
    card.current?.requestFullscreen?.().catch(() => {})
  }
  return (
    <article ref={card} className={`console console--roots ${full ? 'is-full' : ''}`} aria-label="Deep Roots">
      <div className="rg-fx" aria-hidden="true">
        <span className="rg-blob rg-blob--a" /><span className="rg-blob rg-blob--b" /><span className="rg-blob rg-blob--c" />
        {MOTES.map((m, i) => (
          <span key={i} className={`rg-mote ${m.leaf ? 'is-leaf' : ''} ${i >= 12 ? 'is-extra' : ''}`}
            style={{ left: `${m.left}%`, width: m.size * (m.leaf ? 2.4 : 1), height: m.size, animationDuration: `${m.dur}s`, animationDelay: `${m.delay}s` }} />
        ))}
      </div>
      <div className="console__head">
        <div className="rg-tags">
          <span className="tag tag--new">New</span>
          <span className="tag tag--gold">New every day</span>
        </div>
        <h3>Deep Roots</h3>
        <p>Seven quick prompts about campus life. The rarer your answer, the deeper your roots grow.</p>
        <button type="button" className="rg-btn rg-btn--ghost rg-full-btn" onClick={toggle} aria-pressed={full}>
          {full ? '✕ Exit full screen' : '⛶ Full screen'}
        </button>
        <RootsBoard />
      </div>
      <div className="console__screen"><DeepRoots /></div>
    </article>
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
    playTier(a?.tier ?? null)
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
      <RootsView picks={picks} sow />
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
          <p className={`rg-flash ${flash?.tier ? `is-hit is-${flash.tier}` : flash ? 'is-miss' : ''}`} style={flash?.tier ? tierVar(flash.tier) : undefined} role="status" aria-live="polite">
            {flash ? flash.text : `${Math.ceil(left)}s left`}
          </p>
          <SoundToggle />
          <button type="button" className="link-btn" onClick={() => lock('')} disabled={!!flash}>Skip</button>
        </div>
      </div>
    </div>
  )
}

/* ---------- bonus tries ---------- */
function Retries({ day, best, onRetry }: { day: number; best: number; onRetry: (k: BonusKind) => void }) {
  const [bonus, setBonus] = useState(() => loadBonus(day))
  const [joined, setJoined] = useState(onWaitlist)
  const [note, setNote] = useState('')
  const [link, setLink] = useState(false)
  useEffect(() => {
    const f = () => setJoined(onWaitlist())
    window.addEventListener(JOIN_EVENT, f)
    window.addEventListener('storage', f)
    return () => {
      window.removeEventListener(JOIN_EVENT, f)
      window.removeEventListener('storage', f)
    }
  }, [])
  const used = (k: BonusKind) => bonus.used.includes(k)

  if (used('waitlist') && used('share')) {
    return (
      <div className="rg-retry is-over">
        <p className="rg-retry__h">That’s all your tries for today 🌱</p>
        <p className="rg-meta">your best: {best} ft. new prompts at midnight, Berkeley time.</p>
      </div>
    )
  }

  const goJoin = () => {
    window.dispatchEvent(new Event('deeproots:exitfull'))
    window.setTimeout(() => document.getElementById('join')?.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth' }), 120)
  }
  const url = `${location.origin}${location.pathname}?ref=deeproots#games`
  const earn = () => {
    markShared(day)
    setBonus(loadBonus(day))
  }
  const share = async () => {
    const text = `I grew ${best} ft of roots in Deep Roots, a daily Berkeley word game. How deep can you go?`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Deep Roots', text, url })
        earn()
      } catch (e) {
        if ((e as Error)?.name !== 'AbortError') setLink(true) /* share sheet failed: show the link instead */
      }
      return
    }
    /* desktop: show the link, copy it in the background, and unlock the try */
    setLink(true)
    earn()
    void navigator.clipboard?.writeText(`${text} ${url}`).then(() => setNote('link copied. send it to a friend!'), () => {})
  }

  return (
    <div className="rg-retry">
      <p className="rg-retry__h">Want another try?</p>
      <p className="rg-meta">earn up to 2 more today. your best run counts.</p>
      <div className="rg-retry__row">
        <span className="rg-retry__what">📝 Be on the Sow waitlist</span>
        {used('waitlist') ? <span className="rg-retry__done">✓ used</span>
          : joined ? <button type="button" className="rg-btn" onClick={() => onRetry('waitlist')}>Play your waitlist try</button>
          : <button type="button" className="rg-btn rg-btn--ghost" onClick={goJoin}>Join the waitlist</button>}
      </div>
      <div className="rg-retry__row">
        <span className="rg-retry__what">💌 Send the game to a friend</span>
        {used('share') ? <span className="rg-retry__done">✓ used</span>
          : bonus.shared ? <button type="button" className="rg-btn" onClick={() => onRetry('share')}>Play your friend try</button>
          : <button type="button" className="rg-btn rg-btn--ghost" onClick={share}>Send to a friend</button>}
      </div>
      {link && <input className="rg-input rg-retry__link" readOnly value={url} aria-label="Link to send a friend" onFocus={(e) => e.currentTarget.select()} />}
      {note && <p className="rg-meta" role="status">{note}</p>}
    </div>
  )
}

/* ---------- sound on/off ---------- */
function SoundToggle() {
  const [muted, setM] = useState(isMuted)
  const flip = () => {
    setMuted(!muted)
    setM(!muted)
    if (muted) {
      unlockSound()
      playTier('rare')
    }
  }
  return (
    <button type="button" className="link-btn rg-sound" onClick={flip} aria-pressed={!muted}>
      {muted ? '🔇 sound off' : '🔊 sound on'}
    </button>
  )
}

/* ---------- results ---------- */
const tierVar = (t: Tier) => ({ '--tier': TIERS[t].color }) as CSSProperties
const DOT: Record<Tier, string> = { common: '⚪', uncommon: '🟢', rare: '🔵', epic: '🟣', legendary: '🟠', exotic: '💎', mythic: '🟡', prismatic: '🌈' }

function Results({ picks, day, streak, onPractice, onRetry, onHome }: {
  picks: Pick[]; day: number | null; streak: { current: number; best: number } | null; onPractice: () => void; onRetry: (k: BonusKind) => void; onHome: () => void
}) {
  const ft = feetOf(picks)
  const today = useMemo(() => berkeleyDay(), [])
  const run = day !== null ? loadRun(day) : null
  const best = run ? bestOf(run) : ft
  /* prismatic answers stay hidden until every try for today is played */
  const reveal = dayOver(today)
  const head = useRef<HTMLParagraphElement>(null)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (head.current && ft >= 300) confetti(head.current)
  }, [ft])

  const share = async () => {
    const dots = picks.map((k) => {
      const a = answerById(promptById(k.promptId), k.answerId)
      return a ? DOT[a.tier] : '⚫'
    }).join('')
    const text = `Deep Roots${day !== null ? ` #${day - DAY_ZERO}` : ' (practice)'}: ${ft} ft\n${dots}`
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
        {day !== null && best > ft && <p className="rg-meta">today’s best: {best} ft</p>}
        <ol className="rg-list">
          {picks.map((k) => {
            const p = promptById(k.promptId)
            const a = answerById(p, k.answerId)
            const prism = p.answers.find((x) => x.tier === 'prismatic')
            return (
              <li key={k.promptId} className={a ? `is-hit is-${a.tier}` : 'is-miss'} style={a ? tierVar(a.tier) : undefined}>
                <span className="rg-dot" aria-hidden="true" />
                <span className="rg-list__body">
                  <span className="rg-list__p">{p.text}</span>
                  <span className="rg-list__a">
                    {a ? <>{a.name} <span className="rg-list__tier">{TIERS[a.tier].label} +{TIERS[a.tier].ft}</span></> : k.guess ? `“${k.guess}” · no root` : 'skipped'}
                  </span>
                  {prism && prism.id !== a?.id && (reveal
                    ? <span className="rg-list__rare">prismatic answer: {prism.name}</span>
                    : <span className="rg-list__rare">prismatic answer: revealed when you’re done for the day</span>)}
                </span>
              </li>
            )
          })}
        </ol>
        {day !== null && <Retries day={day} best={best} onRetry={onRetry} />}
        {day !== null && <PostScore day={day} ft={best} />}
        <div className="rg-actions">
          <button type="button" className="rg-btn" onClick={share}>{copied ? 'Copied' : 'Share your roots'}</button>
          <button type="button" className="rg-btn rg-btn--ghost" onClick={onPractice}>Practice round</button>
          <button type="button" className="link-btn" onClick={onHome}>Back</button>
        </div>
        {day !== null && !dayOver(day) && <p className="rg-meta">new prompts at midnight, Berkeley time.</p>}
      </div>
    </div>
  )
}

/* ---------- the cross-section: soil strata, a sprout, one root per answer, coloured by rarity ---------- */
const W = 320, GROUND = 190, H = 490
const depthOf = (ft: number) => 22 + ft * 2

export function RootsView({ picks, total = PER_DAY, sow = false }: { picks: Pick[]; total?: number; sow?: boolean }) {
  const svg = useRef<SVGSVGElement>(null)
  const reduced = useReduced()
  const paused = usePaused()
  useEffect(() => {
    if (!svg.current) return
    if (reduced || paused) svg.current.pauseAnimations()
    else svg.current.unpauseAnimations()
  }, [reduced, paused])
  return (
    <svg ref={svg} className="rg-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${picks.length} of ${total} roots grown, ${feetOf(picks)} feet deep`}>
      <defs>
        <linearGradient id="rg-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#06213f" />
          <stop offset="1" stopColor="#1d64a8" />
        </linearGradient>
        <radialGradient id="rg-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fdb515" stopOpacity=".55" />
          <stop offset="1" stopColor="#fdb515" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rg-soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b3f6e" />
          <stop offset="1" stopColor="#001a33" />
        </linearGradient>
        {/* the prismatic root: a rainbow that keeps flowing down the root */}
        <linearGradient id="rg-prism" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="120" y2="120" spreadMethod="repeat">
          {PRISM.map((c, i) => <stop key={i} offset={i / (PRISM.length - 1)} stopColor={c} />)}
          <animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="120 120" dur="2.4s" repeatCount="indefinite" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={W} height={GROUND} fill="url(#rg-sky)" />
      {STARS.map(([x, y, r], i) => <circle key={i} className="rg-star" cx={x} cy={y} r={r} style={{ animationDelay: `${i * 0.37}s` }} />)}
      <rect x="0" y={GROUND} width={W} height={H - GROUND} fill="url(#rg-soil)" />
      {STRATA.map((t) => {
        const y = GROUND + depthOf(t.ft)
        return (
          <g key={t.label} className="rg-stratum">
            <line x1="0" x2={W} y1={y} y2={y} />
            <text x={W - 6} y={y - 4} textAnchor="end">{t.label}</text>
          </g>
        )
      })}
      <path className="rg-ground" d={`M0 ${GROUND} C ${W * 0.3} ${GROUND - 4}, ${W * 0.6} ${GROUND + 4}, ${W} ${GROUND - 1}`} />
      <Plant ft={feetOf(picks)} sow={sow} />
      {picks.map((k, i) => {
        const a = answerById(promptById(k.promptId), k.answerId)
        const n = Math.max(total, picks.length)
        const len = a ? depthOf(TIERS[a.tier].ft) : 14
        const endX = 160 + ((i - (n - 1) / 2) * 40 + (i % 2 ? 8 : -8)) * Math.min(1, 0.35 + len / 160)
        const y1 = GROUND + 2
        const y2 = GROUND + len
        const d = `M160 ${y1} C 160 ${y1 + len * 0.35}, ${endX} ${y1 + len * 0.4}, ${endX} ${y2}`
        const rank = a ? TIER_RANK[a.tier] : -1
        const stroke = a ? (a.tier === 'prismatic' ? 'url(#rg-prism)' : TIERS[a.tier].color) : undefined
        return (
          <g key={i} className={`rg-root ${a ? `is-${a.tier}` : 'is-miss'}`} style={{ stroke, strokeWidth: a ? 2.5 + rank * 0.55 : undefined }}>
            <path d={d} pathLength={1} />
            {rank >= 4 && <path d={`M${endX} ${y2 - len * 0.35} q ${i % 2 ? 16 : -16} 10 ${i % 2 ? 22 : -22} 30`} pathLength={1} className="rg-fork" />}
            {rank >= 6 && <path d={`M${endX} ${y2 - len * 0.6} q ${i % 2 ? -14 : 14} 12 ${i % 2 ? -18 : 18} 34`} pathLength={1} className="rg-fork" />}
          </g>
        )
      })}
    </svg>
  )
}
const PRISM = ['#ff4d6d', '#ff9f1c', '#ffe14d', '#4cc76a', '#22d3ee', '#3d8bff', '#a66bff', '#ff4d6d']
const TIER_RANK = Object.fromEntries((['common', 'uncommon', 'rare', 'epic', 'legendary', 'exotic', 'mythic', 'prismatic'] as Tier[]).map((t, i) => [t, i])) as Record<Tier, number>
const STARS: [number, number, number][] = [[24, 22, 1.2], [70, 48, 0.8], [118, 16, 1], [208, 30, 1.3], [256, 60, 0.8], [298, 18, 1], [44, 96, 0.7], [282, 112, 0.9], [150, 62, 0.6]]

/* The plant above the soil. It is drawn once at full size and scaled by your score, so it grows
   smoothly after each answer; branches, a canopy and golden acorns fade in at higher stages. */
const STAGE_FT = [0, 40, 120, 230, 380] /* stage 1..5 starts at this many feet */
function Plant({ ft, sow }: { ft: number; sow: boolean }) {
  const stage = STAGE_FT.filter((f) => ft >= f).length
  const g = Math.sqrt(Math.min(1, ft / 520))
  const scale = 0.3 + 0.62 * g
  const leaves = [[-34, -1], [-58, 1], [-82, -1], [-104, 1]] as const
  return (
    <g transform={`translate(160 ${GROUND})`}>
      {sow && <circle className="rg-seed" cx="0" cy="-4" r="5" />}
      {stage >= 5 && <circle className="rg-aura" cx="0" cy="-120" r="90" fill="url(#rg-glow)" />}
      <g className={`rg-plant is-s${stage} ${sow ? 'is-sowing' : ''}`} style={{ transform: `scale(${scale})` }}>
        <g className="rg-sway">
          {/* canopy sits behind the trunk */}
          <g className="rg-canopy">
            <circle cx="-34" cy="-132" r="30" />
            <circle cx="34" cy="-134" r="30" />
            <circle cx="0" cy="-160" r="36" />
            <circle cx="-14" cy="-120" r="26" />
            <circle cx="18" cy="-118" r="24" />
          </g>
          <path className="rg-trunk" d="M0 0 C -4 -40, 5 -80, 0 -150" />
          <g className="rg-branches">
            <path d="M1 -86 C -10 -96, -24 -104, -40 -124" />
            <path d="M0 -104 C 12 -112, 26 -118, 40 -134" />
          </g>
          {leaves.map(([y, side], i) => (
            <path key={i} className={`rg-leaf rg-leaf--${i}`} d={`M0 ${y} c ${side * 14} -14 ${side * 28} -8 ${side * 28} 2 c ${side * -10} 6 ${side * -20} 4 ${side * -28} -2 z`} />
          ))}
          <g className="rg-crown">
            <path className="rg-leaf" d="M0 -146 C -14 -160, -28 -150, -26 -142 C -14 -138, -6 -140, 0 -146 Z" />
            <path className="rg-leaf" d="M0 -150 C 12 -166, 30 -158, 28 -150 C 18 -144, 8 -146, 0 -150 Z" />
          </g>
          <g className="rg-acorns">
            {[[-40, -122], [30, -112], [-6, -178], [44, -146], [-22, -150]].map(([x, y], i) => (
              <g key={i} transform={`translate(${x} ${y})`}><ellipse cx="0" cy="3" rx="5" ry="6" /><path d="M-6 0 q 6 -6 12 0 z" /></g>
            ))}
          </g>
        </g>
      </g>
    </g>
  )
}

/* ---------- leaderboard ---------- */
function PostScore({ day, ft }: { day: number; ft: number }) {
  const [name, setName] = useState(savedName)
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>(() => (postedToday(day) ? 'done' : 'idle'))
  if (!boardOnline) return null
  if (state === 'done') return <p className="rg-meta">you’re on today’s leaderboard.</p>
  const send = async (e: FormEvent) => {
    e.preventDefault()
    const n = name.trim().slice(0, 16)
    if (!n) return
    setState('sending')
    try {
      localStorage.setItem(NAME_KEY, n)
    } catch { /* fine */ }
    setState((await postScore(day, n, ft)) ? 'done' : 'error')
  }
  return (
    <form className="rg-form rg-post" onSubmit={send}>
      <label className="sr-only" htmlFor="rg-post-name">Name for the leaderboard</label>
      <input id="rg-post-name" className="rg-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={16} placeholder="name for the leaderboard" />
      <button type="submit" className="rg-btn" disabled={state === 'sending' || !name.trim()}>{state === 'error' ? 'Try again' : 'Post my roots'}</button>
    </form>
  )
}

const MEDAL = ['🥇', '🥈', '🥉']

export function RootsBoard() {
  const day = useMemo(() => berkeleyDay(), [])
  const [rows, setRows] = useState<BoardRow[] | null>(null)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const f = () => setTick((n) => n + 1)
    window.addEventListener(BOARD_EVENT, f)
    return () => window.removeEventListener(BOARD_EVENT, f)
  }, [])
  useEffect(() => {
    let live = true
    if (boardOnline) void todayBoard(day).then((r) => live && setRows(r))
    else {
      const run = loadRun(day)
      setRows(placeholderBoard(day, run ? bestOf(run) : null))
    }
    return () => void (live = false)
  }, [day, tick])
  return (
    <section className="rg-board" aria-labelledby="rg-board-h">
      <div className="rg-board__top">
        <h4 id="rg-board-h" className="rg-board__h">Today’s top 10</h4>
        <span className="rg-board__live"><i aria-hidden="true" />live</span>
      </div>
      <p className="rg-board__reward">🏆 The top 3 deepest roots each day win a Sow reward.</p>
      {rows === null ? <p className="rg-board__empty">loading…</p>
        : rows.length === 0 ? <p className="rg-board__empty">nobody yet. be the first.</p>
        : (
          <ol className="rg-board__list">
            {rows.map((r, i) => (
              <li key={`${r.name}-${i}`} className={`${i < 3 ? `is-podium is-p${i + 1}` : ''} ${r.me ? 'is-me' : ''}`}>
                <span className="rg-board__rank">{i < 3 ? MEDAL[i] : i + 1}</span>
                <span className="rg-board__name">{r.name}</span>
                <span className="rg-board__ft">{r.ft} ft</span>
              </li>
            ))}
          </ol>
        )}
      <p className="rg-board__note">resets at midnight, Berkeley time.</p>
    </section>
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
          <p className={`rg-flash ${s.beat?.kind === 'ok' ? 'is-ok' : s.beat ? 'is-miss' : ''}`} role="status" aria-live="polite">{beat}</p>
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
