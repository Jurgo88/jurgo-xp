<script setup lang="ts">
import { experience } from '~/data/experience'

const props = defineProps<{ ids?: string[] }>()
const { l } = useL10n()
const jobs = computed(() =>
  props.ids ? props.ids.map(id => experience.find(j => j.id === id)!).filter(Boolean) : experience,
)
</script>

<template>
  <div>
    <div v-for="j in jobs" :key="j.id" class="job">
      <span class="yr">{{ l(j.period) }}</span>
      <div>
        <b>{{ l(j.role) }}</b> · {{ l(j.company) }}
        <p>{{ l(j.description) }}</p>
        <div class="tags"><span v-for="tg in j.tags" :key="tg" class="tag">{{ tg }}</span></div>
      </div>
    </div>
  </div>
</template>
