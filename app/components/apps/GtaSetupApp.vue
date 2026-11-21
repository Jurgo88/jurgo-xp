<script setup lang="ts">
import type { L10n } from '~/data/l10n'
import { useWindowsStore } from '~/stores/windows'

/**
 * Prank installer behind the GTA_VI_setup.exe desktop icon.
 * Welcome -> license -> system check (an old XP PC fails everything but patience)
 * -> install that stalls at 99 % and overheats -> "coffee break" -> CV or Minesweeper.
 * Nothing is downloaded; it is all timers.
 */
type Step = 'welcome' | 'license' | 'declined' | 'check' | 'install' | 'coffee'

const { l, locale } = useL10n()
const { pathFor } = useApps()
const localePath = useLocalePath()
const { $track } = useNuxtApp()
const status = useState<string>('status-gta-setup', () => '')

const step = ref<Step>('welcome')
const agreed = ref<boolean | null>(null)
const checked = ref(0) // rows of the system check revealed so far
const progress = ref(0)
const temp = ref(41)
const stalled = ref(false)
const fileName = ref('')

const track = (stage: string) => $track?.('gta_prank', { stage, lang: locale.value }, `gta_prank_${stage}`)

const license: L10n[] = [
  { sk: 'Súhlasím, že nebudem spať, kým nedohrám hlavnú dejovú líniu.', en: 'I agree not to sleep until I finish the main story.' },
  { sk: 'Beriem na vedomie, že „ešte jedna misia“ znamená do 3:00 ráno.', en: 'I understand that "just one more mission" means until 3 AM.' },
  { sk: 'Nebudem tvrdiť, že sa „len pozriem, ako vyzerá mapa“.', en: 'I will not claim I am "just checking out the map".' },
  { sk: 'Za zhorený procesor, stratených priateľov a nevyspatosť inštalátor nezodpovedá.', en: 'The installer is not liable for a melted CPU, lost friends or lack of sleep.' },
  { sk: 'Toto je vtip. Nič sa nesťahuje a žiadna hra tu nie je.', en: 'This is a joke. Nothing is downloaded and there is no game here.' },
]

const checks: { name: L10n; need: L10n; have: L10n; ok: boolean }[] = [
  { name: { sk: 'Procesor', en: 'Processor' }, need: { sk: '8 jadier', en: '8 cores' }, have: { sk: 'Pentium 4, 1,6 GHz', en: 'Pentium 4, 1.6 GHz' }, ok: false },
  { name: { sk: 'Operačná pamäť', en: 'Memory' }, need: { sk: '16 GB', en: '16 GB' }, have: { sk: '256 MB', en: '256 MB' }, ok: false },
  { name: { sk: 'Grafická karta', en: 'Graphics card' }, need: { sk: 'ray tracing', en: 'ray tracing' }, have: { sk: 'GeForce4 MX 440', en: 'GeForce4 MX 440' }, ok: false },
  { name: { sk: 'Voľné miesto', en: 'Free disk space' }, need: { sk: '150 GB', en: '150 GB' }, have: { sk: '20 GB (z toho 19 MP3)', en: '20 GB (19 of it MP3s)' }, ok: false },
  { name: { sk: 'Systém', en: 'System' }, need: { sk: 'niečo z tohto desaťročia', en: 'anything from this decade' }, have: { sk: 'Windows XP SP2', en: 'Windows XP SP2' }, ok: false },
  { name: { sk: 'Trpezlivosť hráča', en: 'Player patience' }, need: { sk: 'veľká', en: 'a lot' }, have: { sk: 'nekonečná', en: 'infinite' }, ok: true },
]

const files = [
  'data/city_map_part01.pak', 'audio/radio_stations.pak', 'textures/sunset_4k.pak', 'cars/everything.pak',
  'npc/people_waiting_in_traffic.pak', 'shaders/reflections_in_puddles.bin', 'data/city_map_part02.pak', 'save/one_more_mission.sav',
]

const titles: Record<Step, L10n> = {
  welcome: { sk: 'Vitajte v sprievodcovi inštaláciou GTA VI', en: 'Welcome to the GTA VI Setup Wizard' },
  license: { sk: 'Licenčná zmluva', en: 'License Agreement' },
  check: { sk: 'Kontrola systému', en: 'System Check' },
  install: { sk: 'Inštaluje sa', en: 'Installing' },
  coffee: { sk: 'Inštalácia prerušená', en: 'Setup interrupted' },
  declined: { sk: 'Inštalácia zrušená', en: 'Setup cancelled' },
}
const subtitles: Record<Step, L10n> = {
  welcome: { sk: '', en: '' },
  license: { sk: 'Pred inštaláciou si prečítajte tieto dôležité podmienky.', en: 'Please read these important terms before installing.' },
  check: { sk: 'Sprievodca zisťuje, či to váš počítač zvládne.', en: 'Setup is checking whether your computer can handle it.' },
  install: { sk: 'Počkajte, kým sprievodca nainštaluje GTA VI.', en: 'Please wait while Setup installs GTA VI.' },
  coffee: { sk: 'Tvoje PC si dalo pauzu na kávu.', en: 'Your PC is taking a coffee break.' },
  declined: { sk: '', en: '' },
}

const failed = computed(() => checks.filter(c => !c.ok).length)
const checkDone = computed(() => checked.value >= checks.length)
const reduced = () => import.meta.client && matchMedia('(prefers-reduced-motion: reduce)').matches

// ---- timers (all cleared when the window closes) ----
const timers = new Set<ReturnType<typeof setTimeout>>()
function later(fn: () => void, ms: number) {
  const id = setTimeout(() => { timers.delete(id); fn() }, ms)
  timers.add(id)
}
function clearTimers() {
  for (const id of timers) clearTimeout(id)
  timers.clear()
}
onBeforeUnmount(clearTimers)

const body = ref<HTMLElement>()
/** keyboard users: after each step, focus its main button so Enter/Tab keep going */
function focusMain() {
  nextTick(() => body.value?.querySelector<HTMLElement>('[data-main]:not(:disabled)')?.focus({ preventScroll: true }))
}

function go(next: Step) {
  clearTimers()
  step.value = next
  if (next === 'license') track('license')
  if (next === 'declined') track('declined')
  if (next === 'check') startCheck()
  if (next === 'install') startInstall()
  focusMain()
}

function startCheck() {
  track('check')
  checked.value = 0
  status.value = l({ sk: 'Kontrolujem hardvér...', en: 'Checking hardware...' })
  const tick = () => {
    checked.value++
    if (checked.value < checks.length) later(tick, reduced() ? 150 : 650)
    else {
      status.value = l({ sk: `Nesplnené požiadavky: ${failed.value} z ${checks.length}`, en: `Requirements not met: ${failed.value} of ${checks.length}` })
      focusMain()
    }
  }
  later(tick, 500)
}

function startInstall() {
  track('install')
  progress.value = 0
  temp.value = 41
  stalled.value = false
  const tick = () => {
    // fast at first, then slower and slower, like every real installer
    const left = 99 - progress.value
    progress.value = Math.min(99, progress.value + Math.max(1, Math.round(left * 0.12 * (0.5 + Math.random()))))
    temp.value = Math.round(41 + progress.value * 0.57)
    fileName.value = files[Math.floor(progress.value / 13) % files.length]!
    status.value = l({ sk: `Inštalujem... ${progress.value} %`, en: `Installing... ${progress.value}%` })
    if (progress.value < 99) later(tick, reduced() ? 120 : 280 + Math.random() * 320)
    else {
      stalled.value = true
      fileName.value = 'save/one_more_mission.sav'
      status.value = l({ sk: 'Inštalujem... 99 % (zostáva približne 3 roky)', en: 'Installing... 99% (about 3 years left)' })
      later(() => {
        temp.value = 99
        later(() => { status.value = l({ sk: 'Pauza na kávu', en: 'Coffee break' }); track('coffee'); go('coffee') }, 900)
      }, 2600)
    }
  }
  later(tick, 400)
}

function exit(to: 'cv' | 'minesweeper') {
  track(`exit_${to}`)
  navigateTo(to === 'cv' ? localePath('/cv') : pathFor('minesweeper'))
}

const store = useWindowsStore()
function cancel() {
  store.close('gta-setup')
}
</script>

<template>
  <div ref="body" class="gs" :class="`step-${step}`">
    <!-- welcome and the final page use the big side panel, like real XP wizards -->
    <div v-if="step === 'welcome' || step === 'coffee' || step === 'declined'" class="gs-split">
      <div class="gs-side" aria-hidden="true">
        <img src="/icons/setup.svg" alt="" width="72" height="72">
      </div>
      <div class="gs-text">
        <h2>{{ l(titles[step]) }}</h2>
        <template v-if="step === 'welcome'">
          <p>{{ l({ sk: 'Sprievodca vám pomôže nainštalovať GTA VI na tento počítač.', en: 'This wizard will help you install GTA VI on this computer.' }) }}</p>
          <p>{{ l({ sk: 'Pred pokračovaním odporúčame zatvoriť všetky ostatné programy, otvoriť okno a pripraviť hasiaci prístroj.', en: 'Before you continue, close all other programs, open a window and keep a fire extinguisher nearby.' }) }}</p>
          <p class="gs-small">{{ l({ sk: 'Pre pokračovanie kliknite na Ďalej.', en: 'Click Next to continue.' }) }}</p>
        </template>
        <template v-else-if="step === 'declined'">
          <div class="gs-coffee" aria-hidden="true">💤</div>
          <p><b>{{ l({ sk: 'Rozumné rozhodnutie.', en: 'A wise choice.' }) }}</b></p>
          <p>{{ l({ sk: 'Bez súhlasu s nespaním to nepôjde. Choď sa vyspať, tvoj procesor ti ďakuje.', en: 'No install without the no-sleep clause. Go get some sleep, your CPU thanks you.' }) }}</p>
          <p>{{ l({ sk: 'Alebo si medzitým pozri niečo užitočnejšie:', en: 'Or check out something more useful in the meantime:' }) }}</p>
          <div class="gs-exits">
            <button type="button" data-main @click="cancel">{{ l({ sk: 'Zavrieť', en: 'Close' }) }}</button>
            <button type="button" @click="exit('cv')">
              <img src="/icons/pdf.svg" alt="" width="16" height="16">{{ l({ sk: 'Pozrieť moje CV', en: 'Look at my CV' }) }}
            </button>
          </div>
        </template>
        <template v-else>
          <div class="gs-coffee" aria-hidden="true">☕</div>
          <p><b>{{ l({ sk: 'Tvoje PC si dalo pauzu na kávu.', en: 'Your PC is taking a coffee break.' }) }}</b></p>
          <p>{{ l({ sk: 'Inštalácia sa zastavila na 99 % a procesor dosiahol 99 °C. Ventilátor podal výpoveď.', en: 'Setup stopped at 99% and the CPU reached 99 °C. The fan has handed in its notice.' }) }}</p>
          <p>{{ l({ sk: 'Kým vychladne, mám dva lepšie nápady:', en: 'While it cools down, here are two better ideas:' }) }}</p>
          <div class="gs-exits">
            <button type="button" data-main @click="exit('cv')">
              <img src="/icons/pdf.svg" alt="" width="16" height="16">{{ l({ sk: 'Pozrieť radšej moje CV', en: 'Look at my CV instead' }) }}
            </button>
            <button type="button" @click="exit('minesweeper')">
              <img src="/icons/minesweeper.svg" alt="" width="16" height="16">{{ l({ sk: 'Zahrať si Míny', en: 'Play Minesweeper' }) }}
            </button>
          </div>
        </template>
      </div>
    </div>

    <template v-else>
      <div class="gs-head">
        <div>
          <b>{{ l(titles[step]) }}</b>
          <span>{{ l(subtitles[step]) }}</span>
        </div>
        <img src="/icons/setup.svg" alt="" width="40" height="40">
      </div>

      <div class="gs-content">
        <template v-if="step === 'license'">
          <ol class="gs-license" tabindex="0" :aria-label="l(titles.license)">
            <li v-for="(t, i) in license" :key="i">{{ l(t) }}</li>
          </ol>
          <fieldset class="gs-agree">
            <legend class="gs-sr">{{ l(titles.license) }}</legend>
            <div class="field-row">
              <input id="gs-yes" v-model="agreed" type="radio" name="gs-agree" :value="true">
              <label for="gs-yes">{{ l({ sk: 'Súhlasím so všetkým, aj s tým nespaním', en: 'I accept everything, even the no-sleep part' }) }}</label>
            </div>
            <div class="field-row">
              <input id="gs-no" v-model="agreed" type="radio" name="gs-agree" :value="false">
              <label for="gs-no">{{ l({ sk: 'Nesúhlasím (a pôjdem spať)', en: 'I do not accept (and I will go to bed)' }) }}</label>
            </div>
          </fieldset>
        </template>

        <template v-else-if="step === 'check'">
          <table class="gs-check">
            <thead>
              <tr>
                <th scope="col">{{ l({ sk: 'Komponent', en: 'Component' }) }}</th>
                <th scope="col">{{ l({ sk: 'Treba', en: 'Required' }) }}</th>
                <th scope="col">{{ l({ sk: 'Tento počítač', en: 'This computer' }) }}</th>
                <th scope="col"><span class="gs-sr">{{ l({ sk: 'Výsledok', en: 'Result' }) }}</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(c, i) in checks" :key="i" :class="{ pending: i >= checked }">
                <th scope="row">{{ l(c.name) }}</th>
                <td>{{ l(c.need) }}</td>
                <td>{{ i < checked ? l(c.have) : '…' }}</td>
                <td class="gs-res">
                  <span v-if="i < checked" :class="c.ok ? 'ok' : 'bad'" role="img" :aria-label="c.ok ? 'OK' : l({ sk: 'nevyhovuje', en: 'fails' })">{{ c.ok ? '✔' : '✖' }}</span>
                  <span v-else class="gs-spin" aria-hidden="true" />
                </td>
              </tr>
            </tbody>
          </table>
          <p class="gs-verdict" aria-live="polite">
            <template v-if="checkDone">
              {{ l({ sk: `Váš počítač nespĺňa ${failed} z ${checks.length} požiadaviek. Trpezlivosti však máte dosť. Chcete to skúsiť aj tak?`, en: `Your computer fails ${failed} of ${checks.length} requirements. But you have plenty of patience. Try anyway?` }) }}
            </template>
          </p>
        </template>

        <template v-else-if="step === 'install'">
          <p class="gs-file">{{ l({ sk: 'Kopírujú sa súbory:', en: 'Copying files:' }) }} <code>{{ fileName }}</code></p>
          <div
            class="gs-bar"
            role="progressbar"
            :aria-valuenow="progress"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="l(titles.install)"
          >
            <div :style="{ width: `${progress}%` }" />
          </div>
          <p class="gs-pct" aria-live="polite">
            {{ progress }} %
            <template v-if="stalled"> · {{ l({ sk: 'zostáva približne 3 roky', en: 'about 3 years left' }) }}</template>
          </p>
          <div class="gs-heat" :class="{ hot: temp > 80 }">
            <svg class="gs-fan" :class="{ fast: progress > 60 }" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
              <circle cx="16" cy="16" r="15" fill="#e8e8e8" stroke="#666" />
              <g fill="#5a6f8f">
                <path d="M16 16c-1-6 1-11 5-11 2 3 0 8-5 11z" />
                <path d="M16 16c-1-6 1-11 5-11 2 3 0 8-5 11z" transform="rotate(120 16 16)" />
                <path d="M16 16c-1-6 1-11 5-11 2 3 0 8-5 11z" transform="rotate(240 16 16)" />
              </g>
              <circle cx="16" cy="16" r="3" fill="#333" />
            </svg>
            <div>
              <b>{{ l({ sk: 'Teplota procesora', en: 'CPU temperature' }) }}: {{ temp }} °C</b>
              <small>{{ temp > 90
                ? l({ sk: 'Na procesore by sa dalo smažiť vajíčko.', en: 'You could fry an egg on the CPU.' })
                : temp > 70
                  ? l({ sk: 'Ventilátor znie ako štartujúce lietadlo.', en: 'The fan sounds like a plane taking off.' })
                  : l({ sk: 'Zatiaľ v pohode.', en: 'All good so far.' }) }}</small>
            </div>
          </div>
        </template>
      </div>
    </template>

    <div class="gs-foot">
      <template v-if="step === 'declined'">
        <button type="button" @click="go('license')">{{ l({ sk: '< Späť', en: '< Back' }) }}</button>
        <button type="button" disabled>{{ l({ sk: 'Ďalej >', en: 'Next >' }) }}</button>
        <button type="button" class="gs-cancel" @click="cancel">{{ l({ sk: 'Zrušiť', en: 'Cancel' }) }}</button>
      </template>
      <template v-else-if="step !== 'coffee'">
        <button v-if="step !== 'welcome'" type="button" :disabled="step === 'install'" @click="go(step === 'license' ? 'welcome' : 'license')">
          {{ l({ sk: '< Späť', en: '< Back' }) }}
        </button>
        <button v-if="step === 'welcome'" type="button" data-main @click="go('license')">{{ l({ sk: 'Ďalej >', en: 'Next >' }) }}</button>
        <button v-else-if="step === 'license'" type="button" data-main :disabled="agreed === null" @click="go(agreed ? 'check' : 'declined')">{{ l({ sk: 'Ďalej >', en: 'Next >' }) }}</button>
        <button v-else-if="step === 'check'" type="button" data-main :disabled="!checkDone" @click="go('install')">{{ l({ sk: 'Inštalovať aj tak', en: 'Install anyway' }) }}</button>
        <button v-else type="button" disabled>{{ l({ sk: 'Ďalej >', en: 'Next >' }) }}</button>
        <button type="button" class="gs-cancel" @click="cancel">{{ l({ sk: 'Zrušiť', en: 'Cancel' }) }}</button>
      </template>
      <template v-else>
        <button type="button" @click="go('welcome')">{{ l({ sk: 'Skúsiť znova', en: 'Try again' }) }}</button>
        <button type="button" class="gs-cancel" @click="cancel">{{ l({ sk: 'Zavrieť', en: 'Close' }) }}</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.gs { height: 100%; display: flex; flex-direction: column; background: var(--face, #ece9d8); font: 11px var(--ui, Tahoma, sans-serif); color: #000; }
.gs p { margin: 0 0 10px; line-height: 1.45; }
.gs-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

/* welcome / finish: blue side panel + white text area */
.gs-split { flex: 1; min-height: 0; display: grid; grid-template-columns: 150px 1fr; background: #fff; }
.gs-side { background: linear-gradient(180deg, #2b5fd9 0%, #1941a5 55%, #0f2f7d 100%); display: flex; justify-content: center; padding-top: 28px; }
.gs-side img { filter: drop-shadow(2px 3px 3px rgba(0, 0, 0, .4)); }
.gs-text { padding: 18px 20px; overflow: auto; }
.gs-text h2 { margin: 0 0 14px; font: bold 16px var(--ui, Tahoma, sans-serif); line-height: 1.25; }
.gs-small { color: #555; }
.gs-coffee { font-size: 34px; line-height: 1; margin-bottom: 8px; }
.gs-exits { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
.gs-exits button { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; }

/* inner pages: white header strip */
.gs-head { flex: none; display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 10px 14px 10px 22px; background: #fff; border-bottom: 1px solid #aca899; }
.gs-head b { display: block; margin-bottom: 3px; }
.gs-head span { display: block; padding-left: 14px; }
.gs-content { flex: 1; min-height: 0; overflow: auto; padding: 12px 22px; }

.gs-license { margin: 0 0 10px; padding: 8px 8px 8px 28px; height: 130px; overflow: auto; background: #fff; border: 1px solid #7f9db9; }
.gs-license li { margin-bottom: 6px; line-height: 1.4; }
.gs-agree { border: 0; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }

.gs-check { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #7f9db9; }
.gs-check th, .gs-check td { text-align: left; padding: 4px 6px; border-bottom: 1px solid #eee; }
.gs-check thead th { background: linear-gradient(#fff, #ebeadb); border-bottom: 1px solid #d0cfc4; font-weight: normal; }
.gs-check tbody th { font-weight: bold; }
.gs-check tr.pending { color: #888; }
.gs-res { width: 22px; text-align: center !important; }
.gs-res .ok { color: #1a8f1a; font-weight: bold; }
.gs-res .bad { color: #d21c1c; font-weight: bold; }
.gs-spin { display: inline-block; width: 9px; height: 9px; border: 2px solid #c9c9c9; border-top-color: #2b5fd9; border-radius: 50%; animation: gs-rot .8s linear infinite; }
.gs-verdict { margin-top: 10px !important; min-height: 2.9em; }

.gs-file { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gs-file code { font: 11px var(--ui, Tahoma, sans-serif); }
.gs-bar { height: 16px; padding: 2px; background: #fff; border: 1px solid #686868; border-radius: 3px; box-shadow: inset 0 0 1px #000; }
.gs-bar div { height: 100%; transition: width .25s; background: linear-gradient(#acedad, #7be47d 30%, #4cda50 60%, #35c837); -webkit-mask: repeating-linear-gradient(90deg, #000 0 7px, transparent 7px 9px); mask: repeating-linear-gradient(90deg, #000 0 7px, transparent 7px 9px); }
.gs-pct { margin: 4px 0 14px !important; text-align: right; color: #333; }
.gs-heat { display: flex; align-items: center; gap: 10px; padding: 8px; border: 1px solid #d0cfc4; background: #fff; transition: background .4s; }
.gs-heat.hot { background: #fff1e6; border-color: #e7a46a; }
.gs-heat b, .gs-heat small { display: block; }
.gs-heat small { color: #555; margin-top: 2px; }
.gs-fan { flex: none; animation: gs-rot 1.2s linear infinite; }
.gs-fan.fast { animation-duration: .25s; }

.gs-foot { flex: none; display: flex; justify-content: flex-end; gap: 6px; padding: 10px 12px; border-top: 1px solid #aca899; box-shadow: inset 0 1px #fff; }
.gs-cancel { margin-left: 10px; }

@keyframes gs-rot { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .gs-fan, .gs-spin { animation: none; }
  .gs-bar div { transition: none; }
}
@media (max-width: 700px) {
  .gs-split { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
  .gs-side { padding: 12px 0; }
  .gs-side img { width: 48px; height: 48px; }
  .gs-head { padding-left: 14px; }
  .gs-head span { padding-left: 0; }
  .gs-content { padding: 12px 14px; }
  .gs-check { font-size: 11px; }
  .gs-check th, .gs-check td { padding: 4px 3px; }
  .gs-foot { flex-wrap: wrap; }
  .gs-cancel { margin-left: 0; }
}
</style>
