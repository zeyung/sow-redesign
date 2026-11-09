import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, MotionPathPlugin)
if (import.meta.env.DEV) Object.assign(window, { __ST: ScrollTrigger, __gsap: gsap })
export { gsap, ScrollTrigger }

const mq = () => window.matchMedia('(prefers-reduced-motion: reduce)')
export const prefersReduced = () => mq().matches

export function useReduced() {
  const [r, setR] = useState(prefersReduced)
  useEffect(() => {
    const m = mq()
    const f = () => setR(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [])
  return r
}

/* One global pause for every loop on the page (house rule: anything that moves past 5 s can be paused). */
type PauseListener = (p: boolean) => void
const listeners = new Set<PauseListener>()
let paused = false
export function setPaused(p: boolean) {
  paused = p
  document.documentElement.dataset.paused = p ? 'true' : 'false'
  if (p) gsap.globalTimeline.pause()
  else gsap.globalTimeline.resume()
  listeners.forEach((l) => l(p))
}
export function usePaused() {
  const [p, setP] = useState(paused)
  useEffect(() => {
    listeners.add(setP)
    return () => void listeners.delete(setP)
  }, [])
  return p
}

/* gsap.context scoped to a ref; the callback runs only when motion is allowed. */
export function useGsap<T extends HTMLElement>(fn: (root: T) => void, deps: unknown[] = []) {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    if (!ref.current || prefersReduced()) return
    const ctx = gsap.context(() => fn(ref.current!), ref)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}

/* Decorative lines draw themselves the first time they come into view. Words never wait on this. */
export function drawOnView(root: Element, selector = '[data-draw]') {
  root.querySelectorAll<SVGGeometryElement>(selector).forEach((el) => {
    gsap.fromTo(el, { drawSVG: '0%' }, {
      drawSVG: '100%', duration: Number(el.dataset.dur ?? 0.9), ease: 'power2.inOut', delay: Number(el.dataset.delay ?? 0),
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    })
  })
}

/* Counts a number up once when it scrolls into view; the final number is in the markup. */
export function countOnView(el: HTMLElement, to: number) {
  const o = { v: 0 }
  gsap.to(o, {
    v: to, duration: 1, ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    onUpdate: () => { el.textContent = String(Math.round(o.v)) },
  })
}

/* Emoji burst at a point, for reactions and RSVPs. */
export function burst(x: number, y: number, glyphs: string[], n = 10) {
  const layer = document.createElement('div')
  layer.className = 'burst'
  layer.setAttribute('aria-hidden', 'true')
  layer.style.left = `${x}px`
  layer.style.top = `${y}px`
  document.body.appendChild(layer)
  const reduced = prefersReduced()
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span')
    s.textContent = glyphs[i % glyphs.length]
    layer.appendChild(s)
    if (reduced) continue
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.5
    const d = 60 + Math.random() * 70
    gsap.fromTo(s, { x: 0, y: 0, scale: 0.4, opacity: 1 }, {
      x: Math.cos(a) * d, y: Math.sin(a) * d - 40, scale: 1 + Math.random() * 0.6, rotation: (Math.random() - 0.5) * 90,
      opacity: 0, duration: 0.9 + Math.random() * 0.4, ease: 'power3.out',
    })
  }
  window.setTimeout(() => layer.remove(), reduced ? 500 : 1400)
}

/* Confetti made of little scribbles, for the waitlist finish line. */
export function confetti(el: Element) {
  if (prefersReduced()) return
  const r = el.getBoundingClientRect()
  const colors = ['#ff4a2e', '#ffd12e', '#2f6bff', '#ff6fb5', '#1fbf7f']
  const shapes = ['M2 10 Q6 2 10 10 T18 10', 'M10 2 L12 8 L18 10 L12 12 L10 18 L8 12 L2 10 L8 8Z', 'M3 3 L17 17 M17 3 L3 17', 'M10 3 a7 7 0 1 0 0.1 0']
  const layer = document.createElement('div')
  layer.className = 'burst'
  layer.style.left = `${r.left + r.width / 2}px`
  layer.style.top = `${r.top + r.height / 3}px`
  document.body.appendChild(layer)
  for (let i = 0; i < 36; i++) {
    const c = colors[i % colors.length]
    const ns = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(ns, 'svg')
    svg.setAttribute('viewBox', '0 0 20 20')
    svg.setAttribute('width', '22')
    svg.setAttribute('height', '22')
    const p = document.createElementNS(ns, 'path')
    p.setAttribute('d', shapes[i % shapes.length])
    p.setAttribute('fill', i % 4 === 1 ? c : 'none')
    p.setAttribute('stroke', c)
    p.setAttribute('stroke-width', '3')
    p.setAttribute('stroke-linecap', 'round')
    svg.appendChild(p)
    layer.appendChild(svg)
    gsap.fromTo(svg, { x: 0, y: 0, rotation: 0 }, {
      x: (Math.random() - 0.5) * r.width * 1.1,
      y: -(80 + Math.random() * 220),
      rotation: (Math.random() - 0.5) * 720,
      duration: 0.8, ease: 'power3.out',
      onComplete: () => void gsap.to(svg, { y: '+=' + (260 + Math.random() * 200), opacity: 0, duration: 1.1, ease: 'power1.in' }),
    })
  }
  window.setTimeout(() => layer.remove(), 2400)
}
