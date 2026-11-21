<script setup lang="ts">
import { floorball, isMe, isMyTeam } from '~/data/floorball'

const { l, locale } = useL10n()

type Sheet = 'me' | 'roster' | 'matches' | 'table'
const sheets: { id: Sheet, label: { en: string, sk: string } }[] = [
  { id: 'me', label: { en: 'Me', sk: 'Ja' } },
  { id: 'roster', label: { en: 'Roster', sk: 'Súpiska' } },
  { id: 'matches', label: { en: 'Matches', sk: 'Zápasy' } },
  ...(floorball.standings ? [{ id: 'table' as Sheet, label: { en: 'Standings', sk: 'Tabuľka' } }] : []),
]
const sheet = ref<Sheet>('me')

// Default to the newest season Jurgo actually played in.
const seasonId = ref((floorball.seasons.find(s => s.me.games > 0) ?? floorball.seasons[0])?.id)
const season = computed(() => floorball.seasons.find(s => s.id === seasonId.value) ?? floorball.seasons[0]!)

const mySeasons = computed(() => [...floorball.seasons].reverse())
const total = computed(() => mySeasons.value.reduce(
  (a, s) => ({ games: a.games + s.me.games, goals: a.goals + s.me.goals, assists: a.assists + s.me.assists, pim: a.pim + s.me.pim }),
  { games: 0, goals: 0, assists: 0, pim: 0 },
))

const cols = computed(() => ({ me: 8, roster: 6, matches: 6, table: 9 })[sheet.value])
const letters = computed(() => Array.from({ length: cols.value }, (_, i) => String.fromCharCode(65 + i)))

const formula = computed(() => {
  const s = season.value
  switch (sheet.value) {
    case 'me': return `=SUM(C2:C${mySeasons.value.length + 1})+SUM(D2:D${mySeasons.value.length + 1})`
    case 'roster': return `=VLOOKUP("${floorball.player.name}";B2:F${s.players.length + 1};4;FALSE)`
    case 'matches': return `=COUNTIF(E2:E${s.matches.length + 1};"W")`
    default: return `=RANK(I2;I2:I${(floorball.standings?.rows.length ?? 0) + 1})`
  }
})

const fmtDate = (iso: string, withTime = true) => {
  const [d, t] = iso.split('T')
  const [y, m, day] = d!.split('-')
  return `${day}.${m}.${y}${withTime && t ? ` ${t}` : ''}`
}
const resultLabel = (r: string | null) => r === null ? '' : l({ W: { en: 'W', sk: 'V' }, L: { en: 'L', sk: 'P' }, D: { en: 'D', sk: 'R' } }[r as 'W' | 'L' | 'D'])
const myLine = (m: { played: boolean, events?: { goals: number, assists: number, penalties: number } }) => {
  if (!m.played) return ''
  const e = m.events
  const parts = [e?.goals ? `${e.goals}G` : '', e?.assists ? `${e.assists}A` : '', e?.penalties ? `${e.penalties * 2}'` : ''].filter(Boolean)
  return parts.length ? `✓ ${parts.join(' ')}` : '✓'
}
const updated = computed(() => new Date(floorball.updatedAt).toLocaleDateString(locale.value === 'sk' ? 'sk-SK' : 'en-GB'))
</script>

<template>
  <div class="fb">
    <div class="fbar">
      <b>A1</b><i>fx</i><span>{{ formula }}</span>
      <select v-if="sheet === 'roster' || sheet === 'matches'" v-model="seasonId" :aria-label="l({ en: 'Season', sk: 'Sezóna' })">
        <option v-for="s in floorball.seasons" :key="s.id" :value="s.id">{{ s.season }}</option>
      </select>
    </div>

    <div class="grid">
      <table class="xl">
        <thead>
          <tr><th /><th v-for="c in letters" :key="c">{{ c }}</th></tr>
        </thead>

        <!-- Sheet 1: my seasons (numbers first so they fit on a phone) -->
        <tbody v-if="sheet === 'me'">
          <tr>
            <td>1</td>
            <td class="l"><b>{{ l({ en: 'Season', sk: 'Sezóna' }) }}</b></td>
            <td><b :title="l({ en: 'Games played', sk: 'Odohrané zápasy' })">{{ l({ en: 'GP', sk: 'Z' }) }}</b></td>
            <td><b :title="l({ en: 'Goals', sk: 'Góly' })">G</b></td>
            <td><b :title="l({ en: 'Assists', sk: 'Asistencie' })">A</b></td>
            <td><b :title="l({ en: 'Points', sk: 'Body' })">{{ l({ en: 'P', sk: 'B' }) }}</b></td>
            <td><b :title="l({ en: 'Penalty minutes', sk: 'Trestné minúty' })">{{ l({ en: 'PIM', sk: 'TM' }) }}</b></td>
            <td class="l"><b>{{ l({ en: 'Club', sk: 'Klub' }) }}</b></td>
            <td class="l"><b>{{ l({ en: 'League', sk: 'Liga' }) }}</b></td>
          </tr>
          <tr v-for="(s, i) in mySeasons" :key="s.id">
            <td>{{ i + 2 }}</td>
            <td class="l">{{ s.season }}</td>
            <td>{{ s.me.games }}</td><td>{{ s.me.goals }}</td><td>{{ s.me.assists }}</td><td>{{ s.me.points }}</td><td>{{ s.me.pim }}</td>
            <td class="l">{{ s.club }}</td><td class="l">{{ s.league }}</td>
          </tr>
          <tr class="tot">
            <td>{{ mySeasons.length + 2 }}</td><td class="l">{{ l({ en: 'Total', sk: 'Spolu' }) }}</td>
            <td>{{ total.games }}</td><td>{{ total.goals }}</td><td>{{ total.assists }}</td><td>{{ total.goals + total.assists }}</td><td>{{ total.pim }}</td>
            <td /><td />
          </tr>
          <tr><td>{{ mySeasons.length + 3 }}</td><td v-for="c in letters" :key="c" /></tr>
          <tr>
            <td>{{ mySeasons.length + 4 }}</td>
            <td class="l"><b>{{ floorball.team.name }}</b></td>
            <td><b :title="l({ en: 'Games played', sk: 'Odohrané zápasy' })">{{ l({ en: 'GP', sk: 'Z' }) }}</b></td>
            <td colspan="2"><b>{{ l({ en: 'W – L', sk: 'V – P' }) }}</b></td>
            <td colspan="2"><b>{{ l({ en: 'Goals', sk: 'Skóre' }) }}</b></td>
            <td colspan="2" />
          </tr>
          <tr v-for="(s, i) in mySeasons" :key="`t${s.id}`">
            <td>{{ mySeasons.length + 5 + i }}</td>
            <td class="l">{{ s.season }}</td>
            <td>{{ s.team.played }}</td>
            <td colspan="2" :class="{ win: s.team.played > 0 && s.team.lost === 0 }">{{ s.team.won }} – {{ s.team.lost }}</td>
            <td colspan="2">{{ s.team.goalsFor }}:{{ s.team.goalsAgainst }}</td>
            <td class="l win" colspan="2">
              <template v-if="s.team.played >= 5 && s.team.lost === 0">★ {{ l({ en: 'unbeaten season', sk: 'sezóna bez prehry' }) }}</template>
            </td>
          </tr>
          <tr>
            <td>{{ mySeasons.length * 2 + 5 }}</td>
            <td class="l" colspan="8">
              {{ l({ en: 'Source:', sk: 'Zdroj:' }) }}
              <a :href="floorball.player.url" target="_blank" rel="noopener">legendarnaliga.sk</a>
            </td>
          </tr>
        </tbody>

        <!-- Sheet 2: team roster stats -->
        <tbody v-else-if="sheet === 'roster'">
          <tr>
            <td>1</td>
            <td><b>#</b></td>
            <td class="l"><b>{{ l({ en: 'Player', sk: 'Hráč' }) }}</b></td>
            <td><b>G</b></td><td><b>A</b></td>
            <td><b>{{ l({ en: 'P', sk: 'B' }) }}</b></td>
            <td><b>{{ l({ en: 'PIM', sk: 'TM' }) }}</b></td>
          </tr>
          <tr v-for="(p, i) in season.players" :key="`${p.number}-${p.name}`" :class="{ me: isMe(p.name) }">
            <td>{{ i + 2 }}</td>
            <td>{{ p.number ?? '' }}</td><td class="l">{{ p.name }}</td>
            <td>{{ p.goals }}</td><td>{{ p.assists }}</td><td>{{ p.points }}</td><td>{{ p.pim }}</td>
          </tr>
        </tbody>

        <!-- Sheet 3: matches -->
        <tbody v-else-if="sheet === 'matches'">
          <tr>
            <td>1</td>
            <td class="l"><b>{{ l({ en: 'Date', sk: 'Dátum' }) }}</b></td>
            <td class="l"><b>{{ l({ en: 'Opponent', sk: 'Súper' }) }}</b></td>
            <td class="l"><b>{{ l({ en: 'H/A', sk: 'D/V' }) }}</b></td>
            <td><b>{{ l({ en: 'Score', sk: 'Skóre' }) }}</b></td>
            <td><b>{{ l({ en: 'Result', sk: 'Výsledok' }) }}</b></td>
            <td class="l"><b>{{ l({ en: 'Me', sk: 'Ja' }) }}</b></td>
          </tr>
          <tr v-for="(m, i) in season.matches" :key="m.date + m.opponent" :class="{ future: !m.result }">
            <td>{{ i + 2 }}</td>
            <td class="l">{{ fmtDate(m.date) }}</td>
            <td class="l">{{ m.opponent }}</td>
            <td class="l">{{ m.home ? l({ en: 'H', sk: 'D' }) : l({ en: 'A', sk: 'V' }) }}</td>
            <td>{{ m.score ?? '–' }}</td>
            <td :class="{ win: m.result === 'W', loss: m.result === 'L' }">{{ resultLabel(m.result) }}</td>
            <td class="l">{{ myLine(m) }}</td>
          </tr>
        </tbody>

        <!-- Sheet 4: standings (current season) -->
        <tbody v-else-if="floorball.standings">
          <tr>
            <td>1</td>
            <td><b>#</b></td>
            <td class="l"><b>{{ floorball.standings.season }}<template v-if="floorball.standings.group"> · {{ floorball.standings.group }}</template></b></td>
            <td><b :title="l({ en: 'Games', sk: 'Zápasy' })">{{ l({ en: 'GP', sk: 'Z' }) }}</b></td>
            <td><b :title="l({ en: 'Won', sk: 'Výhry' })">{{ l({ en: 'W', sk: 'V' }) }}</b></td>
            <td><b :title="l({ en: 'Won after penalty shots', sk: 'Výhry po s.n.' })">{{ l({ en: 'WP', sk: 'Vsn' }) }}</b></td>
            <td><b :title="l({ en: 'Lost after penalty shots', sk: 'Prehry po s.n.' })">{{ l({ en: 'LP', sk: 'Psn' }) }}</b></td>
            <td><b :title="l({ en: 'Lost', sk: 'Prehry' })">{{ l({ en: 'L', sk: 'P' }) }}</b></td>
            <td><b>{{ l({ en: 'Goals', sk: 'Skóre' }) }}</b></td>
            <td><b>{{ l({ en: 'Pts', sk: 'Body' }) }}</b></td>
          </tr>
          <tr v-for="(r, i) in floorball.standings.rows" :key="r.team" :class="{ me: isMyTeam(r.team) }">
            <td>{{ i + 2 }}</td>
            <td>{{ r.position }}</td><td class="l">{{ r.team }}</td>
            <td>{{ r.played }}</td><td>{{ r.won }}</td><td>{{ r.wonOt }}</td><td>{{ r.lostOt }}</td><td>{{ r.lost }}</td>
            <td>{{ r.score.replace('-', ':') }}</td><td>{{ r.points }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="tabs" role="tablist">
      <span class="nav" aria-hidden="true">◂ ▸</span>
      <button
        v-for="s in sheets"
        :key="s.id"
        role="tab"
        :aria-selected="sheet === s.id"
        :class="{ on: sheet === s.id }"
        @click="sheet = s.id"
      >
        {{ l(s.label) }}
      </button>
      <span class="upd">{{ l({ en: 'Updated', sk: 'Aktualizované' }) }} {{ updated }}</span>
    </div>
  </div>
</template>

<style scoped>
.fb { display: flex; flex-direction: column; height: 100%; min-height: 0; }
.fbar select { font: inherit; min-width: 0; }
.grid { flex: 1; min-height: 0; overflow: auto; }
.xl tr.me td:not(:first-child) { background: #fff8d6; font-weight: bold; }
.xl tr.future td:not(:first-child) { color: #8a8a8a; }
.xl td.win { color: #1a7f37; }
.xl td.loss { color: #b42318; }
.xl a { color: #0645ad; }
.tabs {
  flex: none; display: flex; align-items: flex-end; gap: 0; padding: 0 6px 3px;
  background: var(--face); border-top: 1px solid #a5acb5; overflow-x: auto;
}
.tabs .nav { color: #666; padding: 2px 8px 2px 0; letter-spacing: 2px; font-size: 10px; }
.tabs button {
  /* reset xp.css button look into an Excel sheet tab */
  all: unset; cursor: pointer; padding: 2px 12px 3px; margin-right: -1px;
  background: #e4e7ec; border: 1px solid #8c96a3; border-top: none;
  border-radius: 0 0 4px 4px; font-size: 11px; white-space: nowrap;
}
.tabs button.on { background: #fff; font-weight: bold; position: relative; top: -1px; padding-bottom: 4px; }
.tabs button:focus-visible { outline: 1px dotted #000; outline-offset: -3px; }
.tabs .upd { margin-left: auto; padding-left: 12px; color: #666; font-size: 11px; white-space: nowrap; }
@media (max-width: 700px) { .tabs button { padding-top: 8px; padding-bottom: 8px; } .tabs .nav { font-size: 12px; } }
</style>
