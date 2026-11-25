<script setup lang="ts">
import { desktopItems, appById } from '~/data/apps'
import { cvPdf } from '~/data/profile'

const { l, locale } = useL10n()
const { t } = useI18n()
const { pathFor } = useApps()
const localePath = useLocalePath()
const selected = ref<string | null>(null)

const items = computed(() => desktopItems.map((it) => {
  if (it.type === 'app') {
    const a = appById(it.id)!
    return { key: it.id, icon: a.icon, label: l(a.label), to: pathFor(it.id), external: false, phoneOnly: !!it.phoneOnly }
  }
  if (it.key === 'portfolio') return { key: 'portfolio', icon: it.icon, label: l(it.label), to: 'https://jurgo.japs.app', external: true }
  return it.key === 'cv'
    ? { key: 'cv', icon: it.icon, label: l(it.label), to: cvPdf(locale.value), external: true }
    : { key: 'classic', icon: it.icon, label: l(it.label), to: localePath('/cv'), external: false }
}))

type Item = (typeof items.value)[number]
const coarse = () => matchMedia('(max-width: 700px), (pointer: coarse)').matches

const { $track } = useNuxtApp()
function go(it: Item) {
  if (it.external) {
    // desktop icons open on double-click, so the global link-click tracking skips them
    if (it.key === 'cv') $track?.('cv_download', { file: it.to.split('/').pop()!, role: 'general', lang: locale.value, from: 'desktop-icon' })
    else $track?.('portfolio_open', { from: 'desktop-icon' })
    window.open(it.to, '_blank', 'noopener')
  }
  else navigateTo(it.to)
}
// XP behaviour: click selects, double-click opens. Touch / phone: tap opens.
function onClick(it: Item) {
  selected.value = it.key
  if (coarse()) go(it)
}
defineExpose({ clear: () => { selected.value = null } })
</script>

<template>
  <ul class="icons" :aria-label="t('desktop_label')">
    <li v-for="it in items" :key="it.key" :class="{ 'phone-only': 'phoneOnly' in it && it.phoneOnly }">
      <a
        class="icon"
        :class="{ sel: selected === it.key }"
        :href="it.to"
        @click.prevent="onClick(it)"
        @dblclick.prevent="go(it)"
        @keydown.enter.prevent="go(it)"
      >
        <img :src="it.icon" alt="" width="40" height="40">
        <span>{{ it.label }}</span>
      </a>
    </li>
  </ul>
</template>
