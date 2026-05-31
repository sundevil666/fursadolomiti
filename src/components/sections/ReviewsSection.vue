<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AnimatedText from '@/components/AnimatedText.vue'
import type { Review } from '@/data/homeSections'

const { t, tm } = useI18n()

const reviewTouchStartX = ref<number | null>(null)
const activeReviewIndex = ref(0)
const isReviewAutoplayPaused = ref(false)
const expandedReviewIds = ref(new Set<number>())
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
const reviewPreviewLength = 360

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

const isReviewExpanded = (id: number) => expandedReviewIds.value.has(id)

const getReviewText = (review: Review) => {
  if (!isLongReview(review.text) || isReviewExpanded(review.id)) return review.text

  return `${review.text.slice(0, reviewPreviewLength).trim()}...`
}

const toggleReview = (id: number) => {
  const nextExpandedReviewIds = new Set(expandedReviewIds.value)

  if (nextExpandedReviewIds.has(id)) {
    nextExpandedReviewIds.delete(id)
  } else {
    nextExpandedReviewIds.add(id)
  }

  expandedReviewIds.value = nextExpandedReviewIds
}

onMounted(startReviewAutoplay)
onBeforeUnmount(stopReviewAutoplay)
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
            >
              <span class="reviews-section__quote" aria-hidden="true">“</span>
              <p class="reviews-section__text">
                <AnimatedText :text="getReviewText(review)" tag="span" />
              </p>
              <button
                v-if="isLongReview(review.text)"
                class="reviews-section__read-more"
                type="button"
                @click="toggleReview(review.id)"
              >
                <AnimatedText
                  :text="t(isReviewExpanded(review.id) ? 'home.reviews.readLess' : 'home.reviews.readMore')"
                  tag="span"
                />
              </button>
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
  </section>
</template>
