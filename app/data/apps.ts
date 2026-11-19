import type { L10n } from './l10n'
import type { AppId } from './app-ids'
import { roles } from './roles'

export type MenuKind = 'explorer' | 'notepad' | 'excel' | 'none'

export interface AppDef {
  id: AppId
  icon: string
  /** window title bar */
  title: L10n
  /** label under the desktop icon / in the start menu */
  label: L10n
  /** meta description for the window's own URL */
  description: L10n
  width: number
  height: number
  menu: MenuKind
  /** 'webamp' windows are rendered by Webamp itself, not by XpWindow */
  kind?: 'window' | 'webamp'
}

const roleApps: AppDef[] = roles.map(r => ({
  id: r.id,
  icon: `/icons/${r.id === 'ai-engineer' ? 'ai' : r.id}.svg`,
  title: { en: `${r.file} – ${r.title.en}`, sk: `${r.file} – ${r.title.sk}` },
  label: { en: r.title.en.replace(/ Developer$/, ''), sk: r.title.sk.replace(/ Developer$/, '') },
  description: {
    en: `Juraj Paluš as ${r.title.en}: ${r.lead.en}`,
    sk: `Juraj Paluš ako ${r.title.sk}: ${r.lead.sk}`,
  },
  width: 920,
  height: 640,
  menu: 'explorer',
}))

export const apps: AppDef[] = [
  ...roleApps,
  {
    id: 'about',
    icon: '/icons/my-computer.png',
    title: { en: 'My Computer – About me', sk: 'Tento počítač – O mne' },
    label: { en: 'My Computer', sk: 'Tento počítač' },
    description: {
      en: 'About Juraj Paluš, developer from Bratislava: full career history.',
      sk: 'O Jurajovi Palušovi, developerovi z Bratislavy: celá kariéra.',
    },
    width: 860,
    height: 620,
    menu: 'explorer',
  },
  {
    id: 'blog',
    icon: '/icons/folder.png',
    title: { en: 'Blog', sk: 'Blog' },
    label: { en: 'Blog', sk: 'Blog' },
    description: { en: 'Notes and blog posts by Jurgo.', sk: 'Poznámky a blog od Jurga.' },
    width: 620,
    height: 400,
    menu: 'explorer',
  },
  {
    // one blog post opened from the Blog folder (?file=<slug>); title is per file, see useApps().titleFor
    id: 'notepad',
    icon: '/icons/notepad.svg',
    title: { en: 'Untitled – Notepad', sk: 'Bez názvu – Poznámkový blok' },
    label: { en: 'Notepad', sk: 'Poznámkový blok' },
    description: { en: 'A blog post by Jurgo.', sk: 'Článok z blogu od Jurga.' },
    width: 680,
    height: 520,
    menu: 'notepad',
  },
  {
    id: 'music',
    icon: '/icons/winamp.svg',
    title: { en: 'Winamp', sk: 'Winamp' },
    label: { en: 'Winamp', sk: 'Winamp' },
    description: { en: 'Music I like, in a real Winamp.', sk: 'Hudba, ktorú mám rád, v skutočnom Winampe.' },
    width: 275,
    height: 348,
    menu: 'none',
    kind: 'webamp',
  },
  {
    // Winamp-style "Media Library" fed by Spotify (netlify/functions/spotify.mts)
    id: 'spotify',
    icon: '/icons/now-playing.svg',
    title: { en: 'Winamp Library – Spotify', sk: 'Winamp knižnica – Spotify' },
    label: { en: 'Now playing', sk: 'Práve počúvam' },
    description: {
      en: 'What Jurgo is listening to on Spotify right now, his top tracks and recently played songs.',
      sk: 'Čo Jurgo práve počúva na Spotify, jeho najhranejšie a naposledy hrané skladby.',
    },
    width: 420,
    height: 352,
    menu: 'none',
  },
  {
    id: 'floorball',
    icon: '/icons/excel.svg',
    title: { en: 'floorball_stats.xls', sk: 'florbal_statistiky.xls' },
    label: { en: 'Floorball', sk: 'Florbal' },
    description: { en: 'My floorball league stats.', sk: 'Moje štatistiky z florbalovej ligy.' },
    width: 760,
    height: 420,
    menu: 'excel',
  },
  {
    id: 'sport',
    icon: '/icons/sport.svg',
    title: { en: 'Sport', sk: 'Šport' },
    label: { en: 'Sport', sk: 'Šport' },
    description: { en: 'Floorball and other sports.', sk: 'Florbal a ďalšie športy.' },
    width: 600,
    height: 380,
    menu: 'explorer',
  },
  {
    id: 'contact',
    icon: '/icons/mail.svg',
    title: { en: 'New Message', sk: 'Nová správa' },
    label: { en: 'Contact', sk: 'Kontakt' },
    description: { en: 'Get in touch with Juraj Paluš.', sk: 'Kontaktujte Juraja Paluša.' },
    width: 560,
    height: 400,
    menu: 'none',
  },
  {
    id: 'recycle-bin',
    icon: '/icons/recycle-bin.svg',
    title: { en: 'Recycle Bin', sk: 'Kôš' },
    label: { en: 'Recycle Bin', sk: 'Kôš' },
    description: { en: 'Old versions of this website.', sk: 'Staré verzie tohto webu.' },
    width: 560,
    height: 360,
    menu: 'explorer',
  },
]

export const appById = (id: string) => apps.find(a => a.id === id)

/** Desktop icons in order. Non-window shortcuts use `href`. */
export type DesktopItem =
  | { type: 'app'; id: AppId }
  | { type: 'link'; key: 'cv' | 'classic'; icon: string; label: L10n }

export const desktopItems: DesktopItem[] = [
  { type: 'app', id: 'about' },
  { type: 'app', id: 'frontend' },
  { type: 'app', id: 'fullstack' },
  { type: 'app', id: 'analyst' },
  { type: 'app', id: 'ai-engineer' },
  { type: 'link', key: 'cv', icon: '/icons/pdf.svg', label: { en: 'CV.pdf', sk: 'CV.pdf' } },
  { type: 'app', id: 'blog' },
  { type: 'app', id: 'music' },
  { type: 'app', id: 'spotify' },
  { type: 'app', id: 'sport' },
  { type: 'app', id: 'contact' },
  { type: 'link', key: 'classic', icon: '/icons/ie.svg', label: { en: 'Classic view', sk: 'Klasický pohľad' } },
  { type: 'app', id: 'recycle-bin' },
]
