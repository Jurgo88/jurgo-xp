#!/usr/bin/env node
// Weekly analytics numbers for jurgo.sk from PostHog, printed as compact JSON.
// Used by the scheduled weekly report (Claude turns the JSON into a short Slovak summary).
//
//   POSTHOG_PERSONAL_API_KEY=phx_... node scripts/weekly-report.mjs [days=7]
//
// The key needs read scopes only (query:read, project:read). Behind an HTTP proxy run Node
// with NODE_USE_ENV_PROXY=1. Counts exclude test accounts (cohort below) and non-jurgo.sk hosts
// (deploy previews); Jurgo's own devices opt out with ?notrack=1 and send nothing.

const HOST = 'https://eu.posthog.com'
const PROJECT = 159818
const TEST_COHORT = 105859
const key = process.env.POSTHOG_PERSONAL_API_KEY
if (!key) {
  console.error('POSTHOG_PERSONAL_API_KEY is not set')
  process.exit(1)
}
const days = Number(process.argv[2] || 7)

const base = `properties.$host = 'jurgo.sk' AND person_id NOT IN COHORT ${TEST_COHORT}`
const cur = `timestamp > now() - INTERVAL ${days} DAY`
const prev = `timestamp > now() - INTERVAL ${days * 2} DAY AND timestamp <= now() - INTERVAL ${days} DAY`

async function q(sql) {
  const res = await fetch(`${HOST}/api/projects/${PROJECT}/query/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query: sql }, name: 'weekly-report' }),
  })
  if (!res.ok) throw new Error(`PostHog ${res.status}: ${(await res.text()).slice(0, 300)}`)
  return (await res.json()).results
}

const pct = (a, b) => (b ? Math.round((a / b) * 100) : null)

const totals = (when) => q(`
  SELECT uniq(person_id), uniq(properties.$session_id), countIf(event = '$pageview')
  FROM events WHERE ${base} AND ${when}`)

const [[cur0], [prev0], sources, campaigns, devices, countries, funnel, windows, assistant, bounce, contacts, cvRoles] =
  await Promise.all([
    totals(cur),
    totals(prev),
    // where sessions came from: referrer of the first event in each session
    q(`SELECT ref, count() AS s FROM (
         SELECT properties.$session_id AS sid, argMin(coalesce(nullIf(properties.$referring_domain, ''), '$direct'), timestamp) AS ref
         FROM events WHERE ${base} AND ${cur} AND sid IS NOT NULL GROUP BY sid)
       GROUP BY ref ORDER BY s DESC LIMIT 6`),
    // tagged links (netlify.toml short links, CV PDFs): who came and what they did, per source+campaign
    q(`SELECT src, camp, uniq(pid), count(), sum(role), sum(cv), sum(contact) FROM (
         SELECT properties.$session_id AS sid, any(person_id) AS pid,
           anyIf(properties.utm_source, properties.utm_source != '') AS src,
           anyIf(properties.utm_campaign, properties.utm_campaign != '') AS camp,
           max(event = 'window_open' AND properties.is_role = true) AS role,
           max(event = 'cv_download') AS cv,
           max(event IN ('contact_click', 'contact_submit')) AS contact
         FROM events WHERE ${base} AND ${cur} AND sid IS NOT NULL GROUP BY sid)
       WHERE src IS NOT NULL AND src != '' GROUP BY src, camp ORDER BY 3 DESC LIMIT 15`),
    q(`SELECT properties.$device_type AS d, uniq(person_id) FROM events
       WHERE ${base} AND ${cur} GROUP BY d ORDER BY 2 DESC`),
    q(`SELECT properties.$geoip_country_code AS c, uniq(person_id) FROM events
       WHERE ${base} AND ${cur} GROUP BY c ORDER BY 2 DESC LIMIT 4`),
    // per-person funnel: visited -> opened a role window -> downloaded CV -> contacted
    q(`SELECT count(), countIf(role), countIf(cv), countIf(contact), countIf(sent) FROM (
         SELECT person_id,
           max(event = 'window_open' AND properties.is_role = true) AS role,
           max(event = 'cv_download') AS cv,
           max(event IN ('contact_click', 'contact_submit')) AS contact,
           max(event = 'contact_submit') AS sent
         FROM events WHERE ${base} AND ${cur} GROUP BY person_id)`),
    q(`SELECT properties.app AS a, uniq(person_id) AS p, count() FROM events
       WHERE ${base} AND ${cur} AND event = 'window_open' GROUP BY a ORDER BY p DESC LIMIT 10`),
    q(`SELECT uniqIf(person_id, event = 'assistant_message'), countIf(event = 'assistant_message'),
         uniqIf(person_id, event = 'window_open' AND properties.app = 'assistant')
       FROM events WHERE ${base} AND ${cur}`),
    // quick exits: sessions under 10 s with no window opened, by device
    q(`SELECT dev, count() AS sessions, countIf(dur < 10 AND opens = 0) AS quick FROM (
         SELECT properties.$session_id AS sid, any(properties.$device_type) AS dev,
           dateDiff('second', min(timestamp), max(timestamp)) AS dur,
           countIf(event = 'window_open') AS opens
         FROM events WHERE ${base} AND ${cur} AND sid IS NOT NULL GROUP BY sid)
       GROUP BY dev ORDER BY sessions DESC`),
    q(`SELECT properties.channel AS ch, uniq(person_id) FROM events
       WHERE ${base} AND ${cur} AND event = 'contact_click' GROUP BY ch ORDER BY 2 DESC`),
    q(`SELECT properties.role AS r, count() FROM events
       WHERE ${base} AND ${cur} AND event = 'cv_download' GROUP BY r ORDER BY 2 DESC`),
  ])

const [people, roleP, cvP, contactP, sentP] = funnel[0]
const out = {
  days,
  generated: new Date().toISOString(),
  visitors: cur0[0],
  visitorsPrev: prev0[0],
  trendPct: prev0[0] ? Math.round(((cur0[0] - prev0[0]) / prev0[0]) * 100) : null,
  sessions: cur0[1],
  pageviews: cur0[2],
  sessionSources: Object.fromEntries(sources),
  tagged: campaigns.map(([source, campaign, persons, sessions, role, cv, contact]) =>
    ({ source, campaign: campaign || undefined, persons, sessions, openedRole: role, cvDownload: cv, contact })),
  devices: Object.fromEntries(devices),
  countries: Object.fromEntries(countries),
  funnel: { people, openedRole: roleP, cvDownload: cvP, contact: contactP, formSent: sentP },
  cvByRole: Object.fromEntries(cvRoles),
  contactByChannel: Object.fromEntries(contacts),
  windows: windows.map(([app, persons, opens]) => ({ app, persons, opens })),
  assistant: { opened: assistant[0][2], chatted: assistant[0][0], messages: assistant[0][1] },
  quickExits: bounce.map(([device, sessions, quick]) => ({ device, sessions, quick, pct: pct(quick, sessions) })),
}
console.log(JSON.stringify(out))
