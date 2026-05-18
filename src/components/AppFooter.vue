<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import AnimatedText from '@/components/AnimatedText.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import type { AppLocale } from '@/i18n'
import menuItemsMock from '@/mocks/menu.json'
import type { MenuItem } from '@/types'

type FooterImage = {
  src: string
  altKey: string
}

type FooterLogo = {
  id: string
  titleKey: string
  textKey: string
}

const { locale, t } = useI18n()
const menuItems = menuItemsMock as MenuItem[]
const footerImages: FooterImage[] = [
  { src: '/mockup-assets/image1.png', altKey: 'footer.images.ski' },
  { src: '/mockup-assets/image2.png', altKey: 'footer.images.hotel' },
  { src: '/mockup-assets/image3.png', altKey: 'footer.images.dolomites' },
  { src: '/mockup-assets/image4.png', altKey: 'footer.images.chalet' },
]
const footerLogos: FooterLogo[] = [
  {
    id: 'val-gardena',
    titleKey: 'footer.logos.valGardena.title',
    textKey: 'footer.logos.valGardena.text',
  },
  {
    id: 'dolomiti-superski',
    titleKey: 'footer.logos.dolomitiSuperski.title',
    textKey: 'footer.logos.dolomitiSuperski.text',
  },
  {
    id: 'south-tyrol',
    titleKey: 'footer.logos.southTyrol.title',
    textKey: 'footer.logos.southTyrol.text',
  },
]

const currentLocale = computed<AppLocale>(() => locale.value as AppLocale)
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer__dot-field" aria-hidden="true" />

    <div class="app-footer__inner">
      <div class="app-footer__content">
        <div class="app-footer__top">
          <RouterLink class="app-footer__brand" :to="{ name: 'home' }" :aria-label="t('app.name')">
            <span class="app-footer__logo" aria-hidden="true">fd</span>
            <span class="app-footer__brand-copy">
              <span class="app-footer__name">fursa dolomiti</span>
              <span class="app-footer__place">val gardena</span>
            </span>
          </RouterLink>

          <LanguageSwitcher class="app-footer__language" />
        </div>

        <p class="app-footer__tagline">
          <AnimatedText :text="t('footer.tagline')" tag="span" />
        </p>

        <div class="app-footer__columns">
          <section class="app-footer__section" :aria-label="t('footer.contacts')">
            <h2 class="app-footer__heading">
              <AnimatedText :text="t('footer.contacts')" tag="span" />
            </h2>
            <div class="app-footer__links">
              <a href="tel:+393341822113">+39 334 18 22 113</a>
              <a href="mailto:info@fursadolomiti.com">info@fursadolomiti.com</a>
              <span class="app-footer__socials">
                <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
                <a href="https://www.facebook.com/" target="_blank" rel="noreferrer">Facebook</a>
              </span>
            </div>
          </section>

          <nav class="app-footer__section" :aria-label="t('footer.menu')">
            <h2 class="app-footer__heading">
              <AnimatedText :text="t('footer.menu')" tag="span" />
            </h2>
            <div class="app-footer__links">
              <RouterLink v-for="item in menuItems" :key="item.id" :to="{ name: item.routeName }">
                <AnimatedText :text="item.labels[currentLocale]" tag="span" />
              </RouterLink>
            </div>
          </nav>
        </div>

        <div class="app-footer__legal">
          <RouterLink :to="{ name: 'home' }">
            <AnimatedText :text="t('footer.privacy')" tag="span" />
          </RouterLink>
          <span aria-hidden="true" />
          <RouterLink :to="{ name: 'home' }">
            <AnimatedText :text="t('footer.cookies')" tag="span" />
          </RouterLink>
          <span aria-hidden="true" />
          <span>
            <AnimatedText :text="t('footer.vat')" tag="span" />
          </span>
        </div>
      </div>

      <div class="app-footer__media">
        <div class="app-footer__gallery" :aria-label="t('footer.gallery')">
          <img
            v-for="image in footerImages"
            :key="image.src"
            class="app-footer__image"
            :src="image.src"
            :alt="t(image.altKey)"
            loading="lazy"
          />
        </div>

        <div class="app-footer__partners" :aria-label="t('footer.partners')">
          <div v-for="logo in footerLogos" :key="logo.id" class="app-footer__partner">
            <span class="app-footer__partner-mark" aria-hidden="true">fd</span>
            <span class="app-footer__partner-copy">
              <strong>
                <AnimatedText :text="t(logo.titleKey)" tag="span" />
              </strong>
              <span>
                <AnimatedText :text="t(logo.textKey)" tag="span" />
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
