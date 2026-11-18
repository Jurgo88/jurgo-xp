import type { L10n } from './l10n'
import type { AppId } from './app-ids'

export interface Role {
  id: Extract<AppId, 'frontend' | 'fullstack' | 'analyst' | 'ai-engineer'>
  title: L10n
  /** fake file name shown on the desktop, e.g. Frontend.exe */
  file: string
  lead: L10n
  skills: string[]
  jobs: string[]
  projects: string[]
}

export const roles: Role[] = [
  {
    id: 'frontend',
    title: { en: 'Frontend Developer', sk: 'Frontend Developer' },
    file: 'Frontend.exe',
    lead: {
      en: 'Vue and Nuxt are my home turf. I build fast, accessible interfaces and care about detail and performance.',
      sk: 'Vue a Nuxt sú moja hlavná doména. Staviam rýchle, prístupné rozhrania a dbám na detail aj na výkon.',
    },
    skills: ['Vue 3', 'Nuxt', 'TypeScript', 'React', 'SCSS', 'GSAP', 'Pinia'],
    jobs: ['foundation', 'nds', 'accenture', 'ensentia'],
    projects: ['pristupio', 'japs', 'loqsy', 'e-passport', 'photographer-portfolio'],
  },
  {
    id: 'fullstack',
    title: { en: 'Fullstack Developer', sk: 'Fullstack Developer' },
    file: 'Fullstack.exe',
    lead: {
      en: 'From the database to the UI. Laravel and PHP on the server, Vue on the client, Supabase for shipping products fast.',
      sk: 'Od databázy po UI. Laravel a PHP na serveri, Vue na klientovi, Supabase pre rýchle produkty.',
    },
    skills: ['PHP', 'Laravel', 'Vue', 'Supabase', 'SQL Server', 'REST API'],
    jobs: ['kanadevia', 'nds', 'accenture'],
    projects: ['loqsy', 'pristupio', 'japs', 'nds-events'],
  },
  {
    id: 'analyst',
    title: { en: 'IT Analyst', sk: 'IT Analytik' },
    file: 'Analyst.xls',
    lead: {
      en: 'I translate business needs into processes and technical steps. BPMN, UML, incident handling and SQL.',
      sk: 'Preložím požiadavky biznisu do procesov a technických krokov. BPMN, UML, incidenty, SQL.',
    },
    skills: ['BPMN', 'UML', 'Visio', 'SQL', 'Incident management'],
    jobs: ['vub', 'kanadevia'],
    projects: ['vub-processes', 'nds-events'],
  },
  {
    id: 'ai-engineer',
    title: { en: 'AI Engineer', sk: 'AI Engineer' },
    file: 'AI_Engineer.exe',
    lead: {
      en: 'I connect LLMs to real products: agents, tools and the web interfaces around them.',
      sk: 'Prepájam LLM s reálnymi produktmi: agenti, nástroje a webové rozhrania okolo nich.',
    },
    skills: ['LLM APIs', 'Prompting', 'Agents', 'RAG', 'TypeScript', 'Supabase'],
    jobs: ['kanadevia', 'nds'],
    projects: ['japs', 'rag', 'ci-review', 'pristupio'],
  },
]

export const roleById = (id: string) => roles.find(r => r.id === id)
