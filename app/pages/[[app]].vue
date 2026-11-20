<script setup lang="ts">
import { isAppId } from '~/data/app-ids'
import { appById } from '~/data/apps'
import { projectById } from '~/data/projects'
import { useWindowsStore } from '~/stores/windows'
import { DEFAULT_WALLPAPER } from '~/composables/useWallpaper'

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

// WordPad document comes from ?file=<slug>. Read it after mount: the prerendered HTML has no query,
// so doing it during setup would cause a hydration mismatch.
// Same for the Project window and ?p=<project id>.
const fileQuery = computed(() => (typeof route.query.file === 'string' ? route.query.file : null))
const projectQuery = computed(() => (typeof route.query.p === 'string' ? route.query.p : null))
const folderQuery = computed(() => (typeof route.query.f === 'string' ? route.query.f : null))
onMounted(() => {
  watch([param, fileQuery], ([id, file]) => { if (id === 'wordpad' && file) store.doc = file }, { immediate: true })
  watch([param, projectQuery], ([id, p]) => { if (id === 'project' && p) store.project = p }, { immediate: true })
  // unlike a project, the folder can also be "none" (the root of My Projects)
  watch([param, folderQuery], ([id, f]) => { if (id === 'projects') store.projectFolder = f }, { immediate: true })
})

// window -> URL (focused window is the address; nothing focused = "/")
watch([() => store.active, () => store.doc, () => store.project, () => store.projectFolder], ([id]) => {
  const target = pathFor(id)
  const strip = (p: string) => p.replace(/\/+$/, '') || '/'
  const { file: _file, p: _p, f: _f, ...rest } = route.query
  const query: typeof rest & { file?: string; p?: string; f?: string } = { ...rest }
  if (id === 'wordpad' && store.doc) query.file = store.doc
  if (id === 'project' && store.project) query.p = store.project
  if (id === 'projects' && store.projectFolder) query.f = store.projectFolder
  if (strip(target) !== strip(route.path) || (route.query.file ?? null) !== (query.file ?? null) || (route.query.p ?? null) !== (query.p ?? null) || (route.query.f ?? null) !== (query.f ?? null)) {
    router.replace({ path: target, query, hash: route.hash })
  }
})

const def = computed(() => (param.value ? appById(param.value) : undefined))
const openProject = computed(() => (param.value === 'project' ? projectById(store.project) : undefined))
const pageTitle = computed(() => {
  if (openProject.value) return `${l(openProject.value.name)} | Juraj Paluš`
  return def.value ? `${l(def.value.seoTitle ?? def.value.label)} | Juraj Paluš` : t('meta_title')
})
const pageDesc = computed(() => {
  if (openProject.value) return l(openProject.value.description)
  return def.value ? l(def.value.description) : t('meta_description')
})
// The wallpaper is the biggest thing on the desktop (the LCP element), so start downloading it
// right away. Only here: the classic /cv page doesn't show it.
useHead({ link: [{ rel: 'preload', as: 'image', href: DEFAULT_WALLPAPER, type: 'image/webp', fetchpriority: 'high' }] })

useSeoMeta({
  title: pageTitle,
  description: pageDesc,
  ogTitle: pageTitle,
  ogDescription: pageDesc,
  twitterTitle: pageTitle,
  twitterDescription: pageDesc,
})
</script>

<template>
  <XpDesktop />
</template>
