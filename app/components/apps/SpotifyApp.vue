<script setup lang="ts">
import { fmtMs, type SpTrack } from '~/composables/useSpotify'

// Winamp 2.x "Media Library" look, fed by Jurgo's Spotify. Songs open on Spotify:
// visitors can't stream Spotify audio inside the page.
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
          <a :href="now.track.url ?? undefined" target="_blank" rel="noopener" class="cover">
            <img v-if="now.track.image" :src="now.track.image" alt="" width="96" height="96">
          </a>
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
            <a v-if="now.track.url" :href="now.track.url" target="_blank" rel="noopener" class="open">
              {{ l({ en: 'Open in Spotify', sk: 'Otvoriť v Spotify' }) }} ↗
            </a>
          </div>
        </div>
        <div v-else class="np idle">
          <p class="msg">{{ l({ en: 'Nothing playing right now.', sk: 'Práve nič nehrá.' }) }}</p>
          <p v-if="last" class="msg small">
            {{ l({ en: 'Last played', sk: 'Naposledy' }) }} {{ ago(last.playedAt) }}:
            <a :href="last.url ?? undefined" target="_blank" rel="noopener">{{ last.artists }} – {{ last.name }}</a>
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
            <a :href="s.url ?? undefined" target="_blank" rel="noopener" :title="`${s.artists} – ${s.name} (${s.album})`">
              <span class="n">{{ i + 1 }}.</span>
              <span class="t">{{ s.artists }} – {{ s.name }}</span>
              <span class="d">{{ tab === 'recent' ? ago(s.playedAt) : fmtMs(s.durationMs) }}</span>
            </a>
          </li>
          <li v-if="!list.length" class="msg">{{ l({ en: 'No songs yet.', sk: 'Zatiaľ žiadne skladby.' }) }}</li>
        </ol>
      </template>
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
.cover { flex: 0 0 96px; height: 96px; background: #111; border: 1px solid #333; }
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
.open { display: inline-block; padding: 2px 6px; border: 1px solid #00a000; }
.pl { list-style: none; margin: 0; padding: 0; }
.pl a { display: flex; gap: 6px; padding: 1px 2px; }
.pl a:hover, .pl a:focus-visible { background: #0000c6; color: #fff; outline: none; }
.n { flex: none; width: 22px; text-align: right; }
.t { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.d { flex: none; color: #8fd18f; }
</style>
