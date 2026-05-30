<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import AnimatedText from '@/components/AnimatedText.vue'

const { t } = useI18n()
</script>

<template>
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
          <img src="/mockup-assets/image5.png" alt="" loading="lazy" />
        </div>
        <div class="personal-selection__dots" />
      </div>

      <aside class="personal-selection__video">
        <p>
          <AnimatedText :text="t('home.personalSelection.videoTitle')" tag="span" />
        </p>
        <ul>
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
      </aside>

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
</template>
