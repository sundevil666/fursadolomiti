<script setup lang="ts">
import HeroSliderSection from '@/components/sections/HeroSliderSection.vue'
import HotelsPreviewSection from '@/components/sections/HotelsPreviewSection.vue'
import HowItWorksSection from '@/components/sections/HowItWorksSection.vue'
import InstructorSection from '@/components/sections/InstructorSection.vue'
import PersonalSelectionSection from '@/components/sections/PersonalSelectionSection.vue'
import ReviewsSection from '@/components/sections/ReviewsSection.vue'
import WhyBookWithMeSection from '@/components/sections/WhyBookWithMeSection.vue'
</script>

<template>
  <q-page class="home-page">
    <HeroSliderSection />
    <HotelsPreviewSection :limit="2" />
    <HowItWorksSection />
    <WhyBookWithMeSection />
    <PersonalSelectionSection />
    <InstructorSection />
    <ReviewsSection />
  </q-page>
</template>
