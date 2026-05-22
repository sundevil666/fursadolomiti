<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AnimatedText from '@/components/AnimatedText.vue'
import { heroSlides } from '@/data/homeSections'

const { t } = useI18n()

const activeSlide = ref(0)
const touchStartX = ref<number | null>(null)
const activeHero = computed(() => heroSlides[activeSlide.value])
const autoplayDelay = 8000
let autoplayTimer: number | undefined

const setSlide = (index: number, shouldRestartAutoplay = true) => {
  activeSlide.value = (index + heroSlides.length) % heroSlides.length

  if (shouldRestartAutoplay) {
    restartAutoplay()
  }
}

const startAutoplay = () => {
  stopAutoplay()
  autoplayTimer = window.setInterval(() => {
    setSlide(activeSlide.value + 1, false)
  }, autoplayDelay)
}

const stopAutoplay = () => {
  if (!autoplayTimer) return

  window.clearInterval(autoplayTimer)
  autoplayTimer = undefined
}

const restartAutoplay = () => {
  stopAutoplay()
  startAutoplay()
}

const handleTouchStart = (event: TouchEvent) => {
  touchStartX.value = event.touches[0]?.clientX ?? null
}

const handleTouchEnd = (event: TouchEvent) => {
  if (touchStartX.value === null) return

  const endX = event.changedTouches[0]?.clientX ?? touchStartX.value
  const distance = touchStartX.value - endX

  if (Math.abs(distance) > 44) {
    setSlide(activeSlide.value + (distance > 0 ? 1 : -1))
  }

  touchStartX.value = null
}

onMounted(startAutoplay)
onBeforeUnmount(stopAutoplay)
</script>

<template>
  <section
    class="hero-slider"
    aria-label="Fursa Dolomiti"
    @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd"
  >
    <article
      v-for="(slide, index) in heroSlides"
      :key="slide.id"
      class="hero-slider__slide"
      :class="{ 'hero-slider__slide--active': index === activeSlide }"
      :aria-hidden="index !== activeSlide"
    >
      <img class="hero-slider__image" :src="slide.image" alt="" loading="eager" />
    </article>

    <div class="hero-slider__shade" />

    <div class="hero-slider__content">
      <Transition name="hero-copy" mode="out-in">
        <div :key="activeHero.id" class="hero-slider__copy">
          <h1 class="hero-slider__title">
            <AnimatedText :text="t(activeHero.titleKey)" tag="span" />
          </h1>
          <p class="hero-slider__lead">
            <AnimatedText :text="t(activeHero.textKey)" tag="span" />
          </p>
        </div>
      </Transition>
    </div>

    <q-btn
      class="hero-slider__arrow hero-slider__arrow--prev"
      round
      unelevated
      icon="chevron_left"
      :aria-label="t('home.previousSlide')"
      @click="setSlide(activeSlide - 1)"
    />
    <q-btn
      class="hero-slider__arrow hero-slider__arrow--next"
      round
      unelevated
      icon="chevron_right"
      :aria-label="t('home.nextSlide')"
      @click="setSlide(activeSlide + 1)"
    />

    <div class="hero-slider__progress" aria-hidden="true">
      <button
        v-for="(_, index) in heroSlides"
        :key="index"
        class="hero-slider__progress-part"
        :class="{ 'hero-slider__progress-part--active': index === activeSlide }"
        :style="{ '--slide-duration': `${autoplayDelay}ms` }"
        type="button"
        @click="setSlide(index)"
      />
    </div>

    <aside class="hero-card">
      <div class="hero-card__quote" aria-hidden="true">
        <svg
          width="36"
          height="28"
          viewBox="0 0 36 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8.77311 28C7.15966 28 5.78151 27.6877 4.63866 27.0632C3.56302 26.4387 2.68908 25.5713 2.01681 24.461C1.34454 23.4201 0.840336 22.171 0.504202 20.7138C0.168067 19.1871 0 17.7646 0 16.4461C0 12.9765 0.840336 9.81908 2.52101 6.97398C4.26891 4.05948 6.92437 1.73482 10.4874 0L11.395 1.87361C9.44538 2.70632 7.73109 4.02478 6.2521 5.829C4.84034 7.63321 4 9.47212 3.73109 11.3457C3.52941 12.6642 3.56303 13.8786 3.83193 14.9888C5.17647 13.601 6.89076 12.9071 8.97479 12.9071C11.1261 12.9071 12.9076 13.5663 14.3193 14.8848C15.7311 16.2032 16.437 18.0768 16.437 20.5056C16.437 22.7261 15.6975 24.5304 14.2185 25.9182C12.7395 27.3061 10.9244 28 8.77311 28ZM28.3361 28C26.7227 28 25.3445 27.6877 24.2017 27.0632C23.126 26.4387 22.2521 25.5713 21.5798 24.461C20.9076 23.4201 20.4034 22.171 20.0672 20.7138C19.7311 19.1871 19.563 17.7646 19.563 16.4461C19.563 12.9765 20.4034 9.81908 22.084 6.97398C23.8319 4.05948 26.4874 1.73482 30.0504 0L30.958 1.87361C29.0084 2.70632 27.2941 4.02478 25.8151 5.829C24.4034 7.63321 23.563 9.47212 23.2941 11.3457C23.0924 12.6642 23.126 13.8786 23.395 14.9888C24.7395 13.601 26.4538 12.9071 28.5378 12.9071C30.6891 12.9071 32.4706 13.5663 33.8824 14.8848C35.2941 16.2032 36 18.0768 36 20.5056C36 22.7261 35.2605 24.5304 33.7815 25.9182C32.3025 27.3061 30.4874 28 28.3361 28Z"
            fill="#175445"
          />
        </svg>
      </div>
      <div class="hero-card__body">
        <p>
          <AnimatedText :text="t('home.hero.quote')" tag="span" />
        </p>
        <div class="hero-card__actions">
          <q-btn unelevated no-caps class="hero-card__primary" :to="{ name: 'hotels' }">
            <AnimatedText :text="t('home.hero.watchHotels')" tag="span" />
          </q-btn>
          <q-btn outline no-caps class="hero-card__secondary" href="https://wa.me/393341822113">
            <AnimatedText :text="t('home.hero.whatsapp')" tag="span" />
          </q-btn>
        </div>
      </div>
      <div class="hero-card__photo" :aria-label="t('home.hero.photo')" />
    </aside>
  </section>
</template>
