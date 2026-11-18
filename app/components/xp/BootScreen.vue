<script setup lang="ts">
// Boot intro: BIOS POST text -> XP-style loader -> "welcome" -> desktop.
// ~6 s total, skippable with any key / click / tap. First visit only (useBoot).
const emit = defineEmits<{ done: [] }>()
const { t, tm, rt } = useI18n()
const { year, years } = useCareer()

type Phase = 'bios' | 'loader' | 'welcome'
const phase = ref<Phase>('bios')
const shown = ref(0)
const lines = computed(() => (tm('boot_bios_lines') as unknown[]).map(m => rt(m as never, { year, years })))
const reduced = import.meta.client && matchMedia('(prefers-reduced-motion: reduce)').matches

const timers: ReturnType<typeof setTimeout>[] = []
const later = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms))

function finish() {
  timers.forEach(clearTimeout)
  document.documentElement.classList.remove('boot-pending')
  emit('done')
}

onMounted(() => {
  document.documentElement.classList.remove('boot-pending')
  if (reduced) { shown.value = lines.value.length; later(1500, finish); return }
  // print BIOS lines one by one
  let ms = 250
  lines.value.forEach((_, i) => {
    ms += lines.value[i] ? 140 : 70
    later(ms, () => { shown.value = i + 1 })
  })
  later(ms + 700, () => { phase.value = 'loader' })
  later(ms + 700 + 2600, () => { phase.value = 'welcome' })
  later(ms + 700 + 2600 + 1300, finish)
  window.addEventListener('keydown', finish, { once: true })
})
onBeforeUnmount(() => {
  timers.forEach(clearTimeout)
  window.removeEventListener('keydown', finish)
})
</script>

<template>
  <div class="boot" :class="phase" role="status" aria-live="polite" @click="finish">
    <div v-if="phase === 'bios'" class="bios">
      <div class="bios-logo" aria-hidden="true"><XpStartFlag /><span>Energy<br>Jurgo</span></div>
      <pre><template v-for="(line, i) in lines.slice(0, shown)" :key="i">{{ line }}
</template><span class="cursor">_</span></pre>
      <p class="bios-foot">{{ t('boot_skip') }}</p>
    </div>

    <div v-else-if="phase === 'loader'" class="loader">
      <div class="brand">
        <small>Juraj Paluš</small>
        <div class="word"><XpStartFlag /><span>Jurgo</span><sup>xp</sup></div>
        <em>Professional</em>
      </div>
      <div class="bar" aria-hidden="true"><i /><i /><i /></div>
      <p class="copy">{{ t('boot_copyright') }}</p>
      <p class="skip">{{ t('boot_skip') }}</p>
    </div>

    <div v-else class="welcome">
      <span>{{ t('welcome') }}</span>
    </div>
  </div>
</template>
