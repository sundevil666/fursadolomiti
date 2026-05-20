<script setup lang="ts">
import HotelsPreviewSection from '@/components/sections/HotelsPreviewSection.vue'
import HeroSliderSection from '@/components/sections/HeroSliderSection.vue'
import HowItWorksSection from '@/components/sections/HowItWorksSection.vue'
import PersonalSelectionSection from '@/components/sections/PersonalSelectionSection.vue'

</script>

<template>
  <q-page class="hotels-page">
    <HeroSliderSection />
    <HotelsPreviewSection />
    <HowItWorksSection />
    <PersonalSelectionSection />
  </q-page>
</template>
