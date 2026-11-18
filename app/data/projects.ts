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
      en: 'Scalable SaaS platform built with modular Vue architecture, Pinia state management, and Supabase backend.',
      sk: 'Škálovateľná SaaS platforma s modulárnou Vue architektúrou, Pinia state managementom a Supabase backendom.',
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
    id: 'ai-1',
    name: 'AI project #1',
    stack: ['LLM', 'RAG'],
    description: { en: 'To be filled in by Jurgo.', sk: 'Doplní Jurgo.' },
    placeholder: true,
  },
  {
    id: 'ai-2',
    name: 'AI project #2',
    stack: ['Claude API', 'Agents'],
    description: { en: 'To be filled in by Jurgo.', sk: 'Doplní Jurgo.' },
    placeholder: true,
  },
]

export const projectById = (id: string) => projects.find(p => p.id === id)
