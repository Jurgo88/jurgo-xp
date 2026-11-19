<script setup lang="ts">
import { profile } from '~/data/profile'

// Easter egg from the Recycle Bin: a (harmless) stop error. Any key or tap "restarts".
const emit = defineEmits<{ done: [] }>()
const { locale } = useI18n()

const text = computed(() => locale.value === 'sk'
  ? `Zistil sa problém a systém JurgoXP bol vypnutý, aby sa zabránilo poškodeniu vášho náborového procesu.

UNFIXED_BUGS_EXE_RAN_FROM_RECYCLE_BIN

Ak vidíte túto obrazovku prvýkrát, nebojte sa. Všetky chyby v Koši sú už dávno opravené, opravovať chyby je Jurajova práca.

Ak sa obrazovka zobrazí znova, postupujte takto:

Skontrolujte, či máte dosť kávy. Ak hľadáte developera, napíšte na
${profile.email}. Ak problém pretrváva, otvorte Klasický pohľad.

Technické informácie:

*** STOP: 0x0000H1RE (0x00000010, 0x0000CAFE, 0x00000BA0, 0x00000000)

***  JURGO.SYS - Address F00DBABE base at C0FFEE00, DateStamp 2016

Začína sa výpis fyzickej pamäte...
Výpis pamäte dokončený.

Stlačte ľubovoľný kláves (alebo ťuknite) pre reštart.`
  : `A problem has been detected and JurgoXP has been shut down to prevent damage
to your hiring process.

UNFIXED_BUGS_EXE_RAN_FROM_RECYCLE_BIN

If this is the first time you've seen this stop error screen, don't worry.
Every bug in this Recycle Bin has been fixed long ago. Fixing bugs is what
Juraj does for a living.

If this screen appears again, follow these steps:

Check that you have enough coffee. If you are looking for a developer, write
to ${profile.email}. If problems continue, switch to the Classic view.

Technical information:

*** STOP: 0x0000H1RE (0x00000010, 0x0000CAFE, 0x00000BA0, 0x00000000)

***  JURGO.SYS - Address F00DBABE base at C0FFEE00, DateStamp 2016

Beginning dump of physical memory...
Physical memory dump complete.

Press any key (or tap) to restart.`)

let armed = false
const done = () => { if (armed) emit('done') }
onMounted(() => {
  // don't let the click that opened it close it right away
  setTimeout(() => { armed = true }, 600)
  window.addEventListener('keydown', done)
})
onBeforeUnmount(() => window.removeEventListener('keydown', done))
</script>

<template>
  <div class="bsod" role="alertdialog" aria-label="Stop error" @pointerdown="done">
    <pre>{{ text }}</pre>
  </div>
</template>

<style scoped>
.bsod { position: fixed; inset: 0; z-index: 20000; background: #0000aa; color: #fff; cursor: none; overflow: auto; padding: 24px clamp(12px, 4vw, 48px); }
pre { margin: 0; padding: 0; border: 0; background: none; color: #fff; font: 15px/1.35 'Lucida Console', 'Courier New', monospace; white-space: pre-wrap; max-width: 80ch; }
@media (max-width: 700px) { pre { font-size: 12px; } }
</style>
