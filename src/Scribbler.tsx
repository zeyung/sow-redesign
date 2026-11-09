import { useEffect, useRef } from 'react'
import { prefersReduced, usePaused } from './motion'

/* The hero's one effect: an ink line that chases the pointer (or wanders on its own),
   drawn on a 2D canvas, fading as it goes. Rests as a still scribble under reduced motion. */
const PENS = ['#d6ff3c', '#ff7ac6', '#fff8ec']
export default function Scribbler({ colors = PENS, ground = '35,64,255' }: { colors?: string[]; ground?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const paused = usePaused()
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let w = 0, h = 0, dpr = 1
    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = cv.getBoundingClientRect()
      w = r.width; h = r.height
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    }
    size()
    const ro = new ResizeObserver(size)
    ro.observe(cv)

    // three pens, each chasing the one ahead; the first chases the pointer
    const pens = colors.map((c, i) => ({ x: w * 0.7, y: h * 0.5, vx: 0, vy: 0, c, k: 0.035 - i * 0.008, wd: 5 - i * 1.2 }))
    const target = { x: w * 0.7, y: h * 0.4, live: false, last: 0 }
    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect()
      target.x = e.clientX - r.left; target.y = e.clientY - r.top
      target.live = true; target.last = performance.now()
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    if (prefersReduced()) {
      // a still scribble, drawn once
      ctx.strokeStyle = colors[0]; ctx.lineWidth = 4; ctx.globalAlpha = 0.5
      ctx.beginPath()
      for (let t = 0; t < 12; t += 0.05) {
        const x = w * 0.62 + Math.sin(t * 1.3) * w * 0.25 + Math.sin(t * 5.1) * 16
        const y = h * 0.5 + Math.sin(t * 0.9 + 1) * h * 0.32 + Math.cos(t * 4.3) * 16
        t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()
      return () => { ro.disconnect(); window.removeEventListener('pointermove', onMove) }
    }

    let visible = true
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(cv)
    let raf = 0
    let t = 0
    const frame = () => {
      raf = requestAnimationFrame(frame)
      if (!visible || pausedRef.current) return
      t += 0.012
      if (performance.now() - target.last > 2200) target.live = false
      if (!target.live) {
        // wander in a loose figure-eight when nobody is pointing
        target.x = w * 0.66 + Math.sin(t * 1.1) * w * 0.26 + Math.sin(t * 3.7) * 30
        target.y = h * 0.5 + Math.sin(t * 2.2) * h * 0.3 + Math.cos(t * 4.1) * 24
      }
      ctx.fillStyle = `rgba(${ground},0.075)`
      ctx.fillRect(0, 0, w, h)
      let lead = { x: target.x, y: target.y }
      for (const p of pens) {
        const ox = p.x, oy = p.y
        p.vx = (p.vx + (lead.x - p.x) * p.k) * 0.88
        p.vy = (p.vy + (lead.y - p.y) * p.k) * 0.88
        p.x += p.vx + (Math.random() - 0.5) * 1.6
        p.y += p.vy + (Math.random() - 0.5) * 1.6
        ctx.strokeStyle = p.c
        ctx.lineWidth = p.wd
        ctx.globalAlpha = 0.9
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(p.x, p.y); ctx.stroke()
        lead = p
      }
      ctx.globalAlpha = 1
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect()
      window.removeEventListener('pointermove', onMove)
    }
  }, [colors, ground])

  return <canvas ref={ref} className="scribbler" aria-hidden="true" />
}
