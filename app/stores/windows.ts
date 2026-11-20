import { defineStore } from 'pinia'
import type { AppId } from '~/data/app-ids'
import { appById } from '~/data/apps'

export interface WinState {
  id: AppId
  x: number
  y: number
  w: number
  h: number
  z: number
  minimized: boolean
  maximized: boolean
}

// Desktop size used for the very first (SSR) layout; corrected on the client.
const FALLBACK_DESK = { w: 1280, h: 690 }
const TASKBAR_H = 30

export const useWindowsStore = defineStore('windows', {
  state: () => ({
    windows: [] as WinState[],
    focused: null as AppId | null,
    zTop: 10,
    cascade: 0,
    desk: { ...FALLBACK_DESK },
    measured: false,
    /** blog post (slug) shown in the Notepad window */
    doc: null as string | null,
    /** project (id) shown in the Project window */
    project: null as string | null,
  }),

  getters: {
    get: s => (id: AppId) => s.windows.find(w => w.id === id),
    isOpen: s => (id: AppId) => s.windows.some(w => w.id === id),
    /** focused and visible */
    active(s): AppId | null {
      const w = s.windows.find(x => x.id === s.focused)
      return w && !w.minimized ? w.id : null
    },
  },

  actions: {
    setDesk(w: number, h: number) {
      this.desk = { w, h: h - TASKBAR_H }
      const first = !this.measured
      this.measured = true
      for (const win of this.windows) {
        // windows opened during SSR used a guessed desktop size: re-fit them once
        if (first) {
          const def = appById(win.id)
          if (def) { win.w = def.width; win.h = def.height }
        }
        this.clamp(win)
      }
    },

    clamp(win: WinState) {
      // keep the whole window on screen: shrink first, then shift left/up if needed
      win.w = Math.min(win.w, Math.max(260, this.desk.w - 16))
      win.h = Math.min(win.h, Math.max(160, this.desk.h - 16))
      win.x = Math.max(0, Math.min(win.x, this.desk.w - win.w - 8))
      win.y = Math.max(0, Math.min(win.y, this.desk.h - win.h - 8))
    },

    open(id: AppId) {
      const existing = this.get(id)
      if (existing) {
        existing.minimized = false
        this.focus(id)
        return
      }
      const def = appById(id)
      if (!def) return
      const step = this.cascade++ % 7
      const win: WinState = {
        id,
        w: def.width,
        h: def.height,
        x: 196 + step * 28,
        y: 24 + step * 24,
        z: ++this.zTop,
        minimized: false,
        maximized: false,
      }
      this.clamp(win)
      this.windows.push(win)
      this.focused = id
    },

    close(id: AppId) {
      this.windows = this.windows.filter(w => w.id !== id)
      if (this.focused === id) this.focusTopmost()
    },

    focus(id: AppId) {
      const w = this.get(id)
      if (!w) return
      w.minimized = false
      if (this.focused !== id || w.z !== this.zTop) w.z = ++this.zTop
      this.focused = id
    },

    focusTopmost() {
      const visible = this.windows.filter(w => !w.minimized).sort((a, b) => b.z - a.z)
      this.focused = visible[0]?.id ?? null
    },

    minimize(id: AppId) {
      const w = this.get(id)
      if (!w) return
      w.minimized = true
      if (this.focused === id) this.focusTopmost()
    },

    toggleMaximize(id: AppId) {
      const w = this.get(id)
      if (w) w.maximized = !w.maximized
    },

    /** Taskbar button behaviour from XP: restore, focus, or minimize. */
    taskbarClick(id: AppId) {
      const w = this.get(id)
      if (!w) return
      if (w.minimized || this.focused !== id) this.focus(id)
      else this.minimize(id)
    },

    move(id: AppId, x: number, y: number) {
      const w = this.get(id)
      if (!w) return
      // like XP: may hang off the edge, but the title bar stays reachable
      w.x = Math.max(80 - w.w, Math.min(x, this.desk.w - 80))
      w.y = Math.max(0, Math.min(y, this.desk.h - 30))
    },

    resize(id: AppId, width: number, height: number) {
      const w = this.get(id)
      if (!w) return
      w.w = Math.max(260, width)
      w.h = Math.max(160, height)
    },
  },
})
