<script setup lang="ts">
import { blogPosts } from '~/data/personal'
import { postBySlug } from '~/composables/useApps'
import { useWindowsStore } from '~/stores/windows'

const store = useWindowsStore()
const { l, locale } = useL10n()
const { pathFor } = useApps()
const post = computed(() => postBySlug(store.doc) ?? blogPosts[0]!)
const { html, minutes } = useBlogPost(post)

const date = computed(() =>
  post.value.date
    ? new Intl.DateTimeFormat(locale.value === 'sk' ? 'sk-SK' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      .format(new Date(`${post.value.date}T12:00:00`))
    : '',
)
const readTime = computed(() => l({ en: `${minutes.value} min read`, sk: `${minutes.value} min čítania` }))
</script>

<template>
  <div class="wp">
    <!-- decorative WordPad format bar + ruler (desktop only) -->
    <div class="wp-bar" aria-hidden="true">
      <span class="wp-field wp-font">Verdana</span>
      <span class="wp-field wp-size">12</span>
      <span class="wp-sep" />
      <b class="wp-btn">B</b><i class="wp-btn">I</i><u class="wp-btn">U</u>
      <span class="wp-sep" />
      <span class="wp-btn wp-align on" /><span class="wp-btn wp-align c" /><span class="wp-btn wp-align r" />
    </div>
    <div class="wp-ruler" aria-hidden="true" />

    <div class="wp-scroll">
      <nav class="wp-top">
        <NuxtLink :to="pathFor('blog')">‹ Blog</NuxtLink>
      </nav>
      <article class="wp-page" :lang="locale">
        <header>
          <h1>{{ l(post.title) }}</h1>
          <p class="wp-meta">
            <time v-if="post.date" :datetime="post.date">{{ date }}</time>
            <span v-if="post.date"> · </span>{{ readTime }}
          </p>
        </header>
        <!-- eslint-disable-next-line vue/no-v-html -- own Markdown from app/data/blog -->
        <div class="wp-body" v-html="html" />
        <footer>
          <NuxtLink :to="pathFor('blog')">‹ {{ l({ en: 'Back to the blog', sk: 'Späť na blog' }) }}</NuxtLink>
        </footer>
      </article>
    </div>
  </div>
</template>
