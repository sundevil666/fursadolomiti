<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

watch(
  () => route.name,
  (routeName) => {
    document.body.classList.toggle('main-page', routeName === 'home')
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.body.classList.remove('main-page')
})
</script>

<template>
  <RouterView />
</template>
