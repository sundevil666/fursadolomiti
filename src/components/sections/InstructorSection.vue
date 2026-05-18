<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import AnimatedText from '@/components/AnimatedText.vue'
import type { InstructorFeature } from '@/data/homeSections'

const { t, tm } = useI18n()

const instructorFeatures = computed(() => tm('home.instructor.features') as InstructorFeature[])
</script>

<template>
  <section class="instructor-section" aria-labelledby="instructor-title">
    <div class="instructor-section__content">
      <h2 id="instructor-title" class="instructor-section__title">
        <AnimatedText :text="t('home.instructor.title')" tag="span" />
      </h2>
      <p class="instructor-section__lead">
        <AnimatedText :text="t('home.instructor.lead')" tag="span" />
      </p>

      <div class="instructor-section__copy">
        <p>
          <AnimatedText :text="t('home.instructor.text1')" tag="span" />
        </p>
        <p>
          <AnimatedText :text="t('home.instructor.text2')" tag="span" />
        </p>
      </div>

      <h3 class="instructor-section__subtitle">
        <AnimatedText :text="t('home.instructor.organizeTitle')" tag="span" />
      </h3>
      <ul class="instructor-section__list">
        <li
          v-for="feature in instructorFeatures"
          :key="feature.id"
          class="instructor-section__item"
        >
          <AnimatedText :text="feature.text" tag="span" />
        </li>
      </ul>

      <q-btn
        unelevated
        no-caps
        class="instructor-section__button"
        href="https://wa.me/393341822113"
      >
        <AnimatedText :text="t('home.instructor.cta')" tag="span" />
      </q-btn>
    </div>
  </section>
</template>
