import type { L10n } from './l10n'

export interface Project {
  id: string
  name: string
  stack: string[]
  description: L10n
  url?: string
  /** true = sample entry, Jurgo still has to fill it in */
  placeholder?: boolean
}

// Real case studies come from portfolio-v2 (app/data/projects.ts).
export const projects: Project[] = [
  {
    id: 'pristupio',
    name: 'Pristupio Platform',
    stack: ['Vue 3', 'Nuxt', 'TypeScript', 'Pinia', 'Supabase'],
    description: {
      en: 'WCAG accessibility audit SaaS. AI (OpenAI, structured JSON output) turns audit findings into clear fixes in Slovak and English.',
      sk: 'SaaS na audit prístupnosti podľa WCAG. AI (OpenAI, štruktúrovaný JSON) prekladá nálezy auditu na zrozumiteľné kroky opravy po slovensky aj anglicky.',
    },
    url: 'https://pristupio.com',
  },
  {
    id: 'e-passport',
    name: 'ePassport System',
    stack: ['Vue', 'Vuetify', 'Supabase'],
    url: 'https://epassport.netlify.app',
    description: {
      en: 'Mobile-first web application that replaced fragmented PDF workflows with a structured system, including authentication and admin management.',
      sk: 'Mobile-first webová aplikácia, ktorá nahradila neprehľadné PDF procesy štruktúrovaným systémom vrátane autentifikácie a administrácie.',
    },
  },
  {
    id: 'photographer-portfolio',
    name: 'Photographer Portfolio',
    stack: ['HTML', 'CSS', 'JavaScript'],
    description: {
      en: 'Minimalist portfolio website focused on presenting visual content with clarity, performance, and smooth user experience.',
      sk: 'Minimalistická portfólio stránka zameraná na prezentáciu vizuálneho obsahu s dôrazom na prehľadnosť, výkon a používateľský zážitok.',
    },
  },
  {
    id: 'nds-events',
    name: 'NDS incident system',
    stack: ['Laravel', 'Vue.js', 'REST API'],
    description: {
      en: 'Information system for motorway workers to log events and resolve them.',
      sk: 'Informačný systém pre pracovníkov diaľnic na evidenciu a riešenie udalostí.',
    },
  },
  {
    id: 'vub-processes',
    name: 'VÚB process diagrams',
    stack: ['BPMN', 'UML', 'Visio'],
    description: {
      en: 'Operational process models and change planning for a bank.',
      sk: 'Modely operačných procesov a plánovanie zmien v banke.',
    },
  },
  {
    id: 'japs',
    name: 'JAPS – Just Another Portfolio Site',
    stack: ['TypeScript', 'Astro', 'Vue 3', 'Cloudflare Workers', 'OpenAI / Gemini / Groq / Ollama'],
    description: {
      en: 'Generates a static portfolio from deployed Netlify sites and their GitHub repos. Grounded AI copywriting: any number not in the extracted facts is rejected.',
      sk: 'Generuje statické portfólio z nasadených Netlify webov a ich GitHub repozitárov. Grounded AI texty: čísla mimo extrahovaných faktov sú zamietnuté.',
    },
    url: 'https://japs.app',
  },
  {
    id: 'rag',
    name: 'Slovak RAG assistant',
    stack: ['TypeScript', 'Supabase', 'pgvector', 'MCP', 'GitHub Actions'],
    description: {
      en: 'Slovak-language retrieval-augmented assistant over my own projects, with swappable embedding/LLM providers and a 40-question evaluation set.',
      sk: 'Slovenský RAG asistent nad mojimi projektmi s vymeniteľnými embedding/LLM providermi a evaluačnou sadou 40 otázok.',
    },
  },
  {
    id: 'ci-review',
    name: 'AI code review in CI',
    stack: ['Claude Code', 'GitHub Actions'],
    description: {
      en: 'Interactive and automatic pull-request review workflows powered by Claude.',
      sk: 'Interaktívne aj automatické review pull requestov pomocou Claude.',
    },
  },
  {
    id: 'loqsy',
    name: 'Loqsy',
    stack: ['Vue 3', 'TypeScript', 'Supabase', 'Netlify'],
    description: {
      en: 'Subscription PWA pairing two user roles, 2,000+ registered users. End-to-end delivery incl. RLS, payment webhooks and server-side tracking.',
      sk: 'Predplatiteľská PWA párujúca dve role používateľov, 2 000+ registrovaných. Dodávka end-to-end vrátane RLS, platobných webhookov a server-side trackingu.',
    },
    url: 'https://loqsy.app',
  },
]

export const projectById = (id: string) => projects.find(p => p.id === id)
