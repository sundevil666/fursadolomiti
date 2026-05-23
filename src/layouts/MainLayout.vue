<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'

const { t } = useI18n()
const isBackToTopVisible = ref(false)

const updateBackToTopVisibility = () => {
  isBackToTopVisible.value = window.scrollY > 180
}

const scrollToTop = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
  })
}

onMounted(() => {
  updateBackToTopVisibility()
  window.addEventListener('scroll', updateBackToTopVisibility, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateBackToTopVisibility)
})
</script>

<template>
  <q-layout view="hHh Lpr fff">
    <AppHeader />

    <q-page-container>
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </q-page-container>

    <AppFooter />

    <Transition name="back-to-top">
      <q-btn
        v-if="isBackToTopVisible"
        class="app-back-to-top"
        round
        unelevated
        icon="keyboard_arrow_up"
        :aria-label="t('footer.backToTop')"
        @click="scrollToTop"
      />
    </Transition>
  </q-layout>
</template>
