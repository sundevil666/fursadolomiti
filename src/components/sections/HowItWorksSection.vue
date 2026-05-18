<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import AnimatedText from '@/components/AnimatedText.vue'
import type { HowItWorksStep } from '@/data/homeSections'

const { t, tm } = useI18n()

const howItWorksSteps = computed(() => tm('home.howItWorks.steps') as HowItWorksStep[])
</script>

<template>
  <section class="how-it-works" aria-labelledby="how-it-works-title">
    <div class="how-it-works__inner">
      <div class="how-it-works__intro">
        <h2 id="how-it-works-title" class="how-it-works__title">
          <AnimatedText :text="t('home.howItWorks.title')" tag="span" />
        </h2>

        <div class="how-it-works__note">
          <p>
            <AnimatedText :text="t('home.howItWorks.note')" tag="span" />
          </p>
        </div>

        <div class="how-it-works__help">
          <p>
            <AnimatedText :text="t('home.howItWorks.help')" tag="span" />
          </p>
          <div class="how-it-works__actions">
            <q-btn
              unelevated
              no-caps
              class="how-it-works__primary"
              href="https://wa.me/393341822113"
            >
              <AnimatedText :text="t('home.howItWorks.whatsapp')" tag="span" />
            </q-btn>
            <q-btn outline no-caps class="how-it-works__secondary" :to="{ name: 'hotels' }">
              <AnimatedText :text="t('home.howItWorks.hotels')" tag="span" />
            </q-btn>
          </div>
        </div>
      </div>

      <div class="how-it-works__steps">
        <article v-for="step in howItWorksSteps" :key="step.id" class="how-it-works__step">
          <div class="how-it-works__step-header">
            <span class="how-it-works__step-number">
              <AnimatedText :text="String(step.id)" tag="span" />
            </span>
            <span class="how-it-works__step-line" aria-hidden="true" />
          </div>
          <h3 class="how-it-works__step-title">
            <AnimatedText :text="step.title" tag="span" />
          </h3>
          <p class="how-it-works__step-text">
            <AnimatedText :text="step.text" tag="span" />
          </p>
        </article>

        <p class="how-it-works__disclaimer">
          <AnimatedText :text="t('home.howItWorks.disclaimer')" tag="span" />
        </p>
      </div>
    </div>
  </section>
</template>
