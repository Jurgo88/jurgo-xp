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

## Čo treba doplniť (TODO)

- Florbal: klub, odkaz na štatistiky ligy, reálne čísla v `app/data/personal.ts`.
- Blog: texty príspevkov v `personal.ts`.
- Hudba: vlastné MP3 do `public/music/` a zoznam `tracks`.
- Ďalšie športy a fotky.
- Originálne XP ikony: v `public/icons/` sú originálne len `my-computer.png`, `folder.png`, `network.png`, `tasks.png` (z repa xp); ostatné sú dočasné SVG v XP štýle. Stačí nahradiť súbor s rovnakým názvom (alebo zmeniť cestu v `app/data/apps.ts`).

## Nasadenie

Netlify: build `npm run generate`, publish `dist` (Nitro preset netlify-static) (viď `netlify.toml`). Súčasný jurgo.sk (portfolio-v2) beží ďalej; doménu prepneme, keď bude tento web hotový.
