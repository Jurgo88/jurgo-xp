<script setup lang="ts">
import { roles } from '~/data/roles'
import { appById } from '~/data/apps'

const { l } = useL10n()
const { t } = useI18n()
const { year, years } = useCareer()
const { pathFor } = useApps()
</script>

<template>
  <div class="ex">
    <aside class="pane">
      <div class="box">
        <h4>{{ t('system') }}</h4>
        <ul><li class="txt">{{ t('about_system', { year, years }) }}</li></ul>
      </div>
      <div class="box">
        <h4>{{ t('other_places') }}</h4>
        <ul>
          <li v-for="id in (['blog', 'music', 'floorball', 'contact'] as const)" :key="id">
            <NuxtLink class="lnk" :to="pathFor(id)"><img :src="appById(id)!.icon" alt="">{{ l(appById(id)!.label) }}</NuxtLink>
          </li>
        </ul>
      </div>
    </aside>
    <div class="main">
      <h2>{{ t('about_h') }}</h2>
      <p class="lead">{{ t('about_lead') }}</p>
      <section>
        <h3>{{ t('drives') }}</h3>
        <div class="files">
          <NuxtLink v-for="r in roles" :key="r.id" class="file" :to="pathFor(r.id)">
            <img :src="appById(r.id)!.icon" alt="">
            <div><b>{{ l(r.title) }}</b><small>{{ t('local_disk') }}</small></div>
          </NuxtLink>
        </div>
      </section>
      <section>
        <h3>{{ t('whole_career') }}</h3>
        <AppsJobList />
      </section>
    </div>
  </div>
</template>
