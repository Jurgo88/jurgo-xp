# JurgoXP – jurgo.sk

Osobný web Juraja Paluša v podobe plochy Windows XP. Nuxt 4, xp.css, Pinia, @nuxtjs/i18n (EN predvolene, SK na `/sk`), Webamp.

## Spustenie

```bash
npm install
npm run dev        # http://localhost:3002
npm run generate   # statický build do .output/public (toto beží na Netlify)
```

Užitočné URL parametre: `?boot` vždy prehrá bootovanie, `?noboot` ho preskočí.

## Ako to funguje

- **Každé okno má vlastnú URL** (`/frontend`, `/sk/floorball`…). Stránka `app/pages/[[app]].vue` otvorí okno podľa URL a pri zmene fokusu URL aktualizuje. Všetky URL sa prerenderujú, takže obsah okna je v HTML (SEO, priame odkazy pre recruiterov).
- **Správca okien** je Pinia store `app/stores/windows.ts` (otvorenie, fokus/z-index, minimalizácia, maximalizácia, presun, zmena veľkosti). Ťahanie cez pointer eventy, funguje myšou aj dotykom.
- **Obsah** je v `app/data/` – ikony a okná sa generujú z dát (`apps.ts`), roly v `roles.ts`, skúsenosti a projekty prevzaté z portfolio-v2, osobné veci v `personal.ts`.
- **Bootovanie** (`components/xp/BootScreen.vue`): BIOS obrazovka → XP loader → „vitajte“ → plocha. Len pri prvej návšteve (localStorage), dá sa preskočiť. Inline skript v `app.vue` skryje plochu ešte pred prvým vykreslením, aby nepreblikla.
- **Pozadie**: predvolene Bliss (`public/bliss.jpg`). Návštevník si môže dať vlastný obrázok (pravý klik na plochu alebo Štart → Pozadie plochy); ostane len v jeho prehliadači.
- **Winamp**: skutočný Webamp 2.3.1. Hrá len MP3, ktoré hostujeme sami (`public/music/` + `tracks` v `personal.ts`). Spotify sa do Webampu prehrať nedá; „práve počúvam“ cez Netlify funkciu je plán na neskôr.
- **Mobil**: mriežka ikon, okná na celú obrazovku, ťuknutie otvára. **Klasický pohľad** `/cv` je obyčajné CV s prepínaním rolí (`/cv?role=fullstack`).

## CV v PDF

`public/cv/` obsahuje CV pre každú rolu (EN/SK) a všeobecné CV, vygenerované z `Jurgo88/job-hunting-pro` (`cv/build.py`, profily general, frontend, fullstack, analyst, ai) **bez telefónneho čísla**. Po zmene CV ich treba pregenerovať a nakopírovať sem (názvy `Juraj-Palus-CV-<rola>-<en|sk>.pdf`, `Juraj-Palus-CV-<en|sk>.pdf`).

## SEO a analytika

- Titulok, popis, Open Graph a Twitter karta pre každé okno (`app/pages/[[app]].vue`, popisy v `app/data/apps.ts`), hreflang + canonical z `@nuxtjs/i18n` (baseUrl `https://jurgo.sk`), JSON-LD Person/WebSite v `app/app.vue`.
- `/sitemap.xml` a `/robots.txt` sa generujú pri builde (`server/routes/`).
- Obrázok na zdieľanie `public/og-image.png` (1200×630) sa robí z `scripts/og-image.html`: `NODE_PATH=$(npm root -g) node scripts/make-og-image.mjs`.
- Microsoft Clarity + PostHog (rovnaké projekty ako starý jurgo.sk) v `app/plugins/analytics.client.ts`. ID sú v `nuxt.config.ts`, dajú sa prepísať `NUXT_PUBLIC_CLARITY_ID` / `NUXT_PUBLIC_POST_HOG_KEY` (prázdna hodnota = vypnuté). Na localhoste a v automatizovaných prehliadačoch sa nič nenačíta.
- Vlastné eventy: `window_open` (app, is_role, source), `cv_download` (file, role, lang, from), `contact_click` (email, phone, linkedin, github). V Clarity ako `open_<okno>`, `cv_download_<rola>`, `contact_<kanál>` a tag `role`.

## Čo treba doplniť (TODO)

- Florbal: klub, odkaz na štatistiky ligy, reálne čísla v `app/data/personal.ts`.
- Blog: texty príspevkov v `personal.ts`.
- Hudba: vlastné MP3 do `public/music/` a zoznam `tracks`.
- Ďalšie športy a fotky.
- Originálne XP ikony: v `public/icons/` sú originálne len `my-computer.png`, `folder.png`, `network.png`, `tasks.png` (z repa xp); ostatné sú dočasné SVG v XP štýle. Stačí nahradiť súbor s rovnakým názvom (alebo zmeniť cestu v `app/data/apps.ts`).

## Nasadenie

Netlify: build `npm run generate`, publish `dist` (Nitro preset netlify-static) (viď `netlify.toml`). Súčasný jurgo.sk (portfolio-v2) beží ďalej; doménu prepneme, keď bude tento web hotový.

## Spotify ("Práve počúvam")

The Winamp library window (`app/components/apps/SpotifyApp.vue`) reads `/api/spotify`, a Netlify
function (`netlify/functions/spotify.mts`) that uses Jurgo's refresh token. Visitors can't stream
Spotify audio through Webamp, so on desktop his songs are loaded into Webamp's own playlist (silent stand-in URLs), the marquee shows what he is listening to, and double-clicking a Spotify entry plays it in the Spotify embed player docked under Webamp (`WebampHost.client.vue`; full song when the visitor is logged in to Spotify, 30 s preview otherwise). Phones use the separate window. The window polls every 10 s (and right after a song ends); the CDN may reuse a response for 5 s, top tracks are kept 10 min in a warm function.

Netlify env vars (mark as secret, never commit): `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`,
`SPOTIFY_REFRESH_TOKEN`. To get the refresh token once, open `/api/spotify-auth` on the deployed
site (it turns itself off once the token is set). The Spotify app needs the redirect URI
`https://<site>/api/spotify-auth`, and its owner needs Spotify Premium (Development Mode rule).

## AI assistant ("Jurgo Messenger")

An MSN Messenger-style chat window (`app/components/apps/AssistantApp.vue`, app id `assistant`, URL `/assistant`)
that answers recruiters' questions about Jurgo. It posts to `/api/assistant`, a Netlify function
(`netlify/functions/assistant.mts`) that calls the Claude API and streams the answer back as plain text.

- **Grounding**: the model only gets `netlify/lib/assistant-knowledge.ts`, i.e. the public CV text plus the
  site data (`app/data/*`: roles, experience, projects, blog, floorball). No phone number. When you change the
  CV, update the `CV` text there too.
- **Guards**: allowed origins (jurgo.sk, jurgo-xp.netlify.app + deploy previews, localhost), input limits
  (500 chars per question, last 12 messages), per-visitor limits (hashed IP, 20/hour, 60/day) and a site-wide
  daily cost cap, kept in Netlify Blobs; system prompt rules against off-topic use and prompt injection;
  `max_tokens` 700, prompt caching for the big system prompt.
- **Netlify env vars** (mark as secret, never commit): `ANTHROPIC_API_KEY` (required),
  `ASSISTANT_MODEL` (default `claude-haiku-5-5`), `ASSISTANT_DAILY_BUDGET_USD` (default `1`),
  `ASSISTANT_PER_IP_HOUR` (default `20`), `ASSISTANT_PER_IP_DAY` (default `60`).
  Without the key the window shows "Offline" and points to e-mail.
- A Messenger-style "Jurgo AI has just signed in" popup appears once per session ~20 s after the desktop shows.
- Analytics events: `assistant_message`, `assistant_nudge`.
