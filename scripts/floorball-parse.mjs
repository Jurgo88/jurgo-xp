// Pure parsers for legendarnaliga.sk (WordPress + JoomSport) pages.
// They only use querySelector(All), textContent and getAttribute, so they work
// with node-html-parser in Node and with DOMParser in a browser.

const txt = el => (el?.textContent ?? '').replace(/\s+/g, ' ').trim()
const num = s => {
  const n = Number.parseInt(String(s).replace(/[^\d-]/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}
// "Peter Čuporák ,,VÝNIMKA´´" -> "Peter Čuporák" (league roster exception flag)
const cleanName = s => s.replace(/,,.*$/, '').trim()

/** Seasons from the season picker: [{ id: '8709', name: '2025/2026' }] */
export function parseSeasons(doc) {
  return [...doc.querySelectorAll('select[name="sid"] option')].map(seasonOpt).filter(Boolean)
}
function seasonOpt(o) {
  const id = o.getAttribute('value')
  const name = txt(o)
  return id && id !== '0' && /\d{4}\/\d{4}/.test(name) ? { id, name } : null
}

/** "28-09-2025 17:00" -> "2025-09-28T17:00" */
function isoDate(s) {
  const m = s.match(/(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}:\d{2}))?/)
  return m ? `${m[3]}-${m[2]}-${m[1]}${m[4] ? `T${m[4]}` : ''}` : s
}

/**
 * Match rows (team page #stab_matches, player page #stab_statistic).
 * On the player page the cell after the away team lists his events,
 * e.g. "AsistenciaAsistenciaGól".
 */
export function parseMatches(container) {
  if (!container) return []
  const rows = [...container.querySelectorAll('.jstable-row')]
  return rows.map((row) => {
    const time = row.querySelector('.jsMatchDivTime')
    const home = row.querySelector('.jsMatchDivHome')
    const away = row.querySelector('.jsMatchDivAway')
    const scoreEl = row.querySelector('.jsMatchDivScore')
    if (!time || !home || !away || !scoreEl) return null
    const score = txt(scoreEl)
    const m = score.match(/(\d+)\s*-\s*(\d+)/)
    const venue = txt(row.querySelector('.jsMatchDivVenue')) || undefined
    // Events: plain cells (no jsMatchDiv* class) after the away team.
    const extra = [...row.querySelectorAll('.jstable-cell')]
      .filter(c => !/jsMatchDiv/.test(c.getAttribute('class') || ''))
      .map(txt).join(' ')
    const count = re => (extra.match(re) || []).length
    const events = extra
      ? { goals: count(/Gól/g), assists: count(/Asistencia/g), penalties: count(/trest/gi) }
      : undefined
    return {
      date: isoDate(txt(time)),
      home: txt(home),
      away: txt(away),
      homeGoals: m ? Number(m[1]) : null,
      awayGoals: m ? Number(m[2]) : null,
      venue,
      ...(events ? { events } : {}),
    }
  }).filter(Boolean)
}

/** Team page player stats table (#stab_players_stats). */
export function parsePlayerStats(doc) {
  const table = doc.querySelector('#stab_players_stats table')
  if (!table) return []
  const head = [...table.querySelectorAll('th')].map(txt)
  const col = name => head.findIndex(h => h.toLowerCase() === name.toLowerCase())
  const iG = col('Gól'), iA = col('Asistencia')
  const iPen = ['Menší trest', 'Väčší trest', 'Osobný trest'].map(col).filter(i => i >= 0)
  return [...table.querySelectorAll('tbody tr')].map((tr) => {
    const cells = [...tr.querySelectorAll('td')].map(txt)
    if (cells.length < head.length) return null
    const m = cells[0].match(/^(\d+)\s+(.*)$/)
    const goals = iG >= 0 ? num(cells[iG]) : 0
    const assists = iA >= 0 ? num(cells[iA]) : 0
    return {
      number: m ? Number(m[1]) : null,
      name: cleanName(m ? m[2] : cells[0]),
      goals,
      assists,
      points: goals + assists,
      pim: iPen.reduce((a, i) => a + num(cells[i]), 0),
    }
  }).filter(Boolean)
}

/** League standings page: every table with the group heading before it. */
export function parseStandings(doc) {
  const out = []
  const tables = [...doc.querySelectorAll('table')]
  const headings = [...doc.querySelectorAll('h1,h2,h3,h4,h5,h6')]
  for (const table of tables) {
    const head = [...table.querySelectorAll('thead th')].map(txt)
    if (!head.some(h => /Tímy/i.test(h))) continue
    const rows = [...table.querySelectorAll('tbody tr')].map((tr) => {
      const c = [...tr.querySelectorAll('td')].map(txt)
      if (c.length < 9) return null
      return {
        position: num(c[0]), team: c[1], played: num(c[2]),
        won: num(c[3]), wonOt: num(c[4]), lostOt: num(c[5]), lost: num(c[6]),
        score: c[7].replace(/\s+/g, ''), points: num(c[8]),
      }
    }).filter(Boolean)
    out.push({ group: null, rows })
  }
  // Group names ("Skupina 'A'") in document order, matched to tables in order.
  const groups = headings.map(txt).filter(h => /skupina/i.test(h))
  out.forEach((t, i) => { t.group = groups[i] ? groups[i].replace(/[,'\\´`"]/g, '').replace(/\s+/g, ' ').trim() : null })
  return out
}
