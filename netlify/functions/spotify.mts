// GET /api/spotify — what Jurgo is listening to, read with his own refresh token.
// Env (set in Netlify, never in the repo): SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN.
// Visitors can't stream Spotify audio here, so the site only shows tracks and links out.

type SpotifyImage = { url: string; width: number | null }
type SpotifyTrack = {
  id: string
  name: string
  duration_ms: number
  external_urls?: { spotify?: string }
  artists: { name: string }[]
  album?: { name: string; images?: SpotifyImage[] }
}

export interface Track {
  id: string
  name: string
  artists: string
  album: string
  image: string | null
  url: string | null
  durationMs: number
  playedAt?: string
}

let cached: { token: string; exp: number } | null = null
// top tracks change slowly: keep them for 10 min in a warm function instance
const TOP_TTL = 10 * 60_000
let topCache: { at: number; value: Record<'short' | 'medium' | 'long', Track[]> } | null = null

async function accessToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 30_000) return cached.token
  const id = Netlify.env.get('SPOTIFY_CLIENT_ID')!
  const secret = Netlify.env.get('SPOTIFY_CLIENT_SECRET')!
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: Netlify.env.get('SPOTIFY_REFRESH_TOKEN')! }),
  })
  if (!res.ok) throw new Error(`token ${res.status}`)
  const j = await res.json() as { access_token: string; expires_in: number }
  cached = { token: j.access_token, exp: Date.now() + j.expires_in * 1000 }
  return j.access_token
}

async function api<T>(path: string, token: string): Promise<T | null> {
  const res = await fetch(`https://api.spotify.com/v1${path}`, { headers: { Authorization: `Bearer ${token}` } })
  if (res.status === 204) return null // nothing playing
  if (!res.ok) throw new Error(`${path} ${res.status}`)
  return res.json() as Promise<T>
}

const pick = (t: SpotifyTrack, playedAt?: string): Track => {
  // smallest cover that still looks sharp at 96px (2x)
  const imgs = [...(t.album?.images ?? [])].sort((a, b) => (a.width ?? 0) - (b.width ?? 0))
  const img = imgs.find(i => (i.width ?? 0) >= 160) ?? imgs.at(-1)
  return {
    id: t.id,
    name: t.name,
    artists: t.artists.map(a => a.name).join(', '),
    album: t.album?.name ?? '',
    image: img?.url ?? null,
    url: t.external_urls?.spotify ?? null,
    durationMs: t.duration_ms,
    ...(playedAt ? { playedAt } : {}),
  }
}

const json = (body: unknown, status = 200, cdnSeconds = 0) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // browsers never reuse it; the CDN may for a few seconds, never stale
      // (stale-while-revalidate kept showing the previous song for up to a minute and a half)
      'Cache-Control': 'no-store',
      ...(cdnSeconds ? { 'Netlify-CDN-Cache-Control': `public, s-maxage=${cdnSeconds}` } : {}),
    },
  })

/** run one section; a failing endpoint must not take the others down */
async function safe<T>(p: Promise<T>): Promise<T | null> {
  try { return await p } catch (e) { console.error('[spotify]', (e as Error).message); return null }
}

export default async () => {
  const configured = ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REFRESH_TOKEN'].every(k => Netlify.env.get(k))
  if (!configured) return json({ configured: false }, 200, 5)

  let token: string
  try { token = await accessToken() } catch (e) {
    console.error('[spotify]', (e as Error).message)
    return json({ configured: true, error: 'auth' }, 502)
  }

  type Now = { is_playing: boolean; progress_ms: number | null; currently_playing_type: string; item: SpotifyTrack | null }
  type Page<T> = { items: T[] }
  // Spotify gives at most 50 per call and stops at offset 49, so two pages = up to 99 songs
  const top = async (range: string): Promise<Page<SpotifyTrack> | null> => {
    const page = (offset: number) => safe(api<Page<SpotifyTrack>>(`/me/top/tracks?limit=50&offset=${offset}&time_range=${range}`, token))
    const [a, b] = await Promise.all([page(0), page(49)])
    if (!a) return null
    const seen = new Set<string>()
    return { items: [...a.items, ...(b?.items ?? [])].filter(t => !seen.has(t.id) && seen.add(t.id)) }
  }

  const freshTop = topCache && Date.now() - topCache.at < TOP_TTL ? topCache.value : null
  const [now, recent, short, medium, long] = await Promise.all([
    safe(api<Now>('/me/player/currently-playing', token)),
    safe(api<Page<{ track: SpotifyTrack; played_at: string }>>('/me/player/recently-played?limit=50', token)), // Spotify keeps only the last 50
    freshTop ? null : top('short_term'),
    freshTop ? null : top('medium_term'),
    freshTop ? null : top('long_term'),
  ])
  // Spotify sometimes answers 503 for a moment: then keep the last good list instead of an empty one
  const prev = topCache?.value
  const topValue = freshTop ?? {
    short: short?.items.map(t => pick(t)) ?? prev?.short ?? [],
    medium: medium?.items.map(t => pick(t)) ?? prev?.medium ?? [],
    long: long?.items.map(t => pick(t)) ?? prev?.long ?? [],
  }
  if (!freshTop && short && medium && long) topCache = { at: Date.now(), value: topValue }

  return json({
    configured: true,
    // only music: podcasts/ads are left out
    now: now?.item && now.currently_playing_type === 'track'
      ? { playing: now.is_playing, progressMs: now.progress_ms ?? 0, track: pick(now.item) }
      : null,
    recent: recent?.items.map(i => pick(i.track, i.played_at)) ?? [],
    top: topValue,
    updatedAt: new Date().toISOString(),
  }, 200, 5)
}

export const config = { path: '/api/spotify' }
