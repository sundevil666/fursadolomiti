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

type HowItWorksStep = {
  id: number
  title: string
  text: string
}

type WhyMeReason = {
  id: number
  title: string
  text: string
}

type InstructorFeature = {
  id: number
  text: string
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
const howItWorksSteps = computed(() => tm('home.howItWorks.steps') as HowItWorksStep[])
const whyMeReasons = computed(() => tm('home.whyMe.reasons') as WhyMeReason[])
const instructorFeatures = computed(() => tm('home.instructor.features') as InstructorFeature[])
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
          <img
            class="hotel-preview__image"
            :src="hotel.image"
            :alt="t(hotel.nameKey)"
            loading="lazy"
          />
          <button
            class="hotel-preview__arrow hotel-preview__arrow--prev"
            type="button"
            aria-hidden="true"
          >
            <q-icon name="chevron_left" />
          </button>
          <button
            class="hotel-preview__arrow hotel-preview__arrow--next"
            type="button"
            aria-hidden="true"
          >
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
    <section class="how-it-works" aria-labelledby="how-it-works-title">
      <div class="how-it-works__inner">
        <div class="how-it-works__intro">
          <h2 id="how-it-works-title" class="how-it-works__title">
            <AnimatedText :text="t('home.howItWorks.title')" tag="span" />
          </h2>

          <div class="how-it-works__note">
            <p>
              <AnimatedText :text="t('home.howItWorks.note')" tag="span" />
            </p>
          </div>

          <div class="how-it-works__help">
            <p>
              <AnimatedText :text="t('home.howItWorks.help')" tag="span" />
            </p>
            <div class="how-it-works__actions">
              <q-btn
                unelevated
                no-caps
                class="how-it-works__primary"
                href="https://wa.me/393341822113"
              >
                <AnimatedText :text="t('home.howItWorks.whatsapp')" tag="span" />
              </q-btn>
              <q-btn outline no-caps class="how-it-works__secondary" :to="{ name: 'hotels' }">
                <AnimatedText :text="t('home.howItWorks.hotels')" tag="span" />
              </q-btn>
            </div>
          </div>
        </div>

        <div class="how-it-works__steps">
          <article v-for="step in howItWorksSteps" :key="step.id" class="how-it-works__step">
            <div class="how-it-works__step-header">
              <span class="how-it-works__step-number">
                <AnimatedText :text="String(step.id)" tag="span" />
              </span>
              <span class="how-it-works__step-line" aria-hidden="true" />
            </div>
            <h3 class="how-it-works__step-title">
              <AnimatedText :text="step.title" tag="span" />
            </h3>
            <p class="how-it-works__step-text">
              <AnimatedText :text="step.text" tag="span" />
            </p>
          </article>

          <p class="how-it-works__disclaimer">
            <AnimatedText :text="t('home.howItWorks.disclaimer')" tag="span" />
          </p>
        </div>
      </div>
    </section>
    <section class="why-me" aria-labelledby="why-me-title">
      <header class="why-me__header">
        <h2 id="why-me-title" class="why-me__title">
          <AnimatedText :text="t('home.whyMe.title')" tag="span" />
        </h2>
      </header>

      <div class="why-me__body">
        <img
          class="why-me__image"
          src="/mockup-assets/image6.png"
          :alt="t('home.whyMe.imageAlt')"
          loading="lazy"
        />
        <div class="why-me__shade" />

        <article class="why-me__panel">
          <div class="why-me__mark" aria-hidden="true">1</div>
          <p class="why-me__eyebrow">
            <AnimatedText :text="t('home.whyMe.eyebrow')" tag="span" />
          </p>
          <h3 class="why-me__panel-title">
            <AnimatedText :text="t('home.whyMe.panelTitle')" tag="span" />
          </h3>
          <p class="why-me__lead">
            <AnimatedText :text="t('home.whyMe.lead')" tag="span" />
          </p>

          <ul class="why-me__list">
            <li v-for="reason in whyMeReasons" :key="reason.id" class="why-me__item">
              <span class="why-me__item-number">
                <AnimatedText :text="String(reason.id)" tag="span" />
              </span>
              <span class="why-me__item-copy">
                <strong>
                  <AnimatedText :text="reason.title" tag="span" />
                </strong>
                <span>
                  <AnimatedText :text="reason.text" tag="span" />
                </span>
              </span>
            </li>
          </ul>
        </article>
      </div>
    </section>
    <section class="personal-selection" aria-labelledby="personal-selection-title">
      <div class="personal-selection__content">
        <div class="personal-selection__copy">
          <h2 id="personal-selection-title" class="personal-selection__title">
            <AnimatedText :text="t('home.personalSelection.title')" tag="span" />
          </h2>

          <div class="personal-selection__note">
            <p>
              <AnimatedText :text="t('home.personalSelection.note')" tag="span" />
            </p>
          </div>
        </div>

        <div class="personal-selection__visual" aria-hidden="true">
          <div class="personal-selection__phone">
            <img src="/mockup-assets/image6.png" alt="" loading="lazy" />
          </div>
          <div class="personal-selection__dots" />
        </div>

        <div class="personal-selection__footer">
          <p>
            <AnimatedText :text="t('home.personalSelection.help')" tag="span" />
          </p>
          <q-btn
            unelevated
            no-caps
            class="personal-selection__button"
            href="https://wa.me/393341822113"
          >
            <AnimatedText :text="t('home.personalSelection.cta')" tag="span" />
          </q-btn>
        </div>
      </div>
    </section>
    <section class="instructor-section" aria-labelledby="instructor-title">
      <div class="instructor-section__content">
        <h2 id="instructor-title" class="instructor-section__title">
          <AnimatedText :text="t('home.instructor.title')" tag="span" />
        </h2>
        <p class="instructor-section__lead">
          <AnimatedText :text="t('home.instructor.lead')" tag="span" />
        </p>

        <div class="instructor-section__copy">
          <p>
            <AnimatedText :text="t('home.instructor.text1')" tag="span" />
          </p>
          <p>
            <AnimatedText :text="t('home.instructor.text2')" tag="span" />
          </p>
        </div>

        <h3 class="instructor-section__subtitle">
          <AnimatedText :text="t('home.instructor.organizeTitle')" tag="span" />
        </h3>
        <ul class="instructor-section__list">
          <li
            v-for="feature in instructorFeatures"
            :key="feature.id"
            class="instructor-section__item"
          >
            <AnimatedText :text="feature.text" tag="span" />
          </li>
        </ul>

        <q-btn
          unelevated
          no-caps
          class="instructor-section__button"
          href="https://wa.me/393341822113"
        >
          <AnimatedText :text="t('home.instructor.cta')" tag="span" />
        </q-btn>
      </div>
    </section>
    <section>reviews.svg</section>
  </q-page>
</template>
