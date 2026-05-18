<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AnimatedText from '@/components/AnimatedText.vue'
import { locales, type AppLocale } from '@/i18n'

const { locale, t } = useI18n()
const isOpen = ref(false)
const spark = ref(0)
const isChanging = ref(false)
const languageOptions = computed<AppLocale[]>(() => [...locales].reverse())

const currentLocale = computed<AppLocale>({
  get: () => locale.value as AppLocale,
  set: (value) => {
    locale.value = value
    localStorage.setItem('locale', value)
    document.documentElement.lang = value
  },
})

const selectLocale = (value: AppLocale) => {
  if (currentLocale.value !== value) {
    isChanging.value = true
    currentLocale.value = value
    spark.value += 1
    setTimeout(() => {
      isChanging.value = false
    }, 600)
  }

  isOpen.value = false
}
</script>

<template>
  <div
    class="language-switcher"
    :class="{
      'language-switcher--open': isOpen,
      'language-switcher--changing': isChanging,
    }"
  >
    <button
      class="language-switcher__trigger"
      type="button"
      :aria-label="t('app.language')"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <span class="language-switcher__glow" aria-hidden="true" />
      <Transition name="language-code" mode="out-in">
        <span :key="`${currentLocale}-${spark}`" class="language-switcher__code">
          {{ currentLocale.toUpperCase() }}
        </span>
      </Transition>
      <q-icon class="language-switcher__icon" name="expand_more" />
      <Transition name="language-spark">
        <span v-if="spark" :key="spark" class="language-switcher__spark" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </Transition>
    </button>

    <Transition name="language-menu">
      <div v-if="isOpen" class="language-switcher__menu" role="listbox">
        <button
          v-for="value in languageOptions"
          :key="value"
          class="language-switcher__option"
          :class="{ 'language-switcher__option--active': currentLocale === value }"
          type="button"
          role="option"
          :aria-selected="currentLocale === value"
          @click="selectLocale(value)"
        >
          <AnimatedText :text="value.toUpperCase()" tag="span" />
        </button>
      </div>
    </Transition>
  </div>
</template>
