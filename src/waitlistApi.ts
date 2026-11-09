export const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'] as const
export type Year = (typeof YEARS)[number]
export type Signup = { firstName: string; lastName: string; email: string; year: Year }

const EDU = /^[^\s@]+@(?:[a-z0-9-]+\.)+edu$/i
export const isEduEmail = (v: string) => EDU.test(v.trim())

// Production: set VITE_WAITLIST_ENDPOINT to a backend with POST / and POST /answer.
// `npm run dev` / `npm run preview`: the plugin in vite.config.ts answers /api/waitlist (data/waitlist.json).
// GitHub Pages test build: VITE_WAITLIST_MODE=demo keeps signups in this browser only (localStorage).
const ENDPOINT = import.meta.env.VITE_WAITLIST_ENDPOINT ?? '/api/waitlist'
const DEMO = import.meta.env.VITE_WAITLIST_MODE === 'demo' && !import.meta.env.VITE_WAITLIST_ENDPOINT

async function post<T>(path: string, body: unknown): Promise<T> {
  if (DEMO) return demo(path, body) as Promise<T>
  const res = await fetch(ENDPOINT + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : `HTTP ${res.status}`)
  return data as T
}

function demo(path: string, body: unknown): Promise<unknown> {
  const key = 'sow-demo-waitlist'
  let rows: Record<string, unknown>[] = []
  try { rows = JSON.parse(localStorage.getItem(key) || '[]') } catch { /* private mode */ }
  const b = body as Record<string, string>
  let out: unknown = { ok: true }
  if (path === '') {
    const id = crypto.randomUUID()
    rows.push({ ...b, id, createdAt: new Date().toISOString() })
    out = { id }
  } else {
    const r = rows.find((x) => x.id === b.id)
    if (r) r.answer = b.answer
  }
  try { localStorage.setItem(key, JSON.stringify(rows)) } catch { /* private mode */ }
  return new Promise((res) => setTimeout(() => res(out), 450))
}

export const joinWaitlist = (s: Signup) => post<{ id: string }>('', s)
export const sendAnswer = (id: string, answer: string) => post<{ ok: true }>('/answer', { id, answer })
