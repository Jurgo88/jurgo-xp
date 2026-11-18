<script setup lang="ts">
import { blogPosts } from '~/data/personal'
import { docFile } from '~/composables/useApps'

const { l } = useL10n()
const { t } = useI18n()
const { docLink } = useApps()
</script>

<template>
  <div class="main">
    <h2>Blog</h2>
    <div class="files">
      <NuxtLink v-for="p in blogPosts" :key="p.slug" class="file" :to="docLink(p.slug)" :title="l(p.title)">
        <img src="/icons/notepad.svg" alt="">
        <div><b>{{ docFile(p.slug) }}</b><small>{{ p.date || t('coming_soon') }} · {{ l(p.title) }}</small></div>
      </NuxtLink>
    </div>
  </div>
</template>
