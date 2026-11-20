<script setup lang="ts">
import { useWindowsStore } from '~/stores/windows'

/**
 * Guestbook in a Paint-like window: draw a picture, sign it, send it.
 * Backend: netlify/functions/guestbook.mts (Netlify Blobs). Drawings are public only
 * after Jurgo approves them; open /paint?admin to moderate (token = GUESTBOOK_ADMIN_TOKEN).
 */
const W = 400
const H = 300
const MAX_DATA_URL = 266_000 // ~200 kB PNG, same limit as the server
const MINE_KEY = 'jurgoxp:guestbook-mine'
const ADMIN_KEY = 'jurgoxp:guestbook-admin'

type Tool = 'pencil' | 'brush' | 'spray' | 'eraser' | 'fill' | 'line' | 'rect' | 'ellipse'
type Status = 'pending' | 'approved' | 'hidden'
interface Entry { id: string; name: string; note: string; createdAt: string; status?: Status; src?: string }
interface Mine extends Entry { dataUrl: string }

const { l, locale } = useL10n()
const { $track } = useNuxtApp()
const store = useWindowsStore()
const route = useRoute()
const status = useState<string>('status-paint', () => '')

// --- tools ------------------------------------------------------------------------------
const TOOLS: { id: Tool; label: { en: string; sk: string }; path: string }[] = [
  { id: 'pencil', label: { en: 'Pencil', sk: 'Ceruzka' }, path: 'M3 13l1-3 7-7 2 2-7 7-3 1zM10 4l2 2' },
  { id: 'brush', label: { en: 'Brush', sk: 'Štetec' }, path: 'M13 2c-2 1-5 4-6 6l1 1c2-1 5-4 6-6zM6 9c-2 0-3 1-3 3 0 1-1 1-1 2 3 0 5-1 5-4z' },
  { id: 'spray', label: { en: 'Airbrush', sk: 'Sprej' }, path: 'M6 7h5v7H6zM7 7V5h3v2M11 4h1M13 2h1M13 5h1M14 3.5h1' },
  { id: 'eraser', label: { en: 'Eraser', sk: 'Guma' }, path: 'M2 10l6-6 6 6-3 3H5zM5 7l6 6' },
  { id: 'fill', label: { en: 'Fill with colour', sk: 'Výplň' }, path: 'M3 8l5-5 5 5-5 5zM8 3V1M13 9c0 2 1 3 1 4' },
  { id: 'line', label: { en: 'Line', sk: 'Čiara' }, path: 'M2 14L14 2' },
  { id: 'rect', label: { en: 'Rectangle', sk: 'Obdĺžnik' }, path: 'M2 4h12v8H2z' },
  { id: 'ellipse', label: { en: 'Ellipse', sk: 'Elipsa' }, path: 'M8 3c3.5 0 6 2.2 6 5s-2.5 5-6 5-6-2.2-6-5 2.5-5 6-5z' },
]
const SIZES = [2, 5, 9, 15]
const COLORS = [
  '#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4', '#8b4513', '#1e3a5f',
  '#ffffff', '#c3c3c3', '#b97a57', '#ffaec9', '#ffc90e', '#efe4b0', '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7', '#f5d0a9', '#0b6623',
]

const tool = ref<Tool>('brush')
const size = ref(5)
const color = ref('#000000')
const filled = ref(false)
const toolLabel = computed(() => l(TOOLS.find(t => t.id === tool.value)!.label))

// --- canvas -----------------------------------------------------------------------------
const canvas = ref<HTMLCanvasElement | null>(null)
const overlay = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let octx: CanvasRenderingContext2D | null = null
const undoStack: ImageData[] = []
const redoStack: ImageData[] = []
const canUndo = ref(false)
const canRedo = ref(false)
const dirty = ref(false)

function initCanvas() {
  if (!canvas.value || !overlay.value) return
  ctx = canvas.value.getContext('2d', { willReadFrequently: true })
  octx = overlay.value.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, W, H)
}

function snapshot() {
  if (!ctx) return
  undoStack.push(ctx.getImageData(0, 0, W, H))
  if (undoStack.length > 30) undoStack.shift()
  redoStack.length = 0
  canUndo.value = true
  canRedo.value = false
}
function undo() {
  if (!ctx || !undoStack.length) return
  redoStack.push(ctx.getImageData(0, 0, W, H))
  ctx.putImageData(undoStack.pop()!, 0, 0)
  canUndo.value = undoStack.length > 0
  canRedo.value = true
}
function redo() {
  if (!ctx || !redoStack.length) return
  undoStack.push(ctx.getImageData(0, 0, W, H))
  ctx.putImageData(redoStack.pop()!, 0, 0)
  canUndo.value = true
  canRedo.value = redoStack.length > 0
}
function clearAll() {
  if (!ctx) return
  snapshot()
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, W, H)
  dirty.value = false
}

function hexRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** 4-way flood fill with a small tolerance so anti-aliased edges don't leave gaps. */
function floodFill(x: number, y: number, hex: string) {
  if (!ctx) return
  const img = ctx.getImageData(0, 0, W, H)
  const d = img.data
  const start = (y * W + x) * 4
  const t = [d[start]!, d[start + 1]!, d[start + 2]!]
  const [r, g, b] = hexRgb(hex)
  if (Math.abs(t[0]! - r) + Math.abs(t[1]! - g) + Math.abs(t[2]! - b) < 8) return
  const tol = 90
  const seen = new Uint8Array(W * H)
  const stack = [y * W + x]
  while (stack.length) {
    const p = stack.pop()!
    if (seen[p]) continue
    seen[p] = 1
    const i = p * 4
    if (Math.abs(d[i]! - t[0]!) + Math.abs(d[i + 1]! - t[1]!) + Math.abs(d[i + 2]! - t[2]!) > tol) continue
    d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255
    const px = p % W
    if (px > 0) stack.push(p - 1)
    if (px < W - 1) stack.push(p + 1)
    if (p >= W) stack.push(p - W)
    if (p < W * (H - 1)) stack.push(p + W)
  }
  ctx.putImageData(img, 0, 0)
}

function shape(c: CanvasRenderingContext2D, t: Tool, a: { x: number; y: number }, b: { x: number; y: number }) {
  c.strokeStyle = color.value
  c.fillStyle = color.value
  c.lineWidth = size.value
  c.lineCap = 'round'
  c.lineJoin = 'round'
  c.beginPath()
  if (t === 'line') { c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); return }
  if (t === 'rect') c.rect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y))
  else c.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, 0, 0, Math.PI * 2)
  if (filled.value) c.fill()
  else c.stroke()
}

function spray(p: { x: number; y: number }) {
  if (!ctx) return
  ctx.fillStyle = color.value
  const r = size.value * 2 + 4
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2
    const d = Math.random() * r
    ctx.fillRect(Math.round(p.x + Math.cos(a) * d), Math.round(p.y + Math.sin(a) * d), 1, 1)
  }
}

let drawing = false
let start = { x: 0, y: 0 }
let last = { x: 0, y: 0 }
let sprayTimer: ReturnType<typeof setInterval> | undefined
const cursor = ref<{ x: number; y: number } | null>(null)

function pos(e: PointerEvent) {
  const r = overlay.value!.getBoundingClientRect()
  return {
    x: Math.max(0, Math.min(W - 1, Math.round((e.clientX - r.left) * W / r.width))),
    y: Math.max(0, Math.min(H - 1, Math.round((e.clientY - r.top) * H / r.height))),
  }
}

function stroke(a: { x: number; y: number }, b: { x: number; y: number }) {
  if (!ctx) return
  ctx.strokeStyle = tool.value === 'eraser' ? '#ffffff' : color.value
  ctx.lineWidth = tool.value === 'pencil' ? 2 : tool.value === 'eraser' ? size.value * 2 + 4 : size.value
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x + 0.01, b.y)
  ctx.stroke()
}

function down(e: PointerEvent) {
  if (!ctx || (e.pointerType === 'mouse' && e.button !== 0)) return
  e.preventDefault()
  overlay.value!.setPointerCapture(e.pointerId)
  const p = pos(e)
  snapshot()
  dirty.value = true
  if (tool.value === 'fill') { floodFill(p.x, p.y, color.value); return }
  drawing = true
  start = last = p
  if (tool.value === 'spray') { spray(p); sprayTimer = setInterval(() => spray(last), 40) }
  else if (['pencil', 'brush', 'eraser'].includes(tool.value)) stroke(p, p)
}
function move(e: PointerEvent) {
  const p = pos(e)
  cursor.value = p
  if (!drawing) return
  e.preventDefault()
  if (tool.value === 'spray') { last = p; spray(p); return }
  if (['line', 'rect', 'ellipse'].includes(tool.value)) {
    octx!.clearRect(0, 0, W, H)
    shape(octx!, tool.value, start, p)
  }
  else stroke(last, p)
  last = p
}
function up(e: PointerEvent) {
  if (!drawing) return
  drawing = false
  clearInterval(sprayTimer)
  if (['line', 'rect', 'ellipse'].includes(tool.value)) {
    octx!.clearRect(0, 0, W, H)
    shape(ctx!, tool.value, start, pos(e))
  }
}

function onKey(e: KeyboardEvent) {
  if (store.active !== 'paint' || view.value !== 'draw' || !(e.ctrlKey || e.metaKey)) return
  if ((e.target as HTMLElement | null)?.closest?.('input, textarea')) return
  const k = e.key.toLowerCase()
  if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
  else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo() }
}

function download() {
  if (!canvas.value) return
  const a = document.createElement('a')
  a.href = canvas.value.toDataURL('image/png')
  a.download = 'jurgo-xp-kresba.png'
  a.click()
}

// --- sign & send ------------------------------------------------------------------------
const signing = ref(false)
const sending = ref(false)
const sendError = ref('')
const sent = ref(false)
const form = reactive({ name: '', note: '', website: '' })

function openSign() {
  sendError.value = ''
  signing.value = true
  nextTick(() => document.getElementById('gb-name')?.focus())
}

async function send() {
  if (!canvas.value || sending.value) return
  const image = canvas.value.toDataURL('image/png')
  if (image.length > MAX_DATA_URL) {
    sendError.value = l({ en: 'The drawing is too detailed to send. Try fewer spray dots.', sk: 'Kresba je na odoslanie príliš zložitá. Skús menej spreja.' })
    return
  }
  sending.value = true
  sendError.value = ''
  try {
    const res = await fetch('/api/guestbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, note: form.note, website: form.website, image }),
    })
    const data = await res.json().catch(() => ({})) as { id?: string; error?: string }
    if (!res.ok || !data.id) {
      $track?.('guestbook_submit_error', { reason: data.error ?? String(res.status) }, 'guestbook_error')
      sendError.value = data.error === 'rate'
        ? l({ en: 'You have sent a lot of drawings. Try again later.', sk: 'Poslal si už veľa kresieb. Skús to neskôr.' })
        : data.error === 'name'
          ? l({ en: 'Please sign with at least 2 characters.', sk: 'Podpíš sa aspoň 2 znakmi.' })
          : l({ en: 'The drawing could not be sent. Try again in a moment.', sk: 'Kresbu sa nepodarilo odoslať. Skús to o chvíľu znova.' })
      return
    }
    // analytics without personal data: no name, no note text, no image
    $track?.('guestbook_submit', { has_note: !!form.note.trim(), lang: locale.value }, 'guestbook_sent')
    const mine: Mine = { id: data.id, name: form.name.trim(), note: form.note.trim(), createdAt: new Date().toISOString(), dataUrl: image }
    myEntries.value = [mine, ...myEntries.value].slice(0, 3)
    saveMine()
    form.note = ''
    signing.value = false
    sent.value = true
    dirty.value = false
  }
  catch {
    sendError.value = l({ en: 'The drawing could not be sent. Check your connection.', sk: 'Kresbu sa nepodarilo odoslať. Skontroluj pripojenie.' })
  }
  finally {
    sending.value = false
  }
}

function newDrawing() {
  sent.value = false
  if (!ctx) return
  undoStack.length = redoStack.length = 0
  canUndo.value = canRedo.value = false
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, W, H)
}

// --- gallery ----------------------------------------------------------------------------
const view = ref<'draw' | 'gallery'>('draw')
const entries = ref<Entry[]>([])
const loading = ref(false)
const loadError = ref(false)
const myEntries = ref<Mine[]>([])
const big = ref<Entry | null>(null)
const pendingMine = computed(() => myEntries.value.filter(m => !entries.value.some(e => e.id === m.id)))

function saveMine() {
  try { localStorage.setItem(MINE_KEY, JSON.stringify(myEntries.value)) }
  catch { /* storage full or blocked */ }
}

const admin = ref('')
const adminAsk = ref(false)
const adminInput = ref('')
const adminError = ref('')
const objectUrls: string[] = []

async function loadGallery() {
  loading.value = true
  loadError.value = false
  try {
    if (admin.value) {
      const res = await fetch('/api/guestbook?admin=1', { headers: { Authorization: `Bearer ${admin.value}` } })
      if (res.status === 401) { adminError.value = l({ en: 'Wrong token.', sk: 'Nesprávny token.' }); logoutAdmin(); return loadGallery() }
      if (!res.ok) throw new Error(String(res.status))
      const list = (await res.json()).entries as Entry[]
      // pending images need the token, so load them as blobs
      await Promise.all(list.map(async (e) => {
        const r = await fetch(`/api/guestbook/img/${e.id}`, { headers: { Authorization: `Bearer ${admin.value}` } })
        if (r.ok) { e.src = URL.createObjectURL(await r.blob()); objectUrls.push(e.src) }
      }))
      entries.value = list
    }
    else {
      const res = await fetch('/api/guestbook')
      if (!res.ok) throw new Error(String(res.status))
      entries.value = ((await res.json()).entries as Entry[]).map(e => ({ ...e, src: `/api/guestbook/img/${e.id}` }))
      // forget my own drawings once they are approved
      const before = myEntries.value.length
      myEntries.value = myEntries.value.filter(m => !entries.value.some(e => e.id === m.id))
      if (myEntries.value.length !== before) saveMine()
    }
  }
  catch {
    loadError.value = true
  }
  finally {
    loading.value = false
  }
}

async function moderate(e: Entry, action: 'approve' | 'hide' | 'delete') {
  if (action === 'delete' && !window.confirm(l({ en: `Delete the drawing by ${e.name}?`, sk: `Zmazať kresbu od ${e.name}?` }))) return
  const res = await fetch('/api/guestbook?admin=1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${admin.value}` },
    body: JSON.stringify({ action, id: e.id }),
  })
  if (!res.ok) { adminError.value = `Chyba ${res.status}`; return }
  if (action === 'delete') entries.value = entries.value.filter(x => x.id !== e.id)
  else e.status = action === 'approve' ? 'approved' : 'hidden'
}

function loginAdmin() {
  admin.value = adminInput.value.trim()
  adminInput.value = ''
  adminAsk.value = false
  adminError.value = ''
  try { localStorage.setItem(ADMIN_KEY, admin.value) }
  catch { /* keep it for this visit only */ }
  view.value = 'gallery'
  void loadGallery()
}
function logoutAdmin() {
  admin.value = ''
  try { localStorage.removeItem(ADMIN_KEY) }
  catch { /* ignore */ }
}

function show(v: 'draw' | 'gallery') {
  view.value = v
  if (v === 'gallery') {
    void loadGallery()
    $track?.('guestbook_gallery', { lang: locale.value }, 'guestbook_gallery')
  }
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(locale.value === 'sk' ? 'sk-SK' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

const counts = computed(() => ({
  pending: entries.value.filter(e => e.status === 'pending').length,
}))

watchEffect(() => {
  if (view.value === 'gallery') {
    status.value = admin.value
      ? l({ en: `Admin · ${entries.value.length} drawings · ${counts.value.pending} waiting`, sk: `Správca · ${entries.value.length} kresieb · ${counts.value.pending} čaká` })
      : l({ en: `${entries.value.length} drawings in the guestbook`, sk: `Kresieb v knihe návštev: ${entries.value.length}` })
  }
  else {
    status.value = cursor.value
      ? `${toolLabel.value} · ${cursor.value.x}, ${cursor.value.y} px`
      : l({ en: 'Draw something and sign the guestbook', sk: 'Nakresli niečo a podpíš sa do knihy návštev' })
  }
})

onMounted(() => {
  initCanvas()
  window.addEventListener('keydown', onKey)
  try {
    myEntries.value = JSON.parse(localStorage.getItem(MINE_KEY) || '[]')
    admin.value = localStorage.getItem(ADMIN_KEY) || ''
  }
  catch { /* storage blocked */ }
  if (admin.value) show('gallery')
  // prerendered page: the route's query is empty while hydrating and comes back a moment later
  let handled = false
  watch(() => route.query, (q) => {
    if (handled || (q.admin === undefined && q.gallery === undefined)) return
    handled = true
    if (q.admin !== undefined && !admin.value) adminAsk.value = true
    else if (view.value !== 'gallery') show('gallery')
  }, { immediate: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  clearInterval(sprayTimer)
  objectUrls.forEach(u => URL.revokeObjectURL(u))
  status.value = ''
})
</script>

<template>
  <div class="pnt">
    <div class="pnt-tabs" role="tablist">
      <button type="button" role="tab" :aria-selected="view === 'draw'" :class="{ on: view === 'draw' }" @click="show('draw')">
        🖌️ {{ l({ en: 'Draw', sk: 'Kresliť' }) }}
      </button>
      <button type="button" role="tab" :aria-selected="view === 'gallery'" :class="{ on: view === 'gallery' }" @click="show('gallery')">
        🖼️ {{ l({ en: 'Guestbook', sk: 'Kniha návštev' }) }}
      </button>
      <span class="pnt-spacer" />
      <button v-if="admin" type="button" class="pnt-link" @click="logoutAdmin(); show('gallery')">
        {{ l({ en: 'Log out admin', sk: 'Odhlásiť správcu' }) }}
      </button>
    </div>

    <!-- ===== drawing ===== -->
    <div v-show="view === 'draw'" class="pnt-draw">
      <div class="pnt-main">
        <div class="pnt-box" role="toolbar" :aria-label="l({ en: 'Tools', sk: 'Nástroje' })">
          <button
            v-for="t in TOOLS"
            :key="t.id"
            type="button"
            class="pnt-tool"
            :class="{ on: tool === t.id }"
            :title="l(t.label)"
            :aria-label="l(t.label)"
            :aria-pressed="tool === t.id"
            @click="tool = t.id"
          >
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              <path :d="t.path" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round" />
            </svg>
          </button>
          <div class="pnt-opts">
            <template v-if="tool === 'rect' || tool === 'ellipse'">
              <button type="button" :class="{ on: !filled }" :title="l({ en: 'Outline', sk: 'Obrys' })" @click="filled = false"><span class="o-out" /></button>
              <button type="button" :class="{ on: filled }" :title="l({ en: 'Filled', sk: 'Vyplnený' })" @click="filled = true"><span class="o-fill" /></button>
            </template>
            <button
              v-for="s in SIZES"
              v-else-if="tool !== 'fill' && tool !== 'pencil'"
              :key="s"
              type="button"
              :class="{ on: size === s }"
              :title="`${s} px`"
              @click="size = s"
            >
              <span class="o-dot" :style="{ width: `${Math.min(s, 12)}px`, height: `${Math.min(s, 12)}px` }" />
            </button>
          </div>
        </div>

        <div class="pnt-work">
          <div class="pnt-paper">
            <canvas ref="canvas" :width="W" :height="H" class="pnt-canvas" />
            <canvas
              ref="overlay"
              :width="W"
              :height="H"
              class="pnt-canvas pnt-over"
              :class="`t-${tool}`"
              :aria-label="l({ en: 'Drawing area', sk: 'Plocha na kreslenie' })"
              role="img"
              @pointerdown="down"
              @pointermove="move"
              @pointerup="up"
              @pointercancel="up"
              @pointerleave="cursor = null"
            />
            <div v-if="sent" class="pnt-sent" role="status">
              <b>{{ l({ en: 'Thank you for your drawing!', sk: 'Ďakujem za kresbu!' }) }}</b>
              <span>{{ l({ en: 'It will appear in the guestbook once I approve it.', sk: 'V knihe návštev sa objaví, keď ju schválim.' }) }}</span>
              <span class="pnt-sent-btns">
                <button type="button" @click="show('gallery')">{{ l({ en: 'View the guestbook', sk: 'Pozrieť knihu návštev' }) }}</button>
                <button type="button" @click="newDrawing">{{ l({ en: 'Draw another', sk: 'Nakresliť ďalšiu' }) }}</button>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="pnt-bottom">
        <div class="pnt-current" :title="l({ en: 'Current colour', sk: 'Aktuálna farba' })">
          <span :style="{ background: color }" />
        </div>
        <div class="pnt-palette" role="listbox" :aria-label="l({ en: 'Colours', sk: 'Farby' })">
          <button
            v-for="c in COLORS"
            :key="c"
            type="button"
            role="option"
            :aria-selected="color === c"
            :aria-label="c"
            :class="{ on: color === c }"
            :style="{ background: c }"
            @click="color = c"
          />
        </div>
        <div class="pnt-actions">
          <button type="button" :disabled="!canUndo" :title="l({ en: 'Undo (Ctrl+Z)', sk: 'Späť (Ctrl+Z)' })" @click="undo">↶</button>
          <button type="button" :disabled="!canRedo" :title="l({ en: 'Redo (Ctrl+Y)', sk: 'Znova (Ctrl+Y)' })" @click="redo">↷</button>
          <button type="button" :title="l({ en: 'Clear', sk: 'Vymazať' })" @click="clearAll">🗑️</button>
          <button type="button" :title="l({ en: 'Save as PNG', sk: 'Uložiť ako PNG' })" @click="download">💾</button>
          <button type="button" class="pnt-sign" :disabled="!dirty || sent" @click="openSign">
            ✍️ {{ l({ en: 'Sign & send', sk: 'Podpísať a poslať' }) }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===== gallery ===== -->
    <div v-if="view === 'gallery'" class="pnt-gallery">
      <p v-if="adminError" class="pnt-err" role="alert">{{ adminError }}</p>
      <p v-if="loading && !entries.length" class="pnt-muted">{{ l({ en: 'Loading drawings…', sk: 'Načítavam kresby…' }) }}</p>
      <p v-else-if="loadError" class="pnt-err" role="alert">
        {{ l({ en: 'The guestbook could not be loaded.', sk: 'Knihu návštev sa nepodarilo načítať.' }) }}
        <button type="button" @click="loadGallery">{{ l({ en: 'Try again', sk: 'Skúsiť znova' }) }}</button>
      </p>

      <ul class="pnt-grid">
        <li v-for="m in admin ? [] : pendingMine" :key="m.id" class="pnt-card mine">
          <img :src="m.dataUrl" :alt="l({ en: `Drawing by ${m.name}`, sk: `Kresba od ${m.name}` })" width="200" height="150">
          <b>{{ m.name }}</b>
          <span v-if="m.note" class="pnt-note">{{ m.note }}</span>
          <span class="pnt-badge">{{ l({ en: 'Waiting for approval · only you see it', sk: 'Čaká na schválenie · vidíš ju len ty' }) }}</span>
        </li>
        <li v-for="e in entries" :key="e.id" class="pnt-card" :class="e.status">
          <button type="button" class="pnt-thumb" :title="l({ en: 'Enlarge', sk: 'Zväčšiť' })" @click="big = e">
            <img :src="e.src" :alt="l({ en: `Drawing by ${e.name}`, sk: `Kresba od ${e.name}` })" width="200" height="150" loading="lazy">
          </button>
          <b>{{ e.name }}</b>
          <span v-if="e.note" class="pnt-note">{{ e.note }}</span>
          <span class="pnt-date">{{ fmtDate(e.createdAt) }}</span>
          <span v-if="admin" class="pnt-mod">
            <span class="pnt-badge" :class="e.status">{{ e.status === 'pending' ? 'čaká' : e.status === 'approved' ? 'verejná' : 'skrytá' }}</span>
            <button v-if="e.status !== 'approved'" type="button" @click="moderate(e, 'approve')">✔ Schváliť</button>
            <button v-if="e.status === 'approved'" type="button" @click="moderate(e, 'hide')">Skryť</button>
            <button type="button" @click="moderate(e, 'delete')">✖ Zmazať</button>
          </span>
        </li>
      </ul>
      <div v-if="!loading && !loadError && !entries.length && !pendingMine.length" class="pnt-empty">
        <p>{{ l({ en: 'No drawings yet. Be the first one!', sk: 'Zatiaľ tu nie je žiadna kresba. Buď prvý!' }) }}</p>
        <button type="button" @click="show('draw')">🖌️ {{ l({ en: 'Draw something', sk: 'Nakresliť niečo' }) }}</button>
      </div>
    </div>

    <!-- ===== dialogs ===== -->
    <div v-if="signing" class="pnt-modal" @click.self="signing = false">
      <form class="window pnt-dlg" @submit.prevent="send">
        <div class="title-bar">
          <div class="title-bar-text">{{ l({ en: 'Sign the guestbook', sk: 'Podpísať sa do knihy návštev' }) }}</div>
          <div class="title-bar-controls"><button type="button" aria-label="Close" @click="signing = false" /></div>
        </div>
        <div class="window-body">
          <label for="gb-name">{{ l({ en: 'Your name or nickname', sk: 'Tvoje meno alebo prezývka' }) }}</label>
          <input id="gb-name" v-model="form.name" type="text" required minlength="2" maxlength="40" autocomplete="nickname">
          <label for="gb-note">{{ l({ en: 'Short message (optional)', sk: 'Krátky odkaz (nepovinné)' }) }}</label>
          <input id="gb-note" v-model="form.note" type="text" maxlength="140">
          <p class="pnt-hp" aria-hidden="true"><label>Website <input v-model="form.website" tabindex="-1" autocomplete="off"></label></p>
          <p class="pnt-muted">
            {{ l({
              en: 'Your drawing, name and message will be public after I approve them. Please don’t write personal details like e-mail or phone.',
              sk: 'Kresba, meno aj odkaz budú verejné, keď ich schválim. Nepíš sem osobné údaje ako e-mail či telefón.',
            }) }}
          </p>
          <p v-if="sendError" class="pnt-err" role="alert">{{ sendError }}</p>
          <div class="pnt-dlg-btns">
            <button type="submit" :disabled="sending">{{ sending ? l({ en: 'Sending…', sk: 'Odosielam…' }) : l({ en: 'Send', sk: 'Odoslať' }) }}</button>
            <button type="button" @click="signing = false">{{ l({ en: 'Cancel', sk: 'Zrušiť' }) }}</button>
          </div>
        </div>
      </form>
    </div>

    <div v-if="adminAsk" class="pnt-modal">
      <form class="window pnt-dlg" @submit.prevent="loginAdmin">
        <div class="title-bar">
          <div class="title-bar-text">Správca knihy návštev</div>
          <div class="title-bar-controls"><button type="button" aria-label="Close" @click="adminAsk = false" /></div>
        </div>
        <div class="window-body">
          <label for="gb-token">Token (GUESTBOOK_ADMIN_TOKEN)</label>
          <input id="gb-token" v-model="adminInput" type="password" required autocomplete="current-password">
          <div class="pnt-dlg-btns">
            <button type="submit">OK</button>
            <button type="button" @click="adminAsk = false">Zrušiť</button>
          </div>
        </div>
      </form>
    </div>

    <div v-if="big" class="pnt-modal" @click.self="big = null">
      <figure class="window pnt-big">
        <div class="title-bar">
          <div class="title-bar-text">{{ big.name }}</div>
          <div class="title-bar-controls"><button type="button" aria-label="Close" @click="big = null" /></div>
        </div>
        <div class="window-body">
          <img :src="big.src" :alt="l({ en: `Drawing by ${big.name}`, sk: `Kresba od ${big.name}` })" :width="W" :height="H">
          <figcaption>
            <span v-if="big.note">„{{ big.note }}“ · </span>{{ fmtDate(big.createdAt) }}
          </figcaption>
        </div>
      </figure>
    </div>
  </div>
</template>

<style scoped>
.pnt { position: relative; height: 100%; display: flex; flex-direction: column; background: #ece9d8; font: 11px Tahoma, 'Segoe UI', sans-serif; color: #000; }
.pnt button { min-width: 0; min-height: 0; }
.pnt .title-bar-controls button { min-width: 21px; min-height: 21px; }
.pnt-tabs { flex: none; display: flex; align-items: center; gap: 2px; padding: 3px 4px 0; border-bottom: 1px solid #919b9c; }
.pnt-tabs [role='tab'] { padding: 3px 10px; border: 1px solid #919b9c; border-bottom: 0; border-radius: 3px 3px 0 0; background: linear-gradient(#fff, #e3e0d0); box-shadow: none; margin-bottom: -1px; }
.pnt-tabs [role='tab'].on { background: #fff; border-top: 2px solid #f9b13a; padding-bottom: 4px; }
.pnt-spacer { flex: 1; }
.pnt-link { all: unset; cursor: pointer; color: #0b4fb0; text-decoration: underline; padding: 0 6px; }

.pnt-draw { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.pnt-main { flex: 1; min-height: 0; display: flex; }
.pnt-box { flex: none; width: 54px; padding: 4px 3px; display: flex; flex-wrap: wrap; align-content: flex-start; gap: 2px; border-right: 1px solid #c5c2b2; }
.pnt-tool { width: 24px; height: 24px; padding: 0; display: grid; place-items: center; background: #ece9d8; border: 1px solid transparent; box-shadow: none; border-radius: 2px; color: #222; }
.pnt-tool:hover { border-color: #919b9c; background: #f5f4ee; }
.pnt-tool.on { border-color: #6b6b6b #fff #fff #6b6b6b; background: #fff; box-shadow: inset 1px 1px 0 #9c9c9c; }
.pnt-opts { width: 48px; margin-top: 6px; padding: 2px; border: 1px solid; border-color: #9c9c9c #fff #fff #9c9c9c; display: flex; flex-direction: column; gap: 2px; align-items: stretch; }
.pnt-opts button { height: 16px; padding: 0; display: grid; place-items: center; background: none; border: 0; box-shadow: none; border-radius: 0; }
.pnt-opts button.on { background: #316ac5; }
.pnt-opts button.on .o-dot { background: #fff; }
.o-dot { display: block; border-radius: 50%; background: #000; }
.o-out, .o-fill { display: block; width: 26px; height: 10px; border: 1px solid #000; }
.o-fill { background: #555; }
.pnt-opts button.on .o-out, .pnt-opts button.on .o-fill { border-color: #fff; }

.pnt-work { flex: 1; min-width: 0; overflow: auto; background: #808080; padding: 8px; }
.pnt-paper { position: relative; width: 400px; max-width: 100%; aspect-ratio: 4 / 3; box-shadow: 2px 2px 0 #3a3a3a; background: #fff; }
.pnt-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.pnt-over { touch-action: none; cursor: crosshair; }
.pnt-over.t-fill { cursor: cell; }
.pnt-sent { position: absolute; inset: auto 8px 8px; display: flex; flex-direction: column; gap: 4px; padding: 8px 10px; background: #ffffe1; border: 1px solid #000; border-radius: 4px; box-shadow: 2px 2px 6px rgba(0, 0, 0, .35); font-size: 12px; }
.pnt-sent-btns { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 2px; }

.pnt-bottom { flex: none; display: flex; align-items: center; gap: 6px; padding: 4px; border-top: 1px solid #c5c2b2; flex-wrap: wrap; }
.pnt-current { width: 30px; height: 30px; padding: 3px; border: 1px solid; border-color: #9c9c9c #fff #fff #9c9c9c; background: #fff; }
.pnt-current span { display: block; width: 100%; height: 100%; border: 1px solid #555; }
.pnt-palette { display: grid; grid-template-columns: repeat(12, 15px); gap: 1px; }
.pnt-palette button { width: 15px; height: 15px; padding: 0; border: 1px solid; border-color: #808080 #fff #fff #808080; border-radius: 0; box-shadow: none; }
.pnt-palette button.on { outline: 2px solid #316ac5; outline-offset: -1px; }
.pnt-actions { display: flex; gap: 3px; margin-left: auto; align-items: center; }
.pnt-actions button { padding: 2px 6px; font-size: 13px; }
.pnt-actions .pnt-sign { font-size: 11px; font-weight: bold; padding: 3px 10px; }

.pnt-gallery { flex: 1; min-height: 0; overflow: auto; background: #fff; padding: 10px; }
.pnt-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; }
.pnt-card { display: flex; flex-direction: column; gap: 2px; padding: 6px; border: 1px solid #d8d2bd; background: #fbfaf5; min-width: 0; }
.pnt-card img { display: block; width: 100%; height: auto; border: 1px solid #c5c2b2; background: #fff; }
.pnt-card b { font-size: 12px; margin-top: 3px; overflow-wrap: anywhere; }
.pnt-thumb { all: unset; cursor: zoom-in; display: block; }
.pnt-thumb:focus-visible { outline: 2px solid #316ac5; }
.pnt-note { color: #333; overflow-wrap: anywhere; }
.pnt-date { color: #777; }
.pnt-badge { align-self: flex-start; padding: 1px 5px; border-radius: 8px; background: #fff3c4; border: 1px solid #e0c060; color: #6a5200; }
.pnt-badge.approved { background: #dff3d8; border-color: #8cc47a; color: #245c14; }
.pnt-badge.hidden { background: #eee; border-color: #bbb; color: #555; }
.pnt-card.pending { border-color: #e0c060; }
.pnt-card.hidden img { opacity: .45; }
.pnt-card.mine img { opacity: .8; }
.pnt-mod { display: flex; flex-wrap: wrap; gap: 3px; align-items: center; margin-top: 4px; }
.pnt-mod button { padding: 1px 6px; font-size: 11px; }
.pnt-empty { text-align: center; padding: 30px 10px; color: #444; font-size: 12px; }
.pnt-muted { color: #555; }
.pnt-err { color: #a00; }

.pnt-modal { position: absolute; inset: 0; z-index: 5; display: grid; place-items: center; padding: 10px; background: rgba(0, 0, 0, .25); }
.pnt-dlg { width: 340px; max-width: 100%; }
.pnt-dlg .window-body, .pnt-big .window-body { margin: 0 3px 3px; padding: 12px 14px; background: #ece9d8; }
.pnt-dlg .window-body { display: flex; flex-direction: column; gap: 4px; }
.pnt-dlg label { font-size: 12px; }
.pnt-dlg input { width: 100%; box-sizing: border-box; margin-bottom: 6px; padding: 3px 5px; height: auto; font-size: 12px; }
.pnt-dlg-btns { display: flex; justify-content: flex-end; gap: 6px; margin-top: 4px; }
.pnt-hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
.pnt-big { margin: 0; max-width: 100%; }
.pnt-big img { display: block; max-width: 100%; height: auto; background: #fff; border: 1px solid #c5c2b2; }
.pnt-big figcaption { margin-top: 6px; font-size: 12px; overflow-wrap: anywhere; }

@media (max-width: 700px) {
  .pnt-main { flex-direction: column; }
  .pnt-box { width: auto; flex-wrap: nowrap; align-items: center; border-right: 0; border-bottom: 1px solid #c5c2b2; overflow-x: auto; }
  .pnt-tool { width: 34px; height: 34px; flex: none; }
  .pnt-tool svg { width: 20px; height: 20px; }
  .pnt-opts { flex-direction: row; width: auto; margin: 0 0 0 6px; }
  .pnt-opts button { width: 26px; height: 26px; }
  .pnt-work { padding: 6px; }
  .pnt-paper { width: 100%; }
  .pnt-palette { grid-template-columns: repeat(12, 1fr); flex: 1 1 100%; order: 3; }
  .pnt-palette button { width: auto; height: 22px; }
  .pnt-actions button { padding: 5px 9px; }
}
</style>
