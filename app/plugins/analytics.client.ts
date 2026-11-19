import type { PostHog } from 'posthog-js'
import { isAppId } from '~/data/app-ids'
import type { AppId } from '~/data/app-ids'
import { roles } from '~/data/roles'
import { useWindowsStore } from '~/stores/windows'

/**
 * Microsoft Clarity + PostHog, the same projects the old jurgo.sk used.
 *
 * Custom events (PostHog name / Clarity name):
 *  - window_open   {app, is_role, source}   / open_<app>
 *  - cv_download   {file, role, lang, from} / cv_download (+ cv_download_<role>)
 *  - contact_click {channel}                / contact_<channel>  (email, phone, linkedin, github)
 *
 * Nothing is loaded on localhost or in automated browsers, so dev work and
 * tests don't end up in the stats.
 */
type Props = Record<string, string | number | boolean | null>
type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[][] }
type Win = Window & { clarity?: ClarityFn }

const roleIds = new Set<string>(roles.map(r => r.id))

export default defineNuxtPlugin((nuxtApp) => {
  const { clarityId, postHogKey } = useRuntimeConfig().public
  const host = location.hostname
  const enabled = !navigator.webdriver && !/^(localhost|127\.|0\.0\.0\.0|\[?::1)/.test(host)

  let posthog: PostHog | null = null
  const queue: [string, Props][] = []
  const w = window as Win

  function clarity(...args: unknown[]) {
    w.clarity?.(...args)
  }

  function track(name: string, props: Props = {}, clarityName = name) {
    if (!enabled) return
    clarity('event', clarityName)
    if (posthog) posthog.capture(name, props)
    else queue.push([name, props])
  }

  if (enabled && clarityId) {
    // official bootstrap: calls made before the script loads are queued in clarity.q
    if (!w.clarity) {
      const q: ClarityFn = (...args: unknown[]) => { (q.q = q.q || []).push(args) }
      w.clarity = q
    }
    const s = document.createElement('script')
    s.async = true
    s.src = `https://www.clarity.ms/tag/${clarityId}`
    document.head.appendChild(s)
    clarity('set', 'lang', document.documentElement.lang || 'en')
  }

  if (enabled && postHogKey) {
    // loaded after the page is interactive so it doesn't slow down the first paint
    const load = () => import('posthog-js').then(({ default: ph }) => {
      ph.init(postHogKey, {
        api_host: 'https://eu.i.posthog.com',
        capture_pageview: 'history_change', // every window has its own URL
        capture_pageleave: true,
      })
      posthog = ph
      for (const [n, p] of queue.splice(0)) ph.capture(n, p)
    })
    nuxtApp.hook('app:suspense:resolve', () => {
      if ('requestIdleCallback' in window) requestIdleCallback(() => void load(), { timeout: 3000 })
      else setTimeout(() => void load(), 1500)
    })
  }

  // --- windows -------------------------------------------------------------
  const store = useWindowsStore()
  const openEvent = (app: AppId, source: 'click' | 'link') => {
    track('window_open', { app, is_role: roleIds.has(app), source }, `open_${app}`)
    if (roleIds.has(app)) clarity('set', 'role', app)
  }

  // windows already open on page load came from a shared link (/frontend, ...)
  nuxtApp.hook('app:mounted', () => {
    for (const win of store.windows) openEvent(win.id, 'link')
  })
  store.$onAction(({ name, args, store: s }) => {
    if (name !== 'open') return
    const id = args[0]
    if (isAppId(id) && !s.isOpen(id)) openEvent(id, 'click')
  })

  // --- links (CV downloads, contact) -------------------------------------------
  document.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest?.('a')
    // desktop icons: a click only selects them, opening is tracked in DesktopIcons.vue
    if (!a || a.closest('.icons')) return
    const href = a.getAttribute('href') || ''
    const cv = href.match(/\/cv\/(Juraj-Palus-CV-(?:(.+)-)?(en|sk)\.pdf)$/)
    if (cv) {
      const role = cv[2] ?? 'general'
      track('cv_download', { file: cv[1]!, role, lang: cv[3]!, from: location.pathname })
      clarity('event', `cv_download_${role}`)
      return
    }
    const channel = href.startsWith('mailto:')
      ? 'email'
      : /linkedin\.com/.test(href) ? 'linkedin' : /github\.com/.test(href) ? 'github' : null
    if (channel) track('contact_click', { channel }, `contact_${channel}`)
  }, { capture: true })

  return { provide: { track } }
})
