import { createI18n } from 'vue-i18n'

import en from '@/i18n/locales/en.json'
import it from '@/i18n/locales/it.json'
import ru from '@/i18n/locales/ru.json'

export type AppLocale = 'ru' | 'en' | 'it'

export const locales: AppLocale[] = ['ru', 'en', 'it']

const savedLocale = localStorage.getItem('locale') as AppLocale | null
const fallbackLocale: AppLocale = 'ru'

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale && locales.includes(savedLocale) ? savedLocale : fallbackLocale,
  fallbackLocale,
  messages: {
    ru,
    en,
    it,
  },
})
