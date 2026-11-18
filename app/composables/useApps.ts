import type { AppId } from '~/data/app-ids'

/** Opening an app = navigating to its URL; the desktop page reacts to the route. */
export function useApps() {
  const localePath = useLocalePath()
  const pathFor = (id: AppId | null) => localePath(id ? `/${id}` : '/')
  const openApp = (id: AppId) => navigateTo(pathFor(id))
  return { pathFor, openApp }
}
