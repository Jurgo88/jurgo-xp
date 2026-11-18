<script setup lang="ts">
import { isAppId } from '~/data/app-ids'
import { appById } from '~/data/apps'
import { useWindowsStore } from '~/stores/windows'

definePageMeta({
  // keep the desktop mounted while the URL changes between windows
  key: 'desktop',
  validate: route => !route.params.app || isAppId(route.params.app),
})

const route = useRoute()
const router = useRouter()
const store = useWindowsStore()
const { l } = useL10n()
const { t } = useI18n()
const { pathFor } = useApps()

const param = computed(() => (isAppId(route.params.app) ? route.params.app : null))

// URL -> window
if (param.value) store.open(param.value)
watch(param, (id) => { if (id && store.active !== id) store.open(id) })

// window -> URL (focused window is the address; nothing focused = "/")
watch(() => store.active, (id) => {
  const target = pathFor(id)
  const strip = (p: string) => p.replace(/\/+$/, '') || '/'
  if (strip(target) !== strip(route.path)) router.replace({ path: target, query: route.query, hash: route.hash })
})

const def = computed(() => (param.value ? appById(param.value) : undefined))
useSeoMeta({
  title: () => (def.value ? `${l(def.value.label)} | Juraj Paluš` : t('meta_title')),
  description: () => (def.value ? l(def.value.description) : t('meta_description')),
  ogTitle: () => (def.value ? `${l(def.value.label)} | Juraj Paluš` : t('meta_title')),
  ogDescription: () => (def.value ? l(def.value.description) : t('meta_description')),
})
</script>

<template>
  <XpDesktop />
</template>
