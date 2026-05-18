<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AnimatedText from '@/components/AnimatedText.vue'
import { hotelPreviews } from '@/data/homeSections'

const props = defineProps<{
  limit?: number
}>()

const { t, tm } = useI18n()

const activeHotelSlides = ref<Record<string, number>>(
  Object.fromEntries(hotelPreviews.map((hotel) => [hotel.id, 0])),
)
const hotelAutoplayDelay = 5200
let hotelAutoplayTimer: number | undefined

const displayedHotels = computed(() => {
  if (!props.limit || props.limit < 1) return hotelPreviews

  return hotelPreviews.slice(0, props.limit)
})

const getHotelFeatures = (key: string) => tm(key) as string[]

const getActiveHotelSlide = (hotelId: string) => activeHotelSlides.value[hotelId] ?? 0

const setHotelSlide = (hotelId: string, index: number, shouldRestartAutoplay = true) => {
  const hotel = hotelPreviews.find((item) => item.id === hotelId)

  if (!hotel) return

  activeHotelSlides.value = {
    ...activeHotelSlides.value,
    [hotelId]: (index + hotel.images.length) % hotel.images.length,
  }

  if (shouldRestartAutoplay) {
    restartHotelAutoplay()
  }
}

const startHotelAutoplay = () => {
  stopHotelAutoplay()
  hotelAutoplayTimer = window.setInterval(() => {
    displayedHotels.value.forEach((hotel) => {
      setHotelSlide(hotel.id, getActiveHotelSlide(hotel.id) + 1, false)
    })
  }, hotelAutoplayDelay)
}

const stopHotelAutoplay = () => {
  if (!hotelAutoplayTimer) return

  window.clearInterval(hotelAutoplayTimer)
  hotelAutoplayTimer = undefined
}

const restartHotelAutoplay = () => {
  stopHotelAutoplay()
  startHotelAutoplay()
}

onMounted(startHotelAutoplay)
onBeforeUnmount(stopHotelAutoplay)
</script>

<template>
  <section class="hotels-section" aria-labelledby="hotels-section-title">
    <div class="hotels-section__header">
      <h2 id="hotels-section-title" class="hotels-section__title">
        <AnimatedText :text="t('home.hotels.title')" tag="span" />
      </h2>
    </div>

    <article v-for="hotel in displayedHotels" :key="hotel.id" class="hotel-preview">
      <div class="hotel-preview__media">
        <img
          v-for="(image, index) in hotel.images"
          :key="image"
          class="hotel-preview__image"
          :class="{ 'hotel-preview__image--active': index === getActiveHotelSlide(hotel.id) }"
          :src="image"
          :alt="t(hotel.nameKey)"
          loading="lazy"
        />
        <button
          class="hotel-preview__arrow hotel-preview__arrow--prev"
          type="button"
          :aria-label="t('home.previousSlide')"
          @click="setHotelSlide(hotel.id, getActiveHotelSlide(hotel.id) - 1)"
        >
          <q-icon name="chevron_left" />
        </button>
        <button
          class="hotel-preview__arrow hotel-preview__arrow--next"
          type="button"
          :aria-label="t('home.nextSlide')"
          @click="setHotelSlide(hotel.id, getActiveHotelSlide(hotel.id) + 1)"
        >
          <q-icon name="chevron_right" />
        </button>
        <div class="hotel-preview__progress">
          <button
            v-for="(_, index) in hotel.images"
            :key="index"
            class="hotel-preview__progress-part"
            :class="{
              'hotel-preview__progress-part--active': index === getActiveHotelSlide(hotel.id),
            }"
            :style="{ '--hotel-slide-duration': `${hotelAutoplayDelay}ms` }"
            type="button"
            :aria-label="`${t(hotel.nameKey)} ${index + 1}`"
            @click="setHotelSlide(hotel.id, index)"
          />
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

    <div v-if="limit" class="hotels-section__footer">
      <q-btn unelevated no-caps class="hotels-section__view-all" :to="{ name: 'hotels' }">
        <AnimatedText :text="t('home.hotels.viewAll')" tag="span" />
      </q-btn>
    </div>
  </section>
</template>
