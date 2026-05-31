<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AnimatedText from '@/components/AnimatedText.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import logoWhiteUrl from '@/assets/img/logo_white.svg'
import type { AppLocale } from '@/i18n'
import menuItemsMock from '@/mocks/menu.json'
import type { MenuItem } from '@/types'

type FooterImage = {
  src: string
  altKey: string
  label: string
}

type FooterLogo = {
  id: string
  title: string
  text?: string
  image?: string
}

const { locale, t } = useI18n()
const footerMenuIds = ['hotels', 'rental']
const menuItems = (menuItemsMock as MenuItem[]).filter((item) => footerMenuIds.includes(item.id))
const footerImages: FooterImage[] = [
  { src: '/mockup-assets/image1.png', altKey: 'footer.images.seceda', label: 'Secada' },
  { src: '/mockup-assets/image4.png', altKey: 'footer.images.alpeDiSiusi', label: 'Alpe di Siusi' },
  { src: '/mockup-assets/image2.png', altKey: 'footer.images.ciampinoi', label: 'Ciampinoi' },
  { src: '/mockup-assets/image3.png', altKey: 'footer.images.dantercapies', label: 'Dantercapies' },
]
const footerLogos: FooterLogo[] = [
  {
    id: 'dolomiti-supersummer',
    title: 'DOLOMITI',
    text: 'SUPERSUMMER',
  },
  {
    id: 'active',
    title: 'ACTIVE',
  },
  {
    id: 'dolomites-unesco',
    title: 'Dolomiti',
    image: '/mockup-assets/image0.png',
  },
]

const currentLocale = computed<AppLocale>(() => locale.value as AppLocale)

const isScrolledDown = ref(false)

const handleScroll = () => {
  isScrolledDown.value = window.scrollY > 100
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const scrollToTop = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
  })
}
</script>

<template>
  <footer id="app-footer" class="app-footer">
    <div class="app-footer__inner">
      <div class="app-footer__dot-field" aria-hidden="true" />

      <div class="app-footer__content">
        <div class="app-footer__top">
          <RouterLink class="app-footer__brand" :to="{ name: 'home' }" :aria-label="t('app.name')">
            <img class="app-footer__logo" :src="logoWhiteUrl" :alt="t('app.logo')" />
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
        <div class="app-footer__media-head">
          <h2 class="app-footer__gallery-title">
            <AnimatedText :text="t('footer.gallery')" tag="span" />
          </h2>

          <Transition name="footer-to-top">
            <button
              v-if="isScrolledDown"
              class="app-footer__to-top"
              type="button"
              :aria-label="t('footer.backToTop')"
              @click="scrollToTop"
            >
              <q-icon name="arrow_upward" />
            </button>
          </Transition>
        </div>

        <div class="app-footer__gallery" :aria-label="t('footer.gallery')">
          <figure v-for="image in footerImages" :key="image.src" class="app-footer__camera">
            <img class="app-footer__image" :src="image.src" :alt="t(image.altKey)" loading="lazy" />
            <figcaption>{{ image.label }}</figcaption>
          </figure>
        </div>

        <div class="app-footer__partners" :aria-label="t('footer.partners')">
          <div
            v-for="logo in footerLogos"
            :key="logo.id"
            class="app-footer__partner"
            :class="`app-footer__partner--${logo.id}`"
          >
            <img v-if="logo.image" :src="logo.image" :alt="logo.title" loading="lazy" />
            <span v-else class="app-footer__partner-copy">
              <strong>{{ logo.title }}</strong>
              <span v-if="logo.text">{{ logo.text }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
