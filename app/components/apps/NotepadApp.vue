<script setup lang="ts">
import { blogPosts } from '~/data/personal'
import { postBySlug } from '~/composables/useApps'
import { useWindowsStore } from '~/stores/windows'

const store = useWindowsStore()
const { l } = useL10n()
const { t } = useI18n()
const { pathFor } = useApps()
const post = computed(() => postBySlug(store.doc) ?? blogPosts[0]!)
</script>

<template>
  <div class="np">
    <article>
      <h2>{{ l(post.title) }}</h2>
      <p>{{ post.date || t('coming_soon') }}</p>
      <p>&nbsp;</p>
      <p>{{ l(post.body) }}</p>
      <p>&nbsp;</p>
      <p><NuxtLink :to="pathFor('blog')">‹ Blog</NuxtLink></p>
    </article>
  </div>
</template>
