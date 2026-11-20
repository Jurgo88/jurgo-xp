// Guestbook drawn in "Paint": visitors draw a small picture, sign it and send it.
// Nothing is public until Jurgo approves it.
//
//   GET  /api/guestbook                 approved entries (public, newest first)
//   GET  /api/guestbook/img/:id         the PNG of an approved entry (admin token: any entry)
//   POST /api/guestbook                 new entry {name, note, image: data:image/png;base64,…, website (honeypot)}
//   GET  /api/guestbook?admin=1         all entries incl. pending/hidden   (Authorization: Bearer <token>)
//   POST /api/guestbook?admin=1         {action: approve|hide|delete, id}  (Authorization: Bearer <token>)
//
// Env (set in Netlify, never in the repo):
//   GUESTBOOK_ADMIN_TOKEN   required for moderation; without it entries are stored but nobody can approve them
//
// Storage: Netlify Blobs store "guestbook" (free, part of the site):
//   entry/<id>  JSON metadata      img/<id>  PNG bytes      index  JSON list of approved entries
//   rate/<hour|day>/<hash>  per-visitor counters (IP hashed with the date, never stored raw)
// The public index is only written by admin actions, so visitors' submissions never race on it.
import { getStore } from '@netlify/blobs'

declare const Netlify: { env: { get(name: string): string | undefined } }
type Context = { ip?: string; params?: Record<string, string> }

const W = 400
const H = 300
const MAX_PNG_BYTES = 200_000
const MAX_NAME = 40
const MAX_NOTE = 140
const PER_IP_HOUR = 3
const PER_IP_DAY = 6
const SITE_PER_DAY = 60 // stops a flood from filling the store
const INDEX_MAX = 300

const ALLOWED_ORIGINS = [
  /^https:\/\/(www\.)?jurgo\.sk$/,
  /^https:\/\/([a-z0-9-]+--)?jurgo(-xp)?\.netlify\.app$/,
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
]

type Status = 'pending' | 'approved' | 'hidden'
interface Entry { id: string; name: string; note: string; createdAt: string; status: Status }
type PublicEntry = Omit<Entry, 'status'>

// --- storage (Netlify Blobs; in-memory fallback for local dev and tests) ---------------------
interface Kv {
  getJSON<T>(key: string): Promise<T | null>
  setJSON(key: string, value: unknown): Promise<void>
  getBytes(key: string): Promise<ArrayBuffer | null>
  setBytes(key: string, value: Uint8Array): Promise<void>
  del(key: string): Promise<void>
  keys(prefix: string): Promise<string[]>
}
const memory = new Map<string, unknown>()
function kv(): Kv {
  try {
    const s = getStore({ name: 'guestbook', consistency: 'strong' })
    return {
      getJSON: async <T,>(k: string) => (await s.get(k, { type: 'json' })) as T | null,
      setJSON: async (k, v) => { await s.setJSON(k, v) },
      getBytes: async k => (await s.get(k, { type: 'arrayBuffer' })) as ArrayBuffer | null,
      setBytes: async (k, v) => { await s.set(k, v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength) as ArrayBuffer) },
      del: async (k) => { await s.delete(k) },
      keys: async p => (await s.list({ prefix: p })).blobs.map(b => b.key),
    }
  }
  catch {
    return {
      getJSON: async <T,>(k: string) => (memory.get(k) as T | undefined) ?? null,
      setJSON: async (k, v) => { memory.set(k, structuredClone(v)) },
      getBytes: async (k) => {
        const v = memory.get(k) as Uint8Array | undefined
        return v ? (v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength) as ArrayBuffer) : null
      },
      setBytes: async (k, v) => { memory.set(k, v) },
      del: async (k) => { memory.delete(k) },
      keys: async p => [...memory.keys()].filter(k => k.startsWith(p)),
    }
  }
}

// --- helpers --------------------------------------------------------------------------------
const json = (status: number, body: unknown, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra },
  })

/** Single line, no control characters, trimmed and capped. */
function cleanText(v: unknown, max: number) {
  if (typeof v !== 'string') return ''
  // eslint-disable-next-line no-control-regex
  return v.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, ' ')
    .replace(/\s+/g, ' ').trim().slice(0, max)
}

/** Decodes a data URL and checks it is a real PNG of the expected size. */
function parsePng(dataUrl: unknown): Uint8Array | null {
  if (typeof dataUrl !== 'string') return null
  const m = dataUrl.match(/^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/)
  if (!m || m[1]!.length > Math.ceil(MAX_PNG_BYTES / 3) * 4) return null
  let bin: string
  try { bin = atob(m[1]!) }
  catch { return null }
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0))
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (bytes.length < 33 || sig.some((b, i) => bytes[i] !== b)) return null
  const dv = new DataView(bytes.buffer)
  // first chunk must be IHDR with our canvas size
  if (String.fromCharCode(...bytes.slice(12, 16)) !== 'IHDR') return null
  if (dv.getUint32(16) !== W || dv.getUint32(20) !== H) return null
  return bytes
}

async function hashIp(ip: string, day: string) {
  const salt = Netlify.env.get('GUESTBOOK_ADMIN_TOKEN')?.slice(-6) ?? ''
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`gb:${day}:${ip}:${salt}`))
  return [...new Uint8Array(d)].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('')
}

function isAdmin(req: Request) {
  const token = Netlify.env.get('GUESTBOOK_ADMIN_TOKEN') ?? ''
  const got = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (token.length < 12 || got.length !== token.length) return false
  let diff = 0
  for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ got.charCodeAt(i)
  return diff === 0
}

const newId = () => `${Date.now().toString(36)}${crypto.getRandomValues(new Uint32Array(1))[0]!.toString(36)}`
const validId = (id: unknown): id is string => typeof id === 'string' && /^[a-z0-9]{6,20}$/.test(id)
const toPublic = ({ status: _s, ...e }: Entry): PublicEntry => e

// --- handlers -------------------------------------------------------------------------------
async function image(req: Request, id: string) {
  const store = kv()
  const entry = await store.getJSON<Entry>(`entry/${id}`)
  const admin = isAdmin(req)
  if (!entry || (entry.status !== 'approved' && !admin)) return new Response('Not found', { status: 404 })
  const png = await store.getBytes(`img/${id}`)
  if (!png) return new Response('Not found', { status: 404 })
  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'X-Content-Type-Options': 'nosniff',
      // approved drawings never change; hidden/deleted ones simply stop being linked
      'Cache-Control': admin ? 'private, no-store' : 'public, max-age=86400',
    },
  })
}

async function submit(req: Request, context: Context) {
  const origin = req.headers.get('origin')
  if (!origin || !ALLOWED_ORIGINS.some(re => re.test(origin))) return json(403, { error: 'origin' })
  if (!(req.headers.get('content-type') ?? '').includes('application/json')) return json(415, { error: 'type' })
  const raw = await req.text()
  if (raw.length > MAX_PNG_BYTES * 1.4 + 2000) return json(413, { error: 'too_large' })
  let body: Record<string, unknown>
  try { body = JSON.parse(raw) }
  catch { return json(400, { error: 'bad_request' }) }

  // honeypot: pretend it worked so bots don't retry
  if (cleanText(body.website, 100)) return json(201, { ok: true, id: newId(), status: 'pending' })

  const name = cleanText(body.name, MAX_NAME)
  const note = cleanText(body.note, MAX_NOTE)
  const png = parsePng(body.image)
  if (name.length < 2) return json(400, { error: 'name' })
  if (!png) return json(400, { error: 'image' })

  const store = kv()
  const now = new Date()
  const day = now.toISOString().slice(0, 10)
  const hour = now.toISOString().slice(0, 13)
  const who = await hashIp(context.ip || 'unknown', day)
  const [perHour, perDay, site] = await Promise.all([
    store.getJSON<{ n: number }>(`rate/${hour}/${who}`),
    store.getJSON<{ n: number }>(`rate/${day}/${who}`),
    store.getJSON<{ n: number }>(`rate/${day}/site`),
  ])
  if ((perHour?.n ?? 0) >= PER_IP_HOUR || (perDay?.n ?? 0) >= PER_IP_DAY || (site?.n ?? 0) >= SITE_PER_DAY) {
    return json(429, { error: 'rate' }, { 'Retry-After': '3600' })
  }
  await Promise.all([
    store.setJSON(`rate/${hour}/${who}`, { n: (perHour?.n ?? 0) + 1 }),
    store.setJSON(`rate/${day}/${who}`, { n: (perDay?.n ?? 0) + 1 }),
    store.setJSON(`rate/${day}/site`, { n: (site?.n ?? 0) + 1 }),
  ])

  const entry: Entry = { id: newId(), name, note, createdAt: now.toISOString(), status: 'pending' }
  await store.setBytes(`img/${entry.id}`, png)
  await store.setJSON(`entry/${entry.id}`, entry)
  return json(201, { ok: true, id: entry.id, status: entry.status })
}

async function adminList() {
  const store = kv()
  const keys = await store.keys('entry/')
  const entries = (await Promise.all(keys.map(k => store.getJSON<Entry>(k)))).filter((e): e is Entry => !!e)
  entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return json(200, { entries })
}

async function adminAction(req: Request) {
  let body: { action?: unknown; id?: unknown }
  try { body = await req.json() }
  catch { return json(400, { error: 'bad_request' }) }
  const { action, id } = body
  if (!validId(id) || !['approve', 'hide', 'delete'].includes(action as string)) return json(400, { error: 'bad_request' })
  const store = kv()
  const entry = await store.getJSON<Entry>(`entry/${id}`)
  if (!entry) return json(404, { error: 'not_found' })

  const index = ((await store.getJSON<PublicEntry[]>('index')) ?? []).filter(e => e.id !== id)
  if (action === 'delete') {
    await Promise.all([store.del(`entry/${id}`), store.del(`img/${id}`)])
  }
  else {
    entry.status = action === 'approve' ? 'approved' : 'hidden'
    await store.setJSON(`entry/${id}`, entry)
    if (entry.status === 'approved') {
      index.push(toPublic(entry))
      index.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    }
  }
  await store.setJSON('index', index.slice(0, INDEX_MAX))
  return json(200, { ok: true, entry: action === 'delete' ? null : entry })
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url)
  const imgId = context.params?.id ?? url.pathname.match(/\/img\/([^/]+)$/)?.[1]
  if (imgId) return validId(imgId) && req.method === 'GET' ? image(req, imgId) : new Response('Not found', { status: 404 })

  if (url.searchParams.has('admin')) {
    if (!Netlify.env.get('GUESTBOOK_ADMIN_TOKEN')) return json(503, { error: 'not_configured' })
    if (!isAdmin(req)) return json(401, { error: 'auth' })
    if (req.method === 'GET') return adminList()
    if (req.method === 'POST') return adminAction(req)
    return json(405, { error: 'method' })
  }

  if (req.method === 'GET') {
    const entries = (await kv().getJSON<PublicEntry[]>('index')) ?? []
    return json(200, { entries }, {
      'Cache-Control': 'public, max-age=0, must-revalidate',
      // short CDN cache: a freshly approved drawing shows up within a minute
      'Netlify-CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    })
  }
  if (req.method === 'POST') return submit(req, context)
  return json(405, { error: 'method' }, { Allow: 'GET, POST' })
}

export const config = { path: ['/api/guestbook', '/api/guestbook/img/:id'] }
