<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AnimatedText from '@/components/AnimatedText.vue'

const { t, tm } = useI18n()

type HeroSlide = {
  id: number
  titleKey: string
  textKey: string
  image: string
}

type HotelPreview = {
  id: string
  image: string
  nameKey: string
  locationKey: string
  descriptionKey: string
  featuresKey: string
}

const slides: HeroSlide[] = [
  {
    id: 1,
    titleKey: 'home.slide1.title',
    textKey: 'home.slide1.text',
    image: '/mockup-assets/image9.png',
  },
  {
    id: 2,
    titleKey: 'home.slide2.title',
    textKey: 'home.slide2.text',
    image: '/mockup-assets/image11.png',
  },
  {
    id: 3,
    titleKey: 'home.slide3.title',
    textKey: 'home.slide3.text',
    image: '/mockup-assets/image6.png',
  },
]

const hotels: HotelPreview[] = [
  {
    id: 'alpenroyal',
    image: '/mockup-assets/image7.png',
    nameKey: 'home.hotels.alpenroyal.name',
    locationKey: 'home.hotels.alpenroyal.location',
    descriptionKey: 'home.hotels.alpenroyal.description',
    featuresKey: 'home.hotels.alpenroyal.features',
  },
  {
    id: 'edenselva',
    image: '/mockup-assets/image8.png',
    nameKey: 'home.hotels.edenselva.name',
    locationKey: 'home.hotels.edenselva.location',
    descriptionKey: 'home.hotels.edenselva.description',
    featuresKey: 'home.hotels.edenselva.features',
  },
]

const activeSlide = ref(0)
const touchStartX = ref<number | null>(null)
const activeHero = computed(() => slides[activeSlide.value])
const autoplayDelay = 8000
let autoplayTimer: number | undefined

const getHotelFeatures = (key: string) => tm(key) as string[]

const setSlide = (index: number, shouldRestartAutoplay = true) => {
  activeSlide.value = (index + slides.length) % slides.length

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
  <q-page class="home-page">
    <section
      class="hero-slider"
      aria-label="Fursa Dolomiti"
      @touchstart.passive="handleTouchStart"
      @touchend.passive="handleTouchEnd"
    >
      <article
        v-for="(slide, index) in slides"
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
          v-for="(_, index) in slides"
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

    <section class="hotels-section" aria-labelledby="home-hotels-title">
      <div class="hotels-section__header">
        <h2 id="home-hotels-title" class="hotels-section__title">
          <AnimatedText :text="t('home.hotels.title')" tag="span" />
        </h2>
      </div>

      <article v-for="hotel in hotels" :key="hotel.id" class="hotel-preview">
        <div class="hotel-preview__media">
          <img class="hotel-preview__image" :src="hotel.image" :alt="t(hotel.nameKey)" loading="lazy" />
          <button class="hotel-preview__arrow hotel-preview__arrow--prev" type="button" aria-hidden="true">
            <q-icon name="chevron_left" />
          </button>
          <button class="hotel-preview__arrow hotel-preview__arrow--next" type="button" aria-hidden="true">
            <q-icon name="chevron_right" />
          </button>
          <div class="hotel-preview__progress" aria-hidden="true">
            <span />
          </div>
        </div>

        <div class="hotel-preview__content">
          <p class="hotel-preview__location">
            <AnimatedText :text="t(hotel.locationKey)" tag="span" />
          </p>
          <h3 class="hotel-preview__name">
            <AnimatedText :text="t(hotel.nameKey)" tag="span" />
          </h3>
          <p class="hotel-preview__description">
            <AnimatedText :text="t(hotel.descriptionKey)" tag="span" />
          </p>

          <div class="hotel-preview__features">
            <span class="hotel-preview__features-label">
              <AnimatedText :text="t('home.hotels.features')" tag="span" />
            </span>
            <ul class="hotel-preview__features-list">
              <li v-for="feature in getHotelFeatures(hotel.featuresKey)" :key="feature">
                <AnimatedText :text="feature" tag="span" />
              </li>
            </ul>
          </div>

          <q-btn unelevated no-caps class="hotel-preview__button" href="https://wa.me/393341822113">
            <AnimatedText :text="t('home.hotels.bookWithBonus')" tag="span" />
          </q-btn>
        </div>
      </article>

      <div class="hotels-section__footer">
        <q-btn unelevated no-caps class="hotels-section__view-all" :to="{ name: 'hotels' }">
          <AnimatedText :text="t('home.hotels.viewAll')" tag="span" />
        </q-btn>
      </div>
    </section>
  </q-page>
</template>
