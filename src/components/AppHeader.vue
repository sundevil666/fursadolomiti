<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { locales, type AppLocale } from '@/i18n'
import menuItemsMock from '@/mocks/menu.json'
import type { MenuItem } from '@/types'

const { locale, t } = useI18n()
const menuItems = menuItemsMock as MenuItem[]

const currentLocale = computed<AppLocale>({
  get: () => locale.value as AppLocale,
  set: (value) => {
    locale.value = value
    localStorage.setItem('locale', value)
    document.documentElement.lang = value
  },
})
</script>

<template>
  <q-header class="app-header" elevated>
    <q-toolbar class="app-header__toolbar">
      <RouterLink class="app-header__brand" :to="{ name: 'home' }" :aria-label="t('app.name')">
        <span class="app-header__logo">{{ t('app.logo') }}</span>
        <span class="app-header__name">{{ t('app.name') }}</span>
      </RouterLink>

      <q-space />

      <nav class="app-header__nav" aria-label="Main navigation">
        <q-btn
          v-for="item in menuItems"
          :key="item.id"
          flat
          no-caps
          class="app-header__nav-link"
          :to="{ name: item.routeName }"
          :label="item.labels[currentLocale]"
        />
      </nav>

      <div class="app-header__languages" :aria-label="t('app.language')">
        <q-btn-toggle
          v-model="currentLocale"
          unelevated
          dense
          toggle-color="primary"
          color="white"
          text-color="primary"
          :options="locales.map((value) => ({ label: value.toUpperCase(), value }))"
        />
      </div>
    </q-toolbar>
  </q-header>
</template>
