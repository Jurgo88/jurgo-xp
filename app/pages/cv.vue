<script setup lang="ts">
import { roles } from '~/data/roles'
import type { Role } from '~/data/roles'
import { profile, cvPdf } from '~/data/profile'

// "Classic view": a plain one-page CV for recruiters in a hurry. Also the
// natural landing page for a link in a job application.
const { l, locale } = useL10n()
const { t } = useI18n()
const { years } = useCareer()
const localePath = useLocalePath()
const route = useRoute()

const initial = roles.find(r => r.id === route.query.role) ?? roles[0]!
const role = ref<Role>(initial)

useSeoMeta({
  title: () => `CV | Juraj Paluš – ${l(role.value.title)}`,
  description: () => `${t('cv_title', { years })}. ${l(role.value.lead)}`,
})
</script>

<template>
  <div class="classic">
    <div class="cv">
      <header class="cv-top">
        <div>
          <h1>{{ profile.name }}</h1>
          <div class="sub">{{ t('cv_title', { years }) }}</div>
        </div>
        <NuxtLink class="backxp" :to="localePath('/')">{{ t('cv_back') }}</NuxtLink>
      </header>
      <div class="roles" role="tablist">
        <button
          v-for="r in roles"
          :key="r.id"
          role="tab"
          :aria-selected="r.id === role.id"
          :class="{ on: r.id === role.id }"
          @click="role = r"
        >
          {{ l(r.title) }}
        </button>
      </div>
      <section>
        <h2>{{ t('cv_profile') }}</h2>
        <p class="lead">{{ l(role.lead) }}</p>
        <p class="lead"><b>{{ t('cv_key') }}:</b> {{ role.skills.join(', ') }}</p>
      </section>
      <section>
        <h2>{{ t('relevant_experience') }}</h2>
        <AppsJobList :ids="role.jobs" />
      </section>
      <section>
        <h2>{{ t('whole_career') }}</h2>
        <AppsJobList />
      </section>
      <section>
        <h2>{{ t('cv_contact') }}</h2>
        <div class="contact">
          <a :href="`mailto:${profile.email}`">{{ profile.email }}</a>
          <XpPhone />
          <a :href="profile.linkedin" target="_blank" rel="noopener">LinkedIn</a>
          <a :href="profile.github" target="_blank" rel="noopener">GitHub</a>
          <a :href="cvPdf(locale, role.id)" target="_blank" rel="noopener">CV.pdf ({{ l(role.title) }})</a>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.classic { position: fixed; inset: 0; overflow: auto; background: #f6f7f9; color: #16181d; font: 15px/1.6 'Segoe UI', system-ui, -apple-system, sans-serif; }
.cv { max-width: 780px; margin: 0 auto; padding: 28px max(16px, env(safe-area-inset-right, 0px)) 60px max(16px, env(safe-area-inset-left, 0px)); display: flex; flex-direction: column; gap: 22px; }
.cv-top { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
h1 { margin: 0; font: 700 30px/1.15 'Segoe UI', system-ui, sans-serif; color: inherit; }
.sub { color: #4a5160; }
h2 { margin: 0 0 8px; font: 600 13px 'Segoe UI', system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; color: #4a5160; }
.lead { margin: 0 0 6px; max-width: 64ch; font-size: 15px; }
.roles { display: flex; gap: 6px; flex-wrap: wrap; }
.roles button { all: unset; border: 1px solid #c8ccd6; background: #fff; border-radius: 999px; padding: 6px 14px; cursor: pointer; font-size: 14px; }
.roles button.on { background: #0054e3; border-color: #0054e3; color: #fff; }
.roles button:focus-visible { outline: 2px solid #0054e3; outline-offset: 2px; }
.backxp { display: inline-flex; align-items: center; gap: 6px; border: 1px solid #0b3cb4; border-radius: 6px; padding: 6px 12px; background: linear-gradient(#3d95ff, #0054e3); color: #fff; text-decoration: none; font-size: 13px; }
.contact { display: flex; gap: 16px; flex-wrap: wrap; }
.contact a { color: #0b4bd1; }
.cv :deep(.job) { grid-template-columns: 120px 1fr; padding: 10px 0; font-size: 14px; }
.cv :deep(.job b) { font-size: 15px; }
.cv :deep(.job p) { font-size: 14px; }
.cv :deep(.tag) { font-size: 12px; border-color: #c8ccd6; background: #fff; }
@media (max-width: 700px) { .cv :deep(.job) { grid-template-columns: 1fr; } }
</style>
