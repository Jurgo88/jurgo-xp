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

// Notepad file comes from ?file=<slug>. Read it after mount: the prerendered HTML has no query,
// so doing it during setup would cause a hydration mismatch.
const fileQuery = computed(() => (typeof route.query.file === 'string' ? route.query.file : null))
onMounted(() => {
  watch([param, fileQuery], ([id, file]) => { if (id === 'notepad' && file) store.doc = file }, { immediate: true })
})

// window -> URL (focused window is the address; nothing focused = "/")
watch([() => store.active, () => store.doc], ([id]) => {
  const target = pathFor(id)
  const strip = (p: string) => p.replace(/\/+$/, '') || '/'
  const { file: _file, ...rest } = route.query
  const query = id === 'notepad' && store.doc ? { ...rest, file: store.doc } : rest
  if (strip(target) !== strip(route.path) || (route.query.file ?? null) !== (query.file ?? null)) {
    router.replace({ path: target, query, hash: route.hash })
  }
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
