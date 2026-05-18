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
      <div class="hero-card__quote" aria-hidden="true">“</div>
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
