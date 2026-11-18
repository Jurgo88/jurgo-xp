import type { AppId } from '~/data/app-ids'
import { appById } from '~/data/apps'
import { blogPosts } from '~/data/personal'
import { useWindowsStore } from '~/stores/windows'

export const docFile = (slug: string) => `${slug}.txt`
export const postBySlug = (slug: string | null | undefined) => blogPosts.find(p => p.slug === slug)

/** Opening an app = navigating to its URL; the desktop page reacts to the route. */
export function useApps() {
  const localePath = useLocalePath()
  const store = useWindowsStore()
  const { l, locale } = useL10n()

  const pathFor = (id: AppId | null) => localePath(id ? `/${id}` : '/')
  const openApp = (id: AppId) => navigateTo(pathFor(id))
  /** blog post as a text file in Notepad */
  const docLink = (slug: string) => ({ path: pathFor('notepad'), query: { file: slug } })

  /** window / taskbar title; Notepad shows the open file name */
  const titleFor = (id: AppId) => {
    const def = appById(id)!
    if (id === 'notepad' && postBySlug(store.doc)) {
      return `${docFile(store.doc!)} – ${locale.value === 'sk' ? 'Poznámkový blok' : 'Notepad'}`
    }
    return l(def.title)
  }

  return { pathFor, openApp, docLink, titleFor }
}
