<script setup lang="ts">
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const { wallpaper, set, reset } = useWallpaper()
const fileInput = ref<HTMLInputElement>()

function pick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  // downscale so it fits into localStorage
  const img = new Image()
  img.onload = () => {
    const scale = Math.min(1, 1920 / img.width)
    const c = document.createElement('canvas')
    c.width = Math.round(img.width * scale)
    c.height = Math.round(img.height * scale)
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
    set(c.toDataURL('image/jpeg', 0.8))
    URL.revokeObjectURL(img.src)
  }
  img.src = URL.createObjectURL(file)
}
</script>

<template>
  <section class="window xpwin dispdlg" role="dialog" :aria-label="t('display_title')" style="position:absolute">
    <div class="title-bar">
      <div class="title-bar-text"><img src="/icons/my-computer.png" alt="">{{ t('display_title') }}</div>
      <div class="title-bar-controls"><button aria-label="Close" @click="emit('close')" /></div>
    </div>
    <div class="window-body">
      <div class="mon" :style="{ backgroundImage: `url(${wallpaper})` }" />
      <p style="margin:0">{{ t('display_text') }}</p>
      <div class="row">
        <button type="button" @click="fileInput?.click()">{{ t('display_browse') }}</button>
        <input ref="fileInput" type="file" accept="image/*" tabindex="-1" aria-hidden="true" @change="pick">
        <button @click="reset">{{ t('display_default') }}</button>
        <button @click="emit('close')">{{ t('ok') }}</button>
      </div>
    </div>
  </section>
</template>
