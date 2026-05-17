<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { locales, type AppLocale } from '@/i18n'
import menuItemsMock from '@/mocks/menu.json'
import type { MenuItem } from '@/types'
import AnimatedText from '@/components/AnimatedText.vue'

const { locale, t } = useI18n()
const menuItems = menuItemsMock as MenuItem[]
const isMobileMenuOpen = ref(false)
const isLanguageOpen = ref(false)
const languageSpark = ref(0)
const isLanguageChanging = ref(false)
const languageOptions = computed<AppLocale[]>(() => [...locales].reverse())

const currentLocale = computed<AppLocale>({
  get: () => locale.value as AppLocale,
  set: (value) => {
    locale.value = value
    localStorage.setItem('locale', value)
    document.documentElement.lang = value
  },
})

const selectLocale = (value: AppLocale) => {
  if (currentLocale.value !== value) {
    isLanguageChanging.value = true
    currentLocale.value = value
    languageSpark.value += 1
    setTimeout(() => {
      isLanguageChanging.value = false
    }, 600)
  }

  isLanguageOpen.value = false
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

      <div
        class="app-header__language"
        :class="{
          'app-header__language--open': isLanguageOpen,
          'app-header__language--changing': isLanguageChanging,
        }"
      >
        <button
          class="app-header__language-trigger"
          type="button"
          :aria-label="t('app.language')"
          :aria-expanded="isLanguageOpen"
          @click="isLanguageOpen = !isLanguageOpen"
        >
          <span class="app-header__language-glow" aria-hidden="true" />
          <Transition name="language-code" mode="out-in">
            <span :key="`${currentLocale}-${languageSpark}`" class="app-header__language-code">
              {{ currentLocale.toUpperCase() }}
            </span>
          </Transition>
          <q-icon class="app-header__language-icon" name="expand_more" />
          <Transition name="language-spark">
            <span
              v-if="languageSpark"
              :key="languageSpark"
              class="app-header__language-spark"
              aria-hidden="true"
            >
              <span />
              <span />
              <span />
            </span>
          </Transition>
        </button>

        <Transition name="language-menu">
          <div v-if="isLanguageOpen" class="app-header__language-menu" role="listbox">
            <button
              v-for="value in languageOptions"
              :key="value"
              class="app-header__language-option"
              :class="{ 'app-header__language-option--active': currentLocale === value }"
              type="button"
              role="option"
              :aria-selected="currentLocale === value"
              @click="selectLocale(value)"
            >
              <AnimatedText :text="value.toUpperCase()" tag="span" />
            </button>
          </div>
        </Transition>
      </div>

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
