import { partyConfigured, supabase } from './deepRootsParty'

/* Deep Roots leaderboard. With Supabase configured it is campus-wide: today's runs from the
   `deeproots_scores` table (SQL in the README). Without it, it shows a placeholder board. */

export const boardOnline = partyConfigured
export const BOARD_EVENT = 'deeproots:board'
export type BoardRow = { name: string; ft: number; me?: boolean }
const MAX_FT = 7 * 120
const postedKey = (day: number) => `deeproots:posted:${day}`

export async function todayBoard(day: number): Promise<BoardRow[]> {
  try {
    const { data, error } = await (await supabase())
      .from('deeproots_scores').select('name, ft').eq('day', day).order('ft', { ascending: false }).order('created_at').limit(10)
    if (error) throw error
    return (data ?? []) as BoardRow[]
  } catch {
    return []
  }
}

export async function postScore(day: number, name: string, ft: number) {
  try {
    const { error } = await (await supabase()).from('deeproots_scores').insert({ day, name: name.slice(0, 16), ft: Math.max(0, Math.min(MAX_FT, ft)) })
    if (error) throw error
    localStorage.setItem(postedKey(day), '1')
    window.dispatchEvent(new Event(BOARD_EVENT))
    return true
  } catch {
    return false
  }
}

export const postedToday = (day: number) => {
  try {
    return localStorage.getItem(postedKey(day)) === '1'
  } catch {
    return false
  }
}

/* Placeholder board until the real one is switched on: ten made-up players whose scores change
   each day (seeded by the date, so everyone sees the same board), plus you if you've played. */
const NAMES = [
  'oskiwannabe', 'campanile_cat', 'doe_dweller', 'telegraph_tom', 'strawberrycreek', 'goldenbearbri', 'unit2survivor',
  'memglade_mae', 'cs61a_enjoyer', 'sathergate', 'cafe3regular', 'bigc_hiker', 'moffitt_at_3am', 'eucgrove', 'go_bears_gabe',
  'northside_nia', 'southside_sam', 'blue_and_gold', 'axe_keeper', 'tightwad_ty',
]
function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), a | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export function placeholderBoard(day: number, mine: number | null): BoardRow[] {
  const r = seeded(day * 9973 + 5)
  const names = NAMES.slice().sort(() => r() - 0.5).slice(0, 10)
  const rows: BoardRow[] = names.map((name) => ({ name, ft: Math.round(140 + r() * 400) }))
  if (mine !== null) rows.push({ name: 'you', ft: mine, me: true })
  return rows.sort((a, b) => b.ft - a.ft).slice(0, 10)
}
