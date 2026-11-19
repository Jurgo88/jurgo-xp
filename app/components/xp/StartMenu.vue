<script setup lang="ts">
import { roles } from '~/data/roles'
import { appById } from '~/data/apps'
import { profile, cvPdf } from '~/data/profile'
import type { AppId } from '~/data/app-ids'

const emit = defineEmits<{ close: []; wallpaper: []; restart: [] }>()
const { l, locale } = useL10n()
const { t } = useI18n()
const { pathFor } = useApps()
const right: AppId[] = ['about', 'blog', 'music', 'sport', 'contact', 'games']
</script>

<template>
  <div class="startmenu" role="menu" @click.stop>
    <div class="sm-head"><img class="avatar" src="/avatar.jpg" alt="" width="44" height="44">{{ profile.name }}</div>
    <div class="sm-cols">
      <div class="sm-l">
        <NuxtLink v-for="r in roles" :key="r.id" class="sm-i" role="menuitem" :to="pathFor(r.id)" @click="emit('close')">
          <img :src="appById(r.id)!.icon" alt="">
          <span><b>{{ l(r.title) }}</b><small>{{ t('start_menu_roles_hint') }}</small></span>
        </NuxtLink>
        <div class="sm-sep" />
        <button class="sm-i" role="menuitem" @click="emit('wallpaper')">
          <img src="/icons/my-computer.png" alt="">
          <span><b>{{ t('start_wallpaper') }}</b><small>{{ t('start_wallpaper_hint') }}</small></span>
        </button>
        <a class="sm-i" role="menuitem" :href="cvPdf(locale)" target="_blank" rel="noopener" @click="emit('close')">
          <img src="/icons/pdf.svg" alt="">
          <span><b>CV.pdf</b><small>{{ t('start_cv_hint') }}</small></span>
        </a>
      </div>
      <div class="sm-r">
        <NuxtLink v-for="id in right" :key="id" class="sm-i" role="menuitem" :to="pathFor(id)" @click="emit('close')">
          <img :src="appById(id)!.icon" alt="">{{ l(appById(id)!.label) }}
        </NuxtLink>
      </div>
    </div>
    <div class="sm-foot">
      <NuxtLinkLocale to="/cv" @click="emit('close')">
        <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="4" fill="#e9a23b" /><path d="M7 12h10M13 8l4 4-4 4" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" /></svg>
        {{ t('classic_view') }}
      </NuxtLinkLocale>
      <button @click="emit('restart')">
        <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="4" fill="#d9472b" /><path d="M12 6v6M8.2 8.4a5.5 5.5 0 1 0 7.6 0" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" /></svg>
        {{ t('restart') }}
      </button>
    </div>
  </div>
</template>
