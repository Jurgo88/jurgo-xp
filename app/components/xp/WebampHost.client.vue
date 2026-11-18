<script setup lang="ts">
// Real Winamp 2.x (classic skin, EQ, playlist) via Webamp. Client only.
// Audio: only MP3s we host ourselves (see data/personal.ts `tracks`).
// Spotify can't be played inside Webamp; a "now playing" feed comes later.
import { tracks } from '~/data/personal'
import { useWindowsStore } from '~/stores/windows'

const store = useWindowsStore()
const anchor = ref<HTMLElement>()
let webamp: { reopen(): void; dispose(): void; close(): void } | null = null
let disposed = false

function onDocPointer(e: PointerEvent) {
  if ((e.target as HTMLElement | null)?.closest?.('#webamp')) store.focus('music')
}

onMounted(async () => {
  const { default: Webamp } = await import('webamp')
  if (disposed || !anchor.value) return
  const instance = new Webamp({
    initialTracks: tracks.map(t => ({ url: t.url, duration: t.duration, metaData: { artist: t.artist, title: t.title } })),
    zIndex: 5000,
  })
  instance.onClose(() => store.close('music'))
  instance.onMinimize(() => store.minimize('music'))
  await instance.renderWhenReady(anchor.value)
  webamp = instance
  document.addEventListener('pointerdown', onDocPointer, true)
})

watch(() => store.get('music')?.minimized, (min, prev) => {
  if (prev && !min) webamp?.reopen()
})

onBeforeUnmount(() => {
  disposed = true
  document.removeEventListener('pointerdown', onDocPointer, true)
  webamp?.dispose()
  webamp = null
})
</script>

<template>
  <div ref="anchor" class="webamp-anchor" style="position:absolute;left:40%;top:12%;width:275px;height:348px;pointer-events:none" />
</template>
