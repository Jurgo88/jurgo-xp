<script setup lang="ts">
import { projects, projectById, projectShots, projectFolders, projectsIn } from '~/data/projects'
import { useWindowsStore } from '~/stores/windows'

const store = useWindowsStore()
const router = useRouter()
const { l } = useL10n()
const { t } = useI18n()
const { pathFor, projectLink, folderLink } = useApps()

const project = computed(() => projectById(store.project) ?? projects.find(p => p.featured)!)
const folder = computed(() => projectFolders.find(f => f.id === project.value.folder))
const back = computed(() => (project.value.folder ? folderLink(project.value.folder) : pathFor('projects')))
const siblings = computed(() => (project.value.folder ? projectsIn(project.value.folder).filter(p => p.id !== project.value.id) : []))
/** internal demo = another window of this site (e.g. the AI assistant) */
const internal = computed(() => project.value.url?.startsWith('/') ?? false)
const demoTo = computed(() => (internal.value ? pathFor(project.value.url!.slice(1) as never) : undefined))
const shots = computed(() => projectShots(project.value))
const host = (u: string) => u.replace(/^https?:\/\//, '').replace(/\/$/, '')

// a new project = start reading from the top
const scroller = ref<HTMLElement>()
watch(() => project.value.id, () => scroller.value?.closest('.window-body')?.scrollTo({ top: 0 }))
</script>

<template>
  <div ref="scroller" class="ex proj">
    <aside class="pane">
      <div class="box">
        <h4>{{ t('tasks') }}</h4>
        <ul>
          <li v-if="project.url && internal"><NuxtLink class="lnk" :to="demoTo!"><img src="/icons/ie.svg" alt="">{{ l({ en: 'Run the demo', sk: 'Spustiť demo' }) }}</NuxtLink></li>
          <li v-else-if="project.url"><a class="lnk" :href="project.url" target="_blank" rel="noopener"><img src="/icons/ie.svg" alt="">{{ l({ en: 'Run the demo', sk: 'Spustiť demo' }) }}</a></li>
          <li v-if="project.repo"><a class="lnk" :href="project.repo" target="_blank" rel="noopener"><img src="/icons/notepad.svg" alt="">{{ l({ en: 'View code on GitHub', sk: 'Zobraziť kód na GitHube' }) }}</a></li>
          <li><NuxtLink class="lnk" :to="back"><img src="/icons/folder.png" alt="">{{ l({ en: 'Back to', sk: 'Späť do' }) }} {{ folder ? l(folder.name) : l({ en: 'My Projects', sk: 'Moje projekty' }) }}</NuxtLink></li>
        </ul>
      </div>
      <div v-if="siblings.length && folder" class="box">
        <h4>{{ l(folder.name) }}</h4>
        <ul>
          <li v-for="p in siblings" :key="p.id">
            <!-- plain <a>: NuxtLink marks ?p= links "active" differently on the server (no query) and in the browser -->
            <a class="lnk" :href="router.resolve(projectLink(p.id)).href" @click.prevent="navigateTo(projectLink(p.id))"><img :src="folder.icon" alt="">{{ l(p.name) }}</a>
          </li>
        </ul>
      </div>
      <div class="box">
        <h4>{{ t('details') }}</h4>
        <ul><li class="txt">{{ project.stack.join(', ') }}</li></ul>
      </div>
    </aside>

    <article class="main">
      <NuxtLink class="pback" :to="back">‹ {{ folder ? l(folder.name) : l({ en: 'My Projects', sk: 'Moje projekty' }) }}</NuxtLink>
      <header>
        <h2>{{ l(project.name) }}</h2>
        <p v-if="project.status" class="pstatus">{{ l(project.status) }}</p>
      </header>
      <p class="lead">{{ l(project.description) }}</p>

      <AppsProjectGallery v-if="shots.length" :shots="shots" :name="l(project.name)" />

      <div v-if="project.url || project.repo" class="pbtns">
        <NuxtLink v-if="project.url && internal" class="pbtn" :to="demoTo!">▶ {{ l({ en: 'Run the demo', sk: 'Spustiť demo' }) }}</NuxtLink>
        <a v-else-if="project.url" class="pbtn" :href="project.url" target="_blank" rel="noopener">▶ {{ l({ en: 'Run the demo', sk: 'Spustiť demo' }) }} <small>{{ host(project.url) }}</small></a>
        <a v-if="project.repo" class="pbtn" :href="project.repo" target="_blank" rel="noopener">GitHub</a>
      </div>
      <p v-if="project.note" class="pnote">{{ l(project.note) }}</p>

      <section v-if="project.role">
        <h3>{{ l({ en: 'My role', sk: 'Moja rola' }) }}</h3>
        <p>{{ l(project.role) }}</p>
      </section>
      <section v-if="project.highlights?.length">
        <h3>{{ l({ en: 'What is interesting', sk: 'Čo je na tom zaujímavé' }) }}</h3>
        <ul class="plist">
          <li v-for="(h, i) in project.highlights" :key="i">{{ l(h) }}</li>
        </ul>
      </section>
      <section v-if="project.result">
        <h3>{{ l({ en: 'Result', sk: 'Výsledok' }) }}</h3>
        <p>{{ l(project.result) }}</p>
      </section>
      <section>
        <h3>{{ l({ en: 'Tech', sk: 'Technológie' }) }}</h3>
        <div class="tags"><span v-for="s in project.stack" :key="s" class="tag">{{ s }}</span></div>
      </section>
    </article>
  </div>
</template>
