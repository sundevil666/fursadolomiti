<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import pagesMock from '@/mocks/pages.json'
import type { PageContent } from '@/types'
import AnimatedText from '@/components/AnimatedText.vue'

const props = defineProps<{
  pageId: string
}>()

const { locale, t } = useI18n()
const pages = pagesMock as PageContent[]

const page = computed(() => {
  const fallback = pages.find((item) => item.id === 'home') as PageContent

  return pages.find((item) => item.id === props.pageId) || fallback
})

const currentLocale = computed(() => locale.value as keyof PageContent['title'])
</script>

<template>
  <section class="page-content">
    <p class="page-content__eyebrow">
      <AnimatedText :text="t('page.eyebrow')" tag="span" />
    </p>
    <h1 class="page-content__title">
      <AnimatedText :text="page.title[currentLocale]" tag="span" />
    </h1>
    <p class="page-content__lead">
      <AnimatedText :text="page.lead[currentLocale]" tag="span" />
    </p>
    <p class="page-content__body">
      <AnimatedText :text="page.body[currentLocale]" tag="span" />
    </p>
  </section>
</template>
