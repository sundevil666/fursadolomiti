<script setup lang="ts">
import HeroSliderSection from '@/components/sections/HeroSliderSection.vue'
import HotelsPreviewSection from '@/components/sections/HotelsPreviewSection.vue'
import HowItWorksSection from '@/components/sections/HowItWorksSection.vue'
import InstructorSection from '@/components/sections/InstructorSection.vue'
import DolomitesExpertSection from '@/components/sections/DolomitesExpertSection.vue'
import PersonalSelectionSection from '@/components/sections/PersonalSelectionSection.vue'
import SkiRentalSection from '@/components/sections/SkiRentalSection.vue'
import ReviewsSection from '@/components/sections/ReviewsSection.vue'
import WhyBookWithMeSection from '@/components/sections/WhyBookWithMeSection.vue'
import AnimatedText from '@/components/AnimatedText.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <q-page class="home-page">
    <HeroSliderSection />
    <section class="hotels-section">
      <div
        class="hotels-section__header"
        data-aos="block-slide-right"
        data-aos-duration="1000"
        data-aos-offset="140"
      >
        <h2 class="hotels-section__title">
          <AnimatedText :text="t('home.hotels.title')" tag="span" />
        </h2>
        <div class="hotels-section__intro">
          <div class="hotels-section__subtitle">
            <AnimatedText :text="t('home.hotels.subtitle')" tag="span" />
          </div>
          <q-btn unelevated no-caps class="fd-btn fd-btn--filled" :to="{ name: 'hotels' }">
            <AnimatedText :text="t('home.hotels.viewAll')" tag="span" />
          </q-btn>
        </div>
      </div>
    </section>
    <HotelsPreviewSection :limit="2" />
    <HowItWorksSection />
    <WhyBookWithMeSection />
    <PersonalSelectionSection />
    <SkiRentalSection />
    <InstructorSection />
    <ReviewsSection />
    <DolomitesExpertSection />
  </q-page>
</template>
