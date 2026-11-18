<script setup lang="ts">
import { blogPosts } from '~/data/personal'

const { l } = useL10n()
const { t } = useI18n()
</script>

<template>
  <div class="np">
    <article v-for="p in blogPosts" :key="p.slug" :id="p.slug">
      <h2>[{{ p.date || t('coming_soon') }}] {{ l(p.title) }}</h2>
      <p>{{ l(p.body) }}</p>
    </article>
  </div>
</template>
