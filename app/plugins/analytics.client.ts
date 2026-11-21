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
 *  - contact_submit {has_subject, lang}     / contact_form_sent  (contact form sent via Netlify Forms; no personal data)
 *  - contact_submit_error                   / contact_form_error
 *  - assistant_message {n, lang}            / assistant_message  (AI chat, n = question number in the chat)
 *  - assistant_nudge                        / assistant_nudge
 *  - guestbook_submit {has_note, lang}       / guestbook_sent     (Paint guestbook drawing sent; no name/text/image)
 *  - guestbook_submit_error {reason}         / guestbook_error
 *  - guestbook_gallery {lang}                / guestbook_gallery  (guestbook gallery tab opened)
 *  - gta_prank {stage, lang}                 / gta_prank_<stage>  (GTA VI prank installer: license, declined, check, install, coffee, exit_cv, exit_minesweeper)
 *
 * Nothing is loaded on localhost or in automated browsers, so dev work and
 * tests don't end up in the stats.
 *
 * Owner opt-out: open any page with ?notrack=1 once per device/browser and
 * neither Clarity nor PostHog is ever loaded there again (flag in localStorage).
 * ?notrack=0 turns analytics back on. The parameter is removed from the URL.
 *
 * Tagged links: short links in netlify.toml (/in, /gh, /pre/<firma>, /for/<company>)
 * and links in the CV PDFs land with utm_* parameters. PostHog reads them on the first
 * pageview (and keeps them per session/person), then they are removed from the address
 * bar so visitors only ever see a clean jurgo.sk URL.
 */
type Props = Record<string, string | number | boolean | null>
type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[][] }
type Win = Window & { clarity?: ClarityFn }

const roleIds = new Set<string>(roles.map(r => r.id))
const OPT_OUT_KEY = 'jurgo-notrack'

/** Reads/updates the owner opt-out flag; returns [optedOut, changedNow]. */
function ownerOptOut(): [boolean, boolean] {
  const param = new URLSearchParams(location.search).get('notrack')
  try {
    if (param === '1') localStorage.setItem(OPT_OUT_KEY, '1')
    else if (param === '0') localStorage.removeItem(OPT_OUT_KEY)
    return [localStorage.getItem(OPT_OUT_KEY) === '1', param === '1' || param === '0']
  }
  catch {
    // storage blocked: honour the parameter for this page load only
    return [param === '1', false]
  }
}

function toast(text: string) {
  const el = document.createElement('div')
  el.textContent = text
  el.setAttribute('role', 'status')
  el.style.cssText = 'position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:99999;'
    + 'background:#ffffe1;color:#000;border:1px solid #000;border-radius:6px;padding:8px 12px;'
    + 'font:13px Tahoma,Verdana,sans-serif;box-shadow:2px 2px 6px rgba(0,0,0,.35)'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 4000)
}

export default defineNuxtPlugin((nuxtApp) => {
  const { clarityId, postHogKey } = useRuntimeConfig().public
  const host = location.hostname
  const [optedOut, optOutChanged] = ownerOptOut()
  const enabled = !optedOut && !navigator.webdriver && !/^(localhost|127\.|0\.0\.0\.0|\[?::1)/.test(host)

  // drop utm_* from the address bar once analytics has read them
  const utm = Object.fromEntries([...new URLSearchParams(location.search)].filter(([k]) => k.startsWith('utm_')))
  const stripUtm = () => {
    if (!Object.keys(utm).length) return
    const router = useRouter()
    const query = Object.fromEntries(Object.entries(router.currentRoute.value.query).filter(([k]) => !k.startsWith('utm_')))
    void router.replace({ query, hash: router.currentRoute.value.hash })
  }
  if (!enabled || !postHogKey) nuxtApp.hook('app:mounted', stripUtm)

  if (optOutChanged) {
    nuxtApp.hook('app:mounted', () => {
      const router = useRouter()
      const { notrack: _, ...query } = router.currentRoute.value.query
      void router.replace({ query, hash: router.currentRoute.value.hash })
      toast(optedOut
        ? 'Analytika je na tomto zariadení vypnutá (Clarity aj PostHog).'
        : 'Analytika je na tomto zariadení znova zapnutá.')
    })
  }

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
    if (utm.utm_source) clarity('set', 'utm_source', utm.utm_source)
    if (utm.utm_campaign) clarity('set', 'utm_campaign', utm.utm_campaign)
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
      // the first pageview is captured a moment after init (later if the tab is hidden)
      const off = ph.on('eventCaptured', (e: { event?: string }) => {
        if (e.event !== '$pageview') return
        off()
        stripUtm()
      })
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
