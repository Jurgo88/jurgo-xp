// Plain list (no Vue/Nuxt imports) so nuxt.config.ts can use it for prerendering.
export const appIds = [
  'frontend',
  'fullstack',
  'analyst',
  'ai-engineer',
  'about',
  'blog',
  'notepad',
  'music',
  'spotify',
  'floorball',
  'sport',
  'contact',
  'recycle-bin',
] as const

export type AppId = (typeof appIds)[number]

export const isAppId = (v: unknown): v is AppId =>
  typeof v === 'string' && (appIds as readonly string[]).includes(v)
