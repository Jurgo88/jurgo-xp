<script setup lang="ts">
import { otherSports } from '~/data/personal'
import { appById } from '~/data/apps'
import { floorball } from '~/data/floorball'

const { l } = useL10n()
const { pathFor } = useApps()
</script>

<template>
  <div class="main">
    <h2>{{ l(appById('sport')!.label) }}</h2>
    <div class="files">
      <NuxtLink class="file" :to="pathFor('floorball')">
        <img src="/icons/excel.svg" alt="">
        <div><b>{{ l(appById('floorball')!.label) }}</b><small>{{ floorball.team.name }}</small></div>
      </NuxtLink>
      <div v-for="s in otherSports" :key="s.name.en" class="file">
        <img src="/icons/folder.png" alt="">
        <div><b>{{ l(s.name) }}</b><small>{{ l(s.note) }}</small></div>
      </div>
    </div>
  </div>
</template>
