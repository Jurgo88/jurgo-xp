<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const is404 = computed(() => props.error.statusCode === 404)
</script>

<template>
  <div class="bsod">
    <p>A problem has been detected and JurgoXP has been shut down to prevent damage to your browser.</p>
    <p>{{ is404 ? 'PAGE_NOT_FOUND' : 'UNEXPECTED_ERROR' }} ({{ error.statusCode }})</p>
    <p>If this is the first time you've seen this Stop error screen, go back to the desktop.</p>
    <p><a href="/" @click.prevent="clearError({ redirect: '/' })">Restart JurgoXP</a></p>
  </div>
</template>

<style scoped>
.bsod { position: fixed; inset: 0; background: #0000aa; color: #fff; font: 15px/1.5 'Lucida Console', 'Courier New', monospace; padding: 40px max(16px, 5vw); overflow: auto; }
.bsod p { max-width: 80ch; }
.bsod a { color: #fff; }
</style>
