<script setup lang="ts">
const { t } = useI18n()
const { l } = useL10n()
const bsod = useState('bsod', () => false)
// like the desktop icons: double-click with a mouse, single tap on touch
const tap = () => { if (matchMedia('(max-width: 700px), (pointer: coarse)').matches) bsod.value = true }
</script>

<template>
  <div class="main">
        <div class="files">
      <a class="file" href="https://github.com/Jurgo88/portfolio-v2" target="_blank" rel="noopener">
        <img src="/icons/ie.svg" alt=""><div><b>portfolio-v2</b><small>{{ t('bin_old_site') }}</small></div>
      </a>
      <a class="file" href="https://xpecko.netlify.app" target="_blank" rel="noopener">
        <img src="/icons/folder.png" alt=""><div><b>xpecko</b><small>{{ t('bin_old_xp') }}</small></div>
      </a>
      <button type="button" class="file" @dblclick="bsod = true" @click="tap">
        <img src="/icons/bug.svg" alt=""><div><b>unfixed_bugs.exe</b><small>{{ l({ en: 'do not run this', sk: 'toto nespúšťaj' }) }}</small></div>
      </button>
    </div>
  </div>
</template>
