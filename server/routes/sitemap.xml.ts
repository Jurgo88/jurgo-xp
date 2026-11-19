import { appIds } from '../../app/data/app-ids'

// Prerendered at build time (see nitro.prerender.routes). Every page exists in
// English (no prefix) and Slovak (/sk), so each entry lists both as alternates.
// Notepad is left out: its content comes from ?file=, which search engines
// don't get in the static HTML.
export default defineEventHandler((event) => {
  const site = useRuntimeConfig(event).public.siteUrl.replace(/\/+$/, '')
  const today = new Date().toISOString().slice(0, 10)
  const paths = ['', 'cv', ...appIds.filter(id => id !== 'notepad' && id !== 'recycle-bin')]
  const url = (lang: 'en' | 'sk', p: string) => `${site}${lang === 'sk' ? '/sk' : ''}${p ? `/${p}` : (lang === 'sk' ? '' : '/')}`
  const priority = (p: string) => (p === '' ? '1.0' : ['cv', 'frontend', 'fullstack', 'analyst', 'ai-engineer'].includes(p) ? '0.9' : '0.6')

  const entries = paths.flatMap(p => (['en', 'sk'] as const).map(lang => `  <url>
    <loc>${url(lang, p)}</loc>
    <lastmod>${today}</lastmod>
    <priority>${priority(p)}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${url('en', p)}"/>
    <xhtml:link rel="alternate" hreflang="sk" href="${url('sk', p)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${url('en', p)}"/>
  </url>`))

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`
})
