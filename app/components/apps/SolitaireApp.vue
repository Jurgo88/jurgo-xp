<script setup lang="ts">
// Klondike solitaire, written from scratch (cards are plain CSS, no images).
// Click / tap a card: it jumps to the best legal spot (foundation first).
// Drag a card (or a run of cards) to put it somewhere specific.

interface Card { id: number; s: number; r: number; up: boolean }
type PileRef = { t: 'waste' } | { t: 'found'; i: number } | { t: 'tab'; i: number }
interface Game { stock: Card[]; waste: Card[]; found: Card[][]; tab: Card[][] }

const SUITS = ['♠', '♥', '♦', '♣']
const RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const red = (c: Card) => c.s === 1 || c.s === 2

const { l } = useL10n()
const { $track } = useNuxtApp()
const status = useState<string>('status-solitaire', () => '')

const g = reactive<Game>({ stock: [], waste: [], found: [[], [], [], []], tab: [[], [], [], [], [], [], []] })
const drawCount = ref<1 | 3>(1)
const moves = ref(0)
const time = ref(0)
const started = ref(false)
const won = ref(false)
const history: string[] = []
const canUndo = ref(false)

let timer: ReturnType<typeof setInterval> | undefined
function stopTimer() { clearInterval(timer); timer = undefined }
function touch() {
  if (started.value) return
  started.value = true
  timer = setInterval(() => time.value++, 1000)
}

function deal() {
  stopTimer()
  const deck: Card[] = []
  for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) deck.push({ id: s * 13 + r, s, r, up: false })
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j]!, deck[i]!]
  }
  g.tab = Array.from({ length: 7 }, (_, i) => {
    const pile = deck.splice(0, i + 1)
    pile[pile.length - 1]!.up = true
    return pile
  })
  g.stock = deck
  g.waste = []
  g.found = [[], [], [], []]
  moves.value = 0
  time.value = 0
  started.value = false
  won.value = false
  history.length = 0
  canUndo.value = false
  stopBounce()
}

function snapshot() {
  history.push(JSON.stringify({ g, moves: moves.value }))
  if (history.length > 200) history.shift()
  canUndo.value = true
}
function undo() {
  const last = history.pop()
  canUndo.value = history.length > 0
  if (!last || won.value) return
  const s = JSON.parse(last) as { g: Game; moves: number }
  Object.assign(g, s.g)
  moves.value = s.moves
}

// ---- rules ----
const top = (p: Card[]) => p[p.length - 1]
const pileOf = (p: PileRef) => (p.t === 'waste' ? g.waste : p.t === 'found' ? g.found[p.i]! : g.tab[p.i]!)

function fitsFound(c: Card, i: number) {
  const t = top(g.found[i]!)
  return t ? t.s === c.s && t.r === c.r - 1 : c.r === 1
}
function fitsTab(c: Card, i: number) {
  const t = top(g.tab[i]!)
  return t ? t.up && red(t) !== red(c) && t.r === c.r + 1 : c.r === 13
}
function legal(from: PileRef, k: number, to: PileRef) {
  const src = pileOf(from)
  const c = src[k]
  if (!c || !c.up) return false
  if (from.t === to.t && (from as { i: number }).i === (to as { i: number }).i) return false
  if (to.t === 'found') return k === src.length - 1 && fitsFound(c, to.i)
  if (to.t === 'tab') return fitsTab(c, to.i)
  return false
}
function move(from: PileRef, k: number, to: PileRef) {
  snapshot()
  touch()
  const src = pileOf(from)
  const cards = src.splice(k)
  pileOf(to).push(...cards)
  const t = top(src)
  if (from.t === 'tab' && t && !t.up) t.up = true
  moves.value++
  checkWin()
}

function drawStock() {
  if (won.value) return
  touch()
  snapshot()
  if (!g.stock.length) {
    if (!g.waste.length) { history.pop(); return }
    g.stock = g.waste.reverse().map(c => ({ ...c, up: false }))
    g.waste = []
  }
  else {
    const n = Math.min(drawCount.value, g.stock.length)
    const drawn = g.stock.splice(g.stock.length - n, n).reverse().map(c => ({ ...c, up: true }))
    g.waste.push(...drawn)
  }
  moves.value++
}

/** tap: foundation first, then a non-empty column, then an empty one */
function autoMove(from: PileRef, k: number) {
  const src = pileOf(from)
  if (from.t === 'tab' && k === src.length - 1 && !src[k]!.up) {
    snapshot(); src[k]!.up = true; return true
  }
  if (from.t !== 'found') {
    for (let i = 0; i < 4; i++) if (legal(from, k, { t: 'found', i })) { move(from, k, { t: 'found', i }); return true }
  }
  const order = [...g.tab.keys()].sort((a, b) => Number(!g.tab[a]!.length) - Number(!g.tab[b]!.length))
  for (const i of order) if (legal(from, k, { t: 'tab', i })) { move(from, k, { t: 'tab', i }); return true }
  return false
}

const allFound = computed(() => g.found.every(f => f.length === 13))
const canFinish = computed(() => !won.value && !g.stock.length && !g.waste.length && g.tab.every(p => p.every(c => c.up)) && !allFound.value)
let finishing: ReturnType<typeof setInterval> | undefined
function autoFinish() {
  clearInterval(finishing)
  finishing = setInterval(() => {
    for (let t = 0; t < 7; t++) {
      const p = g.tab[t]!
      if (p.length && autoToFound({ t: 'tab', i: t }, p.length - 1)) return
    }
    clearInterval(finishing)
  }, 70)
}
function autoToFound(from: PileRef, k: number) {
  for (let i = 0; i < 4; i++) if (legal(from, k, { t: 'found', i })) { move(from, k, { t: 'found', i }); return true }
  return false
}

function checkWin() {
  if (!allFound.value || won.value) return
  won.value = true
  stopTimer()
  clearInterval(finishing)
  $track?.('game_won', { game: 'solitaire', draw: drawCount.value, seconds: time.value, moves: moves.value })
  nextTick(startBounce)
}

// ---- layout: card size follows the window ----
const board = ref<HTMLElement>()
const cw = ref(71)
const boardH = ref(400)
const ch = computed(() => Math.round(cw.value * 1.42))
const gap = computed(() => Math.max(4, Math.round(cw.value / 8)))
function measure() {
  if (!board.value) return
  const w = board.value.clientWidth
  const h = board.value.clientHeight
  // fit 7 columns across, and two card rows plus a few fanned cards down
  const byW = Math.floor((w - gap.value * 8) / 7)
  const byH = Math.floor((h - gap.value * 4 - 80) / 2 / 1.42)
  cw.value = Math.max(38, Math.min(86, byW, byH))
  boardH.value = h
}
/** vertical offsets in a column; squeezed when the column would not fit */
function offsets(p: Card[]) {
  const downStep = Math.round(ch.value * 0.1)
  let upStep = Math.round(ch.value * 0.27)
  const avail = boardH.value - ch.value * 2 - gap.value * 3
  const downs = p.filter(c => !c.up).length
  const ups = p.length - downs
  if (ups > 1) upStep = Math.max(12, Math.min(upStep, Math.floor((avail - downs * downStep) / (ups - 1))))
  let y = 0
  return p.map((c) => { const at = y; y += c.up ? upStep : downStep; return at })
}
const tabOffsets = computed(() => g.tab.map(offsets))
// draw one keeps the previous card underneath, so it shows while the top one is dragged
const wasteShown = computed(() => g.waste.slice(drawCount.value === 3 ? -3 : -2))

// ---- pointer: tap = auto move, drag = explicit move ----
interface Drag { from: PileRef; k: number; sx: number; sy: number; x: number; y: number; ox: number; oy: number; active: boolean; pid: number }
const drag = ref<Drag | null>(null)
const dragCards = computed(() => (drag.value?.active ? pileOf(drag.value.from).slice(drag.value.k) : []))
const dragIds = computed(() => new Set(dragCards.value.map(c => c.id)))
const pileEls = new Map<string, HTMLElement>()
const setPileEl = (key: string) => (el: unknown) => { if (el) pileEls.set(key, el as HTMLElement); else pileEls.delete(key) }

function down(e: PointerEvent, from: PileRef, k: number) {
  if (e.button !== 0 || won.value) return
  const c = pileOf(from)[k]
  if (!c) return
  if (!c.up) {
    // face-down top card of a column: flip it
    if (from.t === 'tab' && k === pileOf(from).length - 1) { snapshot(); c.up = true }
    return
  }
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  drag.value = { from, k, sx: e.clientX, sy: e.clientY, x: r.left, y: r.top, ox: e.clientX - r.left, oy: e.clientY - r.top, active: false, pid: e.pointerId }
  board.value?.setPointerCapture(e.pointerId)
}
function moveP(e: PointerEvent) {
  const d = drag.value
  if (!d || e.pointerId !== d.pid) return
  if (!d.active && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) d.active = true
  if (d.active) { d.x = e.clientX - d.ox; d.y = e.clientY - d.oy }
}
function up(e: PointerEvent) {
  const d = drag.value
  if (!d || e.pointerId !== d.pid) return
  drag.value = null
  if (!d.active) { autoMove(d.from, d.k); return }
  // drop on the legal pile the dragged card overlaps the most
  const rect = { l: d.x, t: d.y, r: d.x + cw.value, b: d.y + ch.value }
  let bestArea = 0
  let target: PileRef | null = null
  for (const [key, el] of pileEls) {
    const [t, i] = key.split('-') as ['found' | 'tab', string]
    const to = { t, i: Number(i) } as PileRef
    if (!legal(d.from, d.k, to)) continue
    const pr = el.getBoundingClientRect()
    // a column accepts drops anywhere below its top
    const bottom = t === 'tab' ? board.value!.getBoundingClientRect().bottom : pr.bottom
    const area = Math.max(0, Math.min(rect.r, pr.right) - Math.max(rect.l, pr.left)) * Math.max(0, Math.min(rect.b, bottom) - Math.max(rect.t, pr.top))
    if (area > bestArea) { bestArea = area; target = to }
  }
  if (target) move(d.from, d.k, target)
}
function cancel() { drag.value = null }

// ---- win animation: cards bounce off the bottom and leave trails ----
const canvas = ref<HTMLCanvasElement>()
let raf = 0
function stopBounce() { cancelAnimationFrame(raf); raf = 0 }
function startBounce() {
  const cv = canvas.value
  if (!cv || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const W = (cv.width = cv.clientWidth)
  const H = (cv.height = cv.clientHeight)
  const ctx = cv.getContext('2d')!
  const w = cw.value
  const h = ch.value
  const queue = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].flatMap(r => [0, 1, 2, 3].map(s => ({ s, r: r + 1 })))
  let cur: { s: number; r: number; x: number; y: number; vx: number; vy: number } | null = null
  const fx = (s: number) => W - (4 - s) * (w + gap.value) - gap.value
  const step = () => {
    if (!cur) {
      const n = queue.shift()
      if (!n) { raf = 0; return }
      cur = { ...n, x: fx(n.s), y: gap.value, vx: -(2 + Math.random() * 4) * (Math.random() < 0.5 ? 1 : -1), vy: -Math.random() * 6 }
    }
    cur.vy += 0.5
    cur.x += cur.vx
    cur.y += cur.vy
    if (cur.y + h > H) { cur.y = H - h; cur.vy *= -0.78 }
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#333'
    ctx.fillRect(cur.x, cur.y, w, h)
    ctx.strokeRect(cur.x + 0.5, cur.y + 0.5, w - 1, h - 1)
    ctx.fillStyle = cur.s === 1 || cur.s === 2 ? '#d00' : '#000'
    ctx.font = `bold ${Math.round(w * 0.24)}px Arial`
    ctx.fillText(RANKS[cur.r]! + SUITS[cur.s]!, cur.x + 4, cur.y + w * 0.26)
    ctx.font = `${Math.round(w * 0.5)}px Arial`
    ctx.fillText(SUITS[cur.s]!, cur.x + w * 0.3, cur.y + h * 0.65)
    if (cur.x < -w || cur.x > W) cur = null
    raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
}

// status line only on the client: the server renders it empty (no hydration mismatch)
onMounted(() => watchEffect(() => {
  const mm = `${Math.floor(time.value / 60)}:${String(time.value % 60).padStart(2, '0')}`
  status.value = won.value
    ? l({ en: `You won! ${moves.value} moves in ${mm}`, sk: `Vyhral si! ${moves.value} ťahov za ${mm}` })
    : `${l({ en: 'Moves', sk: 'Ťahy' })}: ${moves.value} · ${l({ en: 'Time', sk: 'Čas' })}: ${mm} · ${l({ en: 'Click a card to move it, or drag it', sk: 'Klikni na kartu alebo ju potiahni' })}`
}))

let ro: ResizeObserver | undefined
onMounted(() => {
  deal()
  measure()
  ro = new ResizeObserver(measure)
  ro.observe(board.value!)
})
onBeforeUnmount(() => { stopTimer(); stopBounce(); clearInterval(finishing); ro?.disconnect() })

function setDraw(n: 1 | 3) { drawCount.value = n; deal() }
const cardStyle = (x: number, y: number) => ({ left: `${x}px`, top: `${y}px` })
</script>

<template>
  <div class="sol">
    <div class="menubar gmenu">
      <button type="button" @click="deal">{{ l({ en: 'Deal', sk: 'Rozdať' }) }}</button>
      <button type="button" :disabled="!canUndo" @click="undo">{{ l({ en: 'Undo', sk: 'Späť' }) }}</button>
      <button type="button" :class="{ on: drawCount === 1 }" @click="setDraw(1)">{{ l({ en: 'Draw one', sk: 'Po jednej' }) }}</button>
      <button type="button" :class="{ on: drawCount === 3 }" @click="setDraw(3)">{{ l({ en: 'Draw three', sk: 'Po troch' }) }}</button>
      <button v-if="canFinish" type="button" class="hot" @click="autoFinish">{{ l({ en: 'Finish', sk: 'Dokončiť' }) }}</button>
    </div>
    <div
      ref="board"
      class="board"
      :style="{ '--cw': `${cw}px`, '--ch': `${ch}px`, '--g': `${gap}px` }"
      @pointermove="moveP"
      @pointerup="up"
      @pointercancel="cancel"
    >
      <div class="row">
        <!-- stock -->
        <div class="slot stock" role="button" :aria-label="l({ en: 'Stock', sk: 'Balík' })" @click="drawStock">
          <div v-if="g.stock.length" class="card back" />
          <svg v-else viewBox="0 0 20 20" class="recycle" aria-hidden="true"><circle cx="10" cy="10" r="6" fill="none" stroke="#7fd07f" stroke-width="2.4" /></svg>
        </div>
        <!-- waste (draw three fans the last three) -->
        <div class="slot waste" :class="{ fan: drawCount === 3 }">
          <div
            v-for="(c, n) in wasteShown"
            :key="c.id"
            class="card"
            :class="{ red: red(c), hidden: dragIds.has(c.id), live: n === wasteShown.length - 1 }"
            :style="cardStyle(drawCount === 3 ? n * Math.round(cw * 0.22) : 0, 0)"
            @pointerdown="n === wasteShown.length - 1 && down($event, { t: 'waste' }, g.waste.length - 1)"
          >
            <span class="ix">{{ RANKS[c.r] }}<i>{{ SUITS[c.s] }}</i></span><span class="pip">{{ SUITS[c.s] }}</span><span class="ix b">{{ RANKS[c.r] }}<i>{{ SUITS[c.s] }}</i></span>
          </div>
        </div>
        <div class="spacer" />
        <div v-for="(f, i) in g.found" :key="`f${i}`" :ref="setPileEl(`found-${i}`)" class="slot found">
          <span class="ghost">{{ SUITS[i] }}</span>
          <div
            v-if="f.length"
            class="card"
            :class="{ red: red(top(f)!), hidden: dragIds.has(top(f)!.id) }"
            @pointerdown="down($event, { t: 'found', i }, f.length - 1)"
          >
            <span class="ix">{{ RANKS[top(f)!.r] }}<i>{{ SUITS[top(f)!.s] }}</i></span><span class="pip">{{ SUITS[top(f)!.s] }}</span><span class="ix b">{{ RANKS[top(f)!.r] }}<i>{{ SUITS[top(f)!.s] }}</i></span>
          </div>
          <!-- card under the dragged one stays visible -->
          <div v-if="f.length > 1 && dragIds.has(top(f)!.id)" class="card under" :class="{ red: red(f[f.length - 2]!) }">
            <span class="ix">{{ RANKS[f[f.length - 2]!.r] }}<i>{{ SUITS[f[f.length - 2]!.s] }}</i></span><span class="pip">{{ SUITS[f[f.length - 2]!.s] }}</span>
          </div>
        </div>
      </div>
      <div class="row tab">
        <div v-for="(p, i) in g.tab" :key="`t${i}`" :ref="setPileEl(`tab-${i}`)" class="slot col">
          <div
            v-for="(c, k) in p"
            :key="c.id"
            class="card"
            :class="{ back: !c.up, red: c.up && red(c), hidden: dragIds.has(c.id) }"
            :style="cardStyle(0, tabOffsets[i]![k]!)"
            @pointerdown="down($event, { t: 'tab', i }, k)"
          >
            <template v-if="c.up">
              <span class="ix">{{ RANKS[c.r] }}<i>{{ SUITS[c.s] }}</i></span><span class="pip">{{ SUITS[c.s] }}</span><span class="ix b">{{ RANKS[c.r] }}<i>{{ SUITS[c.s] }}</i></span>
            </template>
          </div>
        </div>
      </div>
      <canvas v-show="won" ref="canvas" class="bounce" @click="stopBounce" />
      <div v-if="won" class="won">
        <p>{{ l({ en: 'You won!', sk: 'Vyhral si!' }) }}</p>
        <button type="button" @click="deal">{{ l({ en: 'Deal again', sk: 'Rozdať znova' }) }}</button>
      </div>
    </div>
    <!-- dragged cards follow the pointer -->
    <div v-if="drag?.active" class="dragging" :style="{ left: `${drag.x}px`, top: `${drag.y}px`, '--cw': `${cw}px`, '--ch': `${ch}px` }">
      <div
        v-for="(c, n) in dragCards"
        :key="c.id"
        class="card"
        :class="{ red: red(c) }"
        :style="cardStyle(0, n * Math.round(ch * 0.27))"
      >
        <span class="ix">{{ RANKS[c.r] }}<i>{{ SUITS[c.s] }}</i></span><span class="pip">{{ SUITS[c.s] }}</span><span class="ix b">{{ RANKS[c.r] }}<i>{{ SUITS[c.s] }}</i></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sol { height: 100%; display: flex; flex-direction: column; user-select: none; -webkit-user-select: none; }
.board {
  position: relative; flex: 1; min-height: 0; overflow: hidden; padding: var(--g); touch-action: none;
  background: radial-gradient(ellipse at 50% 30%, #12922a, #0a7420 70%, #075e19);
  display: flex; flex-direction: column; gap: calc(var(--g) * 1.5);
}
.row { display: flex; gap: var(--g); }
.spacer { width: var(--cw); flex: none; }
.slot { position: relative; width: var(--cw); height: var(--ch); flex: none; border-radius: calc(var(--cw) / 14); }
.stock, .found, .waste:empty, .col:empty { box-shadow: inset 0 0 0 1px rgba(255,255,255,.35); background: rgba(0,0,0,.08); }
.stock { cursor: pointer; display: grid; place-items: center; }
.recycle { width: 50%; }
.found .ghost { position: absolute; inset: 0; display: grid; place-items: center; font-size: calc(var(--cw) * .5); color: rgba(255,255,255,.25); }
.col { height: auto; min-height: var(--ch); }
.tab { flex: 1; }

.card {
  position: absolute; left: 0; top: 0; width: var(--cw); height: var(--ch); box-sizing: border-box;
  background: #fff; color: #000; border: 1px solid #555; border-radius: calc(var(--cw) / 14);
  box-shadow: 0 1px 1px rgba(0,0,0,.3); cursor: pointer; touch-action: none;
  font-family: Arial, Helvetica, sans-serif;
}
.card.red { color: #d00; }
.card.hidden { visibility: hidden; }
.card.under { z-index: -1; }
.card .ix { position: absolute; left: 3px; top: 2px; display: flex; flex-direction: column; align-items: center; font-weight: bold; font-size: calc(var(--cw) * .22); line-height: 1; }
.card .ix i { font-style: normal; font-size: .9em; }
.card .ix.b { left: auto; top: auto; right: 3px; bottom: 2px; transform: rotate(180deg); }
.card .pip { position: absolute; inset: 0; display: grid; place-items: center; font-size: calc(var(--cw) * .5); padding-top: 10%; }
/* original card back: blue lattice with a small JP monogram */
.card.back {
  cursor: default; border-color: #fff; box-shadow: 0 0 0 1px #555, 0 1px 1px rgba(0,0,0,.3);
  background:
    radial-gradient(circle at 50% 50%, #fff 0 calc(var(--cw) * .13), transparent calc(var(--cw) * .13 + 1px)),
    repeating-linear-gradient(45deg, transparent 0 4px, rgba(255,255,255,.22) 4px 5px),
    repeating-linear-gradient(-45deg, transparent 0 4px, rgba(255,255,255,.22) 4px 5px),
    linear-gradient(160deg, #3b74e8, #1d4fc4);
}
.card.back::after { content: 'J'; position: absolute; inset: 0; display: grid; place-items: center; font: bold italic calc(var(--cw) * .2) var(--title); color: #1d4fc4; }
.col .card.back:last-child { cursor: pointer; }
.waste .card:not(.live) { cursor: default; }
.dragging { position: fixed; z-index: 30000; pointer-events: none; }
.dragging .card { box-shadow: 2px 4px 8px rgba(0,0,0,.45); }
.bounce { position: absolute; inset: 0; width: 100%; height: 100%; cursor: pointer; }
.won { position: absolute; left: 50%; bottom: 14px; transform: translateX(-50%); background: #ffffe1; border: 1px solid #000; padding: 8px 12px; text-align: center; box-shadow: 2px 2px 6px rgba(0,0,0,.4); }
.won p { margin: 0 0 6px; font-weight: bold; }
.gmenu .hot { color: #0a246a; font-weight: bold; }
</style>
