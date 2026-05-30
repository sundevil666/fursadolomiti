<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import AnimatedText from '@/components/AnimatedText.vue'
import type { WhyMeReason } from '@/data/homeSections'

const { t, tm } = useI18n()

const whyMeReasons = computed(() => tm('home.whyMe.reasons') as WhyMeReason[])
</script>

<template>
  <section class="why-me" aria-labelledby="why-me-title">
    <header class="why-me__header">
      <h2 id="why-me-title" class="why-me__title">
        <AnimatedText :text="t('home.whyMe.title')" tag="span" />
      </h2>
    </header>

    <div class="why-me__body">
      <img
        class="why-me__image"
        src="/mockup-assets/image6.png"
        :alt="t('home.whyMe.imageAlt')"
        loading="lazy"
      />
      <div class="why-me__shade" />

      <article class="why-me__panel">
        <ul class="why-me__list">
          <li v-for="reason in whyMeReasons" :key="reason.id" class="why-me__item">
            <span class="why-me__item-number">
              <AnimatedText :text="String(reason.id)" tag="span" />
            </span>
            <span class="why-me__item-copy">
              <strong>
                <AnimatedText :text="reason.title" tag="span" />
              </strong>
              <span>
                <AnimatedText :text="reason.text" tag="span" />
              </span>
            </span>
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>
