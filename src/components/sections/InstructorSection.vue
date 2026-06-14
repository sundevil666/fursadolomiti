<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import AnimatedText from '@/components/AnimatedText.vue'
import type { InstructorFeature } from '@/data/homeSections'

const { t, tm } = useI18n()

const instructorTitle = computed(() => t('home.instructor.title'))
const instructorText2 = computed(() => t('home.instructor.text2'))
const instructorFeatures = computed(() => tm('home.instructor.features') as InstructorFeature[])
</script>

<template>
  <section
    class="instructor-section"
    :aria-labelledby="instructorTitle ? 'instructor-title' : undefined"
  >
    <div class="instructor-section__content">
      <h2 v-if="instructorTitle" id="instructor-title" class="instructor-section__title">
        <AnimatedText :text="instructorTitle" tag="span" />
      </h2>
      <p class="instructor-section__lead">
        <AnimatedText :text="t('home.instructor.lead')" tag="span" />
      </p>

      <div class="instructor-section__copy">
        <p>
          <AnimatedText :text="t('home.instructor.text1')" tag="span" />
        </p>
        <p v-if="instructorText2">
          <AnimatedText :text="instructorText2" tag="span" />
        </p>
      </div>

      <h3 v-if="t('home.instructor.organizeTitle')" class="instructor-section__subtitle">
        <AnimatedText :text="t('home.instructor.organizeTitle')" tag="span" />
      </h3>
      <ul v-if="instructorFeatures.length" class="instructor-section__list">
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
