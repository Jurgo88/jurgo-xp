import type { L10n } from './l10n'

// Blog posts. Each one opens as a document in WordPad (/wordpad?file=<slug>).
// Metadata lives here (the AI assistant's Netlify function imports it); the text itself is Markdown
// in ./blog/<slug>.<sk|en>.md (headings ##, lists, **bold**, `code`, ```code blocks```, ![alt](/blog/img.png)).
// Images go to public/blog/. Only real facts, no invented numbers.

export interface BlogPost {
  slug: string
  date: string
  title: L10n
  /** one or two sentences; used by the AI assistant instead of the whole body */
  summary: L10n
  draft?: boolean
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'xp-desktop-in-one-night',
    date: '2026-11-19',
    title: {
      sk: 'Ako som si za jednu noc prerobil web na Windows XP',
      en: 'How I rebuilt my website as Windows XP in one night',
    },
    summary: {
      sk: 'Chcel som osobnejší a originálny web, ktorý nekričí „AI“, tak som dokončil svoj nápad s plochou Windows XP z roku 2022. S Claude Code za jeden večer a noc: Nuxt 4, Webamp so Spotify, florbalové štatistiky a AI asistent v štýle MSN.',
      en: 'I wanted a more personal, original site that doesn't scream "AI", so I finished my Windows XP desktop idea from 2022. Built with Claude Code over one evening and night: Nuxt 4, Webamp with Spotify, floorball stats and an MSN-style AI assistant.',
    },
  },
  {
    slug: 'rag-that-says-i-dont-know',
    date: '2026-11-19',
    title: {
      sk: 'RAG, ktorý vie povedať „neviem“',
      en: 'A RAG assistant that can say "I don\'t know"',
    },
    summary: {
      sk: 'RAG Against the Machine: slovenský RAG asistent, ktorý odpovedá len z dokumentov, cituje zdroje a radšej odmietne, než by si vymýšľal. Kvalitu meria eval set so 40 otázkami.',
      en: 'RAG Against the Machine: a Slovak RAG assistant that answers only from documents, cites its sources and refuses rather than makes things up. Quality is measured with a 40-question eval set.',
    },
  },
  {
    slug: 'working-with-ai-coding-tools',
    date: '2026-11-19',
    title: {
      sk: 'Ako pracujem s AI pri programovaní',
      en: 'How I work with AI coding tools',
    },
    summary: {
      sk: 'Praktické poznámky fullstack vývojára, ktorý s Claude Code pracuje denne: špecifikácia pred kódom, malé kroky cez pull requesty, fakty namiesto voľnej ruky, merať namiesto odhadovať a rozhodnutia nechať človeku.',
      en: 'Practical notes from a fullstack developer who uses Claude Code every day: spec before code, small steps through pull requests, facts instead of free rein, measure instead of guess, and keep the decisions human.',
    },
  },
]
