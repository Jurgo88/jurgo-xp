<script setup lang="ts">
import { fmtMs, type SpTrack } from '~/composables/useSpotify'

// Winamp 2.x "Media Library" look, fed by Jurgo's Spotify. Spotify audio can't go through
// Webamp, so a clicked song plays in Spotify's own embed player at the bottom of this window
// (full song for visitors logged in to Spotify in this browser, a 30 s preview otherwise).
const { l, locale } = useL10n()
const { data, failed, fetchedAt } = useSpotify()

type Tab = 'now' | 'top' | 'recent'
type Range = 'short' | 'medium' | 'long'
const tab = ref<Tab>('now')
const range = ref<Range>('short')

const tabs: { id: Tab; label: { en: string; sk: string } }[] = [
  { id: 'now', label: { en: 'Now playing', sk: 'Práve hrá' } },
  { id: 'top', label: { en: 'Most played', sk: 'Najhranejšie' } },
  { id: 'recent', label: { en: 'Recently played', sk: 'Naposledy' } },
]
const ranges: { id: Range; label: { en: string; sk: string } }[] = [
  { id: 'short', label: { en: 'Last 4 weeks', sk: 'Posledné 4 týždne' } },
  { id: 'medium', label: { en: 'Last 6 months', sk: 'Posledných 6 mesiacov' } },
  { id: 'long', label: { en: 'All time', sk: 'Celé obdobie' } },
]

const now = computed(() => data.value?.now ?? null)

/** song shown in the embedded Spotify player */
const playing = ref<SpTrack | null>(null)
const embedSrc = computed(() =>
  playing.value ? `https://open.spotify.com/embed/track/${encodeURIComponent(playing.value.id)}?utm_source=generator&theme=0` : null,
)
const play = (s: SpTrack) => { playing.value = s }
const last = computed(() => data.value?.recent?.[0] ?? null)
const list = computed<SpTrack[]>(() =>
  tab.value === 'top' ? data.value?.top?.[range.value] ?? [] : data.value?.recent ?? [],
)

// progress keeps moving between polls
const tick = ref(Date.now())
let t: ReturnType<typeof setInterval> | undefined
onMounted(() => { t = setInterval(() => { tick.value = Date.now() }, 1000) })
onBeforeUnmount(() => clearInterval(t))
const progress = computed(() => {
  const n = now.value
  if (!n) return 0
  const p = n.progressMs + (n.playing ? tick.value - fetchedAt.value : 0)
  return Math.min(p, n.track.durationMs)
})

const ago = (iso?: string) => {
  if (!iso) return ''
  const min = Math.max(1, Math.round((tick.value - Date.parse(iso)) / 60000))
  const rtf = new Intl.RelativeTimeFormat(locale.value === 'sk' ? 'sk' : 'en', { numeric: 'auto' })
  if (min < 60) return rtf.format(-min, 'minute')
  if (min < 60 * 24) return rtf.format(-Math.round(min / 60), 'hour')
  return rtf.format(-Math.round(min / 1440), 'day')
}

const state = computed<'loading' | 'off' | 'error' | 'ok'>(() => {
  if (!data.value) return failed.value ? 'off' : 'loading'
  if (!data.value.configured) return 'off'
  if (data.value.error) return 'error'
  return 'ok'
})
</script>

<template>
  <div class="ml">
    <nav class="tabs" role="tablist">
      <button
        v-for="x in tabs" :key="x.id" role="tab" type="button"
        :aria-selected="tab === x.id" :class="{ on: tab === x.id }" @click="tab = x.id"
      >
        {{ l(x.label) }}
      </button>
    </nav>

    <div class="screen">
      <p v-if="state === 'loading'" class="msg">{{ l({ en: 'Connecting to Spotify…', sk: 'Pripájam sa na Spotify…' }) }}</p>
      <p v-else-if="state === 'off'" class="msg">
        {{ l({ en: 'Spotify is not connected yet. Check back soon.', sk: 'Spotify ešte nie je pripojené. Čoskoro tu bude.' }) }}
      </p>
      <p v-else-if="state === 'error'" class="msg">
        {{ l({ en: 'Spotify is not answering right now.', sk: 'Spotify teraz neodpovedá.' }) }}
      </p>

      <!-- Now playing -->
      <template v-else-if="tab === 'now'">
        <div v-if="now" class="np">
          <button type="button" class="cover" :title="l({ en: 'Play here', sk: 'Prehrať tu' })" @click="play(now.track)">
            <img v-if="now.track.image" :src="now.track.image" alt="" width="96" height="96">
          </button>
          <div class="meta">
            <div class="lcd">
              <span class="state">{{ now.playing ? '▶' : '❚❚' }}</span>
              <span class="marquee"><span>{{ now.track.artists }} – {{ now.track.name }}</span></span>
            </div>
            <div class="album">{{ now.track.album }}</div>
            <div class="bar" role="progressbar" :aria-valuenow="Math.round(progress / 1000)" :aria-valuemax="Math.round(now.track.durationMs / 1000)">
              <i :style="{ width: `${(progress / now.track.durationMs) * 100}%` }" />
            </div>
            <div class="time">{{ fmtMs(progress) }} / {{ fmtMs(now.track.durationMs) }}</div>
            <button type="button" class="open" @click="play(now.track)">▶ {{ l({ en: 'Play here', sk: 'Prehrať tu' }) }}</button>
            <a v-if="now.track.url" :href="now.track.url" target="_blank" rel="noopener" class="ext" :title="l({ en: 'Open in Spotify', sk: 'Otvoriť v Spotify' })">Spotify ↗</a>
          </div>
        </div>
        <div v-else class="np idle">
          <p class="msg">{{ l({ en: 'Nothing playing right now.', sk: 'Práve nič nehrá.' }) }}</p>
          <p v-if="last" class="msg small">
            {{ l({ en: 'Last played', sk: 'Naposledy' }) }} {{ ago(last.playedAt) }}:
            <button type="button" class="linkish" @click="play(last)">{{ last.artists }} – {{ last.name }}</button>
          </p>
        </div>
      </template>

      <!-- Top / recent list -->
      <template v-else>
        <div v-if="tab === 'top'" class="ranges">
          <button
            v-for="r in ranges" :key="r.id" type="button"
            :class="{ on: range === r.id }" @click="range = r.id"
          >
            {{ l(r.label) }}
          </button>
        </div>
        <ol class="pl">
          <li v-for="(s, i) in list" :key="`${s.id}-${i}`">
            <button
              type="button" class="row" :class="{ sel: playing?.id === s.id }"
              :title="`${s.artists} – ${s.name} (${s.album})`" @click="play(s)"
            >
              <span class="n">{{ i + 1 }}.</span>
              <span class="t">{{ s.artists }} – {{ s.name }}</span>
              <span class="d">{{ tab === 'recent' ? ago(s.playedAt) : fmtMs(s.durationMs) }}</span>
            </button>
          </li>
          <li v-if="!list.length" class="msg">{{ l({ en: 'No songs yet.', sk: 'Zatiaľ žiadne skladby.' }) }}</li>
        </ol>
      </template>
    </div>

    <div v-if="embedSrc" class="embed">
      <iframe
        :key="embedSrc" :src="embedSrc" :title="`Spotify: ${playing!.artists} – ${playing!.name}`"
        width="100%" height="80" frameborder="0" loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      />
      <button type="button" class="x" :aria-label="l({ en: 'Close player', sk: 'Zavrieť prehrávač' })" @click="playing = null">×</button>
    </div>
  </div>
</template>

<style scoped>
/* classic Winamp 2.x palette: dark chrome, black screen, green text */
.ml {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #2a2a37;
  padding: 4px;
  gap: 4px;
  font: 11px/1.35 Arial, Helvetica, sans-serif;
  color: #00e400;
}
.tabs, .ranges { display: flex; gap: 2px; flex-wrap: wrap; }
.tabs button, .ranges button {
  min-width: 0;
  min-height: 0;
  padding: 2px 8px;
  font: inherit;
  color: #d9d9e3;
  background: linear-gradient(#5d5d72, #3b3b4c);
  border: 1px solid #12121a;
  box-shadow: inset 1px 1px #8888a0;
  border-radius: 0;
}
.tabs button.on, .ranges button.on { color: #00e400; background: #111118; box-shadow: inset 1px 1px #000; }
.screen {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: #000;
  border: 2px solid;
  border-color: #12121a #8888a0 #8888a0 #12121a;
  padding: 6px;
}
.ranges { margin-bottom: 6px; }
.msg { margin: 6px 2px; color: #00e400; }
.small { color: #8fd18f; }
a { color: inherit; text-decoration: none; }
a:hover { color: #fff; }
.np { display: flex; gap: 10px; align-items: flex-start; }
.np.idle { display: block; }
.cover { flex: 0 0 96px; height: 96px; min-width: 0; min-height: 0; padding: 0; background: #111; border: 1px solid #333; box-shadow: none; border-radius: 0; cursor: pointer; }
.cover img { display: block; width: 96px; height: 96px; object-fit: cover; }
.meta { flex: 1; min-width: 0; }
.lcd {
  display: flex;
  gap: 6px;
  align-items: center;
  font: 13px/1.2 'Courier New', monospace;
  color: #00e400;
  white-space: nowrap;
}
.state { flex: none; }
.marquee { overflow: hidden; flex: 1; }
.marquee span { display: inline-block; padding-left: 100%; animation: scroll 12s linear infinite; }
@keyframes scroll { to { transform: translateX(-100%); } }
@media (prefers-reduced-motion: reduce) {
  .marquee span { animation: none; padding-left: 0; }
}
.album { color: #8fd18f; margin: 4px 0 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bar { height: 8px; background: #1a1a1a; border: 1px solid #3c3c3c; }
.bar i { display: block; height: 100%; background: linear-gradient(#5fff5f, #00a000); }
.time { margin: 4px 0 8px; font-family: 'Courier New', monospace; }
button.open, button.row, button.linkish {
  min-width: 0; min-height: 0; font: inherit; color: inherit; background: none;
  border: 0; box-shadow: none; border-radius: 0; text-align: left; cursor: pointer;
}
button.open { padding: 2px 8px; border: 1px solid #00a000; margin-right: 8px; }
button.open:hover { background: #003a00; color: #fff; }
button.linkish { padding: 0; text-decoration: underline; }
.ext { color: #8fd18f; }
.pl { list-style: none; margin: 0; padding: 0; }
.pl .row { display: flex; gap: 6px; width: 100%; padding: 1px 2px; }
.pl .row:hover, .pl .row:focus-visible { background: #0000c6; color: #fff; outline: none; }
.pl .row.sel { background: #00007a; color: #fff; }
.embed { position: relative; flex: none; height: 80px; background: #000; border: 2px solid; border-color: #12121a #8888a0 #8888a0 #12121a; }
.embed iframe { display: block; border: 0; border-radius: 0; }
.embed .x {
  position: absolute; top: -10px; right: -6px; min-width: 0; min-height: 0; width: 18px; height: 18px; padding: 0;
  font: bold 12px/16px Arial, sans-serif; color: #d9d9e3; background: linear-gradient(#5d5d72, #3b3b4c);
  border: 1px solid #12121a; border-radius: 0; box-shadow: none; cursor: pointer;
}
.n { flex: none; width: 22px; text-align: right; }
.t { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.d { flex: none; color: #8fd18f; }
@media (max-width: 700px) { .tabs button, .ranges button { min-height: 32px; } }
</style>
