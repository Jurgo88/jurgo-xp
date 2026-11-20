<script setup lang="ts">
import { projectFolders, projectsIn } from '~/data/projects'
import { cvPdf } from '~/data/profile'

const { l, locale } = useL10n()
const { t } = useI18n()
const { pathFor, projectLink } = useApps()
const folders = projectFolders.map(f => ({ ...f, items: projectsIn(f.id) }))

const main = ref<HTMLElement>()
function jump(id: string) {
  main.value?.querySelector(`#pf-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="ex projects">
    <aside class="pane">
      <div class="box">
        <h4>{{ l({ en: 'Folders', sk: 'Priečinky' }) }}</h4>
        <ul>
          <li v-for="f in folders" :key="f.id">
            <button class="lnk" type="button" @click="jump(f.id)"><img :src="f.icon" alt="">{{ l(f.name) }} ({{ f.items.length }})</button>
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
    <div ref="main" class="main">
      <h2>{{ l({ en: 'My Projects', sk: 'Moje projekty' }) }}</h2>
      <p class="lead">
        {{ l({
          en: 'What I have built: my own AI tools and products, applications for clients and myself, and client websites. Open a project for screenshots, my role, the tech and links to the demo and code.',
          sk: 'Čo som postavil: vlastné AI nástroje a produkty, aplikácie pre klientov aj pre seba a weby pre klientov. Otvor projekt a uvidíš screenshoty, moju rolu, technológie a odkazy na demo a kód.',
        }) }}
      </p>
      <section v-for="f in folders" :id="`pf-${f.id}`" :key="f.id">
        <h3 class="pf-h"><img :src="f.icon" alt="">{{ l(f.name) }}</h3>
        <div class="ptiles">
          <NuxtLink v-for="p in f.items" :key="p.id" class="ptile" :class="{ big: p.featured }" :to="projectLink(p.id)">
            <span class="pthumb" :class="{ tall: p.tall, empty: !p.image }">
              <img v-if="p.image" :src="p.image" :alt="l({ en: `Screenshot: ${l(p.name)}`, sk: `Screenshot: ${l(p.name)}` })" loading="lazy" decoding="async">
              <img v-else :src="f.icon" alt="" class="picon">
            </span>
            <span class="ptext">
              <b>{{ l(p.name) }}</b>
              <small v-if="p.status" class="pstatus">{{ l(p.status) }}</small>
              <span class="pdesc">{{ l(p.description) }}</span>
            </span>
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>
