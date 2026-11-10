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
| Games | Bearings (playable) in a dark console card, and Deep Roots, a daily campus word game in Berkeley Blue and California Gold, with a Pass the Acorn party mode. |
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

## Deep Roots

A daily game in the Games section. Seven Berkeley prompts a day, the same for everyone, with 25 seconds each. Every accepted answer has a hand-set rarity tier (Topsoil, Loam, Clay, Bedrock, Taproot), and rarer answers grow your roots deeper. Runs, streaks and your best score stay in the visitor's browser. Days roll over at midnight Pacific.

- Prompts, answers, aliases and tiers live in `src/deepRootsData.ts`. Add an answer as `['Name', tier, ...aliases]`. The matcher ignores case, punctuation, "the" and filler words like "hall" or "avenue", and allows a typo or two on longer names. Answers with numbers (Unit 2, CS 61B) must match exactly.
- **Practice round** plays a random set without touching the streak.

### Pass the Acorn (party mode)

Players join a room with a four-letter code or an invite link (`?acorn=CODE#games`). Each round has one category. Whoever holds the acorn names an answer nobody has said yet, and the acorn moves to the next player. A hidden fuse of 10 to 30 seconds keeps ticking, and a player who has just received the acorn always gets at least 4 seconds. Whoever is holding it when the fuse runs out is out, and the last player standing wins.

The site is static, so rooms run on [Supabase Realtime](https://supabase.com/docs/guides/realtime). Presence tracks who is in the room and broadcast carries the turns. The earliest player in the room is the host: it runs the fuse, checks answers and broadcasts the game state. If the host leaves, the next player takes over. The game needs no tables.

```bash
# .env.local (git-ignored)
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<the project's anon / publishable key>
```

The anon key is public by design, but never commit a service-role key. In the Supabase dashboard, Realtime must allow public channels (the default). Without these variables the site still builds, single-player still works, and party mode shows a setup note. The Supabase client is only downloaded when someone opens party mode.

