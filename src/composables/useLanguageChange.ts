import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const languageChangeCounter = ref(0)

export function useLanguageChange() {
  const { locale } = useI18n()

  watch(locale, () => {
    languageChangeCounter.value += 1
  })

  return {
    languageChangeCounter,
  }
}
