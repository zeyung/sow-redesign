/* Deep Roots: seven campus prompts a day, the same for everyone. Name something that fits;
   the rarer the answer, the deeper your roots grow. Every list here is hand-curated and meant
   to be edited: add an answer as [name, tier, ...aliases]. */

export type Tier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'exotic' | 'mythic' | 'prismatic'

/* ft is how far one answer grows your roots. Prismatic is the single rarest answer to each prompt:
   exactly one per prompt. */
export const TIERS: Record<Tier, { label: string; ft: number; color: string }> = {
  common: { label: 'Common', ft: 5, color: '#9aa1ab' },
  uncommon: { label: 'Uncommon', ft: 10, color: '#4cc76a' },
  rare: { label: 'Rare', ft: 20, color: '#3d8bff' },
  epic: { label: 'Epic', ft: 35, color: '#a66bff' },
  legendary: { label: 'Legendary', ft: 50, color: '#ff8a1f' },
  exotic: { label: 'Exotic', ft: 70, color: '#22d3ee' },
  mythic: { label: 'Mythic', ft: 90, color: '#fdb515' },
  prismatic: { label: 'Prismatic', ft: 120, color: '#ff5fd2' },
}
export const TIER_ORDER: Tier[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'exotic', 'mythic', 'prismatic']

/* Depth guides drawn in the soil, in feet. */
export const STRATA = [
  { label: 'topsoil', ft: 10 },
  { label: 'loam', ft: 30 },
  { label: 'clay', ft: 55 },
  { label: 'bedrock', ft: 85 },
  { label: 'taproot', ft: 120 },
]

type Row = [string, Tier, ...string[]]
export type Answer = { id: string; name: string; tier: Tier; keys: string[] }
export type Prompt = { id: string; text: string; answers: Answer[] }

const T: Tier = 'common', L: Tier = 'uncommon', C: Tier = 'rare', B: Tier = 'epic', R: Tier = 'legendary'
const X: Tier = 'exotic', M: Tier = 'mythic', P: Tier = 'prismatic'

const RAW: { id: string; text: string; rows: Row[] }[] = [
  {
    id: 'building', text: 'A building on campus',
    rows: [
      ['Doe Library', T, 'doe', 'main library'], ['Sather Tower', T, 'campanile', 'the campanile', 'sather'], ['Wheeler Hall', T], ['Sproul Hall', T],
      ['Moffitt Library', T, 'moffitt'], ['Dwinelle Hall', L], ['Evans Hall', L], ['Soda Hall', L], ['Haas School of Business', L, 'haas'],
      ['Pimentel Hall', L, 'pimentel'], ['MLK Student Union', L, 'mlk', 'student union', 'martin luther king jr student union'], ['Valley Life Sciences Building', C, 'vlsb', 'valley life sciences'],
      ['Cory Hall', C], ['Etcheverry Hall', C], ['Hearst Mining Building', C, 'hearst mining'], ['Stanley Hall', C], ['Hearst Gym', C, 'hearst memorial gymnasium'],
      ['Zellerbach Hall', C, 'zellerbach'], ['Kroeber Hall', C], ['Wurster Hall', C], ['Bancroft Library', C, 'the bancroft'], ['Li Ka Shing Center', C, 'li ka shing'],
      ['Jacobs Hall', C], ['Bechtel Engineering Center', C, 'bechtel'], ['Law Building', C, 'boalt', 'boalt hall', 'berkeley law'], ['Chou Hall', C],
      ['Barker Hall', B], ['Giannini Hall', B], ['Hildebrand Hall', B], ['Latimer Hall', B], ['Lewis Hall', B], ['Tan Hall', B], ['Mulford Hall', B],
      ['Morgan Hall', B], ['Koshland Hall', B], ['Sutardja Dai Hall', B, 'sdh'], ['McCone Hall', B], ['Birge Hall', B], ['LeConte Hall', B, 'le conte hall'],
      ['Campbell Hall', B], ['Hertz Hall', B], ['Morrison Hall', B], ['Stephens Hall', B], ['Moses Hall', B], ['Durant Hall', B], ['California Hall', B],
      ['Davis Hall', B], ['McLaughlin Hall', B], ['Cheit Hall', B], ['Eshleman Hall', B], ['Berkeley Way West', B], ['North Gate Hall', B], ['Faculty Club', B],
      ['Anthony Hall', X], ['Womens Faculty Club', M], ['Blum Hall', R], ['Hesse Hall', R], ['OBrien Hall', R], ['Minor Hall', X], ['Haviland Hall', X], ['Gilman Hall', P], ['Tolman Hall', M],
    ],
  },
  {
    id: 'sport', text: 'A Cal varsity sport',
    rows: [
      ['Football', T], ['Basketball', T, 'hoops'], ['Soccer', T], ['Swimming', L, 'swim', 'swim and dive'], ['Water polo', L], ['Rugby', L], ['Rowing', L, 'crew'],
      ['Baseball', L], ['Volleyball', L], ['Softball', C], ['Tennis', C], ['Golf', C], ['Gymnastics', C], ['Track and field', C, 'track'], ['Cross country', C, 'xc'],
      ['Field hockey', X], ['Lacrosse', R], ['Beach volleyball', M, 'sand volleyball'], ['Diving', P],
    ],
  },
  {
    id: 'city', text: 'A Bay Area city that isn’t Berkeley',
    rows: [
      ['San Francisco', T, 'sf', 'the city'], ['Oakland', T], ['San Jose', T], ['Albany', L], ['Emeryville', L], ['El Cerrito', L], ['Richmond', L], ['Alameda', L],
      ['Palo Alto', L], ['Fremont', L], ['Walnut Creek', C], ['Hayward', C], ['Daly City', C], ['Orinda', C], ['Piedmont', C], ['Sausalito', C], ['San Mateo', C],
      ['Mountain View', C], ['Sunnyvale', C], ['Santa Clara', C], ['Cupertino', C], ['Redwood City', C], ['Menlo Park', C], ['San Leandro', C], ['Concord', C],
      ['Lafayette', B], ['Moraga', B], ['Pleasanton', B], ['Livermore', B], ['Dublin', B], ['San Ramon', B], ['Danville', B], ['Mill Valley', B], ['San Rafael', B],
      ['Vallejo', B], ['Pacifica', B], ['Half Moon Bay', B], ['Burlingame', B], ['Millbrae', B], ['Union City', B], ['Newark', B], ['Martinez', B], ['Novato', B],
      ['Hercules', R], ['Pinole', R], ['Benicia', R], ['Tiburon', R], ['Belvedere', M], ['Larkspur', R], ['Brisbane', X], ['Colma', P], ['Atherton', X],
    ],
  },
  {
    id: 'course', text: 'A lower-division class people talk about',
    rows: [
      ['CS 61A', T, '61a', 'cs61a'], ['Data 8', T, 'data8', 'data c8'], ['CS 61B', L, '61b', 'cs61b'], ['Math 1A', L], ['Math 53', L, 'multivariable calculus'],
      ['Math 54', L, 'linear algebra'], ['Chem 1A', L], ['Econ 1', L], ['CS 70', C, 'cs70'], ['CS 61C', C, '61c', 'cs61c'], ['Math 1B', C], ['Physics 7A', C],
      ['EECS 16A', C, '16a'], ['EECS 16B', B, '16b'], ['Physics 7B', B], ['Chem 3A', B], ['Stat 20', B], ['Psych 1', B], ['Bio 1A', B], ['Physics 8A', P], ['Chem 3B', X], ['Math 10A', M],
    ],
  },
  {
    id: 'eats', text: 'A dining hall or campus spot to eat',
    rows: [
      ['Crossroads', T], ['Cafe 3', T, 'cafe three', 'c3'], ['Foothill Dining', L, 'foothill'], ['Clark Kerr Dining', L, 'ckc dining', 'ckc'], ['Golden Bear Cafe', L, 'gbc'],
      ['Bear Market', C], ['Pat Browns', C], ['The Den', C], ['Browns Cafe', B, 'browns'], ['Ladle and Leaf', R], ['Free Speech Movement Cafe', X, 'fsm cafe', 'fsm'], ['Cafe Think', P],
    ],
  },
  {
    id: 'housing', text: 'A place students live',
    rows: [
      ['Unit 1', T], ['Unit 2', T], ['Unit 3', T], ['Clark Kerr Campus', L, 'clark kerr', 'ckc'], ['Foothill', L], ['Blackwell Hall', L, 'blackwell', 'david blackwell hall'],
      ['Martinez Commons', C, 'martinez'], ['Stern Hall', C, 'stern'], ['Bowles Hall', C, 'bowles'], ['International House', C, 'i house', 'ihouse'], ['Channing-Bowditch', B, 'channing bowditch'],
      ['University Village', B, 'uv', 'albany village'], ['Anchor House', R], ['Co-op', B, 'coop', 'bsc', 'berkeley student cooperative', 'a co op'], ['Cloyne Court', P, 'cloyne'], ['Casa Zimbabwe', M, 'cz'], ['Rochdale', X],
    ],
  },
  {
    id: 'outside', text: 'An outdoor spot on or near campus',
    rows: [
      ['Memorial Glade', T, 'the glade'], ['Sproul Plaza', T, 'sproul', 'upper sproul'], ['Sather Gate', T], ['Strawberry Creek', L], ['Faculty Glade', L],
      ['Eucalyptus Grove', L, 'euc grove'], ['The Big C', L, 'big c', 'charter hill'], ['Greek Theatre', C, 'greek theater', 'the greek'], ['Botanical Garden', C, 'uc botanical garden'],
      ['Tilden Park', C, 'tilden'], ['Indian Rock', C], ['Lawrence Hall of Science', C, 'lawrence hall'], ['Grizzly Peak', C], ['Tightwad Hill', B], ['Lower Sproul', B],
      ['Crescent Lawn', B], ['Dwinelle Plaza', B], ['Peoples Park', B], ['North Gate', B, 'northgate'], ['Observatory Hill', M], ['Founders Rock', P], ['West Circle', X],
    ],
  },
  {
    id: 'street', text: 'A street within a few blocks of campus',
    rows: [
      ['Telegraph Avenue', T, 'telegraph', 'tele'], ['Bancroft Way', T, 'bancroft'], ['Shattuck Avenue', T, 'shattuck'], ['Durant Avenue', L, 'durant'], ['Hearst Avenue', L, 'hearst'],
      ['College Avenue', L, 'college'], ['Oxford Street', L, 'oxford'], ['Euclid Avenue', L, 'euclid'], ['Channing Way', C, 'channing'], ['Haste Street', C, 'haste'],
      ['Dwight Way', C, 'dwight'], ['Piedmont Avenue', C, 'piedmont'], ['Gayley Road', C, 'gayley'], ['La Loma Avenue', C, 'la loma'], ['Le Conte Avenue', B, 'leconte'],
      ['Ridge Road', B, 'ridge'], ['Dana Street', B, 'dana'], ['Ellsworth Street', B, 'ellsworth'], ['Bowditch Street', B, 'bowditch'], ['Fulton Street', B, 'fulton'],
      ['Scenic Avenue', P, 'scenic'], ['Arch Street', M, 'arch'], ['Center Street', R, 'center'], ['Allston Way', R, 'allston'], ['Kittredge Street', X, 'kittredge'],
    ],
  },
  {
    id: 'bart', text: 'A BART station',
    rows: [
      ['Downtown Berkeley', T, 'berkeley'], ['North Berkeley', L], ['Ashby', L], ['MacArthur', L, 'mac arthur'], ['Rockridge', L], ['Embarcadero', L],
      ['Powell Street', L, 'powell'], ['Montgomery Street', L, 'montgomery'], ['Civic Center', C, 'civic center un plaza'], ['16th Street Mission', C, '16th st mission', '16th and mission'],
      ['24th Street Mission', C, '24th st mission', '24th and mission'], ['19th Street Oakland', C, '19th st'], ['12th Street Oakland City Center', C, '12th st', 'city center'],
      ['West Oakland', C], ['Lake Merritt', C], ['El Cerrito Plaza', C], ['El Cerrito del Norte', C, 'del norte'], ['Richmond', C], ['SFO', C, 'sfo airport', 'san francisco international airport'],
      ['Fruitvale', B], ['Coliseum', B], ['Orinda', B], ['Lafayette', B], ['Walnut Creek', B], ['Pleasant Hill', B], ['Concord', B], ['Glen Park', B], ['Balboa Park', B],
      ['Daly City', B], ['Millbrae', B], ['Fremont', B], ['Milpitas', B], ['Berryessa', B], ['Dublin/Pleasanton', B, 'dublin pleasanton', 'dublin'], ['Oakland Airport', B],
      ['San Leandro', R], ['Bay Fair', R, 'bayfair'], ['Hayward', R], ['South Hayward', R], ['Union City', R], ['Warm Springs', R], ['Castro Valley', X], ['West Dublin', X],
      ['North Concord', P, 'north concord martinez', 'north concord/martinez'], ['Pittsburg/Bay Point', R, 'pittsburg bay point', 'bay point'], ['Pittsburg Center', M], ['Antioch', R], ['Colma', R], ['South San Francisco', R], ['San Bruno', R],
    ],
  },
  {
    id: 'element', text: 'A chemical element discovered at Berkeley',
    rows: [
      ['Berkelium', T], ['Californium', L], ['Plutonium', L], ['Seaborgium', C], ['Lawrencium', C], ['Mendelevium', B], ['Neptunium', B], ['Einsteinium', B],
      ['Fermium', B], ['Astatine', P], ['Nobelium', M], ['Rutherfordium', R], ['Dubnium', X],
    ],
  },
  {
    id: 'acc', text: 'A school in Cal’s athletic conference',
    rows: [
      ['Stanford', T, 'the farm'], ['Duke', L], ['Clemson', L], ['Miami', L, 'the u'], ['North Carolina', L, 'unc'], ['Florida State', L, 'fsu'], ['SMU', C, 'southern methodist'],
      ['Notre Dame', C], ['Virginia', C, 'uva'], ['Virginia Tech', C], ['Louisville', C], ['Syracuse', C], ['Georgia Tech', B], ['NC State', B, 'north carolina state'],
      ['Pitt', B, 'pittsburgh'], ['Boston College', R, 'bc'], ['Wake Forest', P],
    ],
  },
  {
    id: 'coffee', text: 'A place to get coffee in Berkeley',
    rows: [
      ['Peets', T], ['Philz', T], ['Starbucks', L], ['Caffe Strada', L, 'strada'], ['Blue Bottle', C], ['Cafe Milano', C, 'milano'], ['Free Speech Movement Cafe', C, 'fsm cafe', 'fsm'],
      ['Yalis', B], ['Brewed Awakening', B], ['Nefeli Caffe', B, 'nefeli'], ['Romeos Coffee', B, 'romeos'], ['Cafe Think', M], ['Caffe Mediterraneum', P, 'the med', 'mediterraneum'],
    ],
  },
  {
    id: 'tradition', text: 'A Cal tradition, chant or piece of game day',
    rows: [
      ['Big Game', T], ['Go Bears', T], ['Oski', T], ['The Axe', L, 'stanford axe', 'axe'], ['Cal Band', L, 'the band'], ['The Big C', L, 'big c'],
      ['Card stunts', C, 'card stunt'], ['Victory Bell', C, 'bell'], ['Tightwad Hill', C], ['Bonfire Rally', B, 'bonfire'], ['Axe Rally', B], ['Campanile bells', B, 'carillon', 'bells'],
      ['The Play', B, 'the band is on the field'], ['Painting the C', P], ['Senior Bench', M], ['Rally Committee', R, 'rally comm'],
    ],
  },
]

/* ---------- matching ---------- */
const GENERIC = new Set(['the', 'a', 'an', 'of', 'and', 'hall', 'library', 'building', 'center', 'avenue', 'ave', 'street', 'st', 'way', 'road', 'rd', 'station', 'bart', 'caffe', 'cafe', 'coffee', 'dining', 'campus', 'uc', 'university'])

export const normalize = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()

/* The "core" of a name: lowercase words with filler (the, hall, avenue, station...) dropped. */
export const core = (s: string) => {
  const words = normalize(s).split(' ').filter(Boolean)
  const kept = words.filter((w) => !GENERIC.has(w))
  return (kept.length ? kept : words).join(' ')
}

function lev(a: string, b: string) {
  if (a === b) return 0
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
      diag = tmp
    }
  }
  return prev[b.length]
}
const slack = (n: number) => (n <= 3 ? 0 : n <= 8 ? 1 : 2)

export const PROMPTS: Prompt[] = RAW.map(({ id, text, rows }) => ({
  id,
  text,
  answers: rows.map(([name, tier, ...aliases]) => ({
    id: `${id}:${core(name)}`,
    name,
    tier,
    keys: [...new Set([name, ...aliases].map(core))],
  })),
}))

if (import.meta.env?.DEV) {
  for (const p of PROMPTS) {
    const n = p.answers.filter((a) => a.tier === 'prismatic').length
    if (n !== 1) console.warn(`Deep Roots: prompt "${p.id}" has ${n} prismatic answers; it should have exactly 1.`)
  }
}

/* Forgiving match: case, punctuation, "the" and words like "hall" don't matter, and a typo or two
   is fine on longer names. Anything with a number (Unit 2, CS 61B) has to match exactly. */
export function match(prompt: Prompt, guess: string): Answer | null {
  const g = core(guess)
  if (!g) return null
  let best: Answer | null = null
  let bestD = Infinity
  for (const a of prompt.answers) {
    for (const k of a.keys) {
      if (k === g) return a
      if (/\d/.test(k) || /\d/.test(g)) continue
      const d = lev(k, g)
      if (d <= slack(Math.min(k.length, g.length)) && d < bestD) {
        best = a
        bestD = d
      }
    }
  }
  return best
}

/* ---------- the day ---------- */
export const PER_DAY = 7
export const SECONDS = 25

/* Days roll over at midnight in Berkeley, not UTC. */
export function berkeleyDay(now = new Date()) {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(now).split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000)
}

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export function shuffled<X>(xs: X[], seed: number) {
  const r = rng(seed)
  const out = xs.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
export const promptsFor = (seed: number) => shuffled(PROMPTS, seed * 7919 + 17).slice(0, PER_DAY)

/* ---------- saved runs and streaks (this browser only) ---------- */
export type Pick = { promptId: string; guess: string; answerId: string | null }
/* picks is the latest run; best is the deepest run of the day (bonus tries included). */
export type Run = { day: number; picks: Pick[]; best?: number }
type Streak = { last: number; current: number; best: number }

const KEY_RUN = (day: number) => `deeproots:run:${day}`
const KEY_STREAK = 'deeproots:streak'
const read = <X,>(k: string): X | null => {
  try {
    const v = localStorage.getItem(k)
    return v ? (JSON.parse(v) as X) : null
  } catch {
    return null
  }
}
const write = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v))
  } catch {
    /* private window: the run still plays, it just isn't remembered */
  }
}
export const loadRun = (day: number) => read<Run>(KEY_RUN(day))
export function saveRun(run: Run) {
  const prev = read<Run>(KEY_RUN(run.day))
  const prevBest = prev ? prev.best ?? feetOf(prev.picks) : 0
  write(KEY_RUN(run.day), { ...run, best: Math.max(prevBest, feetOf(run.picks)) })
  const s = read<Streak>(KEY_STREAK) ?? { last: -1, current: 0, best: 0 }
  if (s.last === run.day) return s
  const current = s.last === run.day - 1 ? s.current + 1 : 1
  const next = { last: run.day, current, best: Math.max(s.best, current) }
  write(KEY_STREAK, next)
  return next
}
export function loadStreak(day: number) {
  const s = read<Streak>(KEY_STREAK)
  if (!s || s.last < day - 1) return { current: 0, best: s?.best ?? 0 }
  return { current: s.current, best: s.best }
}

export const bestOf = (run: Run) => run.best ?? feetOf(run.picks)

/* ---------- bonus tries: one for being on the waitlist, one for sending the game to a friend ---------- */
export type BonusKind = 'waitlist' | 'share'
export type Bonus = { shared: boolean; used: BonusKind[] }
export const JOIN_EVENT = 'sow:joined'
const KEY_BONUS = (day: number) => `deeproots:bonus:${day}`
export const loadBonus = (day: number): Bonus => read<Bonus>(KEY_BONUS(day)) ?? { shared: false, used: [] }
export function markShared(day: number) {
  write(KEY_BONUS(day), { ...loadBonus(day), shared: true })
}
export function spendBonus(day: number, kind: BonusKind) {
  const b = loadBonus(day)
  if (!b.used.includes(kind)) write(KEY_BONUS(day), { ...b, used: [...b.used, kind] })
}
/* Anyone who has joined the Sow waitlist in this browser (now or before) earns the waitlist try. */
export function onWaitlist() {
  try {
    if (localStorage.getItem('sow:joined') === '1') return true
    return (JSON.parse(localStorage.getItem('sow-demo-waitlist') || '[]') as unknown[]).length > 0
  } catch {
    return false
  }
}
/* Done for the day once the daily run and both bonus tries are played. */
export const dayOver = (day: number) => !!loadRun(day) && loadBonus(day).used.length >= 2
/* Bonus tries get their own seven prompts, so a retry isn't a replay of answers you just saw. */
export const bonusPrompts = (day: number, kind: BonusKind) => promptsFor(day * 31 + (kind === 'waitlist' ? 100003 : 200003))

export const promptById = (id: string) => PROMPTS.find((p) => p.id === id)!
export const answerById = (p: Prompt, id: string | null) => (id ? p.answers.find((a) => a.id === id) ?? null : null)
export const feetOf = (picks: Pick[]) =>
  picks.reduce((sum, k) => {
    const p = PROMPTS.find((x) => x.id === k.promptId)
    const a = p ? answerById(p, k.answerId) : null
    return sum + (a ? TIERS[a.tier].ft : 0)
  }, 0)
