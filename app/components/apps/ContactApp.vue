<script setup lang="ts">
import { profile } from '~/data/profile'

const { t } = useI18n()
</script>

<template>
  <div class="main">
    <div class="job" style="grid-template-columns:70px 1fr">
      <span class="yr">{{ t('contact_to') }}</span><a :href="`mailto:${profile.email}`"><b>{{ profile.email }}</b></a>
    </div>
    <div class="job" style="grid-template-columns:70px 1fr">
      <span class="yr">{{ t('phone_label') }}</span><span><XpPhone /></span>
    </div>
    <div class="job" style="grid-template-columns:70px 1fr">
      <span class="yr">LinkedIn:</span><a :href="profile.linkedin" target="_blank" rel="noopener">{{ profile.linkedin.replace('https://www.', '') }}</a>
    </div>
    <div class="job" style="grid-template-columns:70px 1fr">
      <span class="yr">GitHub:</span><a :href="profile.github" target="_blank" rel="noopener">{{ profile.github.replace('https://', '') }}</a>
    </div>
    <p class="lead">{{ t('contact_intro') }}</p>
    <p><a :href="`mailto:${profile.email}`"><button>{{ t('contact_write') }}</button></a></p>
  </div>
</template>
