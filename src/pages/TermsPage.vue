<script setup lang="ts">
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { locales, type AppLocale } from '@/i18n'

const { locale, t, tm, rt } = useI18n()
const route = useRoute()
const router = useRouter()

// Explicit link language takes precedence over the saved site language.
watch(
  () => route.query.lang,
  (lang) => {
    if (typeof lang === 'string' && locales.includes(lang as AppLocale)) locale.value = lang
  },
  { immediate: true },
)

watch(
  locale,
  (lang) => {
    document.title = `${t('terms.title')} | FursaDolomiti`
    document.documentElement.lang = lang
    if (route.query.lang !== lang) {
      void router.replace({ query: { ...route.query, lang }, hash: route.hash })
    }
  },
  { immediate: true },
)
</script>

<template>
  <q-page class="legal-page">
    <main class="legal-page__inner">
      <header class="legal-page__header">
        <p class="legal-page__eyebrow">FursaDolomiti</p>
        <h1>{{ t('terms.title') }}</h1>
        <p class="legal-page__updated">{{ t('terms.draft') }}</p>
      </header>
      <div class="legal-page__content">
        <section>
          <h2>{{ t('terms.ownerTitle') }}</h2>
          <p>{{ t('terms.owner') }}</p>
          <dl>
            <div>
              <dt>Email</dt>
              <dd><a href="mailto:info@fursadolomiti.com">info@fursadolomiti.com</a></dd>
            </div>
            <div>
              <dt>{{ t('terms.phone') }}</dt>
              <dd><a href="tel:+393341822113">+39 334 18 22 113</a></dd>
            </div>
            <div>
              <dt>{{ t('terms.vat') }}</dt>
              <dd>02598270219</dd>
            </div>
          </dl>
        </section>
        <section v-for="(section, index) in tm('terms.sections')" :key="index">
          <h2>{{ rt(section.title) }}</h2>
          <p v-for="(paragraph, paragraphIndex) in section.paragraphs" :key="paragraphIndex">
            {{ rt(paragraph) }}
          </p>
        </section>
        <section>
          <p>
            <a href="mailto:info@fursadolomiti.com">info@fursadolomiti.com</a> ·
            <a href="tel:+393341822113">+39 334 18 22 113</a>
          </p>
          <RouterLink :to="{ name: 'privacy-policy' }">{{ t('terms.privacy') }}</RouterLink>
        </section>
      </div>
    </main>
  </q-page>
</template>
