<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AnimatedText from '@/components/AnimatedText.vue'
import { hotelPreviews, type HotelCategory } from '@/data/homeSections'

const props = defineProps<{
  limit?: number
}>()

const { t, tm } = useI18n()
type HotelFilter = 'all' | HotelCategory

const activeFilter = ref<HotelFilter>('all')
const hotelFilters: HotelFilter[] = ['all', 'fiveStar', 'fourStar', 'chalet']

const activeHotelSlides = ref<Record<string, number>>(
  Object.fromEntries(hotelPreviews.map((hotel) => [hotel.id, 0])),
)
const hotelAutoplayDelay = 5200
let hotelAutoplayTimer: number | undefined

const hasLimit = computed(() => Boolean(props.limit && props.limit > 0))

const displayedHotels = computed(() => {
  if (hasLimit.value) return hotelPreviews.slice(0, props.limit ?? 0)

  if (activeFilter.value === 'all') return hotelPreviews

  return hotelPreviews.filter((hotel) => hotel.category === activeFilter.value)
})

const getHotelFeatures = (key: string) => tm(key) as string[]

const getActiveHotelSlide = (hotelId: string) => activeHotelSlides.value[hotelId] ?? 0

const setActiveFilter = (filter: HotelFilter) => {
  if (hasLimit.value || activeFilter.value === filter) return

  activeFilter.value = filter
  restartHotelAutoplay()
}

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
  <section class="hotels-section">
    <div
      v-if="!hasLimit"
      class="hotels-section__filters"
      :aria-label="t('home.hotels.filters.label')"
    >
      <button
        v-for="filter in hotelFilters"
        :key="filter"
        class="hotels-section__filter"
        :class="{ 'hotels-section__filter--active': activeFilter === filter }"
        type="button"
        :aria-pressed="activeFilter === filter"
        @click="setActiveFilter(filter)"
      >
        <span>{{ t(`home.hotels.filters.${filter}`) }}</span>
      </button>
    </div>

    <TransitionGroup name="hotel-preview-list" tag="div" class="hotels-section__list">
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
          <h3 class="hotel-preview__name">
            <AnimatedText :text="t(hotel.nameKey)" tag="span" />
          </h3>
          <p class="hotel-preview__location">
            <AnimatedText :text="t(hotel.locationKey)" tag="span" />
          </p>
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

          <q-btn
            unelevated
            no-caps
            class="fd-btn fd-btn--outline"
            href="https://wa.me/393341822113"
          >
            <AnimatedText :text="t('home.hotels.bookWithBonus')" tag="span" />
          </q-btn>
        </div>
      </article>
    </TransitionGroup>

    <div v-if="hasLimit" class="hotels-section__footer w-1336">
      <q-btn unelevated no-caps class="fd-btn fd-btn--filled" :to="{ name: 'hotels' }">
        <AnimatedText :text="t('home.hotels.viewAll')" tag="span" />
      </q-btn>
    </div>
  </section>
</template>
