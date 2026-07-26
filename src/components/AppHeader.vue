<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { type AppLocale } from '@/i18n'
import menuItemsMock from '@/mocks/menu.json'
import type { MenuItem } from '@/types'
import AnimatedText from '@/components/AnimatedText.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const { locale, t } = useI18n()
const route = useRoute()
const menuItems = menuItemsMock as MenuItem[]
const isMobileMenuOpen = ref(false)
const isContactMenuOpen = ref(false)
const isHeaderScrolled = ref(false)
const contactMenu = useTemplateRef<HTMLElement>('contactMenu')

const currentLocale = computed<AppLocale>({
  get: () => locale.value as AppLocale,
  set: (value) => {
    locale.value = value
    localStorage.setItem('locale', value)
    document.documentElement.lang = value
  },
})

const isActiveRoute = (routeName: string) => {
  return route.name === routeName
}

const isPrivacyPolicyRoute = computed(() => route.name === 'privacy-policy')

const navLabelWidth = (item: MenuItem) => {
  const maxLength = Math.max(...Object.values(item.labels).map((label) => label.length))
  return `${maxLength}ch`
}

const closeContactMenu = (event: MouseEvent) => {
  if (!contactMenu.value?.contains(event.target as Node)) {
    isContactMenuOpen.value = false
  }
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    isContactMenuOpen.value = false
  }
}

const updateHeaderScrolled = () => {
  isHeaderScrolled.value = window.scrollY > 200
}

onMounted(() => {
  updateHeaderScrolled()
  window.addEventListener('scroll', updateHeaderScrolled, { passive: true })
  document.addEventListener('click', closeContactMenu)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateHeaderScrolled)
  document.removeEventListener('click', closeContactMenu)
  document.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <q-header
    class="app-header"
    :class="{
      'app-header--scrolled': isHeaderScrolled,
      'app-header--privacy-policy': isPrivacyPolicyRoute,
    }"
  >
    <q-toolbar class="app-header__toolbar">
      <RouterLink class="app-header__brand" :to="{ name: 'home' }" :aria-label="t('app.name')">
        <img src="@/assets/img/logo.svg" alt="logo" />
      </RouterLink>

      <q-space />

      <nav class="app-header__nav" aria-label="Main navigation">
        <q-btn
          v-for="item in menuItems"
          :key="item.id"
          no-caps
          :ripple="false"
          flat
          class="app-header__nav-link"
          :class="{ 'app-header__nav-link--active': isActiveRoute(item.routeName) }"
          :style="{ '--nav-label-width': navLabelWidth(item) }"
          :to="{ name: item.routeName }"
        >
          <AnimatedText :text="item.labels[currentLocale]" tag="span" />
        </q-btn>
      </nav>

      <div class="app-header__contacts">
        <a
          class="app-header__contact app-header__contact--email"
          href="mailto:info@fursadolomiti.com"
          >info@fursadolomiti.com</a
        >
        <div ref="contactMenu" class="app-header__phone-menu">
          <button
            class="app-header__contact app-header__contact--phone"
            type="button"
            :aria-expanded="isContactMenuOpen"
            aria-controls="app-header-contact-menu"
            @click="isContactMenuOpen = !isContactMenuOpen"
          >
            +39 334 1822 113
          </button>

          <Transition name="contact-menu">
            <div
              v-if="isContactMenuOpen"
              id="app-header-contact-menu"
              class="app-header__contact-menu"
            >
              <a href="tel:+393341822113" @click="isContactMenuOpen = false">
                {{ t('app.call') }}
              </a>
              <a
                href="https://wa.me/393341822113"
                target="_blank"
                rel="noopener noreferrer"
                @click="isContactMenuOpen = false"
              >
                {{ t('app.writeWhatsApp') }}
              </a>
            </div>
          </Transition>
        </div>
      </div>

      <LanguageSwitcher class="app-header__language" />

      <q-btn
        class="app-header__menu-button"
        :class="{ 'app-header__menu-button--open': isMobileMenuOpen }"
        flat
        round
        dense
        :icon="isMobileMenuOpen ? 'close' : 'menu'"
        :aria-label="isMobileMenuOpen ? t('app.closeMenu') : t('app.openMenu')"
        :aria-expanded="isMobileMenuOpen"
        aria-controls="app-header-mobile-menu"
        @click="isMobileMenuOpen = !isMobileMenuOpen"
      />
    </q-toolbar>

    <Transition name="header-menu">
      <div v-if="isMobileMenuOpen" id="app-header-mobile-menu" class="app-header__mobile-menu">
        <q-btn
          v-for="(item, index) in menuItems"
          :key="item.id"
          v-close-popup
          flat
          no-caps
          class="app-header__mobile-link"
          :class="{ 'app-header__mobile-link--active': isActiveRoute(item.routeName) }"
          :style="{ '--item-index': index }"
          :to="{ name: item.routeName }"
          @click="isMobileMenuOpen = false"
        >
          <AnimatedText :text="item.labels[currentLocale]" tag="span" />
        </q-btn>
      </div>
    </Transition>
  </q-header>
</template>
