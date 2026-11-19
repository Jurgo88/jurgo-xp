<script setup lang="ts">
import { profile } from '~/data/profile'
import { roles } from '~/data/roles'

const { t, locale } = useI18n()
const site = useRuntimeConfig().public.siteUrl.replace(/\/+$/, '')
const i18nHead = useLocaleHead({ seo: true })
const route = useRoute()

// Structured data: tells search engines this site is about a person (name,
// job, links), which helps the knowledge panel / rich result for "Juraj Paluš".
const jsonLd = computed(() => JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': `${site}/#person`,
      'name': profile.name,
      'alternateName': profile.nick,
      'url': `${site}/`,
      'image': `${site}/avatar.jpg`,
      'email': `mailto:${profile.email}`,
      'jobTitle': locale.value === 'sk' ? 'Vývojár – frontend, fullstack, IT analytik, AI' : 'Developer – frontend, fullstack, IT analyst, AI',
      'address': { '@type': 'PostalAddress', 'addressLocality': profile.city, 'addressCountry': 'SK' },
      'knowsAbout': [...new Set(roles.flatMap(r => r.skills))],
      'sameAs': [profile.linkedin, profile.github],
    },
    {
      '@type': 'WebSite',
      '@id': `${site}/#website`,
      'url': `${site}/`,
      'name': 'JurgoXP – Juraj Paluš',
      'inLanguage': ['en', 'sk'],
      'author': { '@id': `${site}/#person` },
    },
  ],
}))
const { booting, decide, finish } = useBoot()

// Runs before first paint: hide the SSR desktop on a first visit so the boot
// screen doesn't flash in after it. Mirrors the logic in useBoot().decide().
const bootGuard = `try{var s=location.search,p=location.pathname;if(!/\\/cv\\/?$/.test(p)&&(/[?&]boot/.test(s)||(!localStorage.getItem('jurgoxp:booted')&&!navigator.webdriver&&!/[?&]noboot/.test(s))))document.documentElement.classList.add('boot-pending')}catch(e){}`

useHead(() => ({
  htmlAttrs: { lang: i18nHead.value.htmlAttrs?.lang },
  link: [...(i18nHead.value.link || [])],
  meta: [...(i18nHead.value.meta || [])],
  script: [
    { innerHTML: bootGuard, tagPosition: 'head' },
    { type: 'application/ld+json', innerHTML: jsonLd.value, key: 'jsonld' },
  ],
}))
useSeoMeta({
  title: () => t('meta_title'),
  description: () => t('meta_description'),
  ogTitle: () => t('meta_title'),
  ogDescription: () => t('meta_description'),
  twitterTitle: () => t('meta_title'),
  twitterDescription: () => t('meta_description'),
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
