// Everything the AI assistant is allowed to know about Jurgo.
// Built from the same data files the site renders (app/data/*) plus the public CV
// (public/cv/*.pdf, generated from Jurgo88/job-hunting-pro WITHOUT the phone number).
// Keep this free of anything that isn't already public on jurgo.sk.
import { experience } from '../../app/data/experience'
import { projects } from '../../app/data/projects'
import { roles } from '../../app/data/roles'
import { blogPosts } from '../../app/data/personal'
import { profile } from '../../app/data/profile'
import { floorball } from '../../app/data/floorball'

/** Text of the public CV (Juraj-Palus-CV-en.pdf + the AI-engineer variant), cleaned up. */
const CV = `
# CV – Juraj Paluš, Software Engineer
Contact: ${profile.email} · jurgo.sk · github.com/Jurgo88 · linkedin.com/in/juraj-palus · Bratislava, open to remote work or relocation within the EU.

## Profile
Software engineer with 8+ years of commercial experience (first job in 2016) and a strong frontend focus, combined with business analysis and hands-on backend work. Can understand the problem, design a clean solution and deliver it to production. Building his own SaaS products taught him to think about users and maintainability. Works efficiently with modern AI-assisted tooling.
AI angle: focused on bringing AI into real products and development workflows. Builds RAG pipelines, grounded LLM features and agentic tooling, and uses AI-assisted development daily. Adds solid engineering underneath: clean TypeScript, proper data handling and evaluation, so AI features are reliable rather than just impressive in a demo.

## Experience
- 2025–2026 · IT Application Developer · Kanadevia Inova: developed new features and modules for an internal business application; wrote and optimized SQL queries, data corrections and reports; managed data flows between the application, database and external business systems (ERP, payroll). Stack: PHP, SQL Server, Active Directory.
- 2023–2024 · Fullstack Developer · NDS – National Motorway Company (Slovakia): in a 10-person dev team co-developed an event and workflow tracking system used by 100–250 field workers across regional centres in Slovakia; designed REST APIs in Laravel and integrated them with a Vue.js frontend; implemented mobile-friendly interfaces for field use with focus on usability and performance.
- 2022–2023 · IT Analyst · VÚB Banka – Intesa Sanpaolo: analyzed business requirements for an internal process-automation system and translated them into technical specifications; coordinated changes and feature delivery with developers and stakeholders in Jira and Confluence; BPMN/UML diagrams, incident handling, SQL.
- 2018–now · Freelance Developer · self-employed: web applications and websites for clients alongside employment; since 2025 focused on SaaS products and AI integrations; owns the full cycle (requirements, implementation, deployment, post-launch analytics); uses Claude Code daily for spec-driven, agentic development; AI-assisted code review in CI.
- 2018–2021 · Frontend Developer · Foundation: responsive web applications in HTML, CSS, JavaScript (also jQuery, JSP, Stripes); translated UI/UX designs into functional interfaces with designers; layout optimization and cross-browser compatibility.
- 2017–2018 · Software Engineer · Accenture: commercial projects for an insurance company and an international CMS platform (Sitecore, AngularJS, C#/.NET, Azure); supported infrastructure and stability of deployed solutions.
- 2016–2017 · .NET Developer (Junior) · Ensentia: frontend in ASP.NET MVC, internal projects incl. a mail tracking system.
- 2015 · IT Technician · City Library Piešťany.

## Projects
- Loqsy (loqsy.app, client project): subscription PWA pairing two user roles, 2,000+ registered users, half of them (1,000) within the first 3 days after launch. End-to-end delivery: architecture, Row Level Security, deployment pipeline (Supabase + GitHub + Netlify), idempotent payment webhook processing, server-side tracking (GA4 Measurement Protocol + Meta Conversions API). Vue 3, TypeScript, Supabase, Netlify.
- Pristupio (pristupio.com, own SaaS): WCAG accessibility audit tool with subscription billing. Component-based architecture, API integrations, billing webhooks; AI (OpenAI API with structured JSON output) turns technical audit findings into clear explanations and remediation steps in Slovak and English; automated WCAG checks with actionable reports. Vue 3, TypeScript, Supabase, Netlify Functions.
- JAPS – Just Another Portfolio Site (japs.app, own product): generates a static portfolio from deployed Netlify sites paired with their GitHub repos. Grounded AI copywriting: texts generated from extracted facts, any number not in the facts is rejected. Local CLI and hosted version with GitHub sign-in, browser editor and one-click publishing; 22 themes, multilingual output, real screenshots, cookieless stats. TypeScript, Astro, Vue 3, Playwright, Cloudflare Workers + Hono + D1, OpenAI / Gemini / Groq / Ollama.
- AI code review in CI: interactive and automatic pull-request review workflows powered by Claude (Claude Code, GitHub Actions).
- Slovak RAG assistant (R&D): Slovak-language retrieval-augmented assistant over his own projects, swappable embedding/LLM providers, 40-question evaluation set (TypeScript, Supabase, pgvector, MCP, GitHub Actions).
- This website jurgo.sk: a Windows XP desktop built with Nuxt 4, Vue 3, TypeScript, Pinia, xp.css and Webamp, hosted on Netlify, with live Spotify "now playing", auto-updated floorball stats, and this AI assistant (Claude API via a Netlify Function, streaming, rate limits and a daily cost cap). Built with heavy use of Claude Code.

## Skills
- Frontend: Vue 3, TypeScript, JavaScript, Pinia, Vue Router, Vite, Nuxt, Astro, React, HTML, CSS/SCSS, GSAP
- Backend & data: Node.js, Hono, Laravel / PHP, REST API, SQL (SQL Server, T-SQL), Supabase (Postgres, RLS, pgvector), Firebase (Firestore), Cloudflare D1, Python (personal projects), C#/.NET (earlier career)
- Cloud & DevOps: Docker, Git, GitHub Actions, GitLab, Netlify, Cloudflare Workers / Pages, Azure (earlier)
- AI: Claude Code, agentic development, RAG, LLM APIs (Claude, OpenAI, Gemini, Groq, Ollama), MCP, evals, prompting, Microsoft Copilot
- Analysis & delivery: requirements analysis, BPMN, UML, Enterprise Architect, MS Visio, Draw.io, Jira, Confluence, incident management

## Education
- 2026–2027: Master's degree (MSc) Cloud-Based Software Architecture, VAMK – Vaasa University of Applied Sciences (online), expected graduation 2027.
- 2011–2015: Bachelor's degree in Computer Science, VŠB – Technical University of Ostrava, Faculty of Electrical Engineering and Computer Science.

## Languages
Slovak native, Czech bilingual, English B2, German A1.
`

function siteData(): string {
  const lines: string[] = ['# Content of the website jurgo.sk']

  lines.push('\n## Target roles (each has its own window on the site)')
  for (const r of roles) {
    lines.push(`- ${r.title.en}: ${r.lead.en} Skills: ${r.skills.join(', ')}. Related projects: ${r.projects.join(', ')}.`)
  }

  lines.push('\n## Work history as shown on the site')
  for (const e of experience) {
    lines.push(`- ${e.period.en} · ${e.role.en} · ${e.company.en}: ${e.description.en} (${e.tags.join(', ')})`)
  }

  lines.push('\n## Projects as shown on the site')
  for (const p of projects.filter(p => !p.placeholder)) {
    lines.push(`- ${p.name}${p.url ? ` (${p.url})` : ''}: ${p.description.en} Stack: ${p.stack.join(', ')}.`)
  }

  const posts = blogPosts.filter(p => !p.draft)
  if (posts.length) {
    lines.push('\n## Blog posts')
    for (const p of posts) lines.push(`- ${p.date} "${p.title.en}": ${p.body.en}`)
  }

  const fb = floorball
  const cur = fb.seasons[0]
  lines.push('\n## Personal: floorball')
  lines.push(`Jurgo plays floorball for ${fb.team.name} in the Legendárna florbalová liga (Legendary Floorball League, Slovak amateur league)${cur?.me.number ? `, jersey #${cur.me.number}` : ''}. Stats are scraped from legendarnaliga.sk and refreshed twice a week.`)
  for (const s of fb.seasons) {
    lines.push(`- Season ${s.season}: Jurgo ${s.me.games} games, ${s.me.goals} goals, ${s.me.assists} assists, ${s.me.pim} penalty minutes; team record ${s.team.won}-${s.team.lost} (${s.team.played} played, goals ${s.team.goalsFor}:${s.team.goalsAgainst}).`)
  }
  if (fb.standings) {
    const mine = fb.standings.rows.find(r => r.team.toLowerCase() === fb.team.name.toLowerCase())
    if (mine) lines.push(`- Current standings ${fb.standings.season}${fb.standings.group ? ` (${fb.standings.group})` : ''}: position ${mine.position}, ${mine.points} points.`)
  }
  const next = cur?.matches.find(m => !m.score)
  if (next) lines.push(`- Next match: ${next.date.replace('T', ' ')} vs ${next.opponent} (${next.home ? 'home' : 'away'}).`)
  lines.push(`(Data updated ${fb.updatedAt.slice(0, 10)}.)`)

  lines.push('\n## Other personal things on the site')
  lines.push('- Music: a real Winamp (Webamp) on the desktop shows what Jurgo is listening to on Spotify right now and his top tracks.')
  lines.push('- The site has a classic plain CV view at jurgo.sk/cv and downloadable CV PDFs per role (frontend, fullstack, analyst, AI engineer), in English and Slovak.')
  lines.push('- Contact: email, LinkedIn and GitHub are in the Contact window; the phone number is shown there after a click.')

  return lines.join('\n')
}

export const knowledge = `${CV}\n${siteData()}`
