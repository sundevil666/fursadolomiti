export const consentStorageKey = 'fursadolomiti_cookie_consent_v2'
export const homeShownHotelsCookie = 'fd_home_shown_hotels'
export const cookieSettingsEvent = 'fursadolomiti:cookie-settings'

// Recognize prior refusals so returning visitors keep their saved choice.
type CookieConsent = 'accepted' | 'necessary'

export const getCookieConsent = (): CookieConsent | null => {
  try {
    const value = localStorage.getItem(consentStorageKey)
    return value === 'accepted' || value === 'necessary' ? value : null
  } catch {
    return null
  }
}

export const clearOptionalCookies = () => {
  document.cookie = `${homeShownHotelsCookie}=; path=/; max-age=0; samesite=lax`
}

export const saveCookieConsent = () => {
  try {
    localStorage.setItem(consentStorageKey, 'accepted')
  } catch {
    // Keep the site usable when browser storage is unavailable.
  }
}

export const openCookieSettings = () => {
  window.dispatchEvent(new Event(cookieSettingsEvent))
}
