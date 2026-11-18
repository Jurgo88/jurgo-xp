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
  <AppsContactApp v-else-if="id === 'contact'" />
  <AppsBinApp v-else-if="id === 'recycle-bin'" />
</template>
