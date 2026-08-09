<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AnimatedText from '@/components/AnimatedText.vue'
import { guestReviews, type GuestReview } from '@/data/reviews'
import type { AppLocale } from '@/i18n'

const { locale, t } = useI18n()

const reviewTouchStartX = ref<number | null>(null)
const activeReviewIndex = ref(0)
const isReviewAutoplayPaused = ref(false)
const selectedReview = ref<GuestReview | null>(null)
const previouslyFocusedElement = ref<HTMLElement | null>(null)
const translatedReviewIds = ref<Record<number, boolean>>({})
const reviews = computed(() => guestReviews)
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

const getReviewTranslation = (review: GuestReview) =>
  review.translations?.[currentLocale.value]?.trim()

const hasReviewTranslation = (review: GuestReview) => Boolean(getReviewTranslation(review))

const isReviewTranslated = (review: GuestReview) =>
  Boolean(translatedReviewIds.value[review.id] && hasReviewTranslation(review))

const getDisplayReviewText = (review: GuestReview) =>
  isReviewTranslated(review) ? (getReviewTranslation(review) ?? review.text) : review.text

const toggleReviewTranslation = (review: GuestReview) => {
  if (!hasReviewTranslation(review)) return

  translatedReviewIds.value = {
    ...translatedReviewIds.value,
    [review.id]: !isReviewTranslated(review),
  }
}

const isLongReview = (review: GuestReview) =>
  getDisplayReviewText(review).length > reviewPreviewLength

const getReviewText = (review: GuestReview) => {
  const text = getDisplayReviewText(review)

  if (!isLongReview(review)) return text

  return `${text.slice(0, reviewPreviewLength).trim()}...`
}

const getReviewLocation = (review: GuestReview) => review.location[currentLocale.value]

const getReviewDate = (review: GuestReview) => review.date[currentLocale.value]

const openReviewModal = (review: GuestReview) => {
  previouslyFocusedElement.value =
    document.activeElement instanceof HTMLElement ? document.activeElement : null
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

const handleReviewKeydown = (event: KeyboardEvent, review: GuestReview) => {
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
          <svg
            width="9"
            height="17"
            viewBox="0 0 9 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8.5 0.500001L0.5 8.5L8.5 16.5"
              stroke="#EFE4C9"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <Transition name="review-slide" mode="out-in">
          <div :key="activeReviewIndex" class="reviews-section__cards">
            <article
              v-for="review in visibleReviews"
              :key="review.id"
              class="reviews-section__card"
              role="button"
              tabindex="0"
              :aria-label="`${t('home.reviews.openReview')}: ${review.author}, ${getReviewLocation(review)}`"
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
                    <span
                      v-if="review.source === 'instagram'"
                      class="reviews-section__instagram-mark"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10 1.8072C12.6506 1.8072 13.012 1.8072 14.0964 1.8072C15.0602 1.8072 15.5422 2.0482 15.9036 2.1687C16.3855 2.4096 16.747 2.5301 17.1084 2.8916C17.4699 3.253 17.7108 3.6145 17.8313 4.0964C17.9518 4.4578 18.0723 4.9398 18.1928 5.9036C18.1928 6.988 18.1928 7.2289 18.1928 10C18.1928 12.7711 18.1928 13.012 18.1928 14.0964C18.1928 15.0602 17.9518 15.5422 17.8313 15.9036C17.5904 16.3855 17.4699 16.747 17.1084 17.1084C16.747 17.4699 16.3855 17.7108 15.9036 17.8313C15.5422 17.9518 15.0602 18.0723 14.0964 18.1928C13.012 18.1928 12.7711 18.1928 10 18.1928C7.2289 18.1928 6.988 18.1928 5.9036 18.1928C4.9398 18.1928 4.4578 17.9518 4.0964 17.8313C3.6145 17.5904 3.253 17.4699 2.8916 17.1084C2.5301 16.747 2.2892 16.3855 2.1687 15.9036C2.0482 15.5422 1.9277 15.0602 1.8072 14.0964C1.8072 13.012 1.8072 12.7711 1.8072 10C1.8072 7.2289 1.8072 6.988 1.8072 5.9036C1.8072 4.9398 2.0482 4.4578 2.1687 4.0964C2.4096 3.6145 2.5301 3.253 2.8916 2.8916C3.253 2.5301 3.6145 2.2892 4.0964 2.1687C4.4578 2.0482 4.9398 1.9277 5.9036 1.8072C6.988 1.8072 7.3494 1.8072 10 1.8072ZM10 0C7.2289 0 6.988 0 5.9036 0C4.8193 0 4.0964 0.241 3.494 0.4819C2.8916 0.7229 2.2892 1.0843 1.6867 1.6867C1.0843 2.2892 0.8434 2.7711 0.4819 3.494C0.241 4.0964 0.1205 4.8193 0 5.9036C0 6.988 0 7.3494 0 10C0 12.7711 0 13.012 0 14.0964C0 15.1807 0.241 15.9036 0.4819 16.506C0.7229 17.1084 1.0843 17.7108 1.6867 18.3133C2.2892 18.9157 2.7711 19.1566 3.494 19.5181C4.0964 19.759 4.8193 19.8795 5.9036 20C6.988 20 7.3494 20 10 20C12.6506 20 13.012 20 14.0964 20C15.1807 20 15.9036 19.759 16.506 19.5181C17.1084 19.2771 17.7108 18.9157 18.3133 18.3133C18.9157 17.7108 19.1566 17.2289 19.5181 16.506C19.759 15.9036 19.8795 15.1807 20 14.0964C20 13.012 20 12.6506 20 10C20 7.3494 20 6.988 20 5.9036C20 4.8193 19.759 4.0964 19.5181 3.494C19.2771 2.8916 18.9157 2.2892 18.3133 1.6867C17.7108 1.0843 17.2289 0.8434 16.506 0.4819C15.9036 0.241 15.1807 0.1205 14.0964 0C13.012 0 12.7711 0 10 0Z" fill="#FFF6E1"/>
<path d="M10 1.8072H14.0964C15.0602 1.8072 15.5422 2.0482 15.9036 2.1687C16.3855 2.4096 16.747 2.5301 17.1084 2.8916C17.4699 3.253 17.7108 3.6145 17.8313 4.0964C17.9518 4.4578 18.0723 4.9398 18.1928 5.9036V10V14.0964C18.1928 15.0602 17.9518 15.5422 17.8313 15.9036C17.5904 16.3855 17.4699 16.747 17.1084 17.1084C16.747 17.4699 16.3855 17.7108 15.9036 17.8313C15.5422 17.9518 15.0602 18.0723 14.0964 18.1928H10H5.9036C4.9398 18.1928 4.4578 17.9518 4.0964 17.8313C3.6145 17.5904 3.253 17.4699 2.8916 17.1084C2.5301 16.747 2.2892 16.3855 2.1687 15.9036C2.0482 15.5422 1.9277 15.0602 1.8072 14.0964V10V5.9036C1.8072 4.9398 2.0482 4.4578 2.1687 4.0964C2.4096 3.6145 2.5301 3.253 2.8916 2.8916C3.253 2.5301 3.6145 2.2892 4.0964 2.1687C4.4578 2.0482 4.9398 1.9277 5.9036 1.8072H10Z" fill="#FFF6E1"/>
<path d="M15.1089 5C15.6612 5 16.1089 4.5523 16.1089 4C16.1089 3.4477 15.6612 3 15.1089 3C14.5566 3 14.1089 3.4477 14.1089 4C14.1089 4.5523 14.5566 5 15.1089 5Z" fill="#175445"/>
<path d="M10 14C12.2091 14 14 12.2091 14 10C14 7.79086 12.2091 6 10 6C7.79086 6 6 7.79086 6 10C6 12.2091 7.79086 14 10 14Z" stroke="#175445" stroke-width="2"/>
</svg>

                    </span>
                    <span v-else>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M19.6 10.2271C19.6 9.51801 19.5364 8.83619 19.4182 8.18164H10V12.0498H15.3818C15.15 13.2998 14.4455 14.3589 13.3864 15.068V17.5771H16.6182C18.5091 15.8362 19.6 13.2726 19.6 10.2271Z"
                          fill="#FFF6E1"
                        />
                        <path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M9.99961 19.9999C12.6996 19.9999 14.9633 19.1045 16.6178 17.5772L13.386 15.0681C12.4905 15.6681 11.3451 16.0226 9.99961 16.0226C7.39506 16.0226 5.19051 14.2635 4.40415 11.8999H1.06323V14.4908C2.70869 17.759 6.09052 19.9999 9.99961 19.9999Z"
                          fill="#FFF6E1"
                        />
                        <path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M4.40455 11.8997C4.20455 11.2997 4.09092 10.6588 4.09092 9.99971C4.09092 9.34062 4.20455 8.6997 4.40455 8.0997V5.50879H1.06364C0.386364 6.85879 0 8.38607 0 9.99971C0 11.6133 0.386364 13.1406 1.06364 14.4906L4.40455 11.8997Z"
                          fill="#FFF6E1"
                        />
                        <path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M9.99961 3.97728C11.4678 3.97728 12.786 4.48183 13.8224 5.47274L16.6905 2.60455C14.9587 0.990911 12.6951 0 9.99961 0C6.09052 0 2.70869 2.24091 1.06323 5.5091L4.40415 8.10002C5.19051 5.73638 7.39506 3.97728 9.99961 3.97728Z"
                          fill="#FFF6E1"
                        />
                      </svg>
                    </span>
                  </span>
                  <span class="reviews-section__author-copy">
                    <strong class="reviews-section__author">
                      <AnimatedText
                        :text="`${review.author}, ${getReviewLocation(review)}`"
                        tag="span"
                      />
                    </strong>
                    <span class="reviews-section__author-date">
                      <AnimatedText :text="getReviewDate(review)" tag="span" />
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
          <svg
            width="9"
            height="17"
            viewBox="0 0 9 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0.499999 0.500001L8.5 8.5L0.5 16.5"
              stroke="#EFE4C9"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <div
          v-if="totalReviewSlides > 1"
          class="reviews-section__dots"
          :style="{ '--review-dot-count': totalReviewSlides }"
          aria-hidden="true"
        >
          <button
            v-for="index in totalReviewSlides"
            :key="index"
            class="reviews-section__dot"
            :class="{ 'reviews-section__dot--active': index - 1 === activeReviewIndex }"
            :style="{
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
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10 1.8072C12.6506 1.8072 13.012 1.8072 14.0964 1.8072C15.0602 1.8072 15.5422 2.0482 15.9036 2.1687C16.3855 2.4096 16.747 2.5301 17.1084 2.8916C17.4699 3.253 17.7108 3.6145 17.8313 4.0964C17.9518 4.4578 18.0723 4.9398 18.1928 5.9036C18.1928 6.988 18.1928 7.2289 18.1928 10C18.1928 12.7711 18.1928 13.012 18.1928 14.0964C18.1928 15.0602 17.9518 15.5422 17.8313 15.9036C17.5904 16.3855 17.4699 16.747 17.1084 17.1084C16.747 17.4699 16.3855 17.7108 15.9036 17.8313C15.5422 17.9518 15.0602 18.0723 14.0964 18.1928C13.012 18.1928 12.7711 18.1928 10 18.1928C7.2289 18.1928 6.988 18.1928 5.9036 18.1928C4.9398 18.1928 4.4578 17.9518 4.0964 17.8313C3.6145 17.5904 3.253 17.4699 2.8916 17.1084C2.5301 16.747 2.2892 16.3855 2.1687 15.9036C2.0482 15.5422 1.9277 15.0602 1.8072 14.0964C1.8072 13.012 1.8072 12.7711 1.8072 10C1.8072 7.2289 1.8072 6.988 1.8072 5.9036C1.8072 4.9398 2.0482 4.4578 2.1687 4.0964C2.4096 3.6145 2.5301 3.253 2.8916 2.8916C3.253 2.5301 3.6145 2.2892 4.0964 2.1687C4.4578 2.0482 4.9398 1.9277 5.9036 1.8072C6.988 1.8072 7.3494 1.8072 10 1.8072ZM10 0C7.2289 0 6.988 0 5.9036 0C4.8193 0 4.0964 0.241 3.494 0.4819C2.8916 0.7229 2.2892 1.0843 1.6867 1.6867C1.0843 2.2892 0.8434 2.7711 0.4819 3.494C0.241 4.0964 0.1205 4.8193 0 5.9036C0 6.988 0 7.3494 0 10C0 12.7711 0 13.012 0 14.0964C0 15.1807 0.241 15.9036 0.4819 16.506C0.7229 17.1084 1.0843 17.7108 1.6867 18.3133C2.2892 18.9157 2.7711 19.1566 3.494 19.5181C4.0964 19.759 4.8193 19.8795 5.9036 20C6.988 20 7.3494 20 10 20C12.6506 20 13.012 20 14.0964 20C15.1807 20 15.9036 19.759 16.506 19.5181C17.1084 19.2771 17.7108 18.9157 18.3133 18.3133C18.9157 17.7108 19.1566 17.2289 19.5181 16.506C19.759 15.9036 19.8795 15.1807 20 14.0964C20 13.012 20 12.6506 20 10C20 7.3494 20 6.988 20 5.9036C20 4.8193 19.759 4.0964 19.5181 3.494C19.2771 2.8916 18.9157 2.2892 18.3133 1.6867C17.7108 1.0843 17.2289 0.8434 16.506 0.4819C15.9036 0.241 15.1807 0.1205 14.0964 0C13.012 0 12.7711 0 10 0Z" fill="#FFF6E1"/>
<path d="M10 1.8072H14.0964C15.0602 1.8072 15.5422 2.0482 15.9036 2.1687C16.3855 2.4096 16.747 2.5301 17.1084 2.8916C17.4699 3.253 17.7108 3.6145 17.8313 4.0964C17.9518 4.4578 18.0723 4.9398 18.1928 5.9036V10V14.0964C18.1928 15.0602 17.9518 15.5422 17.8313 15.9036C17.5904 16.3855 17.4699 16.747 17.1084 17.1084C16.747 17.4699 16.3855 17.7108 15.9036 17.8313C15.5422 17.9518 15.0602 18.0723 14.0964 18.1928H10H5.9036C4.9398 18.1928 4.4578 17.9518 4.0964 17.8313C3.6145 17.5904 3.253 17.4699 2.8916 17.1084C2.5301 16.747 2.2892 16.3855 2.1687 15.9036C2.0482 15.5422 1.9277 15.0602 1.8072 14.0964V10V5.9036C1.8072 4.9398 2.0482 4.4578 2.1687 4.0964C2.4096 3.6145 2.5301 3.253 2.8916 2.8916C3.253 2.5301 3.6145 2.2892 4.0964 2.1687C4.4578 2.0482 4.9398 1.9277 5.9036 1.8072H10Z" fill="#FFF6E1"/>
<path d="M15.1089 5C15.6612 5 16.1089 4.5523 16.1089 4C16.1089 3.4477 15.6612 3 15.1089 3C14.5566 3 14.1089 3.4477 14.1089 4C14.1089 4.5523 14.5566 5 15.1089 5Z" fill="#175445"/>
<path d="M10 14C12.2091 14 14 12.2091 14 10C14 7.79086 12.2091 6 10 6C7.79086 6 6 7.79086 6 10C6 12.2091 7.79086 14 10 14Z" stroke="#175445" stroke-width="2"/>
</svg>

                  </span>
                  <span v-else>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M19.6 10.2271C19.6 9.51801 19.5364 8.83619 19.4182 8.18164H10V12.0498H15.3818C15.15 13.2998 14.4455 14.3589 13.3864 15.068V17.5771H16.6182C18.5091 15.8362 19.6 13.2726 19.6 10.2271Z"
                        fill="#FFF6E1"
                      />
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M9.99961 19.9999C12.6996 19.9999 14.9633 19.1045 16.6178 17.5772L13.386 15.0681C12.4905 15.6681 11.3451 16.0226 9.99961 16.0226C7.39506 16.0226 5.19051 14.2635 4.40415 11.8999H1.06323V14.4908C2.70869 17.759 6.09052 19.9999 9.99961 19.9999Z"
                        fill="#FFF6E1"
                      />
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M4.40455 11.8997C4.20455 11.2997 4.09092 10.6588 4.09092 9.99971C4.09092 9.34062 4.20455 8.6997 4.40455 8.0997V5.50879H1.06364C0.386364 6.85879 0 8.38607 0 9.99971C0 11.6133 0.386364 13.1406 1.06364 14.4906L4.40455 11.8997Z"
                        fill="#FFF6E1"
                      />
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M9.99961 3.97728C11.4678 3.97728 12.786 4.48183 13.8224 5.47274L16.6905 2.60455C14.9587 0.990911 12.6951 0 9.99961 0C6.09052 0 2.70869 2.24091 1.06323 5.5091L4.40415 8.10002C5.19051 5.73638 7.39506 3.97728 9.99961 3.97728Z"
                        fill="#FFF6E1"
                      />
                    </svg>
                  </span>
                </span>
                <span class="reviews-section__author-copy">
                  <strong
                    >{{ selectedReview.author }}, {{ getReviewLocation(selectedReview) }}</strong
                  >
                  <span>{{ getReviewDate(selectedReview) }}</span>
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
