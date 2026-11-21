import type { L10n } from './l10n'

/** Sub-folders of the "My projects" window, in display order. */
export type ProjectFolder = 'ai' | 'apps' | 'web'

export const projectFolders: { id: ProjectFolder; name: L10n; icon: string }[] = [
  { id: 'ai', name: { en: 'AI projects', sk: 'AI projekty' }, icon: '/icons/ai.svg' },
  { id: 'apps', name: { en: 'Applications', sk: 'Aplikácie' }, icon: '/icons/fullstack.svg' },
  { id: 'web', name: { en: 'Client websites', sk: 'Weby pre klientov' }, icon: '/icons/ie.svg' },
]

/** one screenshot in /public/img/projects; `tall` = phone-shaped */
export interface ProjectShot {
  src: string
  tall?: boolean
  caption?: L10n
  /** intrinsic size, reserves space before the image loads */
  w?: number
  h?: number
}

export interface Project {
  /** also the ?p= value in the project window URL */
  id: string
  name: L10n
  stack: string[]
  /** one line: what it is / which problem it solves (role windows, folder tiles, assistant) */
  description: L10n
  url?: string
  /** public repo; private code = no GitHub button */
  repo?: string
  /** shown in the "My projects" folder; projects without a folder appear only in role windows */
  folder?: ProjectFolder
  /** opens as a bigger window and sits first in its folder */
  featured?: boolean
  /** screenshot in /public/projects; `tall` = phone-shaped screenshot */
  image?: string
  tall?: boolean
  /** more screenshots, shown after `image` as a gallery */
  gallery?: ProjectShot[]
  /** project window details */
  role?: L10n
  highlights?: L10n[]
  result?: L10n
  /** small note under the buttons, e.g. why there is no demo */
  note?: L10n
  status?: L10n
}

const L = (en: string, sk: string): L10n => ({ en, sk })

export const projects: Project[] = [
  // ---------------- AI projects ----------------
  {
    id: 'japs',
    folder: 'ai',
    featured: true,
    name: L('JAPS – Just Another Portfolio Site', 'JAPS – Just Another Portfolio Site'),
    stack: ['TypeScript', 'Astro', 'Vue 3', 'Playwright', 'Cloudflare Workers', 'Hono', 'D1', 'OpenAI / Gemini / Groq / Ollama'],
    description: L(
      'A portfolio you don\'t have to build yourself: it connects to Netlify and GitHub, finds what you have actually shipped and generates a static site from it.',
      'Portfólio, ktoré si nemusíš robiť sám: napojí sa na Netlify a GitHub, nájde, čo si naozaj nasadil, a vygeneruje z toho statický web.',
    ),
    url: 'https://japs.app',
    repo: 'https://github.com/Jurgo88/japs',
    image: '/img/projects/japs.webp',
    role: L(
      'Author of the whole product: CLI pipeline, hosted version with GitHub sign-in, browser editor and 22 themes.',
      'Autor celého produktu: CLI pipeline, hostovaná verzia s prihlásením cez GitHub, editor v prehliadači a 22 tém.',
    ),
    highlights: [
      L('Grounded AI copy: texts are written only from extracted facts, and any number that is not in the facts is rejected.',
        'Grounded AI texty: píšu sa iba z extrahovaných faktov a každé číslo, ktoré vo faktoch nie je, sa zamietne.'),
      L('Pairs deployed Netlify sites with their repositories through deploy metadata, not by guessing from names.',
        'Páruje nasadené Netlify weby s ich repozitármi cez metadáta deployov, nie hádaním podľa názvu.'),
      L('Real screenshots of live sites instead of AI cover art; multilingual output; cookieless stats.',
        'Reálne screenshoty živých webov namiesto AI obrázkov, viacjazyčný výstup, štatistiky bez cookies.'),
      L('Swappable LLM providers: OpenAI, Gemini, Groq or a local Ollama.',
        'Vymeniteľní LLM provideri: OpenAI, Gemini, Groq alebo lokálna Ollama.'),
    ],
    result: L('Works end to end locally and as a hosted app; publishes to Netlify, Cloudflare Pages or <you>.japs.app.',
      'Funguje end-to-end lokálne aj ako hostovaná aplikácia; publikuje na Netlify, Cloudflare Pages alebo <ty>.japs.app.'),
    note: L('Live example: jurgo.japs.app', 'Ukážka výstupu: jurgo.japs.app'),
  },
  {
    id: 'assistant',
    folder: 'ai',
    name: L('AI assistant on this site', 'AI asistent na tomto webe'),
    stack: ['Claude API', 'Netlify Functions', 'Netlify Blobs', 'Vue 3', 'TypeScript'],
    description: L(
      'A messenger-style chatbot that answers recruiters\' questions about my experience and projects, only from the content of this site and my CV.',
      'Chatbot v štýle starého messengera, ktorý odpovedá recruiterom na otázky o mojej praxi a projektoch, iba z obsahu tohto webu a CV.',
    ),
    url: '/assistant',
    repo: 'https://github.com/Jurgo88/jurgo-xp',
    image: '/img/projects/assistant.webp',
    role: L('Design and implementation, including the prompt, limits and the chat window.', 'Návrh aj implementácia vrátane promptu, limitov a okna chatu.'),
    highlights: [
      L('Grounded answers: it uses only the facts it is given and says "I don\'t know" instead of inventing.',
        'Odpovedá iba z dodaných faktov a radšej povie „neviem“, ako by si niečo vymyslel.'),
      L('Streaming responses, rate limits per visitor and a hard daily cost cap for the whole site.',
        'Streamované odpovede, limity na návštevníka a pevný denný strop nákladov pre celý web.'),
      L('The knowledge is generated from the same data files that render this site, so it never gets out of date.',
        'Znalosti sa skladajú z tých istých dátových súborov, z ktorých sa kreslí tento web, takže nezastarávajú.'),
    ],
  },
  {
    id: 'projentiq',
    folder: 'ai',
    name: L('ProjentIQ', 'ProjentIQ'),
    stack: ['Nuxt 4', 'TypeScript', 'SSG', 'i18n', 'Netlify Edge Functions', 'AI agents', 'RAG'],
    description: L(
      'AI agents, knowledge systems and process automation for Slovak and Czech companies: data extracted from invoices, answers from company documents with citations, automated order handling.',
      'AI agenti, znalostné systémy a automatizácia procesov pre slovenské a české firmy: vyťaženie údajov z faktúr, odpovede z firemných dokumentov s citáciou, automatické spracovanie objednávok.',
    ),
    url: 'https://projentiq.com',
    repo: 'https://github.com/Jurgo88/projentiq',
    image: '/img/projects/projentiq.webp',
    role: L('My own company project: positioning, copy, the website and the AI solutions.', 'Môj vlastný projekt: pozicionovanie, texty, web aj AI riešenia.'),
    highlights: [
      L('Interactive demos on sample data right on the website: invoice processing, a knowledge base that answers with citations, and automation.',
        'Interaktívne ukážky na vzorových dátach priamo na webe: spracovanie faktúr, znalostná báza, ktorá odpovedá s citáciou, a automatizácia.'),
      L('A clear process: analysis, solution design, a pilot on the client\'s real documents, then production use; data stays in the EU.',
        'Jasný postup: analýza, návrh riešenia, pilot na reálnych dokumentoch klienta a potom produkčné používanie; dáta zostávajú v EÚ.'),
      L('Website in Slovak, Czech and English, each written natively rather than machine-translated, with an invoice cost calculator, case studies and a blog.',
        'Web po slovensky, česky a anglicky, každá verzia písaná prirodzene, nie strojovo preložená, s kalkulačkou nákladov na faktúry, referenciami a blogom.'),
      L('Accessibility (WCAG AA), dark and light theme, static generation.', 'Prístupnosť (WCAG AA), tmavá aj svetlá téma, statické generovanie.'),
    ],
  },
  {
    id: 'job-hunting',
    folder: 'ai',
    name: L('AI job-search workflow', 'AI workflow na hľadanie práce'),
    stack: ['Claude Code', 'Python', 'YAML', 'Agent skills'],
    description: L(
      'My own system built with Claude Code: CVs in several profiles generated from one YAML file, job-offer evaluation and an application tracker.',
      'Vlastný systém postavený s Claude Code: CV v niekoľkých profiloch z jedného YAML súboru, hodnotenie pracovných ponúk a tracker prihlášok.',
    ),
    role: L('Author.', 'Autor.'),
    highlights: [
      L('One source of truth for the CV; PDFs for frontend, fullstack, analyst and AI roles in Slovak and English. The CVs on this site come from it.',
        'Jeden zdroj pravdy pre CV; PDF pre frontend, fullstack, analytika aj AI po slovensky a anglicky. CV na tomto webe pochádzajú odtiaľ.'),
      L('A skill that scores a job offer against my goals and CV and prepares the application.',
        'Skill, ktorý ohodnotí ponuku voči mojim cieľom a CV a pripraví prihlášku.'),
    ],
    note: L('Private repository (it contains my applications), so there is no code link.', 'Repozitár je súkromný (sú v ňom moje prihlášky), preto bez odkazu na kód.'),
  },

  // ---------------- Applications ----------------
  {
    id: 'pristupio',
    folder: 'apps',
    featured: true,
    name: L('Pristupio', 'Pristupio'),
    stack: ['Vue 3', 'TypeScript', 'Pinia', 'Supabase', 'Netlify Functions', 'axe-core', 'OpenAI API'],
    description: L(
      'SaaS for continuous web accessibility monitoring against WCAG: automated audits, weekly monitoring, issue severity and PDF reports.',
      'SaaS na priebežné sledovanie prístupnosti webu podľa WCAG: automatický audit, týždenný monitoring, závažnosť chýb a PDF report.',
    ),
    url: 'https://pristupio.com',
    image: '/img/projects/pristupio.webp',
    role: L('Own product, end to end: product, frontend, backend and billing.', 'Vlastný produkt end-to-end: produkt, frontend, backend aj platby.'),
    highlights: [
      L('AI (OpenAI API with structured JSON output) turns technical audit findings into clear explanations and remediation steps, in Slovak and English.',
        'AI (OpenAI API so štruktúrovaným JSON výstupom) prekladá technické nálezy auditu do zrozumiteľného vysvetlenia a krokov na opravu, po slovensky aj anglicky.'),
      L('Automated checks with axe-core, findings split into high, medium and low severity.',
        'Automatické kontroly cez axe-core, nálezy rozdelené na vysokú, strednú a nízku závažnosť.'),
      L('Weekly monitoring, e-mail alerts, PDF export and subscription billing via webhooks.',
        'Týždenný monitoring, e-mailové upozornenia, export do PDF a predplatné cez webhooky.'),
    ],
    note: L('The code is private; the app is live.', 'Kód je súkromný, aplikácia beží naživo.'),
  },
  {
    id: 'subscription-pwa',
    folder: 'apps',
    featured: true,
    name: L('Subscription PWA for a client', 'Predplatiteľská PWA pre klienta'),
    stack: ['Nuxt 3', 'TypeScript', 'Pinia', 'Supabase', 'Stripe', 'Web Push', 'Netlify'],
    description: L(
      'A PWA that pairs two user roles around a shared timer, with subscriptions, real-time updates and push notifications. 2,000+ registered users.',
      'PWA, ktorá páruje dve role používateľov okolo spoločného časovača, s predplatným, real-time aktualizáciami a push notifikáciami. 2 000+ registrovaných používateľov.',
    ),
    role: L('End-to-end delivery: architecture, Row Level Security, payments, deployment pipeline (Supabase + GitHub + Netlify).',
      'Dodávka end-to-end: architektúra, Row Level Security, platby, deployment pipeline (Supabase + GitHub + Netlify).'),
    highlights: [
      L('Idempotent payment webhook processing for reliable subscriptions.', 'Idempotentné spracovanie platobných webhookov pre spoľahlivé predplatné.'),
      L('Supabase Realtime (Broadcast, Presence) so both sides see changes immediately.', 'Supabase Realtime (Broadcast, Presence), takže obe strany vidia zmeny hneď.'),
      L('Server-side tracking: GA4 Measurement Protocol and Meta Conversions API.', 'Server-side tracking: GA4 Measurement Protocol a Meta Conversions API.'),
      L('Installable PWA with its own service worker and Web Push notifications.', 'Inštalovateľná PWA s vlastným service workerom a Web Push notifikáciami.'),
    ],
    result: L('2,000+ registered users; half of them (1,000) signed up within the first 3 days after launch.',
      '2 000+ registrovaných používateľov; polovica (1 000) sa zaregistrovala počas prvých 3 dní po spustení.'),
    note: L('Client project under NDA, so no name, link or code.', 'Klientsky projekt pod NDA, preto bez názvu, odkazu a kódu.'),
  },
  {
    id: 'hermantool',
    folder: 'apps',
    name: L('HermanTool – tool rental system', 'HermanTool – systém pre požičovňu náradia'),
    stack: ['Nuxt 4', 'TypeScript', 'Supabase', 'AI', 'QR codes', 'Netlify', 'Sentry', 'Vitest'],
    description: L(
      'Multi-tenant system for running a tool rental business, built so that operating it is as simple as possible: the person at the counter just scans QR codes and the admin menu shows everything.',
      'Multi-tenant systém na prevádzku požičovne náradia, navrhnutý tak, aby bola obsluha čo najjednoduchšia: človek za pultom iba odfotí QR kódy a v admin menu má prehľad o všetkom.',
    ),
    url: 'https://hermantool.netlify.app',
    repo: 'https://github.com/Jurgo88/HermanTool',
    image: '/img/projects/hermantool.webp',
    gallery: [
      { src: '/img/projects/hermantool-naradie.webp', caption: L('Tool detail with an availability calendar', 'Detail náradia s kalendárom dostupnosti') },
      { src: '/img/projects/hermantool-mobil.webp', tall: true, caption: L('Catalogue on a phone', 'Katalóg na mobile') },
    ],
    role: L('Analysis, architecture and development.', 'Analýza, architektúra aj vývoj.'),
    highlights: [
      L('Before any code: a 5-part architecture specification covering the domain, workflows and events, functional and non-functional requirements, risks and an independent review.',
        'Pred kódom vznikla architektonická špecifikácia v 5 častiach: doména, workflowy a udalosti, funkčné a nefunkčné požiadavky, riziká a nezávislé review.'),
      L('About 60 architecture decision records (ADRs) that the implementation follows.', 'Približne 60 architektonických rozhodnutí (ADR), ktorými sa riadi implementácia.'),
      L('AI search: customers describe what they need to do and the system suggests which tools to rent.',
        'Prepojenie s AI: zákazník opíše, čo potrebuje urobiť, a systém mu nájde, aké náradie si má požičať.'),
      L('Counter work reduced to scanning QR codes on tools; the admin menu gives an overview of stock, rentals and customers.',
        'Práca za pultom zjednodušená na skenovanie QR kódov na náradí; admin menu dáva prehľad o sklade, výpožičkách a zákazníkoch.'),
      L('Multi-tenant, so the same system can serve more rental businesses.', 'Multi-tenant, takže ten istý systém môže obsluhovať viac požičovní.'),
    ],
    status: L('Almost finished, public demo online', 'Takmer hotové, verejné demo beží online'),
  },
  {
    id: 'ekonomko',
    folder: 'apps',
    name: L('Ekonomko – family budget', 'Ekonomko – rodinný rozpočet'),
    stack: ['Vue 3', 'TypeScript', 'Pinia', 'Supabase', 'Tailwind', 'ECharts', 'Zod', 'PWA'],
    description: L(
      'Web and PWA app for a family budget: accounts, categories, recurring payments, monthly budgets and charts.',
      'Webová a PWA aplikácia na rodinný rozpočet: účty, kategórie, opakované platby, mesačné rozpočty a grafy.',
    ),
    url: 'https://ekonomko.netlify.app',
    repo: 'https://github.com/Jurgo88/Ekonomko',
    role: L('Author.', 'Autor.'),
    highlights: [
      L('Several households in one database, isolated with Row Level Security.', 'Viac domácností v jednej databáze, oddelených cez Row Level Security.'),
      L('Form validation with Zod, tables with TanStack Table, charts with ECharts.', 'Validácia formulárov cez Zod, tabuľky cez TanStack Table, grafy cez ECharts.'),
    ],
    note: L('The demo needs an account.', 'Demo vyžaduje prihlásenie.'),
  },
  {
    id: 'parking',
    folder: 'apps',
    name: L('Company parking lottery', 'Firemné parkovanie losovaním'),
    stack: ['Vue 3', 'Pinia', 'Supabase', 'Netlify Functions'],
    description: L(
      'Internal app that assigns company parking spaces by lottery, including a last-minute draw and an admin interface.',
      'Interná aplikácia, ktorá prideľuje firemné parkovacie miesta losovaním, vrátane last-minute losovania a admin rozhrania.',
    ),
    repo: 'https://github.com/Jurgo88/parking-kvi',
    role: L('Author.', 'Autor.'),
    highlights: [
      L('Scheduled lottery runs as serverless functions.', 'Losovania bežia ako serverless funkcie.'),
      L('Admin pages for users, parking spaces and allocations.', 'Admin stránky pre používateľov, parkovacie miesta a pridelenia.'),
    ],
    note: L('Internal tool, the demo is behind a login.', 'Interný nástroj, demo je za prihlásením.'),
  },
  {
    id: 'hockey',
    folder: 'apps',
    name: L('Another Hockey Manager', 'Another Hockey Manager'),
    stack: ['TypeScript', 'pnpm monorepo', 'Nuxt', 'Supabase'],
    description: L(
      'A text-first online hockey management game. The match engine comes first and is validated statistically against real league data.',
      'Textová online hokejová manažérska hra. Najprv vzniká zápasový engine, ktorý sa štatisticky overuje voči reálnym ligovým dátam.',
    ),
    repo: 'https://github.com/Jurgo88/another-hockey-manager',
    role: L('Author.', 'Autor.'),
    highlights: [
      L('Deterministic match engine as a pure function with seeded randomness: any match can be replayed exactly.',
        'Deterministický zápasový engine ako čistá funkcia so seedovanou náhodnosťou: každý zápas sa dá presne prehrať znova.'),
      L('Event-stream architecture: box scores, standings and player stats are all derived from one event log.',
        'Event-stream architektúra: výsledky, tabuľky aj štatistiky hráčov sa odvodzujú z jedného logu udalostí.'),
    ],
    status: L('In development', 'Vo vývoji'),
  },

  // ---------------- Client websites ----------------
  {
    id: 'e-passport',
    folder: 'web',
    name: L('ePassport', 'ePassport'),
    stack: ['Vue 3', 'Vuetify', 'Tailwind', 'Firebase'],
    description: L(
      'Mobile-first web app that replaced manual data handling: structured forms, role-based login, admin validation and PDF/CSV export.',
      'Mobile-first webová aplikácia, ktorá nahradila ručné spracovanie dát: štruktúrované formuláre, prihlásenie s rolami, admin validácia a export do PDF/CSV.',
    ),
    url: 'https://epassport.netlify.app',
    repo: 'https://github.com/Jurgo88/ePassport',
    image: '/img/projects/epassport.webp',
    tall: true,
    role: L('Client project, frontend and Firebase backend.', 'Klientsky projekt, frontend aj Firebase backend.'),
  },
  {
    id: 'photographer-portfolio',
    folder: 'web',
    name: L('Peter Zigo – wedding photographer', 'Peter Zigo – svadobný fotograf'),
    stack: ['HTML', 'CSS', 'JavaScript', 'GA4', 'Microsoft Clarity'],
    description: L(
      'Minimalist portfolio of a wedding photographer, built around the photos and fast loading.',
      'Minimalistické portfólio svadobného fotografa postavené okolo fotiek a rýchleho načítania.',
    ),
    url: 'https://peterzigo.sk',
    image: '/img/projects/peterzigo.webp',
    role: L('Development and analytics. The design came from the client.', 'Vývoj a analytika. Dizajn riešil klient.'),
    highlights: [
      L('Analytics set up with GA4 and Microsoft Clarity, so the client sees where visitors come from and how they use the site.',
        'Nasadená analytika cez GA4 a Microsoft Clarity, takže klient vidí, odkiaľ ľudia prichádzajú a ako web používajú.'),
    ],
  },
  {
    id: 'greenstar',
    folder: 'web',
    name: L('Green Star', 'Green Star'),
    stack: ['HTML', 'SCSS', 'JavaScript', 'GSAP', 'Vite'],
    description: L(
      'Website of a cleaning company (laser and pressure cleaning of buildings, pool maintenance) with before/after galleries, GSAP animations and a YouTube video gallery.',
      'Web firmy na čistenie budov (aj laserom) a údržbu bazénov, s galériami pred/po, GSAP animáciami a galériou videí z YouTube.',
    ),
    url: 'https://greenstar.sk',
    image: '/img/projects/greenstar.webp',
    role: L('Development. The design was made by a graphic designer I work with; my job was to build the site from it and make it as fast as possible so it scores well.',
      'Vývoj. Dizajn navrhol grafik, s ktorým spolupracujem; mojou úlohou bolo postaviť web podľa návrhu a spraviť ho čo najrýchlejší, aby mal dobré čísla.'),
    highlights: [
      L('Pixel-faithful implementation of the designer\'s mockups, with GSAP animations.', 'Verná implementácia návrhu od grafika, s GSAP animáciami.'),
      L('Built for speed and good PageSpeed numbers: optimized WebP images and a lightweight Vite build.', 'Postavené na rýchlosť a dobré čísla v PageSpeed: optimalizované obrázky vo WebP a ľahký build cez Vite.'),
    ],
  },

  // ---------------- only in role windows ----------------
  {
    id: 'nds-events',
    name: L('NDS incident system', 'NDS incident system'),
    stack: ['Laravel', 'Vue.js', 'REST API'],
    description: L('Information system for motorway workers to log events and resolve them.', 'Informačný systém pre pracovníkov diaľnic na evidenciu a riešenie udalostí.'),
  },
  {
    id: 'vub-processes',
    name: L('VÚB process diagrams', 'VÚB procesné diagramy'),
    stack: ['BPMN', 'UML', 'Visio'],
    description: L('Operational process models and change planning for a bank.', 'Modely operačných procesov a plánovanie zmien v banke.'),
  },
  {
    id: 'rag',
    name: L('Slovak RAG assistant', 'Slovenský RAG asistent'),
    stack: ['TypeScript', 'Postgres + pgvector', 'OpenAI', 'Docker'],
    description: L(
      'Slovak-language retrieval-augmented assistant over a company knowledge base, built and evaluated on fictional sample data (an invented company handbook). Swappable embedding/LLM providers, cited answers, 40-question evaluation set.',
      'Slovenský RAG asistent nad firemnou znalostnou bázou, postavený a testovaný na vymyslených dátach (fiktívna firemná príručka). Vymeniteľní embedding/LLM provideri, odpovede s citáciami, evaluačná sada 40 otázok.',
    ),
    repo: 'https://github.com/Jurgo88/rag-against-the-machine',
  },
  {
    id: 'ci-review',
    name: L('AI code review in CI', 'AI code review v CI'),
    stack: ['Claude Code', 'GitHub Actions'],
    description: L('Interactive and automatic pull-request review workflows powered by Claude.', 'Interaktívne aj automatické review pull requestov pomocou Claude.'),
  },
]

/** all screenshots of a project: `image` first, then `gallery` */
export const projectShots = (p: Project): ProjectShot[] => [
  ...(p.image ? [{ src: p.image, tall: p.tall }] : []),
  ...(p.gallery ?? []),
]

export const projectById = (id: string | null | undefined) => projects.find(p => p.id === id)

/** projects shown in a folder: featured first, then in file order */
export const projectsIn = (folder: ProjectFolder) =>
  projects.filter(p => p.folder === folder).sort((a, b) => Number(!!b.featured) - Number(!!a.featured))
