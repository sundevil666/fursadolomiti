<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import AnimatedText from '@/components/AnimatedText.vue'

const { t } = useI18n()
</script>

<template>
  <section class="growing-selection" aria-labelledby="growing-selection-title">
    <div class="growing-selection__inner">
      <div
        class="growing-selection__intro"
        data-aos="block-slide-right"
        data-aos-duration="1000"
        data-aos-offset="140"
      >
        <p class="growing-selection__eyebrow">
          <AnimatedText :text="t('home.growingSelection.eyebrow')" tag="span" />
        </p>
        <h2 id="growing-selection-title" class="growing-selection__title">
          <AnimatedText :text="t('home.growingSelection.title')" tag="span" />
        </h2>
      </div>

      <article
        class="growing-selection__card"
        data-aos="block-slide-left"
        data-aos-duration="1000"
        data-aos-offset="120"
      >
        <p class="growing-selection__language">
          <AnimatedText :text="t('home.growingSelection.language')" tag="span" />
        </p>
        <p class="growing-selection__text">
          <AnimatedText :text="t('home.growingSelection.text')" tag="span" />
        </p>
      </article>
    </div>
  </section>
</template>
