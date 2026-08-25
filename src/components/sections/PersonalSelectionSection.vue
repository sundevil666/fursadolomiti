<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AnimatedText from '@/components/AnimatedText.vue'

const { t } = useI18n()
const videoIds = ['Q-VQD1-12RE', 'Mdglvm2w-dg']
const autoplayDelay = 10000
const activeVideo = ref(0)
let autoplayTimer: number | undefined

const getVideoEmbedUrl = (videoId: string) =>
  `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=1&loop=1&playlist=${videoId}&playsinline=1&rel=0&modestbranding=1`

const setActiveVideo = (index: number, shouldRestartAutoplay = true) => {
  activeVideo.value = (index + videoIds.length) % videoIds.length

  if (shouldRestartAutoplay) {
    restartAutoplay()
  }
}

const startAutoplay = () => {
  stopAutoplay()
  autoplayTimer = window.setInterval(() => {
    setActiveVideo(activeVideo.value + 1, false)
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

onMounted(startAutoplay)
onBeforeUnmount(stopAutoplay)
</script>

<template>
  <section class="personal-selection" aria-labelledby="personal-selection-title">
    <div class="personal-selection__wrapper">
      <div class="personal-selection__left">
        <div
          class="personal-selection__copy"
          data-aos="block-slide-right"
          data-aos-duration="1000"
          data-aos-offset="140"
        >
          <h2 id="personal-selection-title" class="personal-selection__title">
            <AnimatedText :text="t('home.personalSelection.title')" tag="span" />
          </h2>

          <div class="personal-selection__note">
            <p>
              <AnimatedText :text="t('home.personalSelection.note')" tag="span" />
            </p>
          </div>
        </div>
        <div
          class="personal-selection__footer"
          data-aos="block-slide-right"
          data-aos-duration="1000"
          data-aos-offset="100"
        >
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

      <div class="personal-selection__right">
        <aside
          class="personal-selection__video"
          data-aos="block-slide-left"
          data-aos-duration="1000"
          data-aos-offset="140"
        >
          <p>
            <AnimatedText :text="t('home.personalSelection.videoTitle')" tag="span" />
          </p>

          <div class="personal-selection__video-content">
            <div
              class="personal-selection__visual"
              aria-hidden="true"
              data-aos="block-slide-left"
              data-aos-duration="1000"
              data-aos-offset="140"
            >
              <div class="personal-selection__phone">
                <div
                  v-for="(videoId, index) in videoIds"
                  :key="videoId"
                  class="personal-selection__slide"
                  :class="{ 'personal-selection__slide--active': index === activeVideo }"
                >
                  <iframe
                    v-if="index === activeVideo"
                    class="personal-selection__embed"
                    :src="getVideoEmbedUrl(videoId)"
                    :title="`${t('home.personalSelection.videoTitle')} ${index + 1}`"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen
                    loading="lazy"
                    referrerpolicy="strict-origin-when-cross-origin"
                  />
                </div>
              </div>
              <q-btn
                class="personal-selection__arrow personal-selection__arrow--prev"
                round
                unelevated
                :aria-label="t('home.previousSlide')"
                @click="setActiveVideo(activeVideo - 1)"
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
                    stroke="#08211F"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </q-btn>
              <q-btn
                class="personal-selection__arrow personal-selection__arrow--next"
                round
                unelevated
                :aria-label="t('home.nextSlide')"
                @click="setActiveVideo(activeVideo + 1)"
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
                    stroke="#08211F"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </q-btn>
              <div class="personal-selection__progress" aria-hidden="true">
                <button
                  v-for="(_, index) in videoIds"
                  :key="index"
                  class="personal-selection__progress-part"
                  :class="{ 'personal-selection__progress-part--active': index === activeVideo }"
                  :style="{ '--slide-duration': `${autoplayDelay}ms` }"
                  type="button"
                  @click="setActiveVideo(index)"
                />
              </div>
              <div class="personal-selection__dots" />
            </div>

            <div class="flex column justify-end">
              <ul class="flex column justify-end">
                <li>
                  <AnimatedText :text="t('home.personalSelection.videoPoint1')" tag="span" />
                </li>
                <li>
                  <AnimatedText :text="t('home.personalSelection.videoPoint2')" tag="span" />
                </li>
                <li>
                  <AnimatedText :text="t('home.personalSelection.videoPoint3')" tag="span" />
                </li>
                <li>
                  <AnimatedText :text="t('home.personalSelection.videoPoint4')" tag="span" />
                </li>
                <li>
                  <AnimatedText :text="t('home.personalSelection.videoPoint5')" tag="span" />
                </li>
              </ul>
              <q-btn
                outline
                no-caps
                class="personal-selection__video-button"
                href="https://wa.me/393341822113"
              >
                <AnimatedText :text="t('home.personalSelection.videoCta')" tag="span" />
              </q-btn>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>
