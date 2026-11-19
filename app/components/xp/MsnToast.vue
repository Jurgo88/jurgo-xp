<script setup lang="ts">
// MSN-style "… has just signed in" popup above the tray that invites visitors to the AI chat.
const emit = defineEmits<{ open: []; close: [] }>()
const { l } = useL10n()
onMounted(() => { setTimeout(() => emit('close'), 12000) })
</script>

<template>
  <div class="msn-toast" role="status">
    <div class="mt-head">
      <img src="/icons/messenger.svg" alt="" width="14" height="14">
      <span>Jurgo Messenger</span>
      <button type="button" class="x" :aria-label="l({ en: 'Close', sk: 'Zavrieť' })" @click.stop="emit('close')">×</button>
    </div>
    <button type="button" class="mt-body" @click="emit('open')">
      <img src="/avatar.jpg" alt="" width="40" height="40">
      <span>
        <b>Jurgo AI</b> {{ l({ en: 'has just signed in.', sk: 'sa práve prihlásil.' }) }}
        <u>{{ l({ en: 'Ask me anything about Jurgo’s work.', sk: 'Spýtaj sa ma čokoľvek o Jurgovej práci.' }) }}</u>
      </span>
    </button>
  </div>
</template>

<style scoped>
.msn-toast {
  position: absolute;
  right: max(8px, env(safe-area-inset-right, 0px));
  bottom: 38px;
  width: 200px;
  z-index: 10090;
  border: 1px solid #5a7fbf;
  border-radius: 4px 4px 0 0;
  background: linear-gradient(#ffffff, #d4e2f7);
  box-shadow: 1px 1px 6px rgba(0, 0, 0, .35);
  font: 11px/1.35 Tahoma, 'Segoe UI', sans-serif;
  animation: mt-in .5s ease-out;
}
@keyframes mt-in { from { transform: translateY(120%); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .msn-toast { animation: none; } }
.mt-head {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  color: #fff;
  font-weight: bold;
  background: linear-gradient(#5b8ee0, #2c5fbf);
}
.mt-head span { flex: 1; }
.x { all: unset; cursor: pointer; width: 14px; text-align: center; font-size: 13px; line-height: 13px; }
.mt-body {
  all: unset;
  box-sizing: border-box;
  display: flex;
  gap: 8px;
  width: 100%;
  padding: 8px;
  cursor: pointer;
  color: #00285e;
}
.mt-body img { flex: none; border: 1px solid #7f9db9; border-radius: 3px; object-fit: cover; }
.mt-body u { display: block; margin-top: 3px; color: #0645ad; }
</style>
