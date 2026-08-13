<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const storageKey = 'fursadolomiti_cookie_consent_v1'
const isVisible = ref(false)

const acceptCookies = () => {
  localStorage.setItem(storageKey, 'accepted')
  isVisible.value = false
}

onMounted(() => {
  isVisible.value = localStorage.getItem(storageKey) !== 'accepted'
})
</script>

<template>
  <Transition name="cookie-consent">
    <aside v-if="isVisible" class="cookie-consent" :aria-label="t('cookies.title')">
      <button class="cookie-consent__close" type="button" :aria-label="t('cookies.close')" @click="acceptCookies">
        <span aria-hidden="true"></span>
      </button>

      <p class="cookie-consent__text">
        {{ t('cookies.text') }}
      </p>

      <button class="cookie-consent__accept" type="button" @click="acceptCookies">
        {{ t('cookies.accept') }}
      </button>
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
  font-size: 20px;
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
    font-size: 19px;
  }
}
</style>
