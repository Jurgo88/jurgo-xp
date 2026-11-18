import type { L10n } from './l10n'

// Everything in this file is SAMPLE content. Jurgo replaces it.

export interface BlogPost {
  slug: string
  date: string
  title: L10n
  body: L10n
  draft?: boolean
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'why-windows-xp',
    date: '2026-11-18',
    title: { en: 'Why I rebuilt my site as Windows XP', sk: 'Prečo som si web prerobil na Windows XP' },
    body: {
      en: 'The first draft looked like every other AI-generated portfolio. So I went back to a project I built before AI was everywhere.',
      sk: 'Prvý návrh vyzeral ako každý iný AI web. Tak som sa vrátil k projektu, ktorý som robil ešte pred AI.',
    },
  },
  {
    slug: 'building-an-ai-agent',
    date: '',
    title: { en: 'What I learned building an AI agent', sk: 'Čo som sa naučil pri stavbe AI agenta' },
    body: { en: 'Coming soon.', sk: 'Čoskoro.' },
    draft: true,
  },
  {
    slug: 'floorball-analytics',
    date: '',
    title: { en: 'Floorball and analytics: what the numbers say', sk: 'Florbal a analytika: čo hovoria čísla' },
    body: { en: 'Coming soon.', sk: 'Čoskoro.' },
    draft: true,
  },
]

export const otherSports: { name: L10n; note: L10n }[] = [
  { name: { en: 'Another sport', sk: 'Ďalší šport' }, note: { en: 'to be filled in', sk: 'doplniť' } },
  { name: { en: 'Match photos', sk: 'Fotky zo zápasov' }, note: { en: 'to be filled in', sk: 'doplniť' } },
]

export interface Track {
  artist: string
  title: string
  /** MP3 under public/music/, e.g. '/music/song.mp3'. Webamp can only play files we host. */
  url: string
  duration?: number
}

// TODO(Jurgo): drop own MP3s (that you may publish) into public/music and list them here.
export const tracks: Track[] = []
