<script setup lang="ts">
import { appById } from '~/data/apps'
import { useWindowsStore } from '~/stores/windows'

defineProps<{ startOpen: boolean }>()
const emit = defineEmits<{ toggleStart: []; toggleBalloon: [] }>()
const store = useWindowsStore()
const { l, locale } = useL10n()
const { t } = useI18n()
const { titleFor } = useApps()
const switchLocalePath = useSwitchLocalePath()

const clock = ref('')
let timer: ReturnType<typeof setInterval> | undefined
function tick() {
  clock.value = new Date().toLocaleTimeString(locale.value === 'sk' ? 'sk-SK' : 'en-GB', { hour: '2-digit', minute: '2-digit' })
}
onMounted(() => { tick(); timer = setInterval(tick, 15000) })
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="taskbar">
    <button class="start-btn" :class="{ down: startOpen }" aria-haspopup="menu" :aria-expanded="startOpen" @click.stop="emit('toggleStart')">
      <XpStartFlag />{{ t('start') }}
    </button>
    <nav class="tasks" aria-label="Taskbar">
      <button
        v-for="w in store.windows"
        :key="w.id"
        class="task"
        :class="{ on: store.active === w.id }"
        :title="titleFor(w.id)"
        @click="store.taskbarClick(w.id)"
      >
        <img :src="appById(w.id)!.icon" alt=""><span>{{ titleFor(w.id) }}</span>
      </button>
    </nav>
    <div class="tray">
      <NuxtLink class="lang" :to="switchLocalePath(locale === 'sk' ? 'en' : 'sk')" :title="t('language')">
        {{ locale === 'sk' ? 'SK' : 'EN' }}
      </NuxtLink>
      <button class="hide-s" :title="t('balloon_title')" @click.stop="emit('toggleBalloon')">
        <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#fff" /><text x="8" y="12" font-size="11" font-weight="bold" text-anchor="middle" fill="#0054e3" font-family="Georgia,serif">i</text></svg>
      </button>
      <span class="clock">{{ clock }}</span>
    </div>
  </div>
</template>
