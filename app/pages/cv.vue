<script setup lang="ts">
import { roles } from '~/data/roles'
import type { Role } from '~/data/roles'
import { profile, cvPdf } from '~/data/profile'
import cvData from '~/data/cv-classic.json'

// "Classic view": the CV as a web page, same design and texts as the PDF
// (Jurgo88/job-hunting-pro, cv/template/cv.html.j2 "Tech Grid").
// Texts come from app/data/cv-classic.json -> regenerate with scripts/export-cv.py.

interface CvItem { title: string; company: string; period: string; bullets?: string[] }
interface CvProject { name: string; kind: string; link?: string | null; stack?: string | null; text: string; bullets: string[] }
interface CvDoc {
  headline: string; role: string; stack: string; summary: string; location: string; sections: string[]
  experience: CvItem[]; earlier: CvItem[]; projects: CvProject[]
  skills: { label: string; values: string }[]
  education: { degree: string; school: string; period: string }[]
  languages: { name: string; level: string }[]
  L: Record<string, string>
}

const { l, locale } = useL10n()
const { t } = useI18n()
const { years } = useCareer()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const route = useRoute()
const router = useRouter()

// prerendered HTML has no query: pick the role from ?role= only after mount (no hydration mismatch)
const role = ref<Role>(roles[0]!)
onMounted(() => {
  // during hydration the router may briefly sit on the prerendered URL (no query), so keep watching
  watch(() => route.query.role, (id) => {
    const r = roles.find(x => x.id === id)
    if (r) role.value = r
  }, { immediate: true })
})
function pick(r: Role) {
  role.value = r
  router.replace({ query: { ...route.query, role: r.id } })
}

const cv = computed(() => {
  const byRole = (cvData as unknown as Record<string, Record<string, CvDoc>>)[role.value.id]!
  return byRole[locale.value === 'sk' ? 'sk' : 'en'] ?? byRole.en!
})
const [first, last] = profile.name.split(' ')
const n = (i: number) => String(i + 1).padStart(2, '0')
const strip = (html: string) => html.replace(/<[^>]+>/g, '')

const cvTitle = computed(() => `CV | Juraj Paluš – ${cv.value.role}`)
const cvDesc = computed(() => strip(cv.value.summary).slice(0, 300))
useSeoMeta({
  title: cvTitle,
  description: cvDesc,
  ogTitle: cvTitle,
  ogDescription: cvDesc,
  twitterTitle: cvTitle,
  twitterDescription: cvDesc,
  ogType: 'profile',
})
useHead({ link: [{ rel: 'stylesheet', href: '/fonts/cv/fonts.css' }] })
</script>

<template>
  <div class="classic">
    <nav class="bar" :aria-label="t('cv_title', { years })">
      <NuxtLink class="backxp" :to="localePath('/')">‹ {{ t('cv_back') }}</NuxtLink>
      <div class="roles" role="tablist">
        <button
          v-for="r in roles"
          :key="r.id"
          role="tab"
          :aria-selected="r.id === role.id"
          :class="{ on: r.id === role.id }"
          @click="pick(r)"
        >
          {{ l(r.title) }}
        </button>
      </div>
      <div class="tools">
        <NuxtLink class="tool" :to="{ path: switchLocalePath(locale === 'sk' ? 'en' : 'sk'), query: route.query }">
          {{ locale === 'sk' ? 'EN' : 'SK' }}
        </NuxtLink>
        <a class="tool pdf" :href="cvPdf(locale, role.id)" target="_blank" rel="noopener">PDF ↓</a>
      </div>
    </nav>

    <article class="paper">
      <header>
        <h1>
          <span class="first">{{ first }}</span>
          <span class="second">
            <span class="headtag"><span class="role">{{ cv.role }}</span>{{ cv.stack }}</span>
            <span>{{ last }}</span>
          </span>
        </h1>
        <div class="contact">
          <a :href="`mailto:${profile.email}`">{{ profile.email }}</a>
          <XpPhone />
          <a :href="profile.linkedin" target="_blank" rel="noopener">linkedin.com/in/juraj-palus</a>
          <a :href="profile.github" target="_blank" rel="noopener">{{ profile.github.replace('https://', '') }}</a>
          <span>{{ cv.location }}</span>
        </div>
      </header>

      <template v-for="(s, i) in cv.sections" :key="s">
        <section v-if="s === 'summary'" class="inline">
          <h2>{{ n(i) }} {{ cv.L.summary }}</h2>
          <!-- eslint-disable-next-line vue/no-v-html -- own escaped text, **bold** only -->
          <p class="summary" v-html="cv.summary" />
        </section>

        <section v-else-if="s === 'experience'">
          <h2>{{ n(i) }} {{ cv.L.experience }}</h2>
          <div v-for="e in cv.experience" :key="e.title + e.period" class="row">
            <span class="when">{{ e.period }}</span>
            <div>
              <h3>{{ e.title }} <span class="org">/ {{ e.company }}</span></h3>
              <!-- eslint-disable-next-line vue/no-v-html -->
              <ul v-if="e.bullets?.length"><li v-for="b in e.bullets" :key="b" v-html="b" /></ul>
            </div>
          </div>
          <div v-if="cv.earlier.length" class="row">
            <span class="when">{{ cv.L.earlier_short }}</span>
            <p class="muted">
              <template v-for="(e, k) in cv.earlier" :key="e.title">{{ e.title }} – {{ e.company }} ({{ e.period }})<template v-if="k < cv.earlier.length - 1"> · </template></template>
            </p>
          </div>
        </section>

        <section v-else-if="s === 'projects'">
          <h2>{{ n(i) }} {{ cv.L.projects }}</h2>
          <div v-for="p in cv.projects" :key="p.name" class="row">
            <span class="when"><a v-if="p.link" :href="`https://${p.link}`" target="_blank" rel="noopener">{{ p.link }}</a></span>
            <div>
              <h3>{{ p.name }} <span class="org">/ {{ p.kind }}</span></h3>
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div class="desc" v-html="p.text" />
              <!-- eslint-disable-next-line vue/no-v-html -->
              <ul v-if="p.bullets.length"><li v-for="b in p.bullets" :key="b" v-html="b" /></ul>
              <div v-if="p.stack" class="stack">{{ p.stack }}</div>
            </div>
          </div>
        </section>

        <section v-else-if="s === 'skills'">
          <h2>{{ n(i) }} {{ cv.L.skills }}</h2>
          <dl class="skills">
            <template v-for="sk in cv.skills" :key="sk.label"><dt>{{ sk.label }}</dt><dd>{{ sk.values }}</dd></template>
          </dl>
        </section>

        <section v-else-if="s === 'education'">
          <h2>{{ n(i) }} {{ cv.L.education }}</h2>
          <div v-for="ed in cv.education" :key="ed.degree" class="row">
            <span class="when">{{ ed.period }}</span>
            <div><h3>{{ ed.degree }}</h3><div class="muted">{{ ed.school }}</div></div>
          </div>
        </section>

        <section v-else-if="s === 'languages'" class="inline">
          <h2>{{ n(i) }} {{ cv.L.languages }}</h2>
          <div class="inline-list"><span v-for="lg in cv.languages" :key="lg.name">{{ lg.name }} – {{ lg.level }}</span></div>
        </section>
      </template>
    </article>
  </div>
</template>

<style scoped>
/* Same "Tech Grid" design as the PDF CV, scaled for the screen. */
.classic {
  --ink: #17181c; --muted: #4b4e57; --line: #d5d7db; --accent: #c2410c;
  --sans: 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
  --mono: 'IBM Plex Mono', Consolas, monospace;
  --grot: 'Space Grotesk', 'Segoe UI', Arial, sans-serif;
  position: fixed; inset: 0; overflow: auto; background: #e9eaec; color: var(--ink);
  font: 14px/1.5 var(--sans); user-select: text; -webkit-user-select: text;
}
.classic a { color: inherit; text-decoration: none; }

/* toolbar */
.bar {
  position: sticky; top: 0; z-index: 2; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 10px max(16px, env(safe-area-inset-right, 0px)) 10px max(16px, env(safe-area-inset-left, 0px));
  background: rgba(233, 234, 236, .92); backdrop-filter: blur(6px); border-bottom: 1px solid var(--line);
}
.classic .backxp {
  display: inline-flex; align-items: center; border: 1px solid #0b3cb4; border-radius: 6px; padding: 5px 12px;
  background: linear-gradient(#3d95ff, #0054e3); color: #fff; font-size: 13px; white-space: nowrap;
}
.roles { display: flex; gap: 6px; flex-wrap: wrap; flex: 1; justify-content: center; }
.roles button {
  all: unset; border: 1px solid var(--line); background: #fff; border-radius: 4px; padding: 5px 12px; cursor: pointer;
  font: 500 12px var(--mono);
}
.roles button.on { background: var(--ink); border-color: var(--ink); color: #fff; }
.roles button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.tools { display: flex; gap: 6px; }
.classic .tool { border: 1px solid var(--line); background: #fff; border-radius: 4px; padding: 5px 10px; font: 500 12px var(--mono); }
.classic .tool.pdf { background: var(--accent); border-color: var(--accent); color: #fff; }

/* the sheet */
.paper {
  max-width: 900px; margin: 28px auto 60px; background: #fff; padding: 52px 60px 60px;
  box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 8px 30px rgba(0,0,0,.08);
}
h1 {
  margin: 0; font-family: var(--grot); font-weight: 700; text-transform: uppercase; color: var(--ink);
  font-size: clamp(56px, 15vw, 132px); line-height: .82; letter-spacing: -.04em;
}
h1 .first { display: block; }
h1 .second { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; }
/* not .tag: that class is the skill chip in desktop.css */
.headtag {
  font: 500 14px/1.5 var(--mono); letter-spacing: 0; text-transform: none; color: var(--muted); padding-bottom: .12em;
}
.headtag .role { display: block; font: 700 22px/1.3 var(--grot); color: var(--accent); }
.contact {
  margin-top: 18px; padding: 8px 0; border-top: 2px solid var(--ink); border-bottom: 1px solid var(--line);
  display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px 16px; font: 12.5px var(--mono); color: #3c3f47;
}
.contact a:hover { color: var(--accent); }
.contact :deep(.phone-reveal) {
  all: unset; cursor: pointer; font: inherit; color: var(--accent); text-decoration: underline dotted;
}
.contact :deep(b) { font-weight: inherit; }

section { margin-top: 24px; }
h2 {
  margin: 0 0 10px; font: 500 12.5px var(--mono); text-transform: uppercase; letter-spacing: 1px; color: var(--accent);
  border-bottom: 1px solid var(--line); padding-bottom: 4px;
}
section.inline { display: grid; grid-template-columns: 130px minmax(0, 1fr); gap: 20px; }
section.inline h2 { border: 0; padding: 0; margin: 0; }
.row { display: grid; grid-template-columns: 130px minmax(0, 1fr); gap: 20px; margin-bottom: 14px; }
.when { font: 12.5px var(--mono); color: var(--muted); padding-top: 3px; overflow-wrap: anywhere; }
.when a { color: var(--accent) !important; }
h3 { margin: 0; font: 700 16px/1.3 var(--grot); color: var(--ink); }
h3 .org { font-weight: 500; color: var(--muted); }
ul { margin: 4px 0 0 18px; padding: 0; }
li { margin: 3px 0; }
li::marker { color: #9a9ca3; }
.summary { margin: 0; font-size: 15px; line-height: 1.6; }
.desc { margin-top: 3px; }
.stack { font: 12px var(--mono); color: var(--muted); margin-top: 4px; }
.muted { color: var(--muted); margin: 0; }
.skills { display: grid; grid-template-columns: 180px minmax(0, 1fr); gap: 5px 20px; margin: 0; }
.skills dt { font: 700 14px var(--grot); }
.skills dd { margin: 0; }
.inline-list span + span::before { content: '/'; margin: 0 10px; color: #9a9ca3; }
:deep(strong) { font-weight: 600; }

@media (max-width: 720px) {
  .roles { justify-content: flex-start; order: 3; flex-basis: 100%; }
  .tools { margin-left: auto; }
  .paper { margin: 0; padding: 28px 18px 40px; box-shadow: none; }
  h1 .second { flex-direction: column-reverse; align-items: flex-start; gap: 10px; }
  .headtag { font-size: 13px; }
  .headtag .role { font-size: 19px; }
  .contact { flex-direction: column; }
  section.inline, .row, .skills { grid-template-columns: 1fr; gap: 4px; }
  .row { margin-bottom: 16px; }
  .skills dd { margin-bottom: 8px; }
}
@media print {
  .bar { display: none; }
  .classic { position: static; background: #fff; }
  .paper { box-shadow: none; margin: 0; max-width: none; padding: 0; }
}
</style>
