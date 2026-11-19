<script setup lang="ts">
import { appById } from '~/data/apps'
import { useWindowsStore } from '~/stores/windows'

const store = useWindowsStore()
const { t } = useI18n()
const { wallpaper, load } = useWallpaper()
const { replay, booting } = useBoot()

const startOpen = ref(false)
const balloon = ref(false)
const display = ref(false)
const ctx = ref<{ x: number; y: number } | null>(null)
const icons = ref<{ clear(): void }>()
const bsod = useState('bsod', () => false)
const saver = ref(false)

// Screensaver after a few idle minutes, like XP. Desktop only: phones lock themselves.
const IDLE_MS = 3 * 60_000
let idleTimer: ReturnType<typeof setTimeout> | undefined
function armIdle() {
  clearTimeout(idleTimer)
  idleTimer = setTimeout(() => {
    if (!booting.value && !bsod.value && document.visibilityState === 'visible') saver.value = true
  }, IDLE_MS)
}
const idleEvents = ['pointermove', 'pointerdown', 'keydown', 'wheel'] as const
function previewSaver() {
  display.value = false
  saver.value = true
}
function closeSaver() {
  saver.value = false
  armIdle()
}
function afterBsod() {
  bsod.value = false
  store.close('recycle-bin')
  replay()
}

const windows = computed(() => store.windows.filter(w => appById(w.id)?.kind !== 'webamp'))
const musicOpen = computed(() => store.isOpen('music'))

function closeMenus() {
  startOpen.value = false
  ctx.value = null
}
function onDesktopDown(e: PointerEvent) {
  if ((e.target as HTMLElement).classList.contains('desktop')) icons.value?.clear()
}
function onContext(e: MouseEvent) {
  if (!(e.target as HTMLElement).classList.contains('desktop')) return
  e.preventDefault()
  ctx.value = { x: e.clientX, y: e.clientY }
}
function openDisplay() {
  closeMenus()
  balloon.value = false
  display.value = true
}
function onResize() { store.setDesk(window.innerWidth, window.innerHeight) }
function onKey(e: KeyboardEvent) { if (e.key === 'Escape') closeMenus() }

let balloonTimer: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  load()
  onResize()
  window.addEventListener('resize', onResize)
  document.addEventListener('keydown', onKey)
  if (!matchMedia('(max-width: 700px), (pointer: coarse)').matches) {
    for (const ev of idleEvents) window.addEventListener(ev, armIdle, { passive: true })
    armIdle()
  }
  // balloon tip ~1.5 s after the desktop is actually visible (not on phones)
  if (!matchMedia('(max-width: 700px)').matches) {
    const schedule = () => { balloonTimer = setTimeout(() => { balloon.value = true }, 1500) }
    nextTick(() => {
      if (!booting.value) schedule()
      else { const stop = watch(booting, (v) => { if (!v) { stop(); schedule() } }) }
    })
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  document.removeEventListener('keydown', onKey)
  clearTimeout(balloonTimer)
  clearTimeout(idleTimer)
  for (const ev of idleEvents) window.removeEventListener(ev, armIdle)
})
</script>

<template>
  <div class="xp-root" @click="closeMenus">
    <main
      class="desktop"
      :style="{ backgroundImage: `url(${wallpaper})` }"
      @pointerdown="onDesktopDown"
      @contextmenu="onContext"
    >
      <h1 class="sr-only">Juraj Paluš – {{ t('meta_title') }}</h1>
      <XpDesktopIcons ref="icons" />
      <XpWindow v-for="w in windows" :id="w.id" :key="w.id">
        <XpAppContent :id="w.id" />
        <template #status><XpAppStatus :id="w.id" /></template>
      </XpWindow>
      <XpWebampHost v-if="musicOpen" />
    </main>

    <div v-if="ctx" class="ctx" :style="{ left: `${ctx.x}px`, top: `${ctx.y}px` }" @click.stop>
      <button @click="openDisplay">{{ t('start_wallpaper') }}…</button>
      <button @click="closeMenus(); replay()">{{ t('restart') }}</button>
    </div>

    <XpDisplayDialog v-if="display" @close="display = false" @screensaver="previewSaver" />
    <XpStartMenu v-if="startOpen" @close="startOpen = false" @wallpaper="openDisplay" @restart="closeMenus(); replay()" />

    <div v-if="balloon" class="balloon" role="status" @click.stop>
      <button class="x" :aria-label="t('close')" @click="balloon = false">×</button>
      <b>
        <svg viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="7.5" fill="#0054e3" /><text x="8" y="12" font-size="11" font-weight="bold" text-anchor="middle" fill="#fff" font-family="Georgia,serif">i</text></svg>
        {{ t('balloon_title') }}
      </b>
      <p>{{ t('balloon_text') }} {{ t('balloon_hint') }}</p>
      <div class="row">
        <NuxtLinkLocale to="/cv"><button>{{ t('classic_view') }}</button></NuxtLinkLocale>
        <button @click="openDisplay">{{ t('start_wallpaper') }}</button>
      </div>
    </div>

    <LazyXpScreensaver v-if="saver" @close="closeSaver" />
    <LazyXpBlueScreen v-if="bsod" @done="afterBsod" />

    <XpTaskbar :start-open="startOpen" @toggle-start="startOpen = !startOpen; ctx = null" @toggle-balloon="balloon = !balloon" />
  </div>
</template>
