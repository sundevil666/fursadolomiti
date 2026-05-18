<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { locales, type AppLocale } from '@/i18n'
import menuItemsMock from '@/mocks/menu.json'
import type { MenuItem } from '@/types'
import AnimatedText from '@/components/AnimatedText.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const { locale, t } = useI18n()
const menuItems = menuItemsMock as MenuItem[]
const isMobileMenuOpen = ref(false)

const currentLocale = computed<AppLocale>({
  get: () => locale.value as AppLocale,
  set: (value) => {
    locale.value = value
    localStorage.setItem('locale', value)
    document.documentElement.lang = value
  },
})

const selectLocale = (value: AppLocale) => {
  currentLocale.value = value
}
</script>

<template>
  <q-header class="app-header">
    <q-toolbar class="app-header__toolbar">
      <RouterLink class="app-header__brand" :to="{ name: 'home' }" :aria-label="t('app.name')">
        <span class="app-header__logo" aria-hidden="true">
          <span class="app-header__logo-mark">fd</span>
        </span>
        <span class="app-header__brand-text">
          <span class="app-header__name">
            <span class="app-header__name-main">fursa</span>
            <span class="app-header__name-muted">dolomiti</span>
          </span>
          <span class="app-header__place">val gardena</span>
        </span>
      </RouterLink>

      <q-space />

      <nav class="app-header__nav" aria-label="Main navigation">
        <q-btn
          v-for="item in menuItems"
          :key="item.id"
          no-caps
          unelevated
          flat
          class="app-header__nav-link"
          :to="{ name: item.routeName }"
          :icon-right="item.id === 'webcams' ? 'expand_more' : undefined"
        >
          <AnimatedText :text="item.labels[currentLocale]" tag="span" />
        </q-btn>
      </nav>

      <div class="app-header__contacts">
        <a href="mailto:info@fursadolomiti.com">info@fursadolomiti.com</a>
        <a href="tel:+393341822113">+39 334 1822 113</a>
      </div>

      <LanguageSwitcher class="app-header__language" />

      <q-btn
        class="app-header__menu-button"
        flat
        round
        dense
        icon="menu"
        :aria-label="isMobileMenuOpen ? t('app.closeMenu') : t('app.openMenu')"
        @click="isMobileMenuOpen = !isMobileMenuOpen"
      />
    </q-toolbar>

    <q-slide-transition>
      <div v-if="isMobileMenuOpen" class="app-header__mobile-menu">
        <q-btn
          v-for="item in menuItems"
          :key="item.id"
          v-close-popup
          flat
          no-caps
          class="app-header__mobile-link"
          :to="{ name: item.routeName }"
          @click="isMobileMenuOpen = false"
        >
          <AnimatedText :text="item.labels[currentLocale]" tag="span" />
        </q-btn>
        <div class="app-header__mobile-contacts">
          <a href="mailto:info@fursadolomiti.com">info@fursadolomiti.com</a>
          <a href="tel:+393341822113">+39 334 1822 113</a>
        </div>
        <div class="app-header__mobile-languages" :aria-label="t('app.language')">
          <button
            v-for="value in locales"
            :key="value"
            class="app-header__mobile-language"
            :class="{ 'app-header__mobile-language--active': currentLocale === value }"
            type="button"
            @click="selectLocale(value)"
          >
            <AnimatedText :text="value.toUpperCase()" tag="span" />
          </button>
        </div>
      </div>
    </q-slide-transition>
  </q-header>
</template>
