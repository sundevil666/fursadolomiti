<script setup lang="ts">
import HeroSliderSection from '@/components/sections/HeroSliderSection.vue'
import HotelsPreviewSection from '@/components/sections/HotelsPreviewSection.vue'
import HowItWorksSection from '@/components/sections/HowItWorksSection.vue'
import InstructorSection from '@/components/sections/InstructorSection.vue'
import PersonalSelectionSection from '@/components/sections/PersonalSelectionSection.vue'
import ReviewsSection from '@/components/sections/ReviewsSection.vue'
import WhyBookWithMeSection from '@/components/sections/WhyBookWithMeSection.vue'
import AnimatedText from '@/components/AnimatedText.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <q-page class="home-page">
    <HeroSliderSection />
    <div class="hotels-section__header">
      <h2 class="hotels-section__title">
        <AnimatedText :text="t('home.hotels.title')" tag="span" />
      </h2>
    </div>
    <HotelsPreviewSection :limit="2" />
    <HowItWorksSection />
    <WhyBookWithMeSection />
    <PersonalSelectionSection />
    <InstructorSection />
    <ReviewsSection />
  </q-page>
</template>
