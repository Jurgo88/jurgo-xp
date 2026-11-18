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

export interface Season {
  season: string
  club: string
  league: string
  games: number
  goals: number
  assists: number
}

// TODO(Jurgo): club name + link to the league stats page. Later we can fetch
// these automatically at build time.
export const floorball = {
  sample: true,
  statsUrl: '',
  seasons: [
    { season: '2022/23', club: 'Club (TBD)', league: '1. liga', games: 18, goals: 9, assists: 7 },
    { season: '2023/24', club: 'Club (TBD)', league: '1. liga', games: 20, goals: 12, assists: 10 },
    { season: '2024/25', club: 'Club (TBD)', league: '1. liga', games: 19, goals: 11, assists: 8 },
    { season: '2025/26', club: 'Club (TBD)', league: '1. liga', games: 8, goals: 5, assists: 4 },
  ] as Season[],
}

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
