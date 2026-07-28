<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AnimatedText from '@/components/AnimatedText.vue'
import type { Review } from '@/data/homeSections'
import type { AppLocale } from '@/i18n'

const { locale, t, tm } = useI18n()

const reviewTouchStartX = ref<number | null>(null)
const activeReviewIndex = ref(0)
const isReviewAutoplayPaused = ref(false)
const selectedReview = ref<Review | null>(null)
const previouslyFocusedElement = ref<HTMLElement | null>(null)
const translatedReviewIds = ref<Record<number, boolean>>({})
const reviews = computed(() => tm('home.reviews.items') as Review[])
const currentLocale = computed(() => locale.value as AppLocale)
const reviewsPerSlide = 2
const totalReviewSlides = computed(() => Math.ceil(reviews.value.length / reviewsPerSlide))
const visibleReviews = computed(() => {
  const startIndex = activeReviewIndex.value * reviewsPerSlide

  return reviews.value.slice(startIndex, startIndex + reviewsPerSlide)
})
const reviewAutoplayDelay = 10000
let reviewAutoplayTimer: number | undefined
const reviewPreviewLength = 260

const setReview = (index: number, shouldRestartAutoplay = true) => {
  if (!totalReviewSlides.value) return

  activeReviewIndex.value = (index + totalReviewSlides.value) % totalReviewSlides.value

  if (shouldRestartAutoplay && !isReviewAutoplayPaused.value) {
    restartReviewAutoplay()
  }
}

const startReviewAutoplay = () => {
  if (isReviewAutoplayPaused.value || totalReviewSlides.value <= 1) return

  stopReviewAutoplay()
  reviewAutoplayTimer = window.setInterval(() => {
    setReview(activeReviewIndex.value + 1, false)
  }, reviewAutoplayDelay)
}

const stopReviewAutoplay = () => {
  if (!reviewAutoplayTimer) return

  window.clearInterval(reviewAutoplayTimer)
  reviewAutoplayTimer = undefined
}

const restartReviewAutoplay = () => {
  stopReviewAutoplay()
  startReviewAutoplay()
}

const pauseReviewAutoplay = () => {
  isReviewAutoplayPaused.value = true
  stopReviewAutoplay()
}

const resumeReviewAutoplay = () => {
  isReviewAutoplayPaused.value = false
  startReviewAutoplay()
}

const handleReviewTouchStart = (event: TouchEvent) => {
  reviewTouchStartX.value = event.touches[0]?.clientX ?? null
}

const handleReviewTouchEnd = (event: TouchEvent) => {
  if (reviewTouchStartX.value === null || totalReviewSlides.value <= 1) return

  const endX = event.changedTouches[0]?.clientX ?? reviewTouchStartX.value
  const distance = reviewTouchStartX.value - endX

  if (Math.abs(distance) > 38) {
    setReview(activeReviewIndex.value + (distance > 0 ? 1 : -1))
  }

  reviewTouchStartX.value = null
}

const getReviewTranslation = (review: Review) => review.translations?.[currentLocale.value]?.trim()

const hasReviewTranslation = (review: Review) => Boolean(getReviewTranslation(review))

const isReviewTranslated = (review: Review) =>
  Boolean(translatedReviewIds.value[review.id] && hasReviewTranslation(review))

const getDisplayReviewText = (review: Review) =>
  isReviewTranslated(review) ? (getReviewTranslation(review) ?? review.text) : review.text

const toggleReviewTranslation = (review: Review) => {
  if (!hasReviewTranslation(review)) return

  translatedReviewIds.value = {
    ...translatedReviewIds.value,
    [review.id]: !isReviewTranslated(review),
  }
}

const isLongReview = (review: Review) => getDisplayReviewText(review).length > reviewPreviewLength

const getReviewText = (review: Review) => {
  const text = getDisplayReviewText(review)

  if (!isLongReview(review)) return text

  return `${text.slice(0, reviewPreviewLength).trim()}...`
}

const openReviewModal = (review: Review) => {
  previouslyFocusedElement.value = document.activeElement instanceof HTMLElement ? document.activeElement : null
  selectedReview.value = review
  pauseReviewAutoplay()

  void nextTick(() => {
    document.querySelector<HTMLElement>('.reviews-modal__close')?.focus()
  })
}

const closeReviewModal = () => {
  selectedReview.value = null
  resumeReviewAutoplay()

  void nextTick(() => {
    previouslyFocusedElement.value?.focus()
    previouslyFocusedElement.value = null
  })
}

const handleReviewKeydown = (event: KeyboardEvent, review: Review) => {
  if (event.target instanceof HTMLButtonElement) return

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    openReviewModal(review)
  }
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && selectedReview.value) {
    closeReviewModal()
  }
}

watch(selectedReview, (review) => {
  document.body.classList.toggle('is-review-modal-open', Boolean(review))
})

onMounted(() => {
  startReviewAutoplay()
  window.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  stopReviewAutoplay()
  window.removeEventListener('keydown', handleEscape)
  document.body.classList.remove('is-review-modal-open')
})
</script>

<template>
  <section
    v-if="reviews.length"
    class="reviews-section"
    aria-labelledby="reviews-title"
    @touchstart.passive="handleReviewTouchStart"
    @touchend.passive="handleReviewTouchEnd"
    @mouseenter="pauseReviewAutoplay"
    @mouseleave="resumeReviewAutoplay"
    @focusin="pauseReviewAutoplay"
    @focusout="resumeReviewAutoplay"
  >
    <div class="reviews-section__shell">
      <h2 id="reviews-title" class="reviews-section__title">
        <AnimatedText :text="t('home.reviews.title')" tag="span" />
      </h2>

      <div class="reviews-section__stage">
        <button
          v-if="totalReviewSlides > 1"
          class="reviews-section__nav reviews-section__nav--prev"
          type="button"
          :aria-label="t('home.reviews.previous')"
          @click="setReview(activeReviewIndex - 1)"
        >
          <q-icon name="chevron_left" />
        </button>

        <Transition name="review-slide" mode="out-in">
          <div :key="activeReviewIndex" class="reviews-section__cards">
            <article
              v-for="review in visibleReviews"
              :key="review.id"
              class="reviews-section__card"
              role="button"
              tabindex="0"
              :aria-label="`${t('home.reviews.openReview')}: ${review.author}, ${review.location}`"
              @click="openReviewModal(review)"
              @keydown="handleReviewKeydown($event, review)"
            >
              <span class="reviews-section__quote" aria-hidden="true">“</span>
              <p class="reviews-section__text">
                <AnimatedText :text="getReviewText(review)" tag="span" />
              </p>
              <div class="reviews-section__actions">
                <span v-if="isLongReview(review)" class="reviews-section__read-more">
                  <AnimatedText :text="t('home.reviews.readMore')" tag="span" />
                </span>
              </div>
              <footer class="reviews-section__author">
                <span class="reviews-section__author-main">
                  <span
                    class="reviews-section__social"
                    :class="`reviews-section__social--${review.source}`"
                    aria-hidden="true"
                  >
                    <span v-if="review.source === 'instagram'" class="reviews-section__instagram-mark" />
                    <span v-else>G</span>
                  </span>
                  <span class="reviews-section__author-copy">
                    <strong>
                      <AnimatedText :text="`${review.author}, ${review.location}`" tag="span" />
                    </strong>
                    <span>
                      <AnimatedText :text="review.date" tag="span" />
                    </span>
                  </span>
                </span>
                <button
                  v-if="hasReviewTranslation(review)"
                  class="reviews-section__translate"
                  type="button"
                  @click.stop="toggleReviewTranslation(review)"
                >
                  <q-icon :name="isReviewTranslated(review) ? 'undo' : 'translate'" />
                  <AnimatedText
                    :text="
                      isReviewTranslated(review)
                        ? t('home.reviews.showOriginal')
                        : t('home.reviews.translate')
                    "
                    tag="span"
                  />
                </button>
              </footer>
            </article>
          </div>
        </Transition>

        <button
          v-if="totalReviewSlides > 1"
          class="reviews-section__nav reviews-section__nav--next"
          type="button"
          :aria-label="t('home.reviews.next')"
          @click="setReview(activeReviewIndex + 1)"
        >
          <q-icon name="chevron_right" />
        </button>

        <div v-if="totalReviewSlides > 1" class="reviews-section__dots" aria-hidden="true">
          <button
            v-for="index in totalReviewSlides"
            :key="index"
            class="reviews-section__dot"
            :class="{ 'reviews-section__dot--active': index - 1 === activeReviewIndex }"
            :style="{
              '--review-dot-count': totalReviewSlides,
              '--review-slide-duration': `${reviewAutoplayDelay}ms`,
            }"
            type="button"
            @click="setReview(index - 1)"
          />
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="review-modal">
        <div
          v-if="selectedReview"
          class="reviews-modal"
          role="dialog"
          aria-modal="true"
          :aria-label="`${t('home.reviews.fullReview')}: ${selectedReview.author}`"
          @click.self="closeReviewModal"
        >
          <article class="reviews-modal__panel">
            <button
              class="reviews-modal__close"
              type="button"
              :aria-label="t('home.reviews.close')"
              @click="closeReviewModal"
            >
              <q-icon name="close" />
            </button>

            <span class="reviews-modal__quote" aria-hidden="true">“</span>

            <div class="reviews-modal__content">
              <p class="reviews-modal__text">
                {{ getDisplayReviewText(selectedReview) }}
              </p>
            </div>

            <footer class="reviews-modal__author">
              <span class="reviews-section__author-main">
                <span
                  class="reviews-section__social"
                  :class="`reviews-section__social--${selectedReview.source}`"
                  aria-hidden="true"
                >
                  <span
                    v-if="selectedReview.source === 'instagram'"
                    class="reviews-section__instagram-mark"
                  />
                  <span v-else>G</span>
                </span>
                <span class="reviews-section__author-copy">
                  <strong>{{ selectedReview.author }}, {{ selectedReview.location }}</strong>
                  <span>{{ selectedReview.date }}</span>
                </span>
              </span>
              <button
                v-if="hasReviewTranslation(selectedReview)"
                class="reviews-modal__translate"
                type="button"
                @click="toggleReviewTranslation(selectedReview)"
              >
                <q-icon :name="isReviewTranslated(selectedReview) ? 'undo' : 'translate'" />
                <span>
                  {{
                    isReviewTranslated(selectedReview)
                      ? t('home.reviews.showOriginal')
                      : t('home.reviews.translate')
                  }}
                </span>
              </button>
            </footer>
          </article>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>
