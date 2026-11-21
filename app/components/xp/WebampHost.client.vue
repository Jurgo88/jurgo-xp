<script setup lang="ts">
// Real Winamp 2.x (classic skin, EQ, playlist) via Webamp. Client only.
// Audio: own MP3s (data/personal.ts `tracks`) play in Webamp itself.
// Spotify: Jurgo's songs are loaded into Webamp's own playlist and the marquee shows what he is
// listening to. Spotify audio can't go through Webamp (DRM), so playing a Spotify entry hands it
// to Spotify's embed player in a Winamp-skinned panel docked under the playlist window.
import { tracks } from '~/data/personal'
import { useWindowsStore } from '~/stores/windows'
import type { SpTrack } from '~/composables/useSpotify'

type WebampTrack = { url: string; duration?: number; metaData?: { artist: string; title: string } }
interface WebampLike {
  reopen(): void
  dispose(): void
  close(): void
  stop(): void
  appendTracks(t: WebampTrack[]): void
  getPlaylistTracks(): { id: number; url: string }[]
  onTrackDidChange(cb: (t: { url: string } | null) => void): () => void
  onClose(cb: () => void): () => void
  onMinimize(cb: () => void): () => void
  renderWhenReady(el: HTMLElement): Promise<void>
  // internal redux store; used only for replacing the playlist and the marquee text
  store: { dispatch(a: Record<string, unknown>): void }
}

const store = useWindowsStore()
const { l, locale } = useL10n()
const { data } = useSpotify()
const anchor = ref<HTMLElement>()
let webamp: WebampLike | null = null
let disposed = false

function onDocPointer(e: PointerEvent) {
  if ((e.target as HTMLElement | null)?.closest?.('#webamp, .spdock')) store.focus('music')
}

// ---- Spotify entries in the Webamp playlist -------------------------------------------------

type View = 'now' | 'short' | 'medium' | 'long'
const views: { id: View; label: { en: string; sk: string } }[] = [
  { id: 'now', label: { en: 'Now + recent', sk: 'Teraz + naposledy' } },
  { id: 'short', label: { en: 'Top 4 wk', sk: 'Top 4 týž.' } },
  { id: 'medium', label: { en: 'Top 6 mo', sk: 'Top 6 mes.' } },
  { id: 'long', label: { en: 'All time', sk: 'Top celkovo' } },
]
const view = ref<View>('now')

/** a short silent WAV: Webamp needs a loadable URL; the fragment says which Spotify song it stands for */
let silentUrl = ''
function makeSilence() {
  const rate = 8000, n = rate * 2
  const buf = new ArrayBuffer(44 + n)
  const v = new DataView(buf)
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)))
  str(0, 'RIFF'); v.setUint32(4, 36 + n, true); str(8, 'WAVEfmt ')
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true)
  v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true)
  str(36, 'data'); v.setUint32(40, n, true)
  new Uint8Array(buf, 44).fill(128)
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }))
}

const byKey = new Map<string, SpTrack>()
const SP = '#spotify='

const listFor = (v: View): SpTrack[] => {
  const d = data.value
  if (!d?.configured) return []
  if (v !== 'now') return d.top?.[v] ?? []
  const recent = (d.recent ?? []).filter(t => t.id !== d.now?.track.id)
  return [...(d.now ? [d.now.track] : []), ...recent]
}

let shownSig = ''
function syncPlaylist() {
  if (!webamp) return
  const list = listFor(view.value)
  const sig = `${view.value}|${list.map(t => t.id).join(',')}`
  if (sig === shownSig) return
  shownSig = sig
  byKey.clear()
  webamp.store.dispatch({ type: 'REMOVE_ALL_TRACKS' })
  const own: WebampTrack[] = tracks.map(t => ({ url: t.url, duration: t.duration, metaData: { artist: t.artist, title: t.title } }))
  const sp: WebampTrack[] = list.map((t, i) => {
    const key = `${t.id}-${i}`
    byKey.set(key, t)
    const live = view.value === 'now' && i === 0 && data.value?.now
    return {
      url: `${silentUrl}${SP}${key}`,
      duration: Math.round(t.durationMs / 1000),
      metaData: { artist: t.artists, title: live ? `${t.name}  [${l({ en: 'now playing', sk: 'práve hrá' })}]` : t.name },
    }
  })
  webamp.appendTracks([...own, ...sp])
}

/** the skin's bitmap font has no diacritics: Paluš -> Palus */
const ascii = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7e]/g, '?')

function syncMarquee() {
  if (!webamp) return
  const d = data.value
  let msg: string | null = null
  if (d?.now) msg = `${d.now.playing ? 'JURGO PRAVE POCUVA' : 'JURGO - PAUZA'}: ${d.now.track.artists} - ${d.now.track.name}`
  else if (d?.recent?.[0]) msg = `JURGO NAPOSLEDY: ${d.recent[0].artists} - ${d.recent[0].name}`
  if (msg && locale.value !== 'sk') msg = msg.replace('JURGO PRAVE POCUVA', 'JURGO IS LISTENING TO').replace('JURGO - PAUZA', 'JURGO - PAUSED').replace('JURGO NAPOSLEDY', 'JURGO LAST PLAYED')
  webamp.store.dispatch(msg ? { type: 'SET_USER_MESSAGE', message: ascii(msg) } : { type: 'UNSET_USER_MESSAGE' })
}

watch([data, view, locale], () => { syncPlaylist(); syncMarquee() })

// ---- Spotify embed player docked under Webamp -----------------------------------------------

const playing = ref<SpTrack | null>(null)
const embedSrc = computed(() =>
  playing.value ? `https://open.spotify.com/embed/track/${encodeURIComponent(playing.value.id)}?utm_source=generator&theme=0` : null,
)

function onTrack(t: { url: string } | null) {
  if (!t?.url.includes(SP)) return
  const song = byKey.get(t.url.split(SP)[1] ?? '')
  webamp?.stop() // the silent stand-in must not keep "playing"
  if (!song) return
  playing.value = song
  // loading the stand-in overwrote the playlist duration with its own 2 s: put the real one back
  const fix = () => {
    const pt = webamp?.getPlaylistTracks().find(x => x.url === t.url)
    if (pt) webamp?.store.dispatch({ type: 'SET_MEDIA_DURATION', id: pt.id, duration: Math.round(song.durationMs / 1000) })
  }
  fix()
  setTimeout(fix, 400)
}

const dock = ref<{ left: number; top: number; width: number } | null>(null)
let raf = 0
function follow() {
  raf = requestAnimationFrame(follow)
  const root = document.getElementById('webamp')
  const wins = ['playlist-window', 'equalizer-window', 'main-window']
    .map(id => document.getElementById(id))
    .filter((el): el is HTMLElement => !!el && el.offsetParent !== null)
  if (!root || !wins.length || store.get('music')?.minimized) { dock.value = null; return }
  // dock under the lowest visible Webamp window (they can be dragged apart)
  const rects = wins.map(w => w.getBoundingClientRect())
  const low = rects.reduce((a, b) => (b.bottom > a.bottom + 1 || (Math.abs(b.bottom - a.bottom) <= 1 && b.width > a.width) ? b : a))
  const next = { left: Math.round(low.left), top: Math.round(low.bottom), width: Math.round(low.width) }
  const cur = dock.value
  if (!cur || cur.left !== next.left || cur.top !== next.top || cur.width !== next.width) dock.value = next
}

const state = computed(() => {
  if (!data.value) return 'loading'
  if (!data.value.configured) return 'off'
  return data.value.error ? 'error' : 'ok'
})

// ---- size: Winamp's own 2x "double size" mode whenever the screen has room -------------------

type Layout = { w: number; h: number; double: boolean; zoom?: number; windowLayout?: Record<string, unknown> }
function pickLayout(): Layout {
  const W = window.innerWidth, H = window.innerHeight - 30 // taskbar
  const DOCK = 190 // Spotify panel with a player
  if (H >= 464 + 232 + DOCK) {
    // stacked: main + EQ at 2x, playlist as wide as them
    return {
      w: 550, h: 696, double: true,
      windowLayout: {
        main: { position: { top: 0, left: 0 } },
        equalizer: { position: { top: 232, left: 0 } },
        playlist: { position: { top: 464, left: 0 }, size: { extraWidth: 11, extraHeight: 4 } },
      },
    }
  }
  if (W >= 1000 && H >= 464 + DOCK) {
    // side by side: main + EQ at 2x on the left, a tall playlist on the right
    return {
      w: 875, h: 464, double: true,
      windowLayout: {
        main: { position: { top: 0, left: 0 } },
        equalizer: { position: { top: 232, left: 0 } },
        playlist: { position: { top: 0, left: 550 }, size: { extraWidth: 2, extraHeight: 12 } },
      },
    }
  }
  // phones: 2x doesn't fit, so stretch the 1x Winamp to the screen width (its buttons are tiny otherwise)
  if (W <= 700) return { w: 275, h: 348, double: false, zoom: Math.min(2, (W - 8) / 275) }
  return { w: 275, h: 348, double: false }
}
const layout = ref<Layout>({ w: 275, h: 348, double: false })
const anchorStyle = computed(() => ({
  position: 'absolute' as const,
  // with zoom, Webamp's own coordinates get multiplied, so the anchor is placed in unzoomed pixels
  left: layout.value.zoom ? `${4 / layout.value.zoom}px` : `max(8px, calc(50% - ${layout.value.w / 2}px))`,
  top: layout.value.double ? '12px' : layout.value.zoom ? `${8 / layout.value.zoom}px` : '12%',
  width: `${layout.value.w}px`,
  height: `${layout.value.h}px`,
  pointerEvents: 'none' as const,
}))

const noDragEvents = ['mousedown', 'touchstart', 'pointerdown'] as const
function blockDrag(e: Event) {
  const t = e.target as Element | null
  if (t?.classList?.contains('draggable') && t.closest('#webamp')) e.stopPropagation()
}

// ---- lifecycle ------------------------------------------------------------------------------

onMounted(async () => {
  const { default: Webamp } = await import('webamp')
  if (disposed || !anchor.value) return
  silentUrl = makeSilence()
  layout.value = pickLayout()
  await nextTick()
  const instance = new Webamp({
    enableDoubleSizeMode: layout.value.double,
    ...(layout.value.windowLayout ? { windowLayout: layout.value.windowLayout } : {}),
    initialTracks: tracks.map(t => ({ url: t.url, duration: t.duration, metaData: { artist: t.artist, title: t.title } })),
    zIndex: 5000,
  }) as unknown as WebampLike
  instance.onClose(() => store.close('music'))
  instance.onMinimize(() => store.minimize('music'))
  instance.onTrackDidChange(onTrack)
  await instance.renderWhenReady(anchor.value)
  const z = layout.value.zoom
  const root = document.getElementById('webamp')
  if (z && root) {
    root.style.zoom = String(z)
    // Webamp's drag math ignores CSS zoom, so on phones the windows stay docked where they are
    for (const ev of noDragEvents) window.addEventListener(ev, blockDrag, true)
  }
  webamp = instance
  syncPlaylist()
  syncMarquee()
  document.addEventListener('pointerdown', onDocPointer, true)
  follow()
})

watch(() => store.get('music')?.minimized, (min, prev) => {
  if (prev && !min) webamp?.reopen()
})

onBeforeUnmount(() => {
  disposed = true
  for (const ev of noDragEvents) window.removeEventListener(ev, blockDrag, true)
  cancelAnimationFrame(raf)
  document.removeEventListener('pointerdown', onDocPointer, true)
  webamp?.dispose()
  webamp = null
  if (silentUrl) URL.revokeObjectURL(silentUrl)
})
</script>

<template>
  <div ref="anchor" class="webamp-anchor" :style="anchorStyle" />
  <Teleport to="body">
    <section
      v-if="dock" class="spdock" :aria-label="l({ en: 'Spotify in Winamp', sk: 'Spotify vo Winampe' })"
      :class="{ big: dock.width > 330 }"
      :style="{ left: `${dock.left}px`, top: `${dock.top}px`, width: `${dock.width}px` }"
    >
      <header class="bar"><span>SPOTIFY</span><i /></header>
      <div class="body">
        <div class="views" role="tablist">
          <button
            v-for="v in views" :key="v.id" type="button" role="tab"
            :aria-selected="view === v.id" :class="{ on: view === v.id }" @click="view = v.id"
          >
            {{ l(v.label) }}
          </button>
        </div>
        <p v-if="state === 'loading'" class="hint">{{ l({ en: 'Connecting to Spotify…', sk: 'Pripájam sa na Spotify…' }) }}</p>
        <p v-else-if="state !== 'ok'" class="hint">{{ l({ en: 'Spotify is not connected right now.', sk: 'Spotify teraz nie je pripojené.' }) }}</p>
        <p v-else-if="!embedSrc" class="hint">
          {{ l({ en: 'Double-click a song in the playlist to play it here.', sk: 'Dvojklik na skladbu v playliste ju prehrá tu.' }) }}
        </p>
        <div v-if="embedSrc" class="embed">
          <iframe
            :key="embedSrc" :src="embedSrc" :title="`Spotify: ${playing!.artists} – ${playing!.name}`"
            width="100%" :height="dock.width > 330 ? 152 : 80" frameborder="0" loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          />
          <button type="button" class="x" :aria-label="l({ en: 'Close player', sk: 'Zavrieť prehrávač' })" @click="playing = null">×</button>
        </div>
      </div>
    </section>
  </Teleport>
</template>

<style scoped>
/* Winamp 2.x chrome, matched to the base skin */
.spdock {
  position: fixed;
  z-index: 5000;
  background: #2a2a37;
  border: 1px solid #12121a;
  box-shadow: inset 1px 1px #5d5d72;
  font: 9px/1.3 Arial, Helvetica, sans-serif;
  color: #00e400;
  user-select: none;
}
.bar {
  display: flex; align-items: center; gap: 4px; height: 14px; padding: 0 4px;
  background: linear-gradient(#3e3e52, #22222e);
  color: #c8c8d8; font: bold 8px/14px Arial, sans-serif; letter-spacing: 1px;
}
.bar i { flex: 1; height: 4px; background: repeating-linear-gradient(#8a7a3a 0 1px, transparent 1px 2px); }
.body { padding: 3px 4px 4px; }
.views { display: flex; gap: 2px; }
.views button {
  flex: 1; min-width: 0; min-height: 0; padding: 1px 2px;
  font: 9px/12px Arial, sans-serif; color: #d9d9e3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  background: linear-gradient(#5d5d72, #3b3b4c); border: 1px solid #12121a; border-radius: 0; box-shadow: inset 1px 1px #8888a0;
}
.views button.on { color: #00e400; background: #111118; box-shadow: inset 1px 1px #000; }
.hint { margin: 4px 1px 0; color: #00e400; font-size: 9px; }
.embed { position: relative; margin-top: 4px; height: 80px; background: #000; }
/* double-size Winamp: bigger panel and the taller Spotify player */
.spdock.big .bar { height: 20px; font-size: 11px; line-height: 20px; }
.spdock.big .body { padding: 5px 6px 6px; }
.spdock.big .views button { font-size: 12px; line-height: 18px; padding: 2px 4px; }
.spdock.big .hint { font-size: 12px; margin-top: 6px; }
.spdock.big .embed { height: 152px; }
.spdock.big .embed .x { width: 18px; height: 18px; font-size: 13px; line-height: 16px; }
.embed iframe { display: block; border: 0; }
.embed .x {
  position: absolute; top: 2px; right: 2px; min-width: 0; min-height: 0; width: 14px; height: 14px; padding: 0;
  font: bold 10px/12px Arial, sans-serif; color: #d9d9e3; background: linear-gradient(#5d5d72, #3b3b4c);
  border: 1px solid #12121a; border-radius: 0; box-shadow: none;
}
</style>
