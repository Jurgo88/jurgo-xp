<script setup lang="ts">
import type { AppId } from '~/data/app-ids'
import { roleById } from '~/data/roles'
import { blogPosts } from '~/data/personal'
import { profile } from '~/data/profile'
import { floorball } from '~/data/floorball'

const props = defineProps<{ id: AppId }>()
const { t } = useI18n()
const { l } = useL10n()
const text = computed(() => {
  const role = roleById(props.id)
  if (role) return t('positions', { n: role.jobs.length, p: role.projects.length })
  switch (props.id) {
    case 'about': return `${profile.name} · ${profile.city}`
    case 'blog': return t('objects', { n: blogPosts.length })
    case 'notepad': return t('notepad_line')
    case 'floorball': return `${floorball.team.name} · ${l({ en: 'Legendary Floorball League', sk: 'Legendárna florbalová liga' })}`
    case 'sport': return t('objects', { n: 3 })
    case 'recycle-bin': return t('objects', { n: 2 })
    case 'spotify': return l({ en: 'Data from Spotify · click a song to open it there', sk: 'Dáta zo Spotify · klik na skladbu ju otvorí tam' })
    case 'contact': return profile.email
    default: return String(blogPosts.length)
  }
})
</script>

<template>{{ text }}</template>
