<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AnimatedText from '@/components/AnimatedText.vue'
import { bookableHotelPreviews, type HotelCategory, type HotelPreview } from '@/data/homeSections'

declare global {
  interface Window {
    BookingSüdtirol?: {
      Widgets?: {
        Booking?: (domElement: string | HTMLElement, settings: Record<string, unknown>) => void
      }
    }
    BookingSuedtirol?: Window['BookingSüdtirol']
    BookingSüdtirolTrackingConsent?: boolean
  }
}

const props = defineProps<{
  limit?: number
}>()

const { locale, t, tm } = useI18n()
type HotelFilter = 'all' | HotelCategory
type HotelStat = {
  icon: string
  value: string
}

const activeFilter = ref<HotelFilter>('all')
const previousFilter = ref<HotelFilter>('fourStar')
const isFilterAnimating = ref(false)
const bookingHotelId = ref<string | null>(null)
const bookingModal = ref<HTMLElement | null>(null)
const bookingSuedtirolContainer = ref<HTMLElement | null>(null)
const bookingExpertContainer = ref<HTMLElement | null>(null)
const bookingSuedtirolStatus = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const bookingExpertStatus = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const formError = ref('')
const formStatus = ref<'idle' | 'sending' | 'redirecting'>('idle')
const hotelFilters: HotelFilter[] = ['all', 'fiveStar', 'fourStar', 'chalet']
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const homeShownHotelsCookie = 'fd_home_shown_hotels'
const homeShownHotelsCookieMaxAge = 60 * 60 * 24 * 180

const activeHotelSlides = ref<Record<string, number>>(
  Object.fromEntries(bookableHotelPreviews.map((hotel) => [hotel.id, 0])),
)
const hotelAutoplayDelay = 5200
let hotelAutoplayTimer: number | undefined
let filterAnimationTimer: number | undefined
let bookingSuedtirolScriptPromise: Promise<void> | undefined
let bookingExpertScriptPromise: Promise<void> | undefined
let restoreWindowOpen: (() => void) | undefined
let widgetTrackingCleanup: (() => void) | undefined
let lastWidgetTrackingSignature = ''
let lastWidgetTrackingAt = 0
let widgetTrackingSentForSession = false
const bookingSuedtirolLocales = new Set(['en', 'it'])
const bookingExpertLocales = new Set(['en', 'it', 'fr', 'de'])
const homeDisplayedHotelIds = ref<string[]>([])

const hasLimit = computed(() => Boolean(props.limit && props.limit > 0))

const displayedHotels = computed(() => {
  if (hasLimit.value) {
    const selectedHotels = homeDisplayedHotelIds.value
      .map((id) => bookableHotelPreviews.find((hotel) => hotel.id === id))
      .filter((hotel): hotel is HotelPreview => Boolean(hotel))

    return selectedHotels.length ? selectedHotels : bookableHotelPreviews.slice(0, props.limit ?? 0)
  }

  if (activeFilter.value === 'all') return bookableHotelPreviews

  return bookableHotelPreviews.filter((hotel) => hotel.category === activeFilter.value)
})

const activeBookingHotel = computed(() =>
  bookableHotelPreviews.find((hotel) => hotel.id === bookingHotelId.value),
)

const isBookingSuedtirolHotel = computed(() => Boolean(activeBookingHotel.value?.bookingSuedtirol))
const isBookingExpertHotel = computed(() => Boolean(activeBookingHotel.value?.bookingExpert))
const isWidgetHotel = computed(() => isBookingSuedtirolHotel.value || isBookingExpertHotel.value)
const widgetStatus = computed(() =>
  isBookingExpertHotel.value ? bookingExpertStatus.value : bookingSuedtirolStatus.value,
)
const widgetProviderName = computed(() =>
  isBookingExpertHotel.value ? 'BookingExpert' : 'Booking Südtirol',
)
const activeBookingHotelName = computed(() => {
  const hotel = activeBookingHotel.value

  return hotel ? t(hotel.nameKey) : ''
})
const bookingModalPanelStyle = computed(() => {
  const lowerMaxHeight = activeBookingHotel.value?.bookingModalLowerMaxHeight

  return lowerMaxHeight ? { '--booking-modal-lower-max-height': lowerMaxHeight } : undefined
})

const getFilterCount = (filter: HotelFilter) => {
  if (filter === 'all') return bookableHotelPreviews.length

  return bookableHotelPreviews.filter((hotel) => hotel.category === filter).length
}

const isFilterDisabled = (filter: HotelFilter) => !hasLimit.value && getFilterCount(filter) === 0

const getHotelFeatures = (key: string) => tm(key) as string[]
const getHotelStats = (key?: string) => (key ? (tm(key) as HotelStat[]) : [])

const getActiveHotelSlide = (hotelId: string) => activeHotelSlides.value[hotelId] ?? 0

const readShownHomeHotelIds = () => {
  const cookieValue = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${homeShownHotelsCookie}=`))
    ?.split('=')
    .slice(1)
    .join('=')

  if (!cookieValue) return []

  try {
    const parsedValue = JSON.parse(decodeURIComponent(cookieValue))

    return Array.isArray(parsedValue)
      ? parsedValue.filter((id): id is string => typeof id === 'string')
      : []
  } catch {
    return []
  }
}

const writeShownHomeHotelIds = (hotelIds: string[]) => {
  document.cookie = `${homeShownHotelsCookie}=${encodeURIComponent(
    JSON.stringify(hotelIds),
  )}; path=/; max-age=${homeShownHotelsCookieMaxAge}; samesite=lax`
}

const getRandomHotels = (hotelIds: string[], limit: number, excludedHotelIds: string[] = []) => {
  const excludedIds = new Set(excludedHotelIds)
  const availableHotelIds = hotelIds.filter((id) => !excludedIds.has(id))

  return availableHotelIds
    .map((id) => ({ id, sort: Math.random() }))
    .sort((hotelA, hotelB) => hotelA.sort - hotelB.sort)
    .slice(0, limit)
    .map(({ id }) => id)
}

const selectHomePreviewHotels = () => {
  const limit = props.limit ?? 0
  const hotelIds = bookableHotelPreviews.map((hotel) => hotel.id)

  if (!hasLimit.value || limit <= 0 || hotelIds.length === 0) return

  const currentHotelIds = new Set(hotelIds)
  const normalizedShownIds = readShownHomeHotelIds().filter((id) => currentHotelIds.has(id))
  const unseenHotelIds = hotelIds.filter((id) => !normalizedShownIds.includes(id))
  let selectedHotelIds = getRandomHotels(unseenHotelIds, limit)
  let nextShownIds = [...normalizedShownIds, ...selectedHotelIds]

  if (selectedHotelIds.length < Math.min(limit, hotelIds.length)) {
    const freshHotelIds = getRandomHotels(
      hotelIds,
      limit - selectedHotelIds.length,
      selectedHotelIds,
    )

    selectedHotelIds = [...selectedHotelIds, ...freshHotelIds]
    nextShownIds = freshHotelIds
  } else if (nextShownIds.length >= hotelIds.length) {
    nextShownIds = []
  }

  homeDisplayedHotelIds.value = selectedHotelIds
  writeShownHomeHotelIds(nextShownIds)
}

const setActiveFilter = (filter: HotelFilter) => {
  if (hasLimit.value || activeFilter.value === filter || isFilterDisabled(filter)) return

  previousFilter.value = activeFilter.value
  activeFilter.value = filter
  isFilterAnimating.value = true

  if (filterAnimationTimer) {
    window.clearTimeout(filterAnimationTimer)
  }

  filterAnimationTimer = window.setTimeout(() => {
    isFilterAnimating.value = false
    filterAnimationTimer = undefined
  }, 1040)

  restartHotelAutoplay()
}

const setHotelSlide = (hotelId: string, index: number, shouldRestartAutoplay = true) => {
  const hotel = bookableHotelPreviews.find((item) => item.id === hotelId)

  if (!hotel) return

  activeHotelSlides.value = {
    ...activeHotelSlides.value,
    [hotelId]: (index + hotel.images.length) % hotel.images.length,
  }

  if (shouldRestartAutoplay) {
    restartHotelAutoplay()
  }
}

const startHotelAutoplay = () => {
  stopHotelAutoplay()
  hotelAutoplayTimer = window.setInterval(() => {
    displayedHotels.value.forEach((hotel) => {
      setHotelSlide(hotel.id, getActiveHotelSlide(hotel.id) + 1, false)
    })
  }, hotelAutoplayDelay)
}

const stopHotelAutoplay = () => {
  if (!hotelAutoplayTimer) return

  window.clearInterval(hotelAutoplayTimer)
  hotelAutoplayTimer = undefined
}

const restartHotelAutoplay = () => {
  stopHotelAutoplay()
  startHotelAutoplay()
}

const openBookingModal = (hotelId: string) => {
  bookingHotelId.value = hotelId
  widgetTrackingSentForSession = false
  firstName.value = ''
  lastName.value = ''
  email.value = ''
  formError.value = ''
  formStatus.value = 'idle'
  bookingSuedtirolStatus.value = 'idle'
  bookingExpertStatus.value = 'idle'
}

const closeBookingModal = () => {
  if (formStatus.value === 'sending') return

  bookingHotelId.value = null
  widgetTrackingSentForSession = false
}

const handleModalKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closeBookingModal()
}

const loadBookingSuedtirolScript = () => {
  if (window.BookingSüdtirol?.Widgets?.Booking) return Promise.resolve()
  if (bookingSuedtirolScriptPromise) return bookingSuedtirolScriptPromise

  bookingSuedtirolScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('#booking-suedtirol-js')

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Booking Südtirol failed')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.id = 'booking-suedtirol-js'
    script.src = 'https://widget.bookingsuedtirol.com/v2/bundle.js'
    script.defer = true
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => reject(new Error('Booking Südtirol failed')), {
      once: true,
    })
    document.body.append(script)
  })

  return bookingSuedtirolScriptPromise
}

const getSupportedWidgetLocale = (appLocale: string, supportedLocales: Set<string>) => {
  const normalizedLocale = appLocale.toLowerCase().split('-')[0]

  return supportedLocales.has(normalizedLocale) ? normalizedLocale : 'en'
}

const getBookingSuedtirolLocale = (appLocale: string) =>
  getSupportedWidgetLocale(appLocale, bookingSuedtirolLocales)

const loadBookingExpertScript = () => {
  if (customElements.get('be-searchbox')) return Promise.resolve()
  if (bookingExpertScriptPromise) return bookingExpertScriptPromise

  bookingExpertScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('#booking-expert-searchbox-js')

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('BookingExpert failed')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.id = 'booking-expert-searchbox-js'
    script.src = 'https://ber-js.my-cdn.cloud/widget/v0/searchbox.js'
    script.type = 'module'
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => reject(new Error('BookingExpert failed')), {
      once: true,
    })
    document.head.append(script)
  })

  return bookingExpertScriptPromise
}

const getBookingExpertLocale = (appLocale: string) =>
  getSupportedWidgetLocale(appLocale, bookingExpertLocales)

const getLocalizedBookingUrl = (hotel: HotelPreview, appLocale: string) => {
  if (typeof hotel.bookingUrl === 'string') return hotel.bookingUrl

  const normalizedLocale = appLocale.toLowerCase().split('-')[0]

  return hotel.bookingUrl[normalizedLocale as keyof typeof hotel.bookingUrl] ?? hotel.bookingUrl.default
}

const isPlaceholderBookingUrl = (bookingUrl: string) => {
  try {
    return new URL(bookingUrl).hostname === 'example.com'
  } catch {
    return true
  }
}

const setBooleanAttribute = (element: HTMLElement, name: string, value?: boolean) => {
  if (value === undefined) return

  element.setAttribute(name, String(value))
}

const mountBookingSuedtirolWidget = async (hotel: HotelPreview) => {
  const widgetConfig = hotel.bookingSuedtirol

  if (!widgetConfig || !bookingSuedtirolContainer.value) return

  bookingSuedtirolStatus.value = 'loading'

  try {
    await loadBookingSuedtirolScript()

    const bookingWidget = window.BookingSüdtirol?.Widgets?.Booking

    if (!bookingWidget) {
      throw new Error('Booking Südtirol widget API is unavailable')
    }

    bookingSuedtirolContainer.value.innerHTML = ''
    const bookingWidgetConfig: Record<string, unknown> = {
      id: widgetConfig.id,
      propertyId: widgetConfig.propertyId,
      lang: getBookingSuedtirolLocale(locale.value),
      privacyURL: `${window.location.origin}/privacy-policy`,
      termsURL: `${window.location.origin}/privacy-policy`,
      source: 'fursadolomiti.com',
    }

    if (widgetConfig.promotion) {
      bookingWidgetConfig.promotion = widgetConfig.promotion
    }

    bookingWidget(bookingSuedtirolContainer.value, bookingWidgetConfig)

    bookingSuedtirolStatus.value = 'ready'
  } catch (error) {
    console.error('Booking Südtirol widget failed', error)
    bookingSuedtirolStatus.value = 'error'
  }
}

const mountBookingExpertWidget = async (hotel: HotelPreview) => {
  const widgetConfig = hotel.bookingExpert

  if (!widgetConfig || !bookingExpertContainer.value) return

  bookingExpertStatus.value = 'loading'

  try {
    await loadBookingExpertScript()
    await customElements.whenDefined('be-searchbox')

    bookingExpertContainer.value.innerHTML = ''

    const searchbox = document.createElement('be-searchbox')
    searchbox.setAttribute('searchbox', widgetConfig.searchbox)
    searchbox.setAttribute('lang', getBookingExpertLocale(locale.value))
    searchbox.setAttribute('hotel', String(widgetConfig.hotel))
    searchbox.setAttribute('layout', String(widgetConfig.layout))
    searchbox.setAttribute('guests', widgetConfig.guests)

    if (widgetConfig.endpoint) searchbox.setAttribute('endpoint', widgetConfig.endpoint)
    if (widgetConfig.calendar) searchbox.setAttribute('calendar', widgetConfig.calendar)
    if (widgetConfig.room !== undefined) searchbox.setAttribute('room', String(widgetConfig.room))

    setBooleanAttribute(searchbox, 'coupon', widgetConfig.coupon)
    setBooleanAttribute(searchbox, 'agency', widgetConfig.agency)
    setBooleanAttribute(searchbox, 'reservations', widgetConfig.reservations)
    setBooleanAttribute(searchbox, 'rooms', widgetConfig.rooms)
    setBooleanAttribute(searchbox, 'locations', widgetConfig.locations)
    setBooleanAttribute(searchbox, 'hotels', widgetConfig.hotels)

    bookingExpertContainer.value.append(searchbox)
    bookingExpertStatus.value = 'ready'
  } catch (error) {
    console.error('BookingExpert widget failed', error)
    bookingExpertStatus.value = 'error'
  }
}

const bookingEmailEndpoint =
  import.meta.env.VITE_BOOKING_EMAIL_ENDPOINT ||
  (window.location.hostname.endsWith('.vercel.app') ? '/api/send-email' : '/php/send-email.php')

const getWidgetContainer = () =>
  (isBookingExpertHotel.value ? bookingExpertContainer.value : bookingSuedtirolContainer.value) ?? null

const getWidgetProvider = () => (isBookingExpertHotel.value ? 'BookingExpert' : 'Booking Südtirol')
const widgetTrackingActionPatterns = [
  'book',
  'booking',
  'reserve',
  'reservation',
  'room',
  'continue',
  'next',
  'checkout',
  'go to',
  'check availability',
  'book now',
  'prenota',
  'continua',
  'camera',
  'buchen',
  'zimmer',
  'weiter',
]

const widgetLabelDictionary = {
  checkIn: ['check in', 'check-in', 'arrival', 'arrive', 'from', 'start date', 'anreise', 'arrivo'],
  checkOut: [
    'check out',
    'check-out',
    'departure',
    'depart',
    'to',
    'end date',
    'abreise',
    'partenza',
  ],
  guests: ['guests', 'guest', 'adults', 'adult', 'children', 'child', 'babies', 'rooms', 'ospiti'],
  email: ['email', 'e-mail', 'mail'],
  firstName: ['first name', 'firstname', 'name', 'nome', 'vorname'],
  lastName: ['last name', 'lastname', 'surname', 'cognome', 'nachname'],
  promoCode: ['promo', 'coupon', 'discount', 'code', 'voucher', 'promotion'],
} as const

const normalizeFieldToken = (value: string) =>
  value
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const findNearestTextLabel = (element: HTMLElement) => {
  const htmlElement = element as HTMLElement
  const labelById = htmlElement.id
    ? document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(htmlElement.id)}"]`)
    : null
  const labelledBy = htmlElement
    .getAttribute('aria-labelledby')
    ?.split(/\s+/)
    .map((id) => document.getElementById(id)?.textContent?.trim() || '')
    .filter(Boolean)
    .join(' ')

  const nearbyText = [
    labelById?.textContent?.trim(),
    htmlElement.closest('label')?.textContent?.trim(),
    htmlElement.closest('[data-field], [data-testid], [data-name]')?.textContent?.trim(),
    htmlElement.parentElement?.querySelector('label, legend, [aria-label]')?.textContent?.trim(),
    labelledBy,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()

  return nearbyText
}

const inferWidgetFieldLabel = (element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => {
  const candidates = [
    element.getAttribute('aria-label'),
    element.getAttribute('placeholder'),
    element.getAttribute('name'),
    element.getAttribute('id'),
    element.getAttribute('data-testid'),
    element.getAttribute('data-name'),
    element.getAttribute('autocomplete'),
    findNearestTextLabel(element),
  ]
    .filter(Boolean)
    .map((value) => String(value))

  const normalizedCandidateText = normalizeFieldToken(candidates.join(' '))
  const matches = (terms: readonly string[]) =>
    terms.some((term) => normalizedCandidateText.includes(normalizeFieldToken(term)))

  if (matches(widgetLabelDictionary.checkIn)) return 'Check-in'
  if (matches(widgetLabelDictionary.checkOut)) return 'Check-out'
  if (matches(widgetLabelDictionary.guests)) return 'Guests'
  if (matches(widgetLabelDictionary.email)) return 'Email'
  if (matches(widgetLabelDictionary.firstName)) return 'First name'
  if (matches(widgetLabelDictionary.lastName)) return 'Last name'
  if (matches(widgetLabelDictionary.promoCode)) return 'Promo code'

  const value = String(
    element instanceof HTMLInputElement && (element.type === 'checkbox' || element.type === 'radio')
      ? element.checked
        ? element.value || 'checked'
        : ''
      : element.value,
  ).trim()

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const lowerCandidates = candidates.map((candidate) => candidate.toLowerCase())
    const existingDateFields = lowerCandidates.filter((candidate) => /\d{4}-\d{2}-\d{2}/.test(candidate))
    return existingDateFields.length === 0 ? 'Date' : 'Check-in'
  }

  const cleaned = candidates
    .map((candidate) => candidate.replace(/[A-Za-z0-9]{8,}/g, '').trim())
    .find(Boolean)

  return cleaned || element.name || element.id || 'Field'
}

const collectWidgetFields = (root: ParentNode, bucket: Array<{ label: string; value: string }>) => {
  root.querySelectorAll('input, select, textarea').forEach((field) => {
    const element = field as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    const rawValue =
      element instanceof HTMLInputElement && (element.type === 'checkbox' || element.type === 'radio')
        ? element.checked
          ? element.value || 'checked'
          : ''
        : element.value
    const value = String(rawValue || '').trim()

    if (!value) return

    const label = inferWidgetFieldLabel(element)

    bucket.push({ label, value })
  })

  root.querySelectorAll<HTMLElement>('*').forEach((element) => {
    if (element.shadowRoot) collectWidgetFields(element.shadowRoot, bucket)
  })
}

const collectWidgetSelection = () => {
  const container = getWidgetContainer()
  if (!container) return []

  const values: Array<{ label: string; value: string }> = []
  collectWidgetFields(container, values)

  const dedupedValues = values.filter(
    (entry, index, array) =>
      array.findIndex((candidate) => candidate.label === entry.label && candidate.value === entry.value) ===
      index,
  )

  const dateEntries = dedupedValues.filter((entry) => entry.label === 'Date')
  if (dateEntries.length >= 2) {
    dateEntries[0].label = 'Check-in'
    dateEntries[1].label = 'Check-out'
  }

  return dedupedValues
}

const reportWidgetTracking = async (widgetAction: string, redirectUrl = '') => {
  const hotel = activeBookingHotel.value
  if (!hotel) return
  if (widgetTrackingSentForSession) return

  const widgetSelection = collectWidgetSelection()
  const signature = JSON.stringify({
    hotelId: hotel.id,
    widgetAction,
    redirectUrl,
    widgetSelection,
  })
  const now = Date.now()

  if (signature === lastWidgetTrackingSignature && now - lastWidgetTrackingAt < 4000) return

  lastWidgetTrackingSignature = signature
  lastWidgetTrackingAt = now
  widgetTrackingSentForSession = true

  const submittedAt = new Date()

  try {
    await fetch(bookingEmailEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'widget_redirect',
        widgetProvider: getWidgetProvider(),
        widgetAction,
        widgetSelection,
        redirectUrl,
        hotelId: hotel.id,
        hotel: t(hotel.nameKey),
        promoCode: hotel.promoCode,
        hotelImage: hotel.images[0] ? new URL(hotel.images[0], window.location.origin).href : '',
        locale: locale.value,
        localDateTime: new Intl.DateTimeFormat(locale.value, {
          dateStyle: 'full',
          timeStyle: 'long',
        }).format(submittedAt),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        submittedAt: submittedAt.toISOString(),
      }),
      keepalive: true,
    })
  } catch (error) {
    console.error('Widget tracking failed', error)
  }
}

const installWidgetTracking = () => {
  widgetTrackingCleanup?.()
  const container = getWidgetContainer()
  if (!container) return

  const handleClick = (event: Event) => {
    const target = event.target as HTMLElement | null
    if (!target) return
    const clickable = target.closest<HTMLElement>('button, a, [role="button"]')
    if (!clickable) return
    const action = (clickable.textContent || clickable.getAttribute('aria-label') || '').trim()
    if (!action) return
    const normalizedAction = action.toLowerCase()
    const isLikelyBookingAction = widgetTrackingActionPatterns.some((pattern) =>
      normalizedAction.includes(pattern),
    )
    if (!isLikelyBookingAction) return
    void reportWidgetTracking(`click:${action.slice(0, 80)}`)
  }

  const handleSubmit = () => {
    void reportWidgetTracking('submit')
  }

  container.addEventListener('click', handleClick, true)
  container.addEventListener('submit', handleSubmit, true)

  widgetTrackingCleanup = () => {
    container.removeEventListener('click', handleClick, true)
    container.removeEventListener('submit', handleSubmit, true)
    widgetTrackingCleanup = undefined
  }
}

const installWindowOpenTracking = () => {
  restoreWindowOpen?.()
  const originalWindowOpen = window.open.bind(window)

  window.open = ((...args: Parameters<typeof window.open>) => {
    const [url] = args
    if (bookingHotelId.value && isWidgetHotel.value) {
      void reportWidgetTracking('window.open', typeof url === 'string' ? url : '')
    }

    return originalWindowOpen(...args)
  }) as typeof window.open

  restoreWindowOpen = () => {
    window.open = originalWindowOpen
    restoreWindowOpen = undefined
  }
}

const submitBookingRequest = async () => {
  formError.value = ''

  if (!firstName.value.trim() || !lastName.value.trim() || !email.value.trim()) {
    formError.value = t('home.hotels.bookingModal.errors.required')
    return
  }

  if (!emailPattern.test(email.value.trim())) {
    formError.value = t('home.hotels.bookingModal.errors.email')
    return
  }

  const hotel = bookableHotelPreviews.find((item) => item.id === bookingHotelId.value)
  const hotelName = hotel ? t(hotel.nameKey) : bookingHotelId.value
  formStatus.value = 'sending'

  try {
    const submittedAt = new Date()

    const response = await fetch(bookingEmailEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: firstName.value.trim(),
        lastName: lastName.value.trim(),
        email: email.value.trim(),
        hotelId: hotel?.id,
        hotel: hotelName,
        promoCode: hotel?.promoCode,
        hotelImage: hotel?.images[0] ? new URL(hotel.images[0], window.location.origin).href : '',
        locale: locale.value,
        localDateTime: new Intl.DateTimeFormat(locale.value, {
          dateStyle: 'full',
          timeStyle: 'long',
        }).format(submittedAt),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        submittedAt: submittedAt.toISOString(),
      }),
    })

    if (!response.ok) throw new Error(await response.text())

    const { promoCode } = (await response.json()) as { promoCode: string }

    if (hotel) {
      const localizedBookingUrl = getLocalizedBookingUrl(hotel, locale.value)

      if (isPlaceholderBookingUrl(localizedBookingUrl)) {
        throw new Error(`Booking URL is not configured for ${hotel.id}`)
      }

      const bookingUrl = new URL(localizedBookingUrl)

      if (hotel.bookingParams.firstName) {
        bookingUrl.searchParams.set(hotel.bookingParams.firstName, firstName.value.trim())
      }

      if (hotel.bookingParams.lastName) {
        bookingUrl.searchParams.set(hotel.bookingParams.lastName, lastName.value.trim())
      }

      if (hotel.bookingParams.email) {
        bookingUrl.searchParams.set(hotel.bookingParams.email, email.value.trim())
      }

      bookingUrl.searchParams.set(hotel.bookingParams.promoCode, promoCode)

      Object.entries(hotel.bookingHiddenParams ?? {}).forEach(([paramName, paramValue]) => {
        bookingUrl.searchParams.set(paramName, paramValue)
      })

      formStatus.value = 'redirecting'
      window.setTimeout(() => {
        window.open(bookingUrl.href, '_blank', 'noopener,noreferrer')
      }, 1400)
    }
  } catch (error) {
    console.error('Booking request failed', error)
    formStatus.value = 'idle'
    formError.value = t('home.hotels.bookingModal.errors.send')
  }
}

watch(bookingHotelId, async (hotelId) => {
  document.body.classList.toggle('is-booking-modal-open', Boolean(hotelId))

  if (hotelId) {
    await nextTick()
    const hotel = activeBookingHotel.value

    if (hotel?.bookingSuedtirol) {
      await mountBookingSuedtirolWidget(hotel)
      installWidgetTracking()
      bookingModal.value?.querySelector<HTMLElement>('.booking-modal__close')?.focus()
      return
    }

    if (hotel?.bookingExpert) {
      await mountBookingExpertWidget(hotel)
      installWidgetTracking()
      bookingModal.value?.querySelector<HTMLElement>('.booking-modal__close')?.focus()
      return
    }

    bookingModal.value?.querySelector<HTMLElement>('input')?.focus()
  }
})

onMounted(() => {
  selectHomePreviewHotels()
  startHotelAutoplay()
  installWindowOpenTracking()
})
onBeforeUnmount(() => {
  stopHotelAutoplay()
  document.body.classList.remove('is-booking-modal-open')
  restoreWindowOpen?.()
  widgetTrackingCleanup?.()

  if (filterAnimationTimer) {
    window.clearTimeout(filterAnimationTimer)
  }
})
</script>

<template>
  <section class="hotels-section">
    <div
      v-if="!hasLimit"
      class="hotels-section__filters"
      :class="[
        `hotels-section__filters--active-${activeFilter}`,
        `hotels-section__filters--leave-${previousFilter}`,
        { 'hotels-section__filters--animating': isFilterAnimating },
      ]"
      :aria-label="t('home.hotels.filters.label')"
    >
      <button
        v-for="filter in hotelFilters"
        :key="filter"
        class="hotels-section__filter"
        :class="{
          'hotels-section__filter--active': activeFilter === filter,
          'hotels-section__filter--disabled': isFilterDisabled(filter),
        }"
        type="button"
        :disabled="isFilterDisabled(filter)"
        :aria-pressed="activeFilter === filter"
        :aria-disabled="isFilterDisabled(filter)"
        @click="setActiveFilter(filter)"
      >
        <span>{{ t(`home.hotels.filters.${filter}`) }}</span>
      </button>
    </div>

    <TransitionGroup
      name="hotel-preview-list"
      tag="div"
      class="hotels-section__list"
      :class="{ 'hotels-section__list--filtering': isFilterAnimating }"
    >
      <article
        v-for="(hotel, index) in displayedHotels"
        :key="hotel.id"
        class="hotel-preview"
        :data-aos="index % 2 === 0 ? 'block-slide-right' : 'block-slide-left'"
        data-aos-duration="1000"
        data-aos-offset="140"
      >
        <div class="hotel-preview__media">
          <img
            v-for="(image, index) in hotel.images"
            :key="image"
            class="hotel-preview__image"
            :class="{ 'hotel-preview__image--active': index === getActiveHotelSlide(hotel.id) }"
            :src="image"
            :alt="t(hotel.nameKey)"
            loading="lazy"
          />
          <button
            class="hotel-preview__arrow hotel-preview__arrow--prev"
            type="button"
            :aria-label="t('home.previousSlide')"
            @click="setHotelSlide(hotel.id, getActiveHotelSlide(hotel.id) - 1)"
          >
            <q-icon name="chevron_left" />
          </button>
          <button
            class="hotel-preview__arrow hotel-preview__arrow--next"
            type="button"
            :aria-label="t('home.nextSlide')"
            @click="setHotelSlide(hotel.id, getActiveHotelSlide(hotel.id) + 1)"
          >
            <q-icon name="chevron_right" />
          </button>
          <div class="hotel-preview__progress">
            <button
              v-for="(_, index) in hotel.images"
              :key="index"
              class="hotel-preview__progress-part"
              :class="{
                'hotel-preview__progress-part--active': index === getActiveHotelSlide(hotel.id),
              }"
              :style="{ '--hotel-slide-duration': `${hotelAutoplayDelay}ms` }"
              type="button"
              :aria-label="`${t(hotel.nameKey)} ${index + 1}`"
              @click="setHotelSlide(hotel.id, index)"
            />
          </div>
        </div>

        <div class="hotel-preview__content" @click="openBookingModal(hotel.id)">
          <h3 class="hotel-preview__name">
            <AnimatedText :text="t(hotel.nameKey)" tag="span" />
          </h3>
          <p class="hotel-preview__location">
            <AnimatedText :text="t(hotel.locationKey)" tag="span" />
          </p>
          <p class="hotel-preview__description">
            <AnimatedText :text="t(hotel.descriptionKey)" tag="span" />
          </p>

          <div class="hotel-preview__features">
            <span class="hotel-preview__features-label">
              <AnimatedText
                :text="t(hotel.featuresLabelKey ?? 'home.hotels.features')"
                tag="span"
              />
            </span>
            <ul class="hotel-preview__features-list">
              <li v-for="feature in getHotelFeatures(hotel.featuresKey)" :key="feature">
                <AnimatedText :text="feature" tag="span" />
              </li>
            </ul>
          </div>

          <ul v-if="hotel.statsKey" class="hotel-preview__stats" :aria-label="t(hotel.nameKey)">
            <li v-for="stat in getHotelStats(hotel.statsKey)" :key="`${stat.icon}-${stat.value}`">
              <q-icon :name="stat.icon" />
              <span>{{ stat.value }}</span>
            </li>
          </ul>

          <q-btn
            unelevated
            no-caps
            class="fd-btn fd-btn--outline"
            @click.stop="openBookingModal(hotel.id)"
          >
            <AnimatedText :text="t('home.hotels.bookWithBonus')" tag="span" />
          </q-btn>
        </div>
      </article>
    </TransitionGroup>

    <div v-if="hasLimit" class="hotels-section__footer w-1336">
      <q-btn unelevated no-caps class="fd-btn fd-btn--filled" :to="{ name: 'hotels' }">
        <AnimatedText :text="t('home.hotels.viewAll')" tag="span" />
      </q-btn>
    </div>

    <Teleport to="body">
      <Transition name="booking-modal">
        <div
          v-if="bookingHotelId"
          ref="bookingModal"
          class="booking-modal"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="`booking-modal-title-${bookingHotelId}`"
          @click.self="closeBookingModal"
          @keydown="handleModalKeydown"
        >
          <section
            class="booking-modal__panel"
            :class="{
              'booking-modal__panel--widget': isWidgetHotel,
              'booking-modal__panel--expert': isBookingExpertHotel,
              'booking-modal__panel--limited-lower': activeBookingHotel?.bookingModalLowerMaxHeight,
              'booking-modal__panel--success': formStatus === 'redirecting',
            }"
            :style="bookingModalPanelStyle"
          >
            <button
              v-if="formStatus === 'idle'"
              class="booking-modal__close"
              type="button"
              :aria-label="t('home.hotels.bookingModal.close')"
              @click="closeBookingModal"
            >
              <span aria-hidden="true"></span>
            </button>

            <div v-if="formStatus !== 'redirecting'" class="booking-modal__intro">
              <div>
                <h2 :id="`booking-modal-title-${bookingHotelId}`" class="booking-modal__title">
                  {{
                    isWidgetHotel
                      ? t('home.hotels.bookingModal.widgetTitle', { hotel: activeBookingHotelName })
                      : t('home.hotels.bookingModal.title')
                  }}
                </h2>
                <p v-if="isWidgetHotel" class="booking-modal__privacy-note">
                  {{
                    t('home.hotels.bookingModal.widgetPrivacyNote', {
                      provider: widgetProviderName,
                    })
                  }}
                </p>
                <p class="booking-modal__description">
                  {{
                    isWidgetHotel
                      ? t('home.hotels.bookingModal.widgetDescription', {
                          provider: widgetProviderName,
                        })
                      : t('home.hotels.bookingModal.description')
                  }}
                </p>
              </div>

              <p v-if="!isWidgetHotel" class="booking-modal__privacy-note">
                {{ t('home.hotels.bookingModal.privacyNote') }}
              </p>
            </div>

            <div v-if="formStatus === 'redirecting'" class="booking-modal__redirect">
              <span class="booking-modal__success-mark" aria-hidden="true">
                <q-icon name="check" />
              </span>
              <h2 class="booking-modal__redirect-title">
                {{ t('home.hotels.bookingModal.redirectTitle') }}
              </h2>
              <p class="booking-modal__redirect-text">
                {{ t('home.hotels.bookingModal.redirectText') }}
              </p>
              <button class="booking-modal__primary" type="button" @click="closeBookingModal">
                {{ t('home.hotels.bookingModal.ok') }}
              </button>
            </div>

            <div
              v-if="isWidgetHotel"
              class="booking-modal__widget-shell"
              :class="{ 'booking-modal__widget-shell--expert': isBookingExpertHotel }"
            >
              <div
                v-if="widgetStatus === 'loading' || widgetStatus === 'error'"
                class="booking-modal__widget-status"
                aria-live="polite"
              >
                <span
                  v-if="widgetStatus === 'loading'"
                  class="booking-modal__button-loader"
                  aria-hidden="true"
                ></span>
                <span>
                  {{
                    t(`home.hotels.bookingModal.widgetStatus.${widgetStatus}`, {
                      provider: widgetProviderName,
                    })
                  }}
                </span>
              </div>

              <div
                v-if="isBookingSuedtirolHotel"
                ref="bookingSuedtirolContainer"
                class="booking-modal__widget booking-modal__widget--suedtirol"
              ></div>
              <div
                v-else
                ref="bookingExpertContainer"
                class="booking-modal__widget booking-modal__widget--expert"
              ></div>
            </div>

            <form
              v-else-if="formStatus !== 'redirecting'"
              class="booking-modal__form"
              novalidate
              @submit.prevent="submitBookingRequest"
            >
              <label class="booking-modal__field">
                <span>{{ t('home.hotels.bookingModal.firstName') }}</span>
                <input
                  v-model="firstName"
                  type="text"
                  required
                  autocomplete="given-name"
                  :placeholder="t('home.hotels.bookingModal.firstNamePlaceholder')"
                />
              </label>

              <label class="booking-modal__field">
                <span>{{ t('home.hotels.bookingModal.lastName') }}</span>
                <input
                  v-model="lastName"
                  type="text"
                  required
                  autocomplete="family-name"
                  :placeholder="t('home.hotels.bookingModal.lastNamePlaceholder')"
                />
              </label>

              <label class="booking-modal__field">
                <span>{{ t('home.hotels.bookingModal.email') }}</span>
                <input
                  v-model="email"
                  type="email"
                  required
                  autocomplete="email"
                  :placeholder="t('home.hotels.bookingModal.emailPlaceholder')"
                />
              </label>

              <p
                class="booking-modal__required"
                :class="{ 'booking-modal__required--error': formError }"
                aria-live="polite"
              >
                {{ formError || t('home.hotels.bookingModal.required') }}
              </p>

              <div class="booking-modal__actions">
                <button
                  class="booking-modal__primary"
                  type="submit"
                  :disabled="formStatus === 'sending'"
                >
                  <span v-if="formStatus === 'sending'" class="booking-modal__button-loader"></span>
                  <span>
                    {{
                      formStatus === 'sending'
                        ? t('home.hotels.bookingModal.sending')
                        : t('home.hotels.bookingModal.continue')
                    }}
                  </span>
                </button>
              </div>
            </form>
          </section>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
.booking-modal__panel--success {
  width: min(100%, 560px);
  min-height: 0;
  grid-template-columns: 1fr;
  border-radius: 14px;
}

.booking-modal__panel--success .booking-modal__redirect {
  min-height: 0;
  padding: 52px 48px 46px;
}

.booking-modal__success-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border: 1px solid rgb(23 84 69 / 18%);
  border-radius: 50%;
  background: rgb(23 84 69 / 8%);
  color: #175445;
  font-size: 28px;
}

.booking-modal__panel--success .booking-modal__redirect-title {
  max-width: 420px;
  margin: 22px 0 12px;
  font-size: 32px;
}

.booking-modal__panel--success .booking-modal__redirect-text {
  max-width: 420px;
  margin-bottom: 30px;
}

.booking-modal__panel--success .booking-modal__primary {
  width: auto;
  min-width: 154px;
  min-height: 46px;
  padding: 10px 30px;
}

@media (max-width: 620px) {
  .booking-modal__panel--success {
    width: min(100%, 420px);
  }

  .booking-modal__panel--success .booking-modal__redirect {
    padding: 42px 24px 34px;
  }

  .booking-modal__panel--success .booking-modal__redirect-title {
    font-size: 28px;
  }
}
</style>
