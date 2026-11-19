<script setup lang="ts">
// Idle screensaver: a floating logo that fades out and reappears somewhere else.
// Any mouse move, key or tap closes it.
const emit = defineEmits<{ close: [] }>()
const { l } = useL10n()

const pos = ref({ x: 30, y: 30 })
const shown = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

function jump() {
  pos.value = { x: 5 + Math.random() * 60, y: 8 + Math.random() * 70 }
  shown.value = true
  timer = setTimeout(() => {
    shown.value = false
    timer = setTimeout(jump, 1300)
  }, 6000)
}

let origin: { x: number; y: number } | null = null
function onMove(e: PointerEvent) {
  // ignore the tiny jitter some mice report right after the saver shows up
  if (!origin) { origin = { x: e.clientX, y: e.clientY }; return }
  if (Math.hypot(e.clientX - origin.x, e.clientY - origin.y) > 8) emit('close')
}
const close = () => emit('close')

onMounted(() => {
  timer = setTimeout(jump, 400)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('keydown', close)
  window.addEventListener('pointerdown', close)
  window.addEventListener('wheel', close)
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('keydown', close)
  window.removeEventListener('pointerdown', close)
  window.removeEventListener('wheel', close)
})
</script>

<template>
  <div class="saver" aria-hidden="true">
    <div class="logo" :class="{ on: shown }" :style="{ left: `${pos.x}%`, top: `${pos.y}%` }">
      <XpStartFlag />
      <div>
        <b>Jurgo<span>XP</span></b>
        <small>{{ l({ en: 'Professional · open to work', sk: 'Professional · otvorený novej práci' }) }}</small>
      </div>
    </div>
  </div>
</template>

<style scoped>
.saver { position: fixed; inset: 0; z-index: 20000; background: #000; cursor: none; animation: in .6s ease; }
@keyframes in { from { opacity: 0; } }
.logo { position: absolute; display: flex; align-items: center; gap: 14px; opacity: 0; transition: opacity 1.2s ease; color: #fff; }
.logo.on { opacity: 1; }
.logo svg { width: 64px; height: 64px; }
.logo b { display: block; font: bold italic 38px/1 var(--title); letter-spacing: -.5px; }
.logo b span { color: #f60; font-size: .6em; vertical-align: super; margin-left: 2px; }
.logo small { display: block; margin-top: 4px; font: 13px var(--ui); color: #bbb; }
@media (prefers-reduced-motion: reduce) { .logo { transition: none; } }
</style>
