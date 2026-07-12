<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AnimatedText from '@/components/AnimatedText.vue'
import { hotelPreviews, type HotelCategory, type HotelPreview } from '@/data/homeSections'

declare global {
  interface Window {
    BookingSüdtirol?: {
      Widgets?: {
        Booking?: (domElement: string | HTMLElement, settings: Record<string, unknown>) => void
      }
    }
    BookingSuedtirol?: Window['BookingSüdtirol']
    BookingSüdtirolTrackingConsent?: boolean
  }
}

const props = defineProps<{
  limit?: number
}>()

const { locale, t, tm } = useI18n()
type HotelFilter = 'all' | HotelCategory
type HotelStat = {
  icon: string
  value: string
}

const activeFilter = ref<HotelFilter>('fourStar')
const previousFilter = ref<HotelFilter>('fourStar')
const isFilterAnimating = ref(false)
const bookingHotelId = ref<string | null>(null)
const bookingModal = ref<HTMLElement | null>(null)
const bookingSuedtirolContainer = ref<HTMLElement | null>(null)
const bookingSuedtirolStatus = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const bookingSuedtirolLog = ref<string[]>([])
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const formError = ref('')
const formStatus = ref<'idle' | 'sending' | 'redirecting'>('idle')
const hotelFilters: HotelFilter[] = ['all', 'fiveStar', 'fourStar', 'chalet']
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const activeHotelSlides = ref<Record<string, number>>(
  Object.fromEntries(hotelPreviews.map((hotel) => [hotel.id, 0])),
)
const hotelAutoplayDelay = 5200
let hotelAutoplayTimer: number | undefined
let filterAnimationTimer: number | undefined
let bookingSuedtirolScriptPromise: Promise<void> | undefined

const hasLimit = computed(() => Boolean(props.limit && props.limit > 0))

const displayedHotels = computed(() => {
  if (hasLimit.value) return hotelPreviews.slice(0, props.limit ?? 0)

  if (activeFilter.value === 'all') return hotelPreviews

  return hotelPreviews.filter((hotel) => hotel.category === activeFilter.value)
})

const activeBookingHotel = computed(() =>
  hotelPreviews.find((hotel) => hotel.id === bookingHotelId.value),
)

const isBookingSuedtirolHotel = computed(() => Boolean(activeBookingHotel.value?.bookingSuedtirol))

const getFilterCount = (filter: HotelFilter) => {
  if (filter === 'all') return hotelPreviews.length

  return hotelPreviews.filter((hotel) => hotel.category === filter).length
}

const isFilterDisabled = (filter: HotelFilter) => !hasLimit.value && getFilterCount(filter) === 0

const getHotelFeatures = (key: string) => tm(key) as string[]
const getHotelStats = (key?: string) => (key ? (tm(key) as HotelStat[]) : [])

const getActiveHotelSlide = (hotelId: string) => activeHotelSlides.value[hotelId] ?? 0

const setActiveFilter = (filter: HotelFilter) => {
  if (hasLimit.value || activeFilter.value === filter || isFilterDisabled(filter)) return

  previousFilter.value = activeFilter.value
  activeFilter.value = filter
  isFilterAnimating.value = true

  if (filterAnimationTimer) {
    window.clearTimeout(filterAnimationTimer)
  }

  filterAnimationTimer = window.setTimeout(() => {
    isFilterAnimating.value = false
    filterAnimationTimer = undefined
  }, 1040)

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

const openBookingModal = (hotelId: string) => {
  bookingHotelId.value = hotelId
  firstName.value = ''
  lastName.value = ''
  email.value = ''
  formError.value = ''
  formStatus.value = 'idle'
  bookingSuedtirolStatus.value = 'idle'
  bookingSuedtirolLog.value = []
}

const closeBookingModal = () => {
  if (formStatus.value !== 'idle') return

  bookingHotelId.value = null
}

const handleModalKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closeBookingModal()
}

const addBookingSuedtirolLog = (label: string, payload?: unknown) => {
  const message = payload ? `${label}: ${JSON.stringify(payload, null, 2)}` : label
  bookingSuedtirolLog.value = [message, ...bookingSuedtirolLog.value].slice(0, 6)
}

const loadBookingSuedtirolScript = () => {
  if (window.BookingSüdtirol?.Widgets?.Booking) return Promise.resolve()
  if (bookingSuedtirolScriptPromise) return bookingSuedtirolScriptPromise

  bookingSuedtirolScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('#booking-suedtirol-js')

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Booking Südtirol failed')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.id = 'booking-suedtirol-js'
    script.src = 'https://widget.bookingsuedtirol.com/v2/bundle.js'
    script.defer = true
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => reject(new Error('Booking Südtirol failed')), {
      once: true,
    })
    document.body.append(script)
  })

  return bookingSuedtirolScriptPromise
}

const mountBookingSuedtirolWidget = async (hotel: HotelPreview) => {
  const widgetConfig = hotel.bookingSuedtirol

  if (!widgetConfig || !bookingSuedtirolContainer.value) return

  bookingSuedtirolStatus.value = 'loading'
  addBookingSuedtirolLog('Loading Booking Südtirol widget')

  try {
    await loadBookingSuedtirolScript()

    const bookingWidget = window.BookingSüdtirol?.Widgets?.Booking

    if (!bookingWidget) {
      throw new Error('Booking Südtirol widget API is unavailable')
    }

    bookingSuedtirolContainer.value.innerHTML = ''
    bookingWidget(bookingSuedtirolContainer.value, {
      id: widgetConfig.id,
      propertyId: widgetConfig.propertyId,
      lang: locale.value,
      privacyURL: `${window.location.origin}/privacy-policy`,
      termsURL: `${window.location.origin}/privacy-policy`,
      promotion: widgetConfig.promotion,
      source: 'fursadolomiti.com',
      onOccupanciesChange: (guests: number[][]) => {
        addBookingSuedtirolLog('onOccupanciesChange', guests)
      },
      onStaySelection: (stay: unknown) => {
        addBookingSuedtirolLog('onStaySelection', stay)
      },
      onBookingSuccess: (reservation: unknown) => {
        addBookingSuedtirolLog('onBookingSuccess', reservation)
      },
      onBookingError: (error: unknown) => {
        addBookingSuedtirolLog('onBookingError', error)
      },
      onEnquirySuccess: (reservation: unknown) => {
        addBookingSuedtirolLog('onEnquirySuccess', reservation)
      },
    })

    bookingSuedtirolStatus.value = 'ready'
    addBookingSuedtirolLog('Widget mounted')
  } catch (error) {
    console.error('Booking Südtirol widget failed', error)
    bookingSuedtirolStatus.value = 'error'
    addBookingSuedtirolLog(error instanceof Error ? error.message : 'Widget failed')
  }
}

const submitBookingRequest = async () => {
  formError.value = ''

  if (!firstName.value.trim() || !lastName.value.trim() || !email.value.trim()) {
    formError.value = t('home.hotels.bookingModal.errors.required')
    return
  }

  if (!emailPattern.test(email.value.trim())) {
    formError.value = t('home.hotels.bookingModal.errors.email')
    return
  }

  const hotel = hotelPreviews.find((item) => item.id === bookingHotelId.value)
  const hotelName = hotel ? t(hotel.nameKey) : bookingHotelId.value
  formStatus.value = 'sending'

  try {
    const submittedAt = new Date()

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: firstName.value.trim(),
        lastName: lastName.value.trim(),
        email: email.value.trim(),
        hotelId: hotel?.id,
        hotel: hotelName,
        promoCode: hotel?.promoCode,
        hotelImage: hotel?.images[0] ? new URL(hotel.images[0], window.location.origin).href : '',
        locale: locale.value,
        localDateTime: new Intl.DateTimeFormat(locale.value, {
          dateStyle: 'full',
          timeStyle: 'long',
        }).format(submittedAt),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        submittedAt: submittedAt.toISOString(),
      }),
    })

    if (!response.ok) throw new Error(await response.text())

    const { promoCode } = (await response.json()) as { promoCode: string }

    if (hotel) {
      const bookingUrl = new URL(hotel.bookingUrl)
      bookingUrl.searchParams.set(hotel.bookingParams.firstName, firstName.value.trim())
      bookingUrl.searchParams.set(hotel.bookingParams.lastName, lastName.value.trim())
      bookingUrl.searchParams.set(hotel.bookingParams.email, email.value.trim())
      bookingUrl.searchParams.set(hotel.bookingParams.promoCode, promoCode)

      formStatus.value = 'redirecting'
      window.setTimeout(() => {
        window.location.assign(bookingUrl.href)
      }, 1400)
    }
  } catch (error) {
    console.error('Booking request failed', error)
    formStatus.value = 'idle'
    formError.value = t('home.hotels.bookingModal.errors.send')
  }
}

watch(bookingHotelId, async (hotelId) => {
  document.body.classList.toggle('is-booking-modal-open', Boolean(hotelId))

  if (hotelId) {
    await nextTick()
    const hotel = activeBookingHotel.value

    if (hotel?.bookingSuedtirol) {
      await mountBookingSuedtirolWidget(hotel)
      bookingModal.value?.querySelector<HTMLElement>('.booking-modal__close')?.focus()
      return
    }

    bookingModal.value?.querySelector<HTMLElement>('input')?.focus()
  }
})

onMounted(startHotelAutoplay)
onBeforeUnmount(() => {
  stopHotelAutoplay()
  document.body.classList.remove('is-booking-modal-open')

  if (filterAnimationTimer) {
    window.clearTimeout(filterAnimationTimer)
  }
})
</script>

<template>
  <section class="hotels-section">
    <div
      v-if="!hasLimit"
      class="hotels-section__filters"
      :class="[
        `hotels-section__filters--active-${activeFilter}`,
        `hotels-section__filters--leave-${previousFilter}`,
        { 'hotels-section__filters--animating': isFilterAnimating },
      ]"
      :aria-label="t('home.hotels.filters.label')"
    >
      <button
        v-for="filter in hotelFilters"
        :key="filter"
        class="hotels-section__filter"
        :class="{
          'hotels-section__filter--active': activeFilter === filter,
          'hotels-section__filter--disabled': isFilterDisabled(filter),
        }"
        type="button"
        :disabled="isFilterDisabled(filter)"
        :aria-pressed="activeFilter === filter"
        :aria-disabled="isFilterDisabled(filter)"
        @click="setActiveFilter(filter)"
      >
        <span>{{ t(`home.hotels.filters.${filter}`) }}</span>
      </button>
    </div>

    <TransitionGroup
      name="hotel-preview-list"
      tag="div"
      class="hotels-section__list"
      :class="{ 'hotels-section__list--filtering': isFilterAnimating }"
    >
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

        <div class="hotel-preview__content" @click="openBookingModal(hotel.id)">
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
              <AnimatedText
                :text="t(hotel.featuresLabelKey ?? 'home.hotels.features')"
                tag="span"
              />
            </span>
            <ul class="hotel-preview__features-list">
              <li v-for="feature in getHotelFeatures(hotel.featuresKey)" :key="feature">
                <AnimatedText :text="feature" tag="span" />
              </li>
            </ul>
          </div>

          <ul v-if="hotel.statsKey" class="hotel-preview__stats" :aria-label="t(hotel.nameKey)">
            <li v-for="stat in getHotelStats(hotel.statsKey)" :key="`${stat.icon}-${stat.value}`">
              <q-icon :name="stat.icon" />
              <span>{{ stat.value }}</span>
            </li>
          </ul>

          <q-btn
            unelevated
            no-caps
            class="fd-btn fd-btn--outline"
            @click.stop="openBookingModal(hotel.id)"
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

    <Teleport to="body">
      <Transition name="booking-modal">
        <div
          v-if="bookingHotelId"
          ref="bookingModal"
          class="booking-modal"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="`booking-modal-title-${bookingHotelId}`"
          @click.self="closeBookingModal"
          @keydown="handleModalKeydown"
        >
          <section
            class="booking-modal__panel"
            :class="{ 'booking-modal__panel--widget': isBookingSuedtirolHotel }"
          >
            <button
              v-if="formStatus === 'idle'"
              class="booking-modal__close"
              type="button"
              :aria-label="t('home.hotels.bookingModal.close')"
              @click="closeBookingModal"
            >
              <span aria-hidden="true"></span>
            </button>

            <div v-if="formStatus !== 'redirecting'" class="booking-modal__intro">
              <div>
                <h2 :id="`booking-modal-title-${bookingHotelId}`" class="booking-modal__title">
                  {{
                    isBookingSuedtirolHotel
                      ? t('home.hotels.bookingModal.widgetTitle')
                      : t('home.hotels.bookingModal.title')
                  }}
                </h2>
                <p class="booking-modal__description">
                  {{
                    isBookingSuedtirolHotel
                      ? t('home.hotels.bookingModal.widgetDescription')
                      : t('home.hotels.bookingModal.description')
                  }}
                </p>
              </div>

              <p class="booking-modal__privacy-note">
                {{
                  isBookingSuedtirolHotel
                    ? t('home.hotels.bookingModal.widgetPrivacyNote')
                    : t('home.hotels.bookingModal.privacyNote')
                }}
              </p>
            </div>

            <div v-if="formStatus === 'redirecting'" class="booking-modal__redirect">
              <span class="booking-modal__loader" aria-hidden="true"></span>
              <h2 class="booking-modal__redirect-title">
                {{ t('home.hotels.bookingModal.redirectTitle') }}
              </h2>
              <p class="booking-modal__redirect-text">
                {{ t('home.hotels.bookingModal.redirectText') }}
              </p>
            </div>

            <div v-if="isBookingSuedtirolHotel" class="booking-modal__widget-shell">
              <div class="booking-modal__widget-status" aria-live="polite">
                <span
                  v-if="bookingSuedtirolStatus === 'loading'"
                  class="booking-modal__button-loader"
                  aria-hidden="true"
                ></span>
                <span>
                  {{ t(`home.hotels.bookingModal.widgetStatus.${bookingSuedtirolStatus}`) }}
                </span>
              </div>

              <div ref="bookingSuedtirolContainer" class="booking-modal__widget"></div>

              <details class="booking-modal__debug" open>
                <summary>{{ t('home.hotels.bookingModal.widgetDebugTitle') }}</summary>
                <pre>{{ bookingSuedtirolLog.join('\n\n') || '-' }}</pre>
              </details>
            </div>

            <form
              v-else
              class="booking-modal__form"
              novalidate
              @submit.prevent="submitBookingRequest"
            >
              <label class="booking-modal__field">
                <span>{{ t('home.hotels.bookingModal.firstName') }}</span>
                <input
                  v-model="firstName"
                  type="text"
                  required
                  autocomplete="given-name"
                  :placeholder="t('home.hotels.bookingModal.firstNamePlaceholder')"
                />
              </label>

              <label class="booking-modal__field">
                <span>{{ t('home.hotels.bookingModal.lastName') }}</span>
                <input
                  v-model="lastName"
                  type="text"
                  required
                  autocomplete="family-name"
                  :placeholder="t('home.hotels.bookingModal.lastNamePlaceholder')"
                />
              </label>

              <label class="booking-modal__field">
                <span>{{ t('home.hotels.bookingModal.email') }}</span>
                <input
                  v-model="email"
                  type="email"
                  required
                  autocomplete="email"
                  :placeholder="t('home.hotels.bookingModal.emailPlaceholder')"
                />
              </label>

              <p
                class="booking-modal__required"
                :class="{ 'booking-modal__required--error': formError }"
                aria-live="polite"
              >
                {{ formError || t('home.hotels.bookingModal.required') }}
              </p>

              <div class="booking-modal__actions">
                <button
                  class="booking-modal__primary"
                  type="submit"
                  :disabled="formStatus === 'sending'"
                >
                  <span v-if="formStatus === 'sending'" class="booking-modal__button-loader"></span>
                  <span>
                    {{
                      formStatus === 'sending'
                        ? t('home.hotels.bookingModal.sending')
                        : t('home.hotels.bookingModal.continue')
                    }}
                  </span>
                </button>
              </div>
            </form>
          </section>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>
