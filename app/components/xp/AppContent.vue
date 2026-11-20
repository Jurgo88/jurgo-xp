<script setup lang="ts">
import type { AppId } from '~/data/app-ids'
import { roleById } from '~/data/roles'

defineProps<{ id: AppId }>()
</script>

<template>
  <!-- every app is its own chunk, loaded only when its window opens (prerendered pages still get full HTML) -->
  <LazyAppsRoleApp v-if="roleById(id)" :role="roleById(id)!" />
  <LazyAppsAboutApp v-else-if="id === 'about'" />
  <LazyAppsProjectsApp v-else-if="id === 'projects'" />
  <LazyAppsProjectApp v-else-if="id === 'project'" />
  <LazyAppsBlogApp v-else-if="id === 'blog'" />
  <LazyAppsWordpadApp v-else-if="id === 'wordpad'" />
  <LazyAppsFloorballApp v-else-if="id === 'floorball'" />
  <LazyAppsSportApp v-else-if="id === 'sport'" />
  <LazyAppsSpotifyApp v-else-if="id === 'spotify'" />
  <LazyAppsContactApp v-else-if="id === 'contact'" />
  <LazyAppsAssistantApp v-else-if="id === 'assistant'" />
  <LazyAppsPaintApp v-else-if="id === 'paint'" />
  <LazyAppsBinApp v-else-if="id === 'recycle-bin'" />
  <LazyAppsGamesApp v-else-if="id === 'games'" />
  <LazyAppsMinesweeperApp v-else-if="id === 'minesweeper'" />
  <LazyAppsSolitaireApp v-else-if="id === 'solitaire'" />
</template>
