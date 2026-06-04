<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AnimatedText from '@/components/AnimatedText.vue'
import type { Review } from '@/data/homeSections'

const { t, tm } = useI18n()

const reviewTouchStartX = ref<number | null>(null)
const activeReviewIndex = ref(0)
const isReviewAutoplayPaused = ref(false)
const selectedReview = ref<Review | null>(null)
const previouslyFocusedElement = ref<HTMLElement | null>(null)
const reviews = computed(() => tm('home.reviews.items') as Review[])
const visibleReviews = computed(() => {
  if (reviews.value.length <= 1) return reviews.value

  return [
    reviews.value[activeReviewIndex.value],
    reviews.value[(activeReviewIndex.value + 1) % reviews.value.length],
  ]
})
const reviewAutoplayDelay = 6000
let reviewAutoplayTimer: number | undefined
const reviewPreviewLength = 260

const setReview = (index: number, shouldRestartAutoplay = true) => {
  if (!reviews.value.length) return

  activeReviewIndex.value = (index + reviews.value.length) % reviews.value.length

  if (shouldRestartAutoplay && !isReviewAutoplayPaused.value) {
    restartReviewAutoplay()
  }
}

const startReviewAutoplay = () => {
  if (isReviewAutoplayPaused.value) return

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
  if (reviewTouchStartX.value === null) return

  const endX = event.changedTouches[0]?.clientX ?? reviewTouchStartX.value
  const distance = reviewTouchStartX.value - endX

  if (Math.abs(distance) > 38) {
    setReview(activeReviewIndex.value + (distance > 0 ? 1 : -1))
  }

  reviewTouchStartX.value = null
}

const isLongReview = (text: string) => text.length > reviewPreviewLength

const getReviewText = (review: Review) => {
  if (!isLongReview(review.text)) return review.text

  return `${review.text.slice(0, reviewPreviewLength).trim()}...`
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
              <span v-if="isLongReview(review.text)" class="reviews-section__read-more">
                <AnimatedText :text="t('home.reviews.readMore')" tag="span" />
              </span>
              <footer class="reviews-section__author">
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
              </footer>
            </article>
          </div>
        </Transition>

        <button
          class="reviews-section__nav reviews-section__nav--next"
          type="button"
          :aria-label="t('home.reviews.next')"
          @click="setReview(activeReviewIndex + 1)"
        >
          <q-icon name="chevron_right" />
        </button>

        <div class="reviews-section__dots" aria-hidden="true">
          <button
            v-for="(_, index) in reviews"
            :key="index"
            class="reviews-section__dot"
            :class="{ 'reviews-section__dot--active': index === activeReviewIndex }"
            :style="{ '--review-slide-duration': `${reviewAutoplayDelay}ms` }"
            type="button"
            @click="setReview(index)"
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
                {{ selectedReview.text }}
              </p>
            </div>

            <footer class="reviews-modal__author">
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
            </footer>
          </article>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>
