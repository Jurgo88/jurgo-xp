import { marked } from 'marked'
import type { BlogPost } from '~/data/blog'

// Markdown bodies, bundled at build time: ../data/blog/<slug>.<lang>.md
const files = import.meta.glob('../data/blog/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

const bodies: Record<string, string> = {}
for (const [path, raw] of Object.entries(files)) {
  const name = path.split('/').pop()!.replace(/\.md$/, '') // "<slug>.<lang>"
  bodies[name] = raw
}

const WORDS_PER_MINUTE = 200

export function blogMarkdown(slug: string, lang: string) {
  return bodies[`${slug}.${lang}`] ?? bodies[`${slug}.en`] ?? ''
}

export function readingMinutes(md: string) {
  const words = md.replace(/[#*`>_[\]()!-]/g, ' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

/** Rendered HTML + reading time of a post in the current locale. */
export function useBlogPost(post: Ref<BlogPost>) {
  const { locale } = useI18n()
  const md = computed(() => blogMarkdown(post.value.slug, locale.value))
  const html = computed(() => marked.parse(md.value, { async: false }) as string)
  const minutes = computed(() => readingMinutes(md.value))
  return { html, minutes }
}
