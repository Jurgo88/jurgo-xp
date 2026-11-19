<script setup lang="ts">
import type { AppId } from '~/data/app-ids'
import { roleById } from '~/data/roles'

defineProps<{ id: AppId }>()
</script>

<template>
  <AppsRoleApp v-if="roleById(id)" :role="roleById(id)!" />
  <AppsAboutApp v-else-if="id === 'about'" />
  <AppsBlogApp v-else-if="id === 'blog'" />
  <AppsNotepadApp v-else-if="id === 'notepad'" />
  <AppsFloorballApp v-else-if="id === 'floorball'" />
  <AppsSportApp v-else-if="id === 'sport'" />
  <AppsSpotifyApp v-else-if="id === 'spotify'" />
  <AppsContactApp v-else-if="id === 'contact'" />
  <AppsAssistantApp v-else-if="id === 'assistant'" />
  <AppsBinApp v-else-if="id === 'recycle-bin'" />
  <AppsGamesApp v-else-if="id === 'games'" />
  <!-- games are split into their own chunks, loaded only when opened -->
  <LazyAppsMinesweeperApp v-else-if="id === 'minesweeper'" />
  <LazyAppsSolitaireApp v-else-if="id === 'solitaire'" />
</template>
