import type { L10n } from './l10n'

// Personal content. Blog posts live in ./blog.ts.
export { blogPosts } from './blog'
export type { BlogPost } from './blog'

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
