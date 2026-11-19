<script setup lang="ts">
import { appById } from '~/data/apps'
import type { AppId } from '~/data/app-ids'

const { l } = useL10n()
const { pathFor } = useApps()
const games: { id: AppId; note: { en: string; sk: string } }[] = [
  { id: 'minesweeper', note: { en: 'Beginner, Intermediate, Expert', sk: 'Začiatočník, pokročilý, expert' } },
  { id: 'solitaire', note: { en: 'Klondike, draw one or three', sk: 'Klondike, po jednej alebo tri' } },
]
</script>

<template>
  <div class="main">
    <h2>{{ l(appById('games')!.label) }}</h2>
    <p class="lead">
      {{ l({
        en: 'Built from scratch in Vue and TypeScript, no game libraries. A small break from reading CVs.',
        sk: 'Napísané od nuly vo Vue a TypeScripte, bez herných knižníc. Malá pauza od čítania životopisov.',
      }) }}
    </p>
    <div class="files">
      <NuxtLink v-for="g in games" :key="g.id" class="file" :to="pathFor(g.id)">
        <img :src="appById(g.id)!.icon" alt="">
        <div><b>{{ l(appById(g.id)!.label) }}</b><small>{{ l(g.note) }}</small></div>
      </NuxtLink>
    </div>
  </div>
</template>
