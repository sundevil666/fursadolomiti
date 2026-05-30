<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'

const isFooterVisible = ref(false)
let footerObserver: IntersectionObserver | null = null

onMounted(() => {
  const footer = document.querySelector('#app-footer')

  if (!footer) {
    return
  }

  footerObserver = new IntersectionObserver(
    ([entry]) => {
      isFooterVisible.value = entry.isIntersecting
    },
    { threshold: 0.1 },
  )
  footerObserver.observe(footer)
})

onBeforeUnmount(() => {
  footerObserver?.disconnect()
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
