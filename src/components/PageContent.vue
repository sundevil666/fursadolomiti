<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import pagesMock from '@/mocks/pages.json'
import type { PageContent } from '@/types'

const props = defineProps<{
  pageId: string
}>()

const { locale } = useI18n()
const pages = pagesMock as PageContent[]

const page = computed(() => {
  const fallback = pages.find((item) => item.id === 'home') as PageContent

  return pages.find((item) => item.id === props.pageId) || fallback
})

const currentLocale = computed(() => locale.value as keyof PageContent['title'])
</script>

<template>
  <section class="page-content">
    <p class="page-content__eyebrow">Fursa Dolomiti</p>
    <h1 class="page-content__title">{{ page.title[currentLocale] }}</h1>
    <p class="page-content__lead">{{ page.lead[currentLocale] }}</p>
    <p class="page-content__body">{{ page.body[currentLocale] }}</p>
  </section>
</template>
