<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  clearOptionalCookies,
  cookieSettingsEvent,
  getCookieConsent,
  saveCookieConsent,
  type CookieConsent,
} from '@/services/cookieConsent'

const { t } = useI18n()

const isVisible = ref(false)
const showSettings = () => {
  isVisible.value = true
}
const dismiss = () => {
  isVisible.value = false
}
const chooseCookies = (choice: CookieConsent) => {
  saveCookieConsent(choice)
  dismiss()
}

onMounted(() => {
  const consent = getCookieConsent()
  if (consent !== 'accepted') clearOptionalCookies()
  isVisible.value = consent === null
  window.addEventListener(cookieSettingsEvent, showSettings)
})
onUnmounted(() => window.removeEventListener(cookieSettingsEvent, showSettings))
</script>

<template>
  <Transition name="cookie-consent">
    <aside v-if="isVisible" class="cookie-consent" :aria-label="t('cookies.title')">
      <button
        class="cookie-consent__close"
        type="button"
        :aria-label="t('cookies.close')"
        @click="dismiss"
      >
        <span aria-hidden="true"></span>
      </button>

      <p class="cookie-consent__text">
        {{ t('cookies.text') }}
      </p>

      <div class="cookie-consent__actions">
        <button class="cookie-consent__accept" type="button" @click="chooseCookies('necessary')">
          {{ t('cookies.necessary') }}
        </button>
        <button class="cookie-consent__accept" type="button" @click="chooseCookies('accepted')">
          {{ t('cookies.accept') }}
        </button>
        <button class="cookie-consent__cancel" type="button" @click="dismiss">
          {{ t('cookies.cancel') }}
        </button>
      </div>
    </aside>
  </Transition>
</template>

<style scoped lang="scss">
.cookie-consent {
  position: fixed;
  right: max(var(--page-gutter), calc((100vw - var(--container)) / 2));
  bottom: 20px;
  z-index: 80;
  width: min(100% - 32px, 320px);
  max-width: calc(100vw - 32px);
  max-height: calc(100dvh - 40px);
  overflow-y: auto;
  padding: 54px 36px 40px;
  border-radius: 12px;
  background: var(--panel-soft);
  color: #34312d;
  box-shadow: 0 18px 44px rgb(8 33 31 / 12%);
  font-family: 'Manrope', sans-serif;
}

.cookie-consent__close {
  position: absolute;
  top: 20px;
  right: 22px;
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #5a4634;
  cursor: pointer;

  span,
  span::before {
    position: absolute;
    width: 22px;
    height: 2px;
    border-radius: 999px;
    background: currentColor;
    content: '';
  }

  span {
    transform: rotate(45deg);
  }

  span::before {
    top: 0;
    left: 0;
    transform: rotate(90deg);
  }

  &:hover,
  &:focus-visible {
    color: var(--green);
  }

  &:focus-visible {
    outline: 2px solid var(--green);
    outline-offset: 4px;
  }
}

.cookie-consent__text {
  margin: 0 0 26px;
  font-size: 15px;
  font-weight: 400;
  line-height: 1.3;
}

.cookie-consent__actions {
  display: grid;
  gap: 12px;
}

.cookie-consent__cancel {
  padding: 10px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.cookie-consent__accept {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 56px;
  padding: 14px 24px;
  border: 0;
  border-radius: 999px;
  background: #17624f;
  color: #fff9ec;
  cursor: pointer;
  font-family: 'Manrope', sans-serif;
  font-size: 17px;
  font-weight: 800;
  line-height: 1.1;
  transition:
    background-color 220ms ease,
    transform 220ms ease;

  &:hover,
  &:focus-visible {
    background: #0f4f41;
  }

  &:focus-visible {
    outline: 2px solid #0f4f41;
    outline-offset: 4px;
  }

  &:active {
    transform: translateY(1px);
  }
}

.cookie-consent-enter-active,
.cookie-consent-leave-active {
  transition:
    opacity 260ms ease,
    transform 260ms ease;
}

.cookie-consent-enter-from,
.cookie-consent-leave-to {
  opacity: 0;
  transform: translateY(18px);
}

@media (max-width: 900px) {
  .cookie-consent {
    right: 16px;
    bottom: 20px;
    left: auto;
    width: min(100% - 32px, 320px);
    padding: 52px 28px 32px;
  }

  .cookie-consent__close {
    top: 18px;
    right: 18px;
  }

  .cookie-consent__text {
    margin-bottom: 24px;
    font-size: 17px;
  }

  .cookie-consent__accept {
    min-height: 54px;
    font-size: 17px;
  }
}
</style>
