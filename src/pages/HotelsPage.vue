<script setup lang="ts">
import HotelsPreviewSection from '@/components/sections/HotelsPreviewSection.vue'
import HeroSliderSection from '@/components/sections/HeroSliderSection.vue'
import HowItWorksSection from '@/components/sections/HowItWorksSection.vue'
import PersonalSelectionSection from '@/components/sections/PersonalSelectionSection.vue'
import AnimatedText from '@/components/AnimatedText.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <q-page class="hotels-page">
    <HeroSliderSection />
    <div class="hotels-section__header">
      <h2 class="hotels-section__title">
        <AnimatedText :text="t('home.hotels.title')" tag="span" />
      </h2>
    </div>
    <HotelsPreviewSection />
    <HowItWorksSection />
    <PersonalSelectionSection />
  </q-page>
</template>
