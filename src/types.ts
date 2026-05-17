import type { AppLocale } from '@/i18n'

export type LocalizedString = Record<AppLocale, string>

export interface MenuItem {
  id: string
  routeName: string
  labels: LocalizedString
}

export interface PageContent {
  id: string
  title: LocalizedString
  lead: LocalizedString
  body: LocalizedString
}
