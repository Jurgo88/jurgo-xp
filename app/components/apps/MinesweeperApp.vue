<script setup lang="ts">
import { useWindowsStore } from '~/stores/windows'

// Minesweeper, written from scratch. Mines are placed on the first click
// (never under it), so the SSR render is just an empty board and there is no
// hydration mismatch.

type Level = 'beginner' | 'intermediate' | 'expert'
const LEVELS: Record<Level, { w: number; h: number; m: number; label: { en: string; sk: string } }> = {
  beginner: { w: 9, h: 9, m: 10, label: { en: 'Beginner', sk: 'Začiatočník' } },
  intermediate: { w: 16, h: 16, m: 40, label: { en: 'Intermediate', sk: 'Pokročilý' } },
  expert: { w: 30, h: 16, m: 99, label: { en: 'Expert', sk: 'Expert' } },
}
const BEST_KEY = 'jurgoxp:mines-best'

interface Cell { mine: boolean; open: boolean; flag: 0 | 1 | 2; n: number; boom?: boolean; wrong?: boolean }

const { l } = useL10n()
const store = useWindowsStore()
const { $track } = useNuxtApp()
const status = useState<string>('status-minesweeper', () => '')

const level = ref<Level>('beginner')
// phones get wide boards (Expert 30x16) turned upright (16x30) so the cells stay big enough to tap
const upright = ref(false)
const cfg = computed(() => {
  const c = LEVELS[level.value]
  return upright.value && c.w > c.h ? { ...c, w: c.h, h: c.w } : c
})
const cells = ref<Cell[]>([])
const state = ref<'ready' | 'playing' | 'won' | 'lost'>('ready')
const time = ref(0)
const pressing = ref(false)
const flagMode = ref(false)
const best = ref<Partial<Record<Level, number>>>({})
const newBest = ref(false)

const flags = computed(() => cells.value.filter(c => c.flag === 1).length)
const left = computed(() => cfg.value.m - flags.value)
const face = computed(() => state.value === 'won' ? 'cool' : state.value === 'lost' ? 'dead' : pressing.value ? 'oh' : 'smile')
const lcd = (n: number) => (n < 0 ? `-${String(-n).padStart(2, '0')}` : String(Math.min(n, 999)).padStart(3, '0'))

let timer: ReturnType<typeof setInterval> | undefined
function stopTimer() { clearInterval(timer); timer = undefined }

function reset() {
  stopTimer()
  const { w, h } = cfg.value
  cells.value = Array.from({ length: w * h }, () => ({ mine: false, open: false, flag: 0, n: 0 }))
  state.value = 'ready'
  time.value = 0
  newBest.value = false
}

function neighbours(i: number) {
  const { w, h } = cfg.value
  const x = i % w
  const y = (i - x) / w
  const out: number[] = []
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue
      const nx = x + dx
      const ny = y + dy
      if (nx >= 0 && ny >= 0 && nx < w && ny < h) out.push(ny * w + nx)
    }
  }
  return out
}

function placeMines(safe: number) {
  const forbidden = new Set([safe, ...neighbours(safe)])
  const free = cells.value.map((_, i) => i).filter(i => !forbidden.has(i))
  for (let k = 0; k < cfg.value.m; k++) {
    const j = k + Math.floor(Math.random() * (free.length - k))
    ;[free[k], free[j]] = [free[j]!, free[k]!]
    cells.value[free[k]!]!.mine = true
  }
  cells.value.forEach((c, i) => { c.n = neighbours(i).filter(j => cells.value[j]!.mine).length })
}

function start(i: number) {
  placeMines(i)
  state.value = 'playing'
  time.value = 1
  timer = setInterval(() => { if (time.value < 999) time.value++ }, 1000)
}

function open(i: number) {
  const c = cells.value[i]!
  if (c.open || c.flag === 1) return
  if (c.mine) return lose(i)
  // flood fill the empty area
  const stack = [i]
  while (stack.length) {
    const j = stack.pop()!
    const d = cells.value[j]!
    if (d.open || d.flag === 1) continue
    d.open = true
    d.flag = 0
    if (d.n === 0) stack.push(...neighbours(j).filter(k => !cells.value[k]!.open))
  }
  checkWin()
}

function lose(i: number) {
  stopTimer()
  state.value = 'lost'
  cells.value[i]!.boom = true
  for (const c of cells.value) {
    if (c.mine && c.flag !== 1) c.open = true
    if (!c.mine && c.flag === 1) c.wrong = true
  }
}

function checkWin() {
  const safe = cells.value.length - cfg.value.m
  if (cells.value.filter(c => c.open).length !== safe) return
  stopTimer()
  state.value = 'won'
  for (const c of cells.value) if (c.mine) c.flag = 1
  const prev = best.value[level.value]
  if (!prev || time.value < prev) {
    best.value = { ...best.value, [level.value]: time.value }
    newBest.value = true
    try { localStorage.setItem(BEST_KEY, JSON.stringify(best.value)) } catch { /* ignore */ }
  }
  $track?.('game_won', { game: 'minesweeper', level: level.value, seconds: time.value })
}

/** clicking an opened number with the right amount of flags around opens the rest */
function chord(i: number) {
  const c = cells.value[i]!
  const around = neighbours(i)
  if (around.filter(j => cells.value[j]!.flag === 1).length !== c.n) return
  for (const j of around) {
    if (state.value !== 'playing') return
    open(j)
  }
}

function reveal(i: number) {
  if (state.value === 'won' || state.value === 'lost') return
  const c = cells.value[i]!
  if (state.value === 'ready') start(i)
  if (c.open) chord(i)
  else open(i)
}

function toggleFlag(i: number) {
  if (state.value === 'won' || state.value === 'lost') return
  const c = cells.value[i]!
  if (c.open) return
  c.flag = c.flag === 0 ? 1 : c.flag === 1 ? 2 : 0
}

// ---- input: mouse (left = open, right = flag) and touch (tap = open, long press = flag) ----
const cellAt = (e: Event) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-i]')
  return el ? Number(el.dataset.i) : -1
}
let longPress: ReturnType<typeof setTimeout> | undefined
let longFired = false
let lastPointer = 'mouse'
let downAt = -1

function onDown(e: PointerEvent) {
  lastPointer = e.pointerType
  const i = cellAt(e)
  if (i < 0 || e.button !== 0) return
  downAt = i
  longFired = false
  if (state.value === 'ready' || state.value === 'playing') pressing.value = true
  if (e.pointerType !== 'mouse') {
    clearTimeout(longPress)
    longPress = setTimeout(() => {
      longFired = true
      pressing.value = false
      toggleFlag(i)
      navigator.vibrate?.(30)
    }, 420)
  }
}
function onUp(e: PointerEvent) {
  clearTimeout(longPress)
  pressing.value = false
  const i = cellAt(e)
  if (e.button !== 0 || longFired || i < 0 || i !== downAt) return
  downAt = -1
  if (flagMode.value && !cells.value[i]!.open) toggleFlag(i)
  else reveal(i)
}
function onCancel() {
  clearTimeout(longPress)
  pressing.value = false
  downAt = -1
}
function onContext(e: MouseEvent) {
  e.preventDefault()
  // touch long press already flagged via the timer (some browsers also fire contextmenu)
  if (lastPointer !== 'mouse') return
  const i = cellAt(e)
  if (i >= 0) toggleFlag(i)
}

// ---- layout: fixed cell size on desktop (window is fitted to the board), fill the width on phones ----
const root = ref<HTMLElement>()
const game = ref<HTMLElement>()
const cell = ref(22)
const isPhone = () => matchMedia('(max-width: 700px)').matches

function layout() {
  if (!root.value) return
  if (isPhone()) {
    const avail = root.value.clientWidth - 30
    cell.value = Math.max(14, Math.min(36, Math.floor(avail / cfg.value.w)))
    return
  }
  cell.value = 22
  nextTick(() => {
    const win = store.get('minesweeper')
    const body = root.value?.closest<HTMLElement>('.window-body')
    if (!win || !body || !game.value || win.maximized) return
    const menu = root.value!.querySelector<HTMLElement>('.gmenu')
    const needW = Math.max(game.value.offsetWidth + 24, (menu?.scrollWidth ?? 0) + 2)
    const needH = (menu?.offsetHeight ?? 0) + game.value.offsetHeight + 22
    store.resize('minesweeper', win.w + needW - body.clientWidth, win.h + needH - body.clientHeight)
    store.clamp(win)
  })
}

watch(state, (s, prev) => { if (s === 'won' || s === 'lost' || prev === 'won' || prev === 'lost') layout() })

function setLevel(lv: Level) {
  level.value = lv
  upright.value = isPhone()
  reset()
  layout()
}

// status line only on the client: the server renders it empty (no hydration mismatch)
onMounted(() => watchEffect(() => {
  const hint = l(flagMode.value
    ? { en: 'Flag mode: tap marks a mine', sk: 'Režim vlajok: ťuknutie označí mínu' }
    : { en: 'Right-click or long-press to flag a mine', sk: 'Pravý klik alebo podržanie = vlajka' })
  const b = best.value[level.value]
  status.value = b ? `${hint} · ${l({ en: 'Best', sk: 'Rekord' })}: ${b} s` : hint
}))

let ro: ResizeObserver | undefined
onMounted(() => {
  try { best.value = JSON.parse(localStorage.getItem(BEST_KEY) || '{}') } catch { /* ignore */ }
  layout()
  ro = new ResizeObserver(() => { if (isPhone()) layout() })
  ro.observe(root.value!)
})
onBeforeUnmount(() => { stopTimer(); clearTimeout(longPress); ro?.disconnect() })
reset()
</script>

<template>
  <div ref="root" class="ms">
    <div class="menubar gmenu">
      <button type="button" @click="reset">{{ l({ en: 'New', sk: 'Nová hra' }) }}</button>
      <button v-for="(lv, key) in LEVELS" :key="key" type="button" :class="{ on: level === key }" @click="setLevel(key)">
        {{ l(lv.label) }}
      </button>
    </div>
    <div ref="game" class="ms-game" :style="{ '--c': `${cell}px` }">
      <div class="ms-head">
        <span class="lcd" :aria-label="l({ en: 'Mines left', sk: 'Zostáva mín' })">{{ lcd(left) }}</span>
        <button type="button" class="ms-face" :aria-label="l({ en: 'New game', sk: 'Nová hra' })" @click="reset">
          <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
            <circle cx="10" cy="10" r="8.5" fill="#ff0" stroke="#000" />
            <template v-if="face === 'dead'">
              <path d="M5.5 6l3 3m0-3l-3 3M11.5 6l3 3m0-3l-3 3" stroke="#000" stroke-width="1.2" />
              <path d="M6.5 14.5q3.5-3 7 0" fill="none" stroke="#000" stroke-width="1.2" />
            </template>
            <template v-else-if="face === 'cool'">
              <path d="M3.5 7.5h13M4.5 7.5l1 2.5h3l1-2.5M10.5 7.5l1 2.5h3l1-2.5" fill="#000" stroke="#000" stroke-width="1" />
              <path d="M6 12.5q4 3 8 0" fill="none" stroke="#000" stroke-width="1.2" />
            </template>
            <template v-else>
              <circle cx="7" cy="8" r="1.2" /><circle cx="13" cy="8" r="1.2" />
              <circle v-if="face === 'oh'" cx="10" cy="13.5" r="2" fill="none" stroke="#000" stroke-width="1.2" />
              <path v-else d="M6 12q4 3.5 8 0" fill="none" stroke="#000" stroke-width="1.2" />
            </template>
          </svg>
        </button>
        <span class="lcd" :aria-label="l({ en: 'Time', sk: 'Čas' })">{{ lcd(time) }}</span>
      </div>
      <div
        class="ms-grid"
        :class="{ over: state === 'won' || state === 'lost' }"
        :style="{ gridTemplateColumns: `repeat(${cfg.w}, var(--c))` }"
        @pointerdown="onDown"
        @pointerup="onUp"
        @pointercancel="onCancel"
        @pointerleave="onCancel"
        @contextmenu="onContext"
      >
        <div
          v-for="(c, i) in cells"
          :key="i"
          :data-i="i"
          class="ms-c"
          :class="[c.open ? `o n${c.mine ? 'm' : c.n}` : '', { boom: c.boom, wrong: c.wrong }]"
        >
          <template v-if="c.open && c.mine">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v12M2 8h12M4 4l8 8M12 4l-8 8" stroke="#000" stroke-width="1.4" /><circle cx="8" cy="8" r="4.2" /><rect x="5.8" y="5.8" width="1.8" height="1.8" fill="#fff" /></svg>
          </template>
          <template v-else-if="c.open">{{ c.n || '' }}</template>
          <svg v-else-if="c.flag === 1" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v8" stroke="#000" stroke-width="1.4" /><path d="M8.6 2.5 3.5 5.2l5.1 2.6z" fill="#f00" /><path d="M4.5 13h7v-1.2h-2l-1-1h-1l-1 1h-2z" /></svg>
          <template v-else-if="c.flag === 2">?</template>
          <svg v-if="c.wrong" class="x" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3 3 13" stroke="#f00" stroke-width="1.6" /></svg>
        </div>
      </div>
      <p v-if="state === 'won' || state === 'lost'" class="ms-msg" role="status">
        <template v-if="state === 'won'">
          {{ l({ en: `Cleared in ${time} s!`, sk: `Vyčistené za ${time} s!` }) }}
          <b v-if="newBest">{{ l({ en: 'New record.', sk: 'Nový rekord.' }) }}</b>
        </template>
        <template v-else>{{ l({ en: 'Boom. Click the face to try again.', sk: 'Bum. Klikni na smajlíka a skús znova.' }) }}</template>
      </p>
    </div>
    <button type="button" class="ms-flagmode" :class="{ on: flagMode }" @click="flagMode = !flagMode">
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 3v8" stroke="#000" stroke-width="1.4" /><path d="M8.6 2.5 3.5 5.2l5.1 2.6z" fill="#f00" /><path d="M4.5 13h7v-1.2h-2l-1-1h-1l-1 1h-2z" /></svg>
      {{ l({ en: 'Flag mode', sk: 'Režim vlajok' }) }}
    </button>
  </div>
</template>

<style scoped>
.ms { min-height: 100%; background: var(--face); display: flex; flex-direction: column; align-items: center; user-select: none; -webkit-user-select: none; }
.gmenu { align-self: stretch; white-space: nowrap; }
.ms-game {
  margin: 10px; padding: 6px; background: #c0c0c0;
  border: 3px solid; border-color: #fff #808080 #808080 #fff;
}
.ms-head {
  display: flex; justify-content: space-between; align-items: center; padding: 4px 5px; margin-bottom: 6px;
  border: 2px solid; border-color: #808080 #fff #fff #808080;
}
.lcd {
  background: #000; color: #f00; font: bold 22px/1 'Courier New', monospace; padding: 1px 2px; letter-spacing: 1px;
  border: 1px solid; border-color: #808080 #fff #fff #808080; min-width: 3ch; text-align: center;
}
.ms-face {
  all: unset; width: 26px; height: 26px; display: grid; place-items: center; cursor: pointer; background: #c0c0c0;
  border: 2px solid; border-color: #fff #808080 #808080 #fff;
}
.ms-face:active { border-color: #808080 #fff #fff #808080; }
.ms-grid {
  display: grid; grid-auto-rows: var(--c); touch-action: manipulation;
  border: 3px solid; border-color: #808080 #fff #fff #808080;
}
.ms-c {
  position: relative; display: grid; place-items: center; box-sizing: border-box; background: #c0c0c0; cursor: default;
  border: max(2px, calc(var(--c) / 9)) solid; border-color: #fff #808080 #808080 #fff;
  font: bold calc(var(--c) * .62) / 1 Tahoma, Verdana, sans-serif;
  -webkit-touch-callout: none;
}
.ms-grid:not(.over) .ms-c:not(.o):active { border: 1px solid #808080; border-width: 1px 0 0 1px; }
.ms-c.o { border: 0; border-left: 1px solid #808080; border-top: 1px solid #808080; }
.ms-c.boom { background: #f00; }
.ms-c svg { width: 70%; height: 70%; }
.ms-c .x { position: absolute; inset: 15%; }
.n1 { color: #0000ff; } .n2 { color: #008000; } .n3 { color: #ff0000; } .n4 { color: #000080; }
.n5 { color: #800000; } .n6 { color: #008080; } .n7 { color: #000; } .n8 { color: #808080; }
.ms-msg { width: 0; min-width: 100%; margin: 6px 0 0; text-align: center; font-size: 11px; }
.ms-flagmode { display: none; align-items: center; gap: 6px; margin: 0 0 12px; }
.ms-flagmode.on { box-shadow: inset 1px 1px 2px #555; background: #fff8c4; }
@media (pointer: coarse), (max-width: 700px) { .ms-flagmode { display: inline-flex; } }
</style>
