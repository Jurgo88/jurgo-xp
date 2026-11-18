<script setup lang="ts">
const { t } = useI18n()
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
    </div>
  </div>
</template>
