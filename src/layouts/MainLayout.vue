<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
</script>

<template>
  <q-layout view="hHh Lpr fff">
    <AppHeader />

    <q-page-container>
      <RouterView />
    </q-page-container>
  </q-layout>
</template>
