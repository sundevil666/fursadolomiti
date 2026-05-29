<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AnimatedText from '@/components/AnimatedText.vue'
import type { HowItWorksStep } from '@/data/homeSections'

const { t, tm } = useI18n()

const promoCode = 'FURSADOLOMITI'
const isPromoCopied = ref(false)
const howItWorksSteps = computed(() => tm('home.howItWorks.steps') as HowItWorksStep[])

const stepTitleMain = (step: HowItWorksStep) =>
  step.id === 4 ? step.title.replace(/FursaDolomiti/i, '').trim() : step.title

const stepTitlePromo = (step: HowItWorksStep) =>
  step.id === 4 && /FursaDolomiti/i.test(step.title) ? promoCode : ''

const copyPromoCode = async () => {
  try {
    await navigator.clipboard.writeText(promoCode)
    isPromoCopied.value = true
    window.setTimeout(() => {
      isPromoCopied.value = false
    }, 1800)
  } catch {
    isPromoCopied.value = false
  }
}
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
              class="fd-btn fd-btn--filled"
              href="https://wa.me/393341822113"
            >
              <AnimatedText :text="t('home.howItWorks.whatsapp')" tag="span" />
            </q-btn>
            <q-btn flat no-caps class="fd-btn fd-btn--outline" @click="copyPromoCode">
              <AnimatedText
                :text="
                  isPromoCopied ? t('home.howItWorks.promoCopied') : t('home.howItWorks.copyPromo')
                "
                tag="span"
              />
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
            <AnimatedText :text="stepTitleMain(step)" tag="span" />
            <span v-if="stepTitlePromo(step)" class="how-it-works__step-promo">
              <AnimatedText :text="stepTitlePromo(step)" tag="span" />
            </span>
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
