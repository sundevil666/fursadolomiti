<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'

const isFooterVisible = ref(false)
let footerObserver: IntersectionObserver | null = null
let isFooterIntersecting = false

const updateHeaderVisibility = () => {
  isFooterVisible.value = isFooterIntersecting && window.scrollY > 80
}

onMounted(() => {
  const footer = document.querySelector('#app-footer')

  if (!footer) {
    return
  }

  footerObserver = new IntersectionObserver(
    ([entry]) => {
      isFooterIntersecting = entry.isIntersecting
      updateHeaderVisibility()
    },
    { threshold: 0.1 },
  )
  footerObserver.observe(footer)
  window.addEventListener('scroll', updateHeaderVisibility, { passive: true })
})

onBeforeUnmount(() => {
  footerObserver?.disconnect()
  window.removeEventListener('scroll', updateHeaderVisibility)
})
</script>

<template>
  <q-layout view="hHh Lpr fff" :class="{ 'main-layout--footer-visible': isFooterVisible }">
    <AppHeader />

    <q-page-container>
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </q-page-container>

    <AppFooter />
  </q-layout>
</template>
