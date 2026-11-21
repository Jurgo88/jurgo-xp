<script setup lang="ts">
import type { ProjectShot } from '~/data/projects'

/** Screenshots of one project: a big picture, a thumbnail strip and an
 *  XP "Picture and Fax Viewer" style window to look at them full size. */
const props = defineProps<{ shots: ProjectShot[]; name: string }>()
const { l } = useL10n()

const cur = ref(0)
const open = ref(false)
watch(() => props.shots, () => { cur.value = 0; open.value = false })

const shot = computed(() => props.shots[cur.value]!)
const alt = (i: number) => {
  const s = props.shots[i]!
  return s.caption ? `${props.name}: ${l(s.caption)}` : `Screenshot: ${props.name} (${i + 1})`
}
const go = (d: number) => { cur.value = (cur.value + d + props.shots.length) % props.shots.length }

function onKey(e: KeyboardEvent) {
  if (!open.value) return
  if (e.key === 'Escape') open.value = false
  else if (e.key === 'ArrowRight') go(1)
  else if (e.key === 'ArrowLeft') go(-1)
  else return
  e.preventDefault()
}
// swipe left/right on phones
let x0: number | null = null
const touchStart = (e: TouchEvent) => { x0 = e.touches.length === 1 ? e.touches[0]!.clientX : null }
function touchEnd(e: TouchEvent) {
  if (x0 === null || props.shots.length < 2) return
  const dx = e.changedTouches[0]!.clientX - x0
  x0 = null
  if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
}

const closeBtn = ref<HTMLButtonElement>()
watch(open, async (v) => {
  if (!v) return
  await nextTick()
  closeBtn.value?.focus()
})
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="pgal">
    <figure class="pshot" :class="{ tall: shot.tall }">
      <button type="button" class="pshot-open" :title="l({ en: 'Click to enlarge', sk: 'Kliknutím zväčšíš' })" @click="open = true">
        <img :src="shot.src" :alt="alt(cur)" :width="shot.w" :height="shot.h" decoding="async">
      </button>
      <figcaption v-if="shot.caption">{{ l(shot.caption) }}</figcaption>
    </figure>

    <div v-if="shots.length > 1" class="pthumbs" role="tablist" :aria-label="l({ en: 'Screenshots', sk: 'Screenshoty' })">
      <button
        v-for="(s, i) in shots" :key="s.src" type="button" role="tab" class="pthumb" :class="{ tall: s.tall }"
        :aria-selected="i === cur" :aria-label="alt(i)" @click="cur = i"
      >
        <img :src="s.src" alt="" loading="lazy" decoding="async">
      </button>
    </div>

    <Teleport to="body">
      <div v-if="open" class="pview-bg" @click.self="open = false">
        <section class="window pview" role="dialog" aria-modal="true" :aria-label="alt(cur)">
          <div class="title-bar">
            <div class="title-bar-text"><img src="/icons/paint.svg" alt="">{{ name }} – {{ l({ en: 'Windows Picture and Fax Viewer', sk: 'Prehliadač obrázkov a faxov' }) }}</div>
            <div class="title-bar-controls"><button ref="closeBtn" :aria-label="l({ en: 'Close', sk: 'Zavrieť' })" @click="open = false" /></div>
          </div>
          <div class="pview-img" @touchstart.passive="touchStart" @touchend="touchEnd">
            <img :src="shot.src" :alt="alt(cur)">
          </div>
          <div class="pview-bar">
            <button v-if="shots.length > 1" type="button" class="pview-nav" :aria-label="l({ en: 'Previous picture', sk: 'Predchádzajúci obrázok' })" @click="go(-1)">◀</button>
            <span class="pview-cap">
              <b v-if="shots.length > 1">{{ cur + 1 }} / {{ shots.length }}</b>
              <span v-if="shot.caption">{{ l(shot.caption) }}</span>
            </span>
            <button v-if="shots.length > 1" type="button" class="pview-nav" :aria-label="l({ en: 'Next picture', sk: 'Nasledujúci obrázok' })" @click="go(1)">▶</button>
          </div>
        </section>
      </div>
    </Teleport>
  </div>
</template>
