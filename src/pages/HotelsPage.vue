<script setup lang="ts">
import PageContent from '@/components/PageContent.vue'
import RequestForm from '@/components/RequestForm.vue'
</script>

<template>
  <q-page class="page-shell">
    <PageContent page-id="hotels" />
    <RequestForm page-id="hotels" />
  </q-page>
</template>
