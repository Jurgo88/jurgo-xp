// https://nuxt.com/docs/api/configuration/nuxt-config
import { appIds } from './app/data/app-ids'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  modules: ['@pinia/nuxt', '@nuxtjs/i18n'],
  css: ['xp.css/dist/XP.css', '~/assets/css/desktop.css', '~/assets/css/boot.css'],
  i18n: {
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'sk', language: 'sk-SK', name: 'Slovenčina', file: 'sk.json' },
    ],
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    baseUrl: 'https://jurgo.sk',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
      alwaysRedirect: false,
    },
  },
  runtimeConfig: {
    public: {
      siteUrl: 'https://jurgo.sk',
      // Same Clarity project + PostHog project as the old jurgo.sk (portfolio-v2).
      // Both are public client-side IDs; override with NUXT_PUBLIC_CLARITY_ID /
      // NUXT_PUBLIC_POST_HOG_KEY, set to '' to switch a tracker off.
      clarityId: 'oj7l0t75h5',
      postHogKey: 'phc_Ahs3wRsdtoSJVmZPFqNv9SDxoZWCdPJ4UsN5po6QVmWi',
    },
  },
  hooks: {
    // Nuxt prefetches every lazy chunk on page load. Webamp (~250 kB) and PostHog (~100 kB)
    // are only needed later (Winamp is opened on demand, analytics loads when idle), so
    // don't make phones download them up front.
    'build:manifest'(manifest) {
      for (const [key, entry] of Object.entries(manifest)) {
        if (/node_modules\/(webamp|posthog-js)\//.test(key)) entry.prefetch = false
      }
    },
  },
  vite: {
    // xp.css 0.2.6 ships one selector lightningcss rejects; esbuild minifies it fine.
    build: { cssMinify: 'esbuild' },
  },
  nitro: {
    prerender: {
      // Every window has its own URL (/frontend, /sk/frontend, ...) so recruiters
      // can share direct links and search engines see real content.
      routes: ['/', '/sk', '/cv', '/sk/cv', '/sitemap.xml', '/robots.txt', ...appIds.flatMap(id => [`/${id}`, `/sk/${id}`])],
      crawlLinks: true,
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
      meta: [
        { name: 'author', content: 'Juraj Paluš' },
        { name: 'theme-color', content: '#245edb' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'JurgoXP – Juraj Paluš' },
        { property: 'og:image', content: 'https://jurgo.sk/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'Juraj Paluš – a Windows XP style desktop with the Bliss wallpaper' },
        { name: 'twitter:image', content: 'https://jurgo.sk/og-image.png' },
      ],
    },
  },
})
