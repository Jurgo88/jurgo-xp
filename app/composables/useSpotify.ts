// Polls /api/spotify (Netlify function) while a Spotify view is mounted. Client only.

export interface SpTrack {
  id: string
  name: string
  artists: string
  album: string
  image: string | null
  url: string | null
  durationMs: number
  playedAt?: string
}

export interface SpData {
  configured: boolean
  error?: string
  now?: { playing: boolean; progressMs: number; track: SpTrack } | null
  recent?: SpTrack[]
  top?: { short: SpTrack[]; medium: SpTrack[]; long: SpTrack[] }
  updatedAt?: string
}

const POLL_MS = 10_000

export function useSpotify() {
  const data = useState<SpData | null>('spotify', () => null)
  const failed = ref(false)
  const fetchedAt = ref(0)
  let timer: ReturnType<typeof setInterval> | undefined
  let endTimer: ReturnType<typeof setTimeout> | undefined
  let busy = false

  async function load() {
    if (busy) return
    busy = true
    try {
      const res = await fetch('/api/spotify', { cache: 'no-store', headers: { Accept: 'application/json' } })
      if (!res.ok && res.status !== 502) throw new Error(String(res.status))
      const ct = res.headers.get('content-type') ?? ''
      if (!ct.includes('json')) throw new Error('no function') // `nuxt dev` serves HTML here
      data.value = await res.json()
      fetchedAt.value = Date.now()
      failed.value = false
      scheduleTrackEnd()
    } catch {
      failed.value = true
    } finally {
      busy = false
    }
  }

  /** ask again right after the current song ends, so the next one shows up without waiting for the poll */
  function scheduleTrackEnd() {
    clearTimeout(endTimer)
    const n = data.value?.now
    if (!n?.playing) return
    const left = n.track.durationMs - n.progressMs
    if (left > 0 && left < POLL_MS) endTimer = setTimeout(load, left + 1500)
  }

  const onVisible = () => { if (document.visibilityState === 'visible') load() }

  onMounted(() => {
    load()
    timer = setInterval(() => { if (document.visibilityState === 'visible') load() }, POLL_MS)
    document.addEventListener('visibilitychange', onVisible)
  })
  onBeforeUnmount(() => {
    clearInterval(timer)
    clearTimeout(endTimer)
    document.removeEventListener('visibilitychange', onVisible)
  })

  return { data, failed, fetchedAt, reload: load }
}

export const fmtMs = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
