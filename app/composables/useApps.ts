import type { AppId } from '~/data/app-ids'
import { appById } from '~/data/apps'
import { blogPosts } from '~/data/personal'
import { projectById } from '~/data/projects'
import { useWindowsStore } from '~/stores/windows'

export const docFile = (slug: string) => `${slug}.rtf`
export const postBySlug = (slug: string | null | undefined) => blogPosts.find(p => p.slug === slug)

/** Opening an app = navigating to its URL; the desktop page reacts to the route. */
export function useApps() {
  const localePath = useLocalePath()
  const store = useWindowsStore()
  const { l, locale } = useL10n()

  const pathFor = (id: AppId | null) => localePath(id ? `/${id}` : '/')
  const openApp = (id: AppId) => navigateTo(pathFor(id))
  /** blog post as a document in WordPad */
  const docLink = (slug: string) => ({ path: pathFor('wordpad'), query: { file: slug } })
  /** one project in the Project window */
  const projectLink = (id: string) => ({ path: pathFor('project'), query: { p: id } })

  /** window / taskbar title; WordPad shows the open file name */
  const titleFor = (id: AppId) => {
    const def = appById(id)!
    if (id === 'wordpad' && postBySlug(store.doc)) {
      return `${docFile(store.doc!)} – WordPad`
    }
    if (id === 'project') {
      const p = projectById(store.project)
      if (p) return `${l(p.name)} – ${l({ en: 'My Projects', sk: 'Moje projekty' })}`
    }
    return l(def.title)
  }

  return { pathFor, openApp, docLink, projectLink, titleFor }
}
