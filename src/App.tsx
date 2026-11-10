import { useEffect, useRef, useState } from 'react'
import type { FormEvent, MouseEvent, PointerEvent as RPointerEvent } from 'react'
import Waitlist from './Waitlist'
import Bearings from './Bearings'
import DeepRoots from './DeepRoots'
import Scribbler from './Scribbler'
import { Face, InkDefs, Scribble } from './Doodles'
import { EVENTS, FAQ, PHOTOS, REACTIONS, RULES, SOURCES, STATS, STEPS, TRUCK, VENUE_POINTS } from './data'
import { ScrollTrigger, burst, confetti, countOnView, drawOnView, gsap, prefersReduced, setPaused, useGsap, usePaused } from './motion'

/* sentence case for copy shared with the lowercase notebook site */
const cap = (t: string) => t.replace(/(^|[.?!]\s+)([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase()).replace(/\bi\b/g, 'I')

/* Sow Social, redesigned: a riso-printed poster that moves. Cobalt, lime, tomato and pink,
   heavy grotesk type, hand-scribbled notes on top, and the app itself in the hero. */

export default function App() {
  return (
    <>
      <InkDefs />
      <Nav />
      <main id="top">
        <Hero />
        <Why />
        <How />
        <Rules />
        <Games />
        <Events />
        <Venues />
        <Join />
        <Questions />
      </main>
      <Footer />
    </>
  )
}

function Nav() {
  const paused = usePaused()
  const [solid, setSolid] = useState(false)
  useEffect(() => {
    const f = () => setSolid(window.scrollY > window.innerHeight * 0.85)
    f()
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
  return (
    <header className={`nav ${solid ? 'is-solid' : ''}`}>
      <div className="wrap nav__in">
        <a className="logo" href="#top" aria-label="Sow Social, back to top">
          <svg viewBox="0 0 40 40" aria-hidden="true">
            <path d="M20 36 C20 26 20 20 20 14" fill="none" />
            <path d="M20 20 C12 10 4 12 3 16 C8 22 15 23 20 20Z" />
            <path d="M20 15 C26 4 35 5 37 9 C32 16 26 18 20 15Z" />
          </svg>
          <span>sow</span>
        </a>
        <nav className="nav__links" aria-label="Main">
          <a href="#how">How it works</a>
          <a href="#events">Events</a>
          <a href="#games">Games</a>
          <a href="#venues">Venues</a>
        </nav>
        <div className="nav__end">
          <button type="button" className="pause" aria-pressed={paused} onClick={() => setPaused(!paused)} aria-label={paused ? 'Play animations' : 'Pause animations'}>
            {paused ? <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4 L16 10 L6 16 Z" /></svg> : <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4 V16 M14 4 V16" /></svg>}
          </button>
          <a className="btn btn--lime btn--sm" href="#join">Join the waitlist</a>
        </div>
      </div>
    </header>
  )
}

/* ---------- hero: the app itself, in a phone ---------- */
function Hero() {
  const ref = useGsap<HTMLElement>((root) => {
    const intro = gsap.timeline({ delay: 0.15 })
    intro.from(root.querySelectorAll('.hero h1 .line > span'), { yPercent: 110, duration: 0.8, stagger: 0.08, ease: 'power4.out' })
    intro.fromTo(root.querySelectorAll('.hero h1 .scribble path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.8, ease: 'power2.inOut' }, '-=0.3')
    intro.from(root.querySelector('.phone'), { y: 80, rotation: 8, opacity: 0, duration: 0.9, ease: 'power3.out' }, 0.2)
    intro.from(root.querySelectorAll('.float'), { scale: 0, rotation: -20, duration: 0.6, stagger: 0.1, ease: 'back.out(2)' }, 0.6)
    root.querySelectorAll('.float').forEach((f, i) => gsap.to(f, { y: i % 2 ? -12 : 12, rotation: i % 2 ? 3 : -3, duration: 2.4 + i * 0.3, yoyo: true, repeat: -1, ease: 'sine.inOut' }))

    // the app loop: a crew forms, then you're in (one cycle about 4 s)
    const faces = root.querySelectorAll('.app__crew .avatar')
    const status = root.querySelector('.app__status b')!
    const count = root.querySelector('.app__count')!
    const cta = root.querySelector('.app__cta')!
    const loop = gsap.timeline({ repeat: -1, repeatDelay: 0.5, delay: 2.4 })
    loop.set(faces, { scale: 0, opacity: 0 })
    loop.call(() => { status.textContent = 'Matching your crew'; count.textContent = '0 of 4'; cta.classList.remove('is-in'); cta.textContent = 'RSVP' })
    faces.forEach((f, i) => {
      loop.to(f, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2.4)' }, 0.3 + i * 0.45)
      loop.call(() => { count.textContent = `${i + 1} of 4` }, [], 0.3 + i * 0.45)
    })
    loop.call(() => { status.textContent = 'Crew ready, meet at 8:40' }, [], 2.2)
    loop.to(cta, { scale: 0.94, duration: 0.1, yoyo: true, repeat: 1 }, 2.6)
    loop.call(() => { cta.classList.add('is-in'); cta.textContent = "You're in ✓" }, [], 2.7)
    loop.to({}, { duration: 0.9 })
    root.querySelector('.phone')?.addEventListener('pointerenter', () => { if (loop.time() > 0.8) loop.restart(true) })

    // the marquee speeds up with scroll velocity
    const band = root.querySelector('.band__track')
    const tween = gsap.to(band, { xPercent: -50, duration: 30, ease: 'none', repeat: -1 })
    ScrollTrigger.create({
      onUpdate: (s) => gsap.to(tween, { timeScale: 1 + Math.min(Math.abs(s.getVelocity()) / 400, 5), duration: 0.2, overwrite: true, onComplete: () => void gsap.to(tween, { timeScale: 1, duration: 0.8 }) }),
    })
  })
  const first = EVENTS[0]
  return (
    <section className="hero" ref={ref} aria-labelledby="hero-h">
      <Scribbler />
      <div className="halftone" aria-hidden="true" />
      <div className="wrap hero__grid">
        <div className="hero__text">
          <p className="chip"><span className="chip__dot" aria-hidden="true" />Students only. Opening at Berkeley first.</p>
          <h1 id="hero-h">
            <span className="line"><span>Nights out with</span></span>
            <span className="line"><span><span className="circled">new people,<Scribble d="circle" view="0 0 200 84" /></span> for</span></span>
            <span className="line"><span>Berkeley students.</span></span>
          </h1>
          <p className="lead">Pick a night, get matched into a crew of 3 to 6 who share something with you, and meet at a public spot before you walk in.</p>
          <div className="actions">
            <a className="btn btn--lime btn--xl" href="#join">Join the waitlist</a>
            <a className="btn btn--ghost btn--xl" href="#events">See upcoming nights</a>
          </div>
          <p className="hero__fact"><b>First night:</b> {first.title}, {first.dow}, {first.month} {first.date}.</p>
        </div>

        <div className="hero__stage">
          <div className="phone">
            <div className="phone__notch" aria-hidden="true" />
            <div className="app" role="img" aria-label="The Sow app: a rooftop party on Saturday, a crew of four forming, and an RSVP button.">
              <div className="app__top"><span>Sat, Nov 14</span><span className="app__pill">Berkeley</span></div>
              <p className="app__h">Tonight</p>
              <div className="app__event">
                <img src={first.photo} alt="" width="600" height="400" />
                <div className="app__event-t">
                  <b>{first.title}</b>
                  <span>9:00 pm · rooftop, Southside</span>
                </div>
              </div>
              <div className="app__status"><b>Crew ready, meet at 8:40</b><span className="app__count">4 of 4</span></div>
              <div className="app__crew">
                {(['pip', 'mo', 'sprout', 'juno'] as const).map((k) => (
                  <span key={k} className="avatar"><Face kind={k} look={{ x: -999, y: -999 }} /></span>
                ))}
              </div>
              <p className="app__meet">Meet at the fountain first, then walk in together.</p>
              <span className="app__cta is-in">You&apos;re in ✓</span>
            </div>
          </div>
          <span className="float float--edu" aria-hidden="true">✓ .edu verified</span>
          <span className="float float--crew" aria-hidden="true">crew of 4</span>
          <span className="float float--hi" aria-hidden="true">hey! first time too?</span>
        </div>
      </div>
      <div className="band" aria-hidden="true">
        <div className="band__track">
          {[0, 1].map((n) => (
            <span key={n} className="band__row">
              {[...EVENTS.map((e) => e.title), 'the game truck'].map((t, i) => (
                <span key={t} className={i % 2 ? 'is-outline' : ''}>{t}<i>✺</i></span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- why ---------- */
function Why() {
  const ref = useGsap<HTMLElement>((root) => {
    root.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => countOnView(el, Number(el.dataset.count)))
    drawOnView(root)
    // the statement fills in, word by word, as you read down the page
    gsap.fromTo(root.querySelectorAll('.statement .w'), { opacity: 0.18 }, {
      opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: root.querySelector('.statement'), start: 'top 80%', end: 'bottom 45%', scrub: true },
    })
  })
  const statement = 'College was supposed to fix this. It mostly doesn’t. So we’re building the third place back: same spots, same nights, new people every time, until strangers become regulars.'
  const hot = new Set(['same', 'spots,', 'nights,', 'new', 'people', 'every', 'time,'])
  const notes = ['since 2003', 'nearly, anyway', 'even Meta says so']
  return (
    <section className="section section--cream" id="why" ref={ref} aria-labelledby="why-h">
      <div className="wrap">
        <div className="head">
          <p className="kicker">01 · why</p>
          <h2 id="why-h" className="h2">Why Sow exists</h2>
        </div>
        <div className="tiles">
          {STATS.map((s, i) => (
            <article key={s.n} className={`tile tile--${i}`}>
              <p className="tile__n"><span data-count={s.n}>{s.n}</span>{s.unit}</p>
              <p className="tile__t">{s.t}<sup><a href={`#src-${s.f}`} aria-label={`Source ${s.f}`}>{s.f}</a></sup></p>
              <p className="scrawl tile__note" aria-hidden="true">{notes[i]}<Scribble d="arrow" view="0 0 110 70" /></p>
            </article>
          ))}
        </div>
        <p className="statement">
          {statement.split(' ').map((w, i) => <span key={i} className={`w ${hot.has(w) && i > 14 ? 'is-hot' : ''}`}>{w} </span>)}
        </p>
      </div>
    </section>
  )
}

/* ---------- how: a pinned strip that scrolls sideways ---------- */
function How() {
  const ref = useGsap<HTMLElement>((root) => {
    const mm = gsap.matchMedia()
    mm.add('(min-width: 1024px)', () => {
      const track = root.querySelector<HTMLElement>('.strip__track')!
      const dist = () => track.scrollWidth - track.clientWidth
      gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: root.querySelector('.strip'), start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.5, invalidateOnRefresh: true },
      })
      gsap.fromTo(root.querySelector('.strip__progress span'), { scaleX: 0 }, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: root.querySelector('.strip'), start: 'top top', end: () => `+=${dist()}`, scrub: true },
      })
    })
    drawOnView(root)
  })
  return (
    <section className="section section--ink how" id="how" ref={ref} aria-labelledby="how-h">
      <div className="strip">
        <div className="wrap strip__head">
          <div className="head">
            <p className="kicker">02 · how</p>
            <h2 id="how-h" className="h2">How a Sow night works</h2>
          </div>
          <div className="strip__progress" aria-hidden="true"><span /></div>
        </div>
        <ol className="strip__track">
          {STEPS.map((s, i) => (
            <li key={s.t} className={`step step--${i}`}>
              <div className="step__img"><img src={s.photo} alt="" loading="lazy" width="800" height="800" /></div>
              <div className="step__body">
                <p className="step__n">0{i + 1}</p>
                <h3>{cap(s.t)}</h3>
                <p>{cap(s.b)}</p>
              </div>
            </li>
          ))}
          <li className="step step--alone">
            <p className="step__big">Come alone. <span className="scrawl">seriously.</span></p>
            <p>Most people at a Sow night didn’t know anyone when they showed up. That’s the point.</p>
            <div className="bubbles" aria-hidden="true"><span>nice to meet you!</span><span>hey!</span><span>first time</span></div>
          </li>
        </ol>
      </div>
    </section>
  )
}

/* ---------- rules: a sticker sheet ---------- */
const RULE_ICONS = [
  <path key="0" d="M8 20 L20 10 L32 20 V32 H8 Z M16 32 V24 H24 V32" />,
  <><circle key="a" cx="13" cy="14" r="5" /><circle key="b" cx="27" cy="14" r="5" /><path key="c" d="M5 32 C6 24 20 24 20 32 C20 24 34 24 35 32" /></>,
  <><circle key="a" cx="20" cy="14" r="7" /><path key="b" d="M20 21 V34 M14 28 H26" /></>,
  <path key="0" d="M10 6 V34 M10 8 H30 L25 15 L30 22 H10" />,
  <path key="0" d="M11 8 H29 L26 34 H14 Z M12 16 H28" />,
  <><rect key="a" x="6" y="12" width="20" height="16" rx="3" /><path key="b" d="M26 17 L34 12 V28 L26 23 M4 4 L36 36" /></>,
]
function Rules() {
  const ref = useGsap<HTMLElement>((root) => {
    gsap.from(root.querySelectorAll('.sticker'), {
      scale: 0.6, opacity: 0, clearProps: 'transform', duration: 0.55, stagger: 0.08, ease: 'back.out(1.8)',
      scrollTrigger: { trigger: root.querySelector('.stickers'), start: 'top 75%', once: true },
    })
  })
  return (
    <section className="section section--pink" id="rules" ref={ref} aria-labelledby="rules-h">
      <div className="wrap">
        <div className="head head--split">
          <div>
            <p className="kicker">03 · rules</p>
            <h2 id="rules-h" className="h2">Six house rules</h2>
          </div>
          <p className="sub">The same six at every Sow night, no matter the spot or the crew.</p>
        </div>
        <ul className="stickers">
          {RULES.map((r, i) => (
            <li key={r} className={`sticker sticker--${i}`}>
              <svg viewBox="0 0 40 40" aria-hidden="true">{RULE_ICONS[i]}</svg>
              <span>{cap(r)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ---------- games ---------- */
function Games() {
  return (
    <section className="section section--cream" id="games" aria-labelledby="games-h">
      <div className="wrap">
        <div className="head head--split">
          <div>
            <p className="kicker">04 · games</p>
            <h2 id="games-h" className="h2">Games while you wait</h2>
          </div>
          <p className="sub">Every find in Bearings moves you up the Berkeley waitlist.</p>
        </div>
        <div className="games">
          <article className="console">
            <div className="console__head">
              <span className="tag tag--lime">New every day</span>
              <h3>Bearings</h3>
              <p>One hidden campus spot a day. Three guesses. Everyone gets the same one.</p>
            </div>
            <div className="console__screen"><Bearings /></div>
          </article>
          <article className="console console--roots">
            <div className="console__head">
              <span className="tag tag--gold">New every day</span>
              <h3>Deep Roots</h3>
              <p>Seven quick prompts about campus life. The rarer your answer, the deeper your roots grow.</p>
            </div>
            <div className="console__screen"><DeepRoots /></div>
          </article>
        </div>
      </div>
    </section>
  )
}

/* ---------- events: a gig-poster list with a photo that follows the pointer ---------- */
function Events() {
  const [rsvps, setRsvps] = useState<number[]>([])
  const [reacts, setReacts] = useState<Record<number, string>>({})
  const [hover, setHover] = useState<number | null>(null)
  const peek = useRef<HTMLDivElement>(null)
  const pos = useRef<{ x: (v: number) => void; y: (v: number) => void } | null>(null)
  useEffect(() => {
    if (!peek.current || prefersReduced()) return
    pos.current = { x: gsap.quickTo(peek.current, 'x', { duration: 0.45, ease: 'power3' }), y: gsap.quickTo(peek.current, 'y', { duration: 0.45, ease: 'power3' }) }
  }, [])
  const move = (e: RPointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    pos.current?.x(e.clientX - r.left)
    pos.current?.y(e.clientY - r.top)
  }
  const toggle = (id: number, e: MouseEvent<HTMLButtonElement>) => {
    const on = !rsvps.includes(id)
    setRsvps((r) => (on ? [...r, id] : r.filter((x) => x !== id)))
    if (on) burst(e.clientX, e.clientY, ['✓', '✺', '★'], 9)
  }
  const react = (id: number, g: string, e: MouseEvent) => {
    setReacts((r) => ({ ...r, [id]: r[id] === g ? '' : g }))
    burst(e.clientX, e.clientY, [g], 9)
  }
  const all = [...EVENTS.map((e) => e.photo), TRUCK.photo]
  return (
    <section className="section section--cream events-sec" id="events" aria-labelledby="events-h">
      <div className="wrap">
        <div className="head head--split">
          <div>
            <p className="kicker">05 · events</p>
            <h2 id="events-h" className="h2">Upcoming nights at Berkeley</h2>
          </div>
          <p className="sub">RSVP now and we’ll hold your place when the app opens.</p>
        </div>
        <div className="gig" onPointerMove={move} onPointerLeave={() => setHover(null)}>
          <div className={`gig__peek ${hover !== null ? 'is-on' : ''}`} ref={peek} aria-hidden="true">
            {all.map((p, i) => <img key={p} src={p} alt="" className={hover === i ? 'is-on' : ''} loading="lazy" width="560" height="400" />)}
          </div>
          {EVENTS.map((ev, i) => {
            const going = rsvps.includes(ev.id)
            return (
              <article key={ev.id} className={`gig__row gig__row--${ev.color} ${going ? 'is-going' : ''}`} onPointerEnter={() => setHover(i)}>
                <p className="gig__date"><span>{ev.day}</span><b>{ev.date}</b><span>{ev.month}</span></p>
                <img className="gig__thumb" src={ev.photo} alt="" loading="lazy" width="560" height="400" />
                <div className="gig__t">
                  <h3>{cap(ev.title).replace('tuesday at kip', 'Tuesday at Kip')}</h3>
                  <p>{cap(ev.body)}</p>
                </div>
                <div className="gig__act">
                  <div className="reacts" role="group" aria-label={`React to ${ev.title}`}>
                    {REACTIONS.map((g) => (
                      <button key={g} type="button" aria-pressed={reacts[ev.id] === g} aria-label={`React ${g}`} onClick={(e) => react(ev.id, g, e)}>{g}</button>
                    ))}
                  </div>
                  <button type="button" className="rsvp" aria-pressed={going} onClick={(e) => toggle(ev.id, e)}>{going ? "You're in ✓" : 'RSVP'}</button>
                </div>
              </article>
            )
          })}
          <article className="gig__row gig__row--truck" onPointerEnter={() => setHover(4)}>
            <p className="gig__date"><span>Date</span><b>?</b><span>Soon</span></p>
            <img className="gig__thumb gig__thumb--redacted" src={TRUCK.photo} alt="" loading="lazy" width="560" height="400" />
            <div className="gig__t">
              <h3>The game truck</h3>
              <p>Something with a lot of screens is rolling onto campus. That’s all we can say.</p>
            </div>
            <div className="gig__act"><span className="tag tag--tomato">Stay tuned</span></div>
          </article>
        </div>
      </div>
    </section>
  )
}

/* ---------- venues ---------- */
function Venues() {
  const [sent, setSent] = useState(false)
  const ref = useGsap<HTMLElement>((root) => drawOnView(root))
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSent(true)
    confetti(e.currentTarget)
  }
  return (
    <section className="section section--cobalt" id="venues" ref={ref} aria-labelledby="venues-h">
      <div className="wrap venues">
        <div className="venues__pitch">
          <p className="kicker">06 · venues</p>
          <h2 id="venues-h" className="h2">Fill your slow nights with students</h2>
          <p className="venues__big"><span>50–100</span> students at your place on a quiet night. We bring them, and send you the numbers after.</p>
          <ol className="venues__points">
            {VENUE_POINTS.map(([t, b], i) => (
              <li key={t}><span aria-hidden="true">0{i + 1}</span><div><b>{cap(t)}.</b> {cap(b)}</div></li>
            ))}
          </ol>
          <div className="venues__img" aria-hidden="true"><img src={PHOTOS.venue} alt="" loading="lazy" width="800" height="560" /></div>
        </div>
        <div className="form-card">
          <h3>Tell us about your place</h3>
          {sent ? (
            <p className="sent" role="status">Thanks. We’ll reach out about your place.</p>
          ) : (
            <form className="venue-form" onSubmit={submit}>
              <label>Name of your place<input required name="place" autoComplete="organization" /></label>
              <label>Your name<input required name="name" autoComplete="name" /></label>
              <label>Email<input required type="email" name="email" autoComplete="email" /></label>
              <label>Neighborhood<input name="area" placeholder="Southside, Downtown…" /></label>
              <label>What kind of spot?
                <select name="kind" defaultValue="" required>
                  <option value="" disabled>Pick one</option>
                  <option>Bar</option><option>Restaurant</option><option>Cafe</option>
                  <option>Rooftop or event space</option><option>Activity (bowling, courts, games)</option><option>Something else</option>
                </select>
              </label>
              <label>How many can you fit?
                <select name="fit" defaultValue="" required>
                  <option value="" disabled>Pick one</option>
                  <option>Under 50</option><option>50 to 100</option><option>100 to 200</option><option>200+</option>
                </select>
              </label>
              <fieldset className="days">
                <legend>Your slow nights</legend>
                <div>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                    <label key={d} className="day"><input type="checkbox" name="nights" value={d} /><span>{d}</span></label>
                  ))}
                </div>
              </fieldset>
              <button type="submit" className="btn btn--lime">Send your place</button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

/* ---------- join ---------- */
function Join() {
  const card = useRef<HTMLDivElement>(null)
  const ref = useGsap<HTMLElement>((root) => {
    drawOnView(root)
    gsap.to(root.querySelectorAll('.join__spin'), { rotation: 360, duration: 14, repeat: -1, ease: 'none' })
  })
  return (
    <section className="section section--lime join" id="join" ref={ref} aria-labelledby="join-h">
      <div className="wrap join__grid">
        <div>
          <p className="kicker">07 · waitlist</p>
          <h2 id="join-h" className="h2 h2--xl">Join the Berkeley waitlist</h2>
          <p className="join__lede">Takes a minute. Every friend who joins with your link moves you up, and so does every Bearings find.</p>
          <p className="scrawl join__friends">Applying with friends? Do it together.<Scribble d="arrow" view="0 0 110 70" /></p>
          <svg className="join__spin" viewBox="0 0 200 200" aria-hidden="true">
            <defs><path id="ring" d="M100 100 m-72 0 a72 72 0 1 1 144 0 a72 72 0 1 1 -144 0" /></defs>
            <text><textPath href="#ring">students only · .edu email · Berkeley first · </textPath></text>
            <path d="M100 124 C100 110 100 102 100 92 M100 102 C92 90 82 92 80 96 C86 104 94 106 100 102Z M100 96 C108 84 118 86 120 90 C114 98 106 100 100 96Z" className="join__sprout" />
          </svg>
        </div>
        <div className="join__card" ref={card}>
          <Waitlist onJoined={() => card.current && confetti(card.current)} />
        </div>
      </div>
    </section>
  )
}

/* ---------- questions ---------- */
function Questions() {
  return (
    <section className="section section--cream" id="faq" aria-labelledby="faq-h">
      <div className="wrap faq__grid">
        <div>
          <p className="kicker">08 · questions</p>
          <h2 id="faq-h" className="h2">Questions</h2>
        </div>
        <div className="faq">
          {FAQ.map(([q, a], i) => (
            <details key={q} open={i === 0}>
              <summary><span>{cap(q)}</span><i aria-hidden="true" /></summary>
              <p>{cap(a)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- footer: letters that lean away from the pointer ---------- */
function Footer() {
  const word = useRef<HTMLParagraphElement>(null)
  const onMove = (e: RPointerEvent<HTMLElement>) => {
    if (prefersReduced() || !word.current) return
    word.current.querySelectorAll<HTMLElement>('span').forEach((s) => {
      const r = s.getBoundingClientRect()
      const dx = r.left + r.width / 2 - e.clientX
      const dy = r.top + r.height / 2 - e.clientY
      const d = Math.hypot(dx, dy)
      const f = Math.max(0, 1 - d / 320)
      gsap.to(s, { x: (dx / (d || 1)) * f * 40, y: (dy / (d || 1)) * f * 40, rotation: (dx / (d || 1)) * f * 14, duration: 0.5, ease: 'power3.out' })
    })
  }
  const reset = () => word.current && gsap.to(word.current.querySelectorAll('span'), { x: 0, y: 0, rotation: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' })
  return (
    <footer className="foot" onPointerMove={onMove} onPointerLeave={reset}>
      <div className="wrap">
        <p className="foot__word" ref={word} aria-hidden="true">{[...'sow social'].map((c, i) => <span key={i}>{c === ' ' ? ' ' : c}</span>)}</p>
        <div className="foot__row">
          <nav className="foot__links" aria-label="Footer">
            <a href="#games">Bearings</a>
            <a href="#events">Events</a>
            <a href="#venues">For venues</a>
            <a href="#join">Join the waitlist</a>
          </nav>
          <ol className="foot__sources">{SOURCES.map((s, i) => <li key={s} id={`src-${i + 1}`}>{s}</li>)}</ol>
        </div>
        <p className="foot__legal">© 2026 Sow Social · Not affiliated with UC Berkeley · <a href="credits.html">Photographs via Unsplash</a></p>
      </div>
    </footer>
  )
}
