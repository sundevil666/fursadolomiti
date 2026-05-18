<script setup lang="ts">
import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'
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
  </q-layout>
</template>
