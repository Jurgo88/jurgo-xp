import type { L10n } from './l10n'
import type { AppId } from './app-ids'
import { roles } from './roles'

export type MenuKind = 'explorer' | 'wordpad' | 'excel' | 'outlook' | 'paint' | 'none'

export interface AppDef {
  id: AppId
  icon: string
  /** window title bar */
  title: L10n
  /** label under the desktop icon / in the start menu */
  label: L10n
  /** meta description for the window's own URL */
  description: L10n
  /** <title> for the window's own URL when the label is too short (defaults to label) */
  seoTitle?: L10n
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
  seoTitle: r.title,
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
    id: 'projects',
    icon: '/icons/folder.png',
    title: { en: 'My Projects', sk: 'Moje projekty' },
    label: { en: 'My Projects', sk: 'Moje projekty' },
    seoTitle: { en: 'My Projects – AI, applications and client websites', sk: 'Moje projekty – AI, aplikácie a weby pre klientov' },
    description: {
      en: 'Projects by Juraj Paluš: AI projects, web applications and client websites, with demos, code and screenshots.',
      sk: 'Projekty Juraja Paluša: AI projekty, webové aplikácie a weby pre klientov, s demami, kódom a screenshotmi.',
    },
    width: 860,
    height: 620,
    menu: 'explorer',
  },
  {
    // one project opened from My Projects (?p=<id>); title is per project, see useApps().titleFor
    id: 'project',
    icon: '/icons/fullstack.svg',
    title: { en: 'Project', sk: 'Projekt' },
    label: { en: 'Project', sk: 'Projekt' },
    description: { en: 'A project by Juraj Paluš.', sk: 'Projekt Juraja Paluša.' },
    width: 880,
    height: 640,
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
    id: 'wordpad',
    icon: '/icons/wordpad.svg',
    title: { en: 'Document – WordPad', sk: 'Dokument – WordPad' },
    label: { en: 'WordPad', sk: 'WordPad' },
    description: { en: 'A blog post by Jurgo.', sk: 'Článok z blogu od Jurga.' },
    width: 820,
    height: 640,
    menu: 'wordpad',
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
    height: 440,
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
    // Outlook Express-style "New Message" form, sent through Netlify Forms (public/__forms.html)
    width: 640,
    height: 500,
    menu: 'outlook',
  },
  {
    // MSN Messenger-style AI assistant (netlify/functions/assistant.mts)
    id: 'assistant',
    icon: '/icons/messenger.svg',
    title: { en: 'Jurgo AI – Conversation', sk: 'Jurgo AI – Konverzácia' },
    label: { en: 'Ask Jurgo AI', sk: 'Spýtaj sa AI' },
    seoTitle: { en: 'Ask Jurgo AI – chat about my experience', sk: 'Spýtaj sa Jurgo AI – chat o mojej praxi' },
    description: {
      en: 'An AI assistant that answers questions about Juraj Paluš: experience, projects, skills and the roles he is looking for.',
      sk: 'AI asistent, ktorý odpovedá na otázky o Jurajovi Palušovi: prax, projekty, zručnosti a pozície, ktoré hľadá.',
    },
    width: 560,
    height: 560,
    menu: 'none',
  },
  {
    // guestbook drawn in a Paint-like window (netlify/functions/guestbook.mts), entries need approval
    id: 'paint',
    icon: '/icons/paint.svg',
    title: { en: 'Guestbook – Paint', sk: 'Kniha návštev – Skicár' },
    label: { en: 'Guestbook', sk: 'Kniha návštev' },
    seoTitle: { en: 'Guestbook – draw me a picture', sk: 'Kniha návštev – nakresli mi obrázok' },
    description: {
      en: 'Leave a drawing in the guestbook of Juraj Paluš, drawn in a Paint-style app right in the browser.',
      sk: 'Nechaj kresbu v knihe návštev Juraja Paluša, nakreslenú v aplikácii v štýle Skicára priamo v prehliadači.',
    },
    width: 620,
    height: 520,
    menu: 'paint',
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
  // ---- just for fun: games live in their own folder, away from the CV stuff ----
  {
    id: 'games',
    icon: '/icons/games.svg',
    title: { en: 'Games', sk: 'Hry' },
    label: { en: 'Games', sk: 'Hry' },
    description: { en: 'A few classic desktop games, rebuilt from scratch.', sk: 'Pár klasických hier z plochy, postavených od nuly.' },
    width: 520,
    height: 320,
    menu: 'explorer',
  },
  {
    // size is re-fitted to the board by MinesweeperApp
    id: 'minesweeper',
    icon: '/icons/minesweeper.svg',
    title: { en: 'Minesweeper', sk: 'Hľadanie mín' },
    label: { en: 'Minesweeper', sk: 'Hľadanie mín' },
    description: { en: 'Minesweeper in the browser, written from scratch in Vue.', sk: 'Hľadanie mín v prehliadači, napísané od nuly vo Vue.' },
    width: 260,
    height: 400,
    menu: 'none',
  },
  {
    id: 'solitaire',
    icon: '/icons/solitaire.svg',
    title: { en: 'Solitaire', sk: 'Solitér' },
    label: { en: 'Solitaire', sk: 'Solitér' },
    description: { en: 'Klondike solitaire in the browser, written from scratch in Vue.', sk: 'Solitér Klondike v prehliadači, napísaný od nuly vo Vue.' },
    width: 640,
    height: 520,
    menu: 'none',
  },
  {
    // prank: a fake installer (desktop icon is the GTA VI logo, Jurgo's choice)
    id: 'gta-setup',
    icon: '/icons/gta6.png',
    title: { en: 'GTA VI Setup', sk: 'Inštalácia GTA VI' },
    label: { en: 'GTA_VI_setup.exe', sk: 'GTA_VI_setup.exe' },
    description: {
      en: 'A joke installer: will GTA VI run on a Windows XP PC? (Nothing is downloaded.)',
      sk: 'Vtipný inštalátor: pôjde GTA VI na počítači s Windows XP? (Nič sa nesťahuje.)',
    },
    width: 520,
    height: 400,
    menu: 'none',
  },
]

export const appById = (id: string) => apps.find(a => a.id === id)

/** Desktop icons in order. Non-window shortcuts use `href`. */
export type DesktopItem =
  | { type: 'app'; id: AppId; phoneOnly?: boolean }
  | { type: 'link'; key: 'cv' | 'classic'; icon: string; label: L10n }

export const desktopItems: DesktopItem[] = [
  { type: 'app', id: 'about' },
  { type: 'app', id: 'frontend' },
  { type: 'app', id: 'fullstack' },
  { type: 'app', id: 'analyst' },
  { type: 'app', id: 'ai-engineer' },
  { type: 'app', id: 'projects' },
  { type: 'link', key: 'cv', icon: '/icons/pdf.svg', label: { en: 'CV.pdf', sk: 'CV.pdf' } },
  { type: 'app', id: 'assistant' },
  { type: 'app', id: 'blog' },
  { type: 'app', id: 'music' },
  // on desktop Spotify lives inside Winamp (WebampHost); phones get it as a window
  { type: 'app', id: 'spotify', phoneOnly: true },
  { type: 'app', id: 'sport' },
  { type: 'app', id: 'contact' },
  { type: 'app', id: 'paint' },
  { type: 'link', key: 'classic', icon: '/icons/ie.svg', label: { en: 'Classic view', sk: 'Klasický pohľad' } },
  { type: 'app', id: 'games' },
  { type: 'app', id: 'gta-setup' },
  { type: 'app', id: 'recycle-bin' },
]
