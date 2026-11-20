<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { projectFolders, projectsIn } from '~/data/projects'
import { cvPdf } from '~/data/profile'
import { useWindowsStore } from '~/stores/windows'

const store = useWindowsStore()
const router = useRouter()
const { l, locale } = useL10n()
const { t } = useI18n()
const { pathFor, projectLink, folderLink } = useApps()

const folders = projectFolders.map(f => ({ ...f, items: projectsIn(f.id) }))
/** open sub-folder (?f=), or null = the root of My Projects */
const folder = computed(() => folders.find(f => f.id === store.projectFolder) ?? null)
const others = computed(() => folders.filter(f => f.id !== folder.value?.id))

// Plain <a> instead of NuxtLink for links that differ only in the query: NuxtLink marks them
// "active" differently on the server (prerendered without a query) and in the browser.
const href = (to: RouteLocationRaw) => router.resolve(to).href
const go = (to: RouteLocationRaw) => navigateTo(to)
const root = computed(() => pathFor('projects'))
</script>

<template>
  <div class="ex projects">
    <aside class="pane">
      <div class="box">
        <h4>{{ l({ en: 'Other places', sk: 'Iné miesta' }) }}</h4>
        <ul>
          <li v-if="folder">
            <a class="lnk" :href="href(root)" @click.prevent="go(root)"><img src="/icons/folder.png" alt="">{{ l({ en: 'My Projects', sk: 'Moje projekty' }) }}</a>
          </li>
          <li v-for="f in others" :key="f.id">
            <a class="lnk" :href="href(folderLink(f.id))" @click.prevent="go(folderLink(f.id))"><img src="/icons/folder.png" alt="">{{ l(f.name) }}</a>
          </li>
        </ul>
      </div>
      <div class="box">
        <h4>{{ t('tasks') }}</h4>
        <ul>
          <li><NuxtLink class="lnk" :to="pathFor('assistant')"><img src="/icons/messenger.svg" alt="">{{ l({ en: 'Ask my AI assistant', sk: 'Spýtať sa môjho AI asistenta' }) }}</NuxtLink></li>
          <li><a class="lnk" :href="cvPdf(locale)" target="_blank" rel="noopener"><img src="/icons/pdf.svg" alt="">{{ t('task_download_cv') }}</a></li>
          <li><NuxtLink class="lnk" :to="pathFor('contact')"><img src="/icons/mail.svg" alt="">{{ t('task_email') }}</NuxtLink></li>
        </ul>
      </div>
    </aside>

    <div class="main">
      <!-- root: the three sub-folders -->
      <template v-if="!folder">
        <h2>{{ l({ en: 'My Projects', sk: 'Moje projekty' }) }}</h2>
        <p class="lead">
          {{ l({
            en: 'What I have built, sorted into folders. Open a folder, then a project for screenshots, my role, the tech and links to the demo and code.',
            sk: 'Čo som postavil, roztriedené do priečinkov. Otvor priečinok a potom projekt: uvidíš screenshoty, moju rolu, technológie a odkazy na demo a kód.',
          }) }}
        </p>
        <div class="bigicons">
          <a v-for="f in folders" :key="f.id" class="bigicon" :href="href(folderLink(f.id))" @click.prevent="go(folderLink(f.id))">
            <span class="bi-img"><img src="/icons/folder.png" alt=""><img :src="f.icon" alt="" class="bi-badge"></span>
            <span class="bi-name">{{ l(f.name) }}</span>
            <small>{{ t('objects', { n: f.items.length }) }}</small>
          </a>
        </div>
      </template>

      <!-- a sub-folder: one icon per project -->
      <template v-else>
        <nav class="crumbs">
          <a :href="href(root)" @click.prevent="go(root)">{{ l({ en: 'My Projects', sk: 'Moje projekty' }) }}</a>
          <span aria-hidden="true">›</span>
          <b>{{ l(folder.name) }}</b>
        </nav>
        <div class="bigicons">
          <NuxtLink v-for="p in folder.items" :key="p.id" class="bigicon" :to="projectLink(p.id)" :title="l(p.description)">
            <span class="bi-img"><img :src="folder.icon" alt=""></span>
            <span class="bi-name">{{ l(p.name) }}</span>
            <small v-if="p.status">{{ l(p.status) }}</small>
          </NuxtLink>
        </div>
      </template>
    </div>
  </div>
</template>
