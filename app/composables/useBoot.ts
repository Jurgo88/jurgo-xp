const KEY = 'jurgoxp:booted'

/**
 * Boot intro (BIOS POST + XP loader) runs on the first visit only.
 * SSR always renders the desktop (good for SEO and no-JS visitors); the
 * client then decides whether to overlay the boot screen.
 */
export function useBoot() {
  const booting = useState('booting', () => false)

  /** The inline head script in app.vue already decided (before first paint). */
  function decide() {
    if (import.meta.server) return
    booting.value = document.documentElement.classList.contains('boot-pending')
  }

  function finish() {
    booting.value = false
    try { localStorage.setItem(KEY, '1') } catch { /* ignore */ }
  }

  return { booting, decide, finish, replay: () => { booting.value = true } }
}
