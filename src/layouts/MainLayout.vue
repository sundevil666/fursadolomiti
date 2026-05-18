<script setup lang="ts">
import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'
</script>

<template>
  <q-layout view="hHh Lpr fff">
    <AppHeader />

    <q-page-container>
      <RouterView />
    </q-page-container>

    <AppFooter />
  </q-layout>
</template>
