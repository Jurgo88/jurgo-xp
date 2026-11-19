<script setup lang="ts">
import type { AppId } from '~/data/app-ids'
import { appById } from '~/data/apps'
import { useWindowsStore } from '~/stores/windows'

const props = defineProps<{ id: AppId }>()
const store = useWindowsStore()
const { titleFor } = useApps()
const { t, tm, rt } = useI18n()

const win = computed(() => store.get(props.id)!)
const def = computed(() => appById(props.id)!)
const menu = computed(() =>
  def.value.menu === 'none' ? [] : (tm(`menu_${def.value.menu}`) as unknown[]).map(m => rt(m as never)),
)

const style = computed(() => ({
  left: `${win.value.x}px`,
  top: `${win.value.y}px`,
  width: `${win.value.w}px`,
  height: `${win.value.h}px`,
  zIndex: win.value.z,
}))

// Keyboard users: when a window becomes the active one (opened, picked on the taskbar,
// or the one below a closed window), move focus into it so Tab continues there.
const rootEl = ref<HTMLElement>()
let opener: HTMLElement | null = null
function focusSelf() {
  const prev = document.activeElement as HTMLElement | null
  if (!opener && prev && prev !== document.body && !prev.closest('.xpwin')) opener = prev
  if (rootEl.value && !rootEl.value.contains(document.activeElement)) rootEl.value.focus({ preventScroll: true })
}
onMounted(() => {
  watch(() => store.active === props.id, (on) => { if (on) nextTick(focusSelf) }, { immediate: true })
})
// closing the last window: give focus back to what opened it (desktop icon, Start menu...) instead of losing it
onBeforeUnmount(() => {
  if (rootEl.value?.contains(document.activeElement)) {
    const back = opener
    nextTick(() => {
      if (store.active) return
      ;(back?.isConnected ? back : document.querySelector<HTMLElement>('.icon.sel, .icon'))?.focus()
    })
  }
})
/** Esc closes the window, like a dialog. Not while typing (e.g. in the AI chat), so nothing is lost. */
function onEsc(e: KeyboardEvent) {
  if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable]')) return
  e.stopPropagation()
  store.close(props.id)
}

const isPhone = () => import.meta.client && matchMedia('(max-width: 700px)').matches

/** Pointer-based drag (mouse + touch), replaces the old document.onmousemove code. */
function startDrag(e: PointerEvent, kind: 'move' | 'resize') {
  if ((e.target as HTMLElement).closest('button')) return
  if (isPhone() || win.value.maximized) return
  if (e.button !== 0) return
  const el = e.currentTarget as HTMLElement
  el.setPointerCapture(e.pointerId)
  const sx = e.clientX
  const sy = e.clientY
  const start = { x: win.value.x, y: win.value.y, w: win.value.w, h: win.value.h }
  const onMove = (ev: PointerEvent) => {
    const dx = ev.clientX - sx
    const dy = ev.clientY - sy
    if (kind === 'move') store.move(props.id, start.x + dx, start.y + dy)
    else store.resize(props.id, start.w + dx, start.h + dy)
  }
  const onUp = () => {
    el.removeEventListener('pointermove', onMove)
    el.removeEventListener('pointerup', onUp)
    el.removeEventListener('pointercancel', onUp)
  }
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', onUp)
}
</script>

<template>
  <section
    class="window xpwin"
    :class="[`app-${id}`, { inactive: store.active !== id, max: win.maximized }]"
    :style="style"
    :hidden="win.minimized"
    :aria-label="titleFor(id)"
    role="dialog"
    tabindex="-1"
    ref="rootEl"
    @pointerdown="store.focus(id)"
    @focusin="store.active !== id && store.focus(id)"
    @keydown.esc="onEsc"
  >
    <header class="title-bar" @pointerdown="startDrag($event, 'move')" @dblclick="store.toggleMaximize(id)">
      <div class="title-bar-text">
        <img :src="def.icon" alt="" width="16" height="16">{{ titleFor(id) }}
      </div>
      <div class="title-bar-controls">
        <button :aria-label="'Minimize'" :title="t('minimize')" @click.stop="store.minimize(id)" />
        <button
          :aria-label="win.maximized ? 'Restore' : 'Maximize'"
          :title="t(win.maximized ? 'restore' : 'maximize')"
          @click.stop="store.toggleMaximize(id)"
        />
        <button :aria-label="'Close'" :title="t('close')" @click.stop="store.close(id)" />
      </div>
    </header>
    <div v-if="menu.length" class="menubar" aria-hidden="true">
      <span v-for="m in menu" :key="m">{{ m }}</span>
    </div>
    <div class="window-body">
      <slot />
    </div>
    <div v-if="$slots.status" class="status-bar">
      <p class="status-bar-field"><slot name="status" /></p>
    </div>
    <span class="grip" aria-hidden="true" @pointerdown.stop="startDrag($event, 'resize')" />
  </section>
</template>
