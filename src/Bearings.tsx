import { useRef, useState } from 'react'
import { Landmark } from './Doodles'
import { MAX_GUESSES, SPOTS, TODAY } from './data'
import { confetti, gsap, prefersReduced } from './motion'

/* Bearings: one hidden campus spot a day, three guesses. */
export default function Bearings() {
  const [tries, setTries] = useState<number[]>([])
  const board = useRef<HTMLDivElement>(null)
  const found = tries.includes(TODAY)
  const left = MAX_GUESSES - tries.length
  const status = tries.length === 0
    ? `pick a patch. ${MAX_GUESSES} guesses left.`
    : found
      ? `found it in ${tries.length} ${tries.length === 1 ? 'guess' : 'guesses'}. you moved up the list.`
      : left > 0
        ? `not ${SPOTS[tries[tries.length - 1]]}. ${left} ${left === 1 ? 'guess' : 'guesses'} left.`
        : `out of guesses. it was ${SPOTS[TODAY]}. new spot tomorrow.`

  const guess = (i: number, el: HTMLButtonElement) => {
    if (found || left <= 0 || tries.includes(i)) return
    setTries((t) => [...t, i])
    if (prefersReduced()) return
    if (i === TODAY) {
      confetti(el)
      gsap.fromTo(el, { scale: 0.9 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' })
    } else {
      gsap.fromTo(el, { x: -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' })
    }
  }
  const reset = () => setTries([])

  return (
    <div className="bearings">
      <div className="bearings__board" ref={board} role="group" aria-label="Bearings: nine campus patches">
        {SPOTS.map((name, i) => {
          const miss = tries.includes(i) && i !== TODAY
          const hit = found && i === TODAY
          const reveal = !found && left <= 0 && i === TODAY
          return (
            <button
              key={name}
              type="button"
              className={`patch ${hit ? 'is-hit' : ''} ${miss ? 'is-miss' : ''} ${reveal ? 'is-reveal' : ''}`}
              aria-label={`${name}${miss ? ', not here' : ''}${hit ? ', found it' : ''}`}
              disabled={found || left <= 0 || tries.includes(i)}
              onClick={(e) => guess(i, e.currentTarget)}
            >
              <Landmark i={i} />
              <span className="patch__name">{name}</span>
              {miss && (
                <svg className="patch__mark" viewBox="0 0 100 100" aria-hidden="true"><path d="M14 14 C40 40 60 62 86 86 M86 14 C60 38 38 62 14 86" /></svg>
              )}
              {(hit || reveal) && (
                <svg className="patch__mark is-star" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 8 L61 38 L94 38 L67 58 L78 90 L50 71 L22 90 L33 58 L6 38 L39 38 Z" /></svg>
              )}
            </button>
          )
        })}
      </div>
      <div className="bearings__foot">
        <p className="bearings__status" role="status" aria-live="polite">{status}</p>
        <div className="bearings__pips" aria-hidden="true">
          {Array.from({ length: MAX_GUESSES }, (_, i) => <span key={i} className={i < tries.length ? 'is-used' : ''} />)}
        </div>
        {(found || left <= 0) && <button type="button" className="link-btn" onClick={reset}>Play again</button>}
      </div>
    </div>
  )
}
