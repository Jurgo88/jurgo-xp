<script setup lang="ts">
import type { Role } from '~/data/roles'
import { roles } from '~/data/roles'
import { projectById } from '~/data/projects'
import { appById } from '~/data/apps'
import { cvPdf } from '~/data/profile'

const props = defineProps<{ role: Role }>()
const { l, locale } = useL10n()
const { t } = useI18n()
const { pathFor } = useApps()
const others = computed(() => roles.filter(r => r.id !== props.role.id))
const projects = computed(() => props.role.projects.map(projectById).filter(p => !!p))
</script>

<template>
  <div class="ex">
    <aside class="pane">
      <div class="box">
        <h4>{{ t('tasks') }}</h4>
        <ul>
          <li><a class="lnk" :href="cvPdf(locale, role.id)" target="_blank" rel="noopener"><img src="/icons/pdf.svg" alt="">{{ t('task_download_cv') }}</a></li>
          <li><NuxtLink class="lnk" :to="pathFor('contact')"><img src="/icons/mail.svg" alt="">{{ t('task_email') }}</NuxtLink></li>
          <li><NuxtLinkLocale class="lnk" to="/cv"><img src="/icons/ie.svg" alt="">{{ t('classic_view') }}</NuxtLinkLocale></li>
        </ul>
      </div>
      <div class="box">
        <h4>{{ t('other_roles') }}</h4>
        <ul>
          <li v-for="r in others" :key="r.id">
            <NuxtLink class="lnk" :to="pathFor(r.id)"><img :src="appById(r.id)!.icon" alt="">{{ l(r.title) }}</NuxtLink>
          </li>
        </ul>
      </div>
      <div class="box">
        <h4>{{ t('details') }}</h4>
        <ul><li class="txt">{{ role.skills.join(', ') }}</li></ul>
      </div>
    </aside>
    <div class="main">
      <h2>{{ l(role.title) }}</h2>
      <p class="lead">{{ l(role.lead) }}</p>
      <section>
        <h3>{{ t('projects') }}</h3>
        <div class="files">
          <component
            :is="p.url ? 'a' : 'div'"
            v-for="p in projects"
            :key="p.id"
            class="file"
            :href="p.url"
            :target="p.url ? '_blank' : undefined"
            :rel="p.url ? 'noopener' : undefined"
            :title="l(p.description)"
          >
            <img src="/icons/folder.png" alt="">
            <div><b>{{ p.name }}</b><small>{{ p.stack.join(' · ') }}</small></div>
          </component>
        </div>
      </section>
      <section>
        <h3>{{ t('relevant_experience') }}</h3>
        <AppsJobList :ids="role.jobs" />
      </section>
    </div>
  </div>
</template>
