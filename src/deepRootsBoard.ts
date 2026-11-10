import { feetOf } from './deepRootsData'
import type { Run } from './deepRootsData'
import { partyConfigured, supabase } from './deepRootsParty'

/* Deep Roots leaderboard. With Supabase configured it is campus-wide: today's runs from the
   `deeproots_scores` table (SQL in the README). Without it, it lists this browser's best days. */

export const boardOnline = partyConfigured
export const BOARD_EVENT = 'deeproots:board'
export type BoardRow = { name: string; ft: number }
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

/* This browser's five deepest daily runs. */
export function localBoard(): BoardRow[] {
  const rows: BoardRow[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k?.startsWith('deeproots:run:')) continue
      const run = JSON.parse(localStorage.getItem(k) ?? 'null') as Run | null
      if (run) rows.push({ name: new Date(run.day * 86400000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }), ft: feetOf(run.picks) })
    }
  } catch { /* storage blocked: empty board */ }
  return rows.sort((a, b) => b.ft - a.ft).slice(0, 5)
}
