<script setup lang="ts">
import { profile } from '~/data/profile'

// MSN Messenger-style chat with "Jurgo AI" (netlify/functions/assistant.mts).
// The answer streams in as plain text; the conversation lives in sessionStorage only.
type Msg = { role: 'user' | 'assistant'; content: string }
type Line = Msg | { role: 'event'; content: string }

const { l, locale } = useL10n()
const { $track } = useNuxtApp()
const root = ref<HTMLElement>()
const log = ref<HTMLElement>()
const input = ref<HTMLTextAreaElement>()

const STORE_KEY = 'jurgoxp:assistant'
const MAX_CHARS = 500

const lines = ref<Line[]>([])
const draft = ref('')
const busy = ref(false)
const offline = ref(false)
let controller: AbortController | null = null

const intro = computed(() => l({
  en: `Hi! I'm Jurgo AI, an assistant that knows Juraj's CV and everything on this site. Ask me about his experience, projects, skills or the roles he's looking for.`,
  sk: 'Ahoj! Som Jurgo AI, asistent, ktorý pozná Jurajovo CV a všetko na tomto webe. Spýtaj sa ma na jeho prax, projekty, zručnosti alebo pozície, ktoré hľadá.',
}))

const suggestions = computed(() => locale.value === 'sk'
  ? ['Aké má skúsenosti s Vue a Nuxtom?', 'Čo robil s AI a LLM?', 'Prečo by sme mali Jurga zamestnať?', 'Hľadá prácu na diaľku?']
  : ['What is his experience with Vue and Nuxt?', 'What has he built with AI and LLMs?', 'Why should we hire Jurgo?', 'Is he open to remote work?'])

const youSay = computed(() => l({ en: 'You say:', sk: 'Ty hovoríš:' }))
const aiSays = computed(() => l({ en: 'Jurgo AI says:', sk: 'Jurgo AI hovorí:' }))

onMounted(async () => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || '[]')
    if (Array.isArray(saved)) lines.value = saved.filter(m => m && typeof m.content === 'string')
  } catch { /* private mode etc. */ }
  scrollDown()
  if (!matchMedia('(max-width: 700px)').matches) input.value?.focus()
  try {
    const r = await fetch('/api/assistant')
    if (r.ok) offline.value = !(await r.json()).configured
  } catch { /* dev server without functions: find out on first send */ }
})
onBeforeUnmount(() => controller?.abort())

watch(lines, (v) => {
  try { sessionStorage.setItem(STORE_KEY, JSON.stringify(v.slice(-40))) } catch { /* ignore */ }
}, { deep: true })

function scrollDown() {
  nextTick(() => { if (log.value) log.value.scrollTop = log.value.scrollHeight })
}

async function send(text = draft.value) {
  const q = text.trim().slice(0, MAX_CHARS)
  if (!q || busy.value) return
  draft.value = ''
  lines.value.push({ role: 'user', content: q })
  const history: Msg[] = lines.value.filter((m): m is Msg => m.role !== 'event').slice(-12)
  const answer: Msg = reactive({ role: 'assistant', content: '' })
  busy.value = true
  scrollDown()
  $track('assistant_message', { n: history.filter(m => m.role === 'user').length, lang: locale.value })

  controller = new AbortController()
  try {
    const res = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history, locale: locale.value }),
      signal: controller.signal,
    })
    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => null) as { message?: string } | null
      if (res.status === 503) offline.value = true
      lines.value.push({
        role: 'event',
        content: err?.message ?? l({ en: 'The message could not be delivered. Try again later.', sk: 'Správu sa nepodarilo doručiť. Skús to neskôr.' }),
      })
      return
    }
    lines.value.push(answer)
    const reader = res.body.getReader()
    const dec = new TextDecoder()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      answer.content += dec.decode(value, { stream: true })
      scrollDown()
    }
    answer.content += dec.decode()
  } catch (e) {
    if ((e as Error).name !== 'AbortError') {
      lines.value.push({ role: 'event', content: l({ en: 'Connection lost. Try again.', sk: 'Spojenie sa prerušilo. Skús to znova.' }) })
    }
  } finally {
    // a reply that never started would break the user/assistant alternation
    if (answer.content === '') lines.value = lines.value.filter(m => m !== answer)
    busy.value = false
    controller = null
    scrollDown()
    if (!matchMedia('(max-width: 700px)').matches) input.value?.focus()
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault()
    void send()
  }
}

/** the famous MSN nudge: shake the whole window */
const shaking = ref(false)
function nudge() {
  const win = root.value?.closest('.xpwin') as HTMLElement | null
  if (shaking.value) return
  shaking.value = true
  win?.classList.add('nudge')
  setTimeout(() => { win?.classList.remove('nudge'); shaking.value = false }, 650)
  lines.value.push({ role: 'event', content: l({ en: 'You have just sent a nudge.', sk: 'Práve si poslal(a) bzučanie.' }) })
  scrollDown()
  $track('assistant_nudge')
}

function clear() {
  controller?.abort()
  lines.value = []
}

/** split text into plain parts and safe links (no v-html) */
const LINK = /(https?:\/\/[^\s)]+|[\w.+-]+@[\w-]+\.[\w.]+|\bjurgo\.sk(?:\/[\w/-]*)?)/g
function parts(text: string) {
  const out: { t: string; href?: string }[] = []
  let last = 0
  for (const m of text.matchAll(LINK)) {
    const raw = m[0].replace(/[.,;:!?]+$/, '')
    if (m.index! > last) out.push({ t: text.slice(last, m.index) })
    const href = raw.includes('@') && !raw.startsWith('http') ? `mailto:${raw}` : raw.startsWith('http') ? raw : `https://${raw}`
    out.push({ t: raw, href })
    last = m.index! + raw.length
  }
  if (last < text.length) out.push({ t: text.slice(last) })
  return out
}
</script>

<template>
  <div ref="root" class="msn">
    <div class="toolbar">
      <button type="button" :disabled="shaking" :title="l({ en: 'Send a nudge', sk: 'Poslať bzučanie' })" @click="nudge">
        <span aria-hidden="true">📳</span>{{ l({ en: 'Nudge', sk: 'Bzučanie' }) }}
      </button>
      <button type="button" :disabled="!lines.length" :title="l({ en: 'Start a new conversation', sk: 'Začať novú konverzáciu' })" @click="clear">
        <span aria-hidden="true">🗒️</span>{{ l({ en: 'New chat', sk: 'Nová konverzácia' }) }}
      </button>
      <a class="tb-link" :href="`mailto:${profile.email}`">
        <span aria-hidden="true">✉️</span>{{ l({ en: 'E-mail Jurgo', sk: 'Napísať Jurgovi' }) }}
      </a>
    </div>

    <div class="to">
      <span>{{ l({ en: 'To:', sk: 'Komu:' }) }}</span>
      <b>Jurgo AI</b>
      <span class="addr">&lt;ai@jurgo.sk&gt;</span>
      <span class="status" :class="{ off: offline }">
        <i aria-hidden="true" />{{ offline ? l({ en: 'Offline', sk: 'Offline' }) : l({ en: 'Online', sk: 'Online' }) }}
      </span>
    </div>

    <div class="body">
      <div class="convo">
        <div ref="log" class="log" role="log" aria-live="polite">
          <div class="msg ai">
            <div class="who">{{ aiSays }}</div>
            <p>{{ intro }}</p>
          </div>
          <template v-for="(m, i) in lines" :key="i">
            <p v-if="m.role === 'event'" class="event">{{ m.content }}</p>
            <div v-else class="msg" :class="m.role === 'user' ? 'me' : 'ai'">
              <div class="who">{{ m.role === 'user' ? youSay : aiSays }}</div>
              <p>
                <template v-for="(p, j) in parts(m.content)" :key="j">
                  <a v-if="p.href" :href="p.href" target="_blank" rel="noopener">{{ p.t }}</a>
                  <template v-else>{{ p.t }}</template>
                </template>
              </p>
            </div>
          </template>
          <div v-if="!lines.length" class="sugg">
            <button v-for="s in suggestions" :key="s" type="button" :disabled="busy || offline" @click="send(s)">{{ s }}</button>
          </div>
        </div>
        <p class="typing" aria-live="polite">
          <template v-if="busy">✏️ {{ l({ en: 'Jurgo AI is typing a message…', sk: 'Jurgo AI píše správu…' }) }}</template>
          <template v-else-if="offline">{{ l({ en: 'Jurgo AI is offline right now. Use e-mail instead.', sk: 'Jurgo AI je teraz offline. Napíš radšej e-mail.' }) }}</template>
        </p>
        <form class="compose" @submit.prevent="send()">
          <textarea
            ref="input"
            v-model="draft"
            :maxlength="MAX_CHARS"
            rows="3"
            :disabled="offline"
            :aria-label="l({ en: 'Your message', sk: 'Tvoja správa' })"
            :placeholder="l({ en: 'Type a question about Jurgo…', sk: 'Napíš otázku o Jurgovi…' })"
            @keydown="onKey"
          />
          <button type="submit" class="send" :disabled="busy || offline || !draft.trim()">
            {{ l({ en: 'Send', sk: 'Odoslať' }) }}
          </button>
        </form>
      </div>
      <aside class="pics" aria-hidden="true">
        <figure><img src="/avatar.jpg" alt="" width="96" height="96"><figcaption>Jurgo AI</figcaption></figure>
        <figure class="you">
          <svg viewBox="0 0 48 48" width="96" height="96"><rect width="48" height="48" fill="#e8f0fb" /><circle cx="24" cy="18" r="8" fill="#7aa7e0" /><path d="M8 46c0-10 7-16 16-16s16 6 16 16z" fill="#7aa7e0" /></svg>
          <figcaption>{{ l({ en: 'You', sk: 'Ty' }) }}</figcaption>
        </figure>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.msn {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(#eef4fd, #d7e4f7);
  font: 12px/1.4 Tahoma, 'Segoe UI', sans-serif;
  color: #000;
}
.toolbar {
  display: flex;
  gap: 2px;
  padding: 3px 4px;
  border-bottom: 1px solid #a9bfdf;
  background: linear-gradient(#fdfefe, #dde8f8);
  flex-wrap: wrap;
}
.toolbar button, .tb-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  min-height: 0;
  padding: 2px 7px;
  font: inherit;
  color: #1b3a6b;
  background: none;
  border: 1px solid transparent;
  box-shadow: none;
  border-radius: 3px;
  text-decoration: none;
  cursor: pointer;
}
.toolbar button:hover:not(:disabled), .tb-link:hover { border-color: #8fb0dc; background: #fff; }
.toolbar button:disabled { opacity: .5; cursor: default; }
.to {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  border-bottom: 1px solid #c3d4ec;
  white-space: nowrap;
  overflow: hidden;
}
.addr { color: #555; }
.status { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; color: #2a7d1a; }
.status i { width: 9px; height: 9px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #c8f7a3, #3ab81f 60%, #1f6d12); }
.status.off { color: #777; }
.status.off i { background: radial-gradient(circle at 35% 30%, #eee, #999 60%, #666); }
.body { flex: 1; min-height: 0; display: flex; gap: 8px; padding: 8px; }
.convo { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.log {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #7f9db9;
  padding: 8px 10px;
  user-select: text;
}
.msg { margin-bottom: 8px; }
.who { color: #6b6b6b; }
.msg p { margin: 1px 0 0 12px; white-space: pre-wrap; overflow-wrap: anywhere; }
.msg.ai p { color: #00285e; }
.msg.me p { color: #000; }
.msg a { color: #0645ad; }
.event { margin: 6px 0; color: #777; font-style: italic; }
.sugg { display: flex; flex-wrap: wrap; gap: 4px; margin: 4px 0 0 12px; }
.sugg button { min-height: 0; padding: 3px 8px; font: inherit; text-align: left; }
.typing { margin: 0; min-height: 17px; color: #555; font-size: 11px; }
.compose { display: flex; gap: 6px; }
.compose textarea {
  flex: 1;
  min-width: 0;
  resize: none;
  font: 13px/1.35 Tahoma, 'Segoe UI', sans-serif;
  padding: 4px 6px;
  border: 1px solid #7f9db9;
}
.send { min-width: 72px; font-weight: bold; }
.pics { flex: 0 0 108px; display: flex; flex-direction: column; justify-content: space-between; }
.pics figure { margin: 0; text-align: center; color: #333; font-size: 11px; }
.pics img, .pics svg {
  display: block;
  width: 96px;
  height: 96px;
  object-fit: cover;
  margin: 0 auto 2px;
  border: 1px solid #7f9db9;
  border-radius: 6px;
  background: #fff;
  padding: 3px;
  box-shadow: 1px 1px 3px rgba(0, 0, 0, .2);
}
@media (max-width: 700px) {
  .pics { display: none; }
  .addr { display: none; }
  .compose textarea { font-size: 16px; } /* no iOS zoom on focus */
}
</style>

<style>
/* window shake for the nudge (applied to the surrounding XpWindow) */
.xpwin.nudge { animation: msn-nudge .6s linear; }
@keyframes msn-nudge {
  0%, 100% { translate: 0 0; }
  10% { translate: -8px 3px; } 20% { translate: 7px -4px; } 30% { translate: -6px -3px; }
  40% { translate: 8px 4px; } 50% { translate: -7px 2px; } 60% { translate: 6px -3px; }
  70% { translate: -5px 3px; } 80% { translate: 4px -2px; } 90% { translate: -2px 1px; }
}
@media (prefers-reduced-motion: reduce) { .xpwin.nudge { animation: none; } }
</style>
