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
  vite: {
    // xp.css 0.2.6 ships one selector lightningcss rejects; esbuild minifies it fine.
    build: { cssMinify: 'esbuild' },
  },
  nitro: {
    prerender: {
      // Every window has its own URL (/frontend, /sk/frontend, ...) so recruiters
      // can share direct links and search engines see real content.
      routes: ['/', '/sk', '/cv', '/sk/cv', ...appIds.flatMap(id => [`/${id}`, `/sk/${id}`])],
      crawlLinks: true,
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      link: [
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'preload', as: 'image', href: '/bliss.jpg' },
      ],
      meta: [
        { name: 'author', content: 'Juraj Paluš' },
        { name: 'theme-color', content: '#245edb' },
        { property: 'og:image', content: 'https://jurgo.sk/og-image.png' },
      ],
    },
  },
})
