# Sow Social, redesigned

A full redesign of sowsocial.site as a riso-printed poster that moves: cobalt, lime, tomato and pink, a heavy grotesk (Bricolage Grotesque) with hand-scribbled notes on top, and the Sow app itself in the hero.

Live test site: https://zeyung.github.io/sow-redesign/
Sister version (the evolved notebook look): https://github.com/zeyung/sow-evolved

## Stack

- **Vite + React 19 + TypeScript**
- **GSAP 3** (ScrollTrigger with pinning, DrawSVG, quickTo) for motion
- A plain **2D canvas** for the hero effect. There's no WebGL, so it's light on phones.
- Fonts via Fontsource: Bricolage Grotesque (type), Caveat (scribbles), IBM Plex Mono (labels)

```bash
npm install
npm run dev      # local /api/waitlist writes data/waitlist.json
npm run build
```

## Components

| Section | What it does |
|---|---|
| Hero | Ink scribbler canvas: three pens chase your pointer and wander in a figure-eight when idle. Masked line-reveal headline with a hand-drawn circle. A live phone mock-up of the app loops through a crew forming and "You're in ✓" (restarts on hover). Floating stickers. A giant marquee band that speeds up with scroll velocity. |
| Why Sow exists | Three colour tiles that count up, and a statement that fills in word by word as you scroll. |
| How a Sow night works | A pinned strip: scroll down and the four steps slide sideways with a progress bar. Stacks vertically below 1024px. |
| Six house rules | A die-cut sticker sheet. The stickers pop in, then straighten and lift on hover. |
| Games | Bearings (playable) in a dark console card, and Deep Roots with growing roots. |
| Upcoming nights | A gig-poster list. Hovering a row tints it and a photo follows the cursor. RSVP and emoji reactions burst from the click. Phones get inline photos. |
| Venues | A big "50–100 students" pitch and the venue form card. |
| Waitlist | The real `Waitlist` component on lime, with a spinning ".edu" badge and confetti on join. |
| Footer | Giant "sow social" letters that lean away from the pointer. |

One **pause button** in the nav stops every loop. `prefers-reduced-motion` turns motion off, and the scribbler draws one still line instead.

## Waitlist backend

The same as the evolved site. `npm run deploy` builds with `VITE_WAITLIST_MODE=demo` (signups stay in the visitor's browser). Set `VITE_WAITLIST_ENDPOINT` for production.

## Stand-ins to replace

- All photos are Unsplash stand-ins (`public/credits.html`).
- The phone mock-up's details ("9:00 pm · rooftop, Southside", "meet at 8:40", "Meet at the fountain first") are illustrative. Swap in real app screens when you have them.
- Headings were rewritten to name things plainly ("Upcoming nights at Berkeley", "Six house rules"). The body copy is the live site's, in sentence case.

## Deploy

`npm run deploy` builds with the right base path and pushes `dist/` to the `gh-pages` branch, which GitHub Pages serves.
