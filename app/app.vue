<script setup lang="ts">
const { t } = useI18n()
const i18nHead = useLocaleHead({ seo: true })
const route = useRoute()
const { booting, decide, finish } = useBoot()

// Runs before first paint: hide the SSR desktop on a first visit so the boot
// screen doesn't flash in after it. Mirrors the logic in useBoot().decide().
const bootGuard = `try{var s=location.search,p=location.pathname;if(!/\\/cv\\/?$/.test(p)&&(/[?&]boot/.test(s)||(!localStorage.getItem('jurgoxp:booted')&&!navigator.webdriver&&!/[?&]noboot/.test(s))))document.documentElement.classList.add('boot-pending')}catch(e){}`

useHead(() => ({
  htmlAttrs: { lang: i18nHead.value.htmlAttrs?.lang },
  link: [...(i18nHead.value.link || [])],
  meta: [...(i18nHead.value.meta || [])],
  script: [{ innerHTML: bootGuard, tagPosition: 'head' }],
}))
useSeoMeta({
  title: () => t('meta_title'),
  description: () => t('meta_description'),
  ogTitle: () => t('meta_title'),
  ogDescription: () => t('meta_description'),
  twitterCard: 'summary_large_image',
})

onMounted(() => {
  if (!/\/cv\/?$/.test(route.path)) decide()
  else document.documentElement.classList.remove('boot-pending')
})
</script>

<template>
  <div>
    <NuxtPage />
    <ClientOnly><XpBootScreen v-if="booting" @done="finish" /></ClientOnly>
  </div>
</template>
