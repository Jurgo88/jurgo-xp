<script setup lang="ts">
import { floorball } from '~/data/personal'

const { t } = useI18n()
const rows = floorball.seasons
const total = rows.reduce((a, s) => ({ games: a.games + s.games, goals: a.goals + s.goals, assists: a.assists + s.assists }), { games: 0, goals: 0, assists: 0 })
const last = rows.length + 1
</script>

<template>
  <div>
    <div class="fbar"><b>A1</b><i>fx</i><span>=SUM(F2:F{{ last }})+SUM(G2:G{{ last }})</span></div>
    <div style="overflow:auto">
      <table class="xl">
        <thead>
          <tr><th /><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>F</th><th>G</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td class="l"><b>{{ t('season') }}</b></td><td class="l"><b>{{ t('club') }}</b></td><td class="l"><b>{{ t('league') }}</b></td>
            <td><b>{{ t('games') }}</b></td><td><b>{{ t('goals') }}</b></td><td><b>{{ t('assists') }}</b></td><td><b>{{ t('points') }}</b></td>
          </tr>
          <tr v-for="(s, i) in rows" :key="s.season">
            <td>{{ i + 2 }}</td><td class="l">{{ s.season }}</td><td class="l">{{ s.club }}</td><td class="l">{{ s.league }}</td>
            <td>{{ s.games }}</td><td>{{ s.goals }}</td><td>{{ s.assists }}</td><td>{{ s.goals + s.assists }}</td>
          </tr>
          <tr class="tot">
            <td>{{ last + 1 }}</td><td class="l">{{ t('total') }}</td><td /><td />
            <td>{{ total.games }}</td><td>{{ total.goals }}</td><td>{{ total.assists }}</td><td>{{ total.goals + total.assists }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
