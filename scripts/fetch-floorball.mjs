#!/usr/bin/env node
// Pulls Jurgo's floorball stats from legendarnaliga.sk into app/data/floorball.json.
//
// Runs before every `npm run generate` (Netlify build) and weekly from
// .github/workflows/floorball.yml. If the league site is down or its markup
// changes, the committed JSON stays as it is and the build carries on.
//
//   node scripts/fetch-floorball.mjs          # update the JSON
//   node scripts/fetch-floorball.mjs --check  # fetch + print, write nothing

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { parse } from 'node-html-parser'
import { parseMatches, parsePlayerStats, parseSeasons, parseStandings } from './floorball-parse.mjs'

const BASE = 'https://legendarnaliga.sk'
const LEAGUE = 'Legendárna florbalová liga'
const TEAM = { name: 'Dynamo TyPilsi', path: '/tim/dynamo-typilsi/' }
const PLAYER = { name: 'Juraj Paluš', path: '/hrac/88-juraj-palus/' }
const OUT = fileURLToPath(new URL('../app/data/floorball.json', import.meta.url))
const CHECK = process.argv.includes('--check')

async function get(path) {
  const res = await fetch(BASE + path, {
    headers: { 'user-agent': 'jurgo-xp-site-build (+https://jurgo-xp.netlify.app)' },
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`${res.status} ${path}`)
  return parse(await res.text())
}

const isMe = name => name.toLowerCase().includes('paluš')
const sameTeam = name => name.toLowerCase() === TEAM.name.toLowerCase()
const matchKey = m => `${m.date}|${m.home}|${m.away}`

async function build() {
  const seasons = parseSeasons(await get(TEAM.path))
  if (!seasons.length) throw new Error('no seasons found on the team page')

  const out = []
  for (const s of seasons) {
    const [teamDoc, playerDoc] = await Promise.all([
      get(`${TEAM.path}?sid=${s.id}`),
      get(`${PLAYER.path}?sid=${s.id}`),
    ])
    const players = parsePlayerStats(teamDoc).sort((a, b) => b.points - a.points || b.goals - a.goals)
    const myMatches = new Map(parseMatches(playerDoc.querySelector('#stab_statistic')).map(m => [matchKey(m), m]))
    const matches = parseMatches(teamDoc.querySelector('#stab_matches')).map((m) => {
      const mine = myMatches.get(matchKey(m))
      const home = sameTeam(m.home)
      const played = m.homeGoals !== null
      const gf = home ? m.homeGoals : m.awayGoals
      const ga = home ? m.awayGoals : m.homeGoals
      return {
        date: m.date,
        opponent: home ? m.away : m.home,
        home,
        score: played ? `${gf}:${ga}` : null,
        result: !played ? null : gf > ga ? 'W' : gf < ga ? 'L' : 'D',
        played: Boolean(mine),
        ...(mine?.events ? { events: mine.events } : {}),
      }
    })
    const me = players.find(p => isMe(p.name))
    const finished = matches.filter(m => m.result)
    out.push({
      id: s.id,
      season: s.name,
      league: LEAGUE,
      club: TEAM.name,
      me: {
        number: me?.number ?? null,
        games: myMatches.size,
        goals: me?.goals ?? 0,
        assists: me?.assists ?? 0,
        points: me?.points ?? 0,
        pim: me?.pim ?? 0,
      },
      team: {
        played: finished.length,
        won: finished.filter(m => m.result === 'W').length,
        lost: finished.filter(m => m.result === 'L').length,
        goalsFor: finished.reduce((a, m) => a + Number(m.score.split(':')[0]), 0),
        goalsAgainst: finished.reduce((a, m) => a + Number(m.score.split(':')[1]), 0),
      },
      players,
      matches,
    })
  }
  out.sort((a, b) => b.season.localeCompare(a.season))

  // The standings page only shows the current season.
  let standings = null
  try {
    const groups = parseStandings(await get('/tabulka/'))
    const mine = groups.find(g => g.rows.some(r => sameTeam(r.team)))
    if (mine) standings = { season: out[0].season, group: mine.group, rows: mine.rows }
  }
  catch (e) {
    console.warn(`[floorball] standings skipped: ${e.message}`)
  }

  return {
    source: BASE + TEAM.path,
    team: { name: TEAM.name, url: BASE + TEAM.path },
    player: { name: PLAYER.name, url: BASE + PLAYER.path },
    standings,
    seasons: out,
  }
}

async function main() {
  let data
  try {
    data = await build()
  }
  catch (e) {
    console.warn(`[floorball] fetch failed, keeping the committed data: ${e.message}`)
    return
  }
  if (CHECK) {
    console.log(JSON.stringify(data, null, 2))
    return
  }
  let prev = null
  try { prev = JSON.parse(await readFile(OUT, 'utf8')) }
  catch {}
  const { updatedAt: _ignored, ...prevData } = prev ?? {}
  if (prev && JSON.stringify(prevData) === JSON.stringify(data)) {
    console.log('[floorball] no changes')
    return
  }
  await writeFile(OUT, `${JSON.stringify({ updatedAt: new Date().toISOString(), ...data }, null, 2)}\n`)
  const cur = data.seasons[0]
  console.log(`[floorball] updated: ${data.seasons.length} seasons, ${cur.season}: ${cur.team.played} games played`)
}

main()
