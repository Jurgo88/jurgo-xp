const KEY = 'jurgoxp:wallpaper'
// WebP is ~57% smaller than the original bliss.jpg (kept for the OG image script)
export const DEFAULT_WALLPAPER = '/bliss.webp'

/**
 * Bliss is the default. A visitor may pick their own picture; it is kept as a
 * data URL in their localStorage only, never uploaded anywhere.
 */
export function useWallpaper() {
  const wallpaper = useState('wallpaper', () => DEFAULT_WALLPAPER)

  function load() {
    try {
      const saved = localStorage.getItem(KEY)
      // older visits may have stored the default JPEG; treat it as the default
      if (saved && saved !== '/bliss.jpg') wallpaper.value = saved
    } catch { /* private mode etc. */ }
  }

  function set(src: string) {
    wallpaper.value = src
    try {
      if (src === DEFAULT_WALLPAPER) localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, src)
    } catch { /* quota or blocked storage: keep it for this visit only */ }
  }

  return { wallpaper, load, set, reset: () => set(DEFAULT_WALLPAPER) }
}
