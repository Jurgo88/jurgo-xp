<script setup lang="ts">
import { decodePhone } from '~/data/profile'

// The number is never in the HTML: it is decoded in the browser only after a click.
const { t } = useI18n()
const phone = ref<string | null>(null)
const tel = computed(() => (phone.value ? `tel:${phone.value.replace(/\s/g, '')}` : undefined))
</script>

<template>
  <a v-if="phone" :href="tel"><b>{{ phone }}</b></a>
  <button v-else type="button" class="phone-reveal" @click="phone = decodePhone()">{{ t('phone_show') }}</button>
</template>
