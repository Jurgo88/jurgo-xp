<script setup lang="ts">
import { desktopItems, appById } from '~/data/apps'
import { profile } from '~/data/profile'

const { l } = useL10n()
const { t } = useI18n()
const { pathFor } = useApps()
const localePath = useLocalePath()
const selected = ref<string | null>(null)

const items = computed(() => desktopItems.map((it) => {
  if (it.type === 'app') {
    const a = appById(it.id)!
    return { key: it.id, icon: a.icon, label: l(a.label), to: pathFor(it.id), external: false }
  }
  return it.key === 'cv'
    ? { key: 'cv', icon: it.icon, label: l(it.label), to: profile.cvPdf, external: true }
    : { key: 'classic', icon: it.icon, label: l(it.label), to: localePath('/cv'), external: false }
}))

type Item = (typeof items.value)[number]
const coarse = () => matchMedia('(max-width: 700px), (pointer: coarse)').matches

function go(it: Item) {
  if (it.external) window.open(it.to, '_blank', 'noopener')
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
    <li v-for="it in items" :key="it.key">
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
