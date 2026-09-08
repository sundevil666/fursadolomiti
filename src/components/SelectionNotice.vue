<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const route = useRoute()
const { t } = useI18n()

// Add a route name here when the notice should also be enabled on another page.
const selectionNoticeRouteNames = ['hotels']
const isVisible = ref(false)
let anchorObserver: IntersectionObserver | null = null

const stopObserving = () => {
  anchorObserver?.disconnect()
  anchorObserver = null
}

const observeHotelsSection = async () => {
  stopObserving()
  isVisible.value = false

  if (!selectionNoticeRouteNames.includes(String(route.name))) return

  await nextTick()
  const anchor = document.querySelector('[data-selection-notice-anchor]')

  if (!anchor) return

  anchorObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting || entry.intersectionRect.height <= 0) return

      isVisible.value = true
      stopObserving()
    },
    { threshold: 0.001 },
  )
  anchorObserver.observe(anchor)
}

const closeNotice = () => {
  isVisible.value = false
}

watch(() => route.name, observeHotelsSection, { immediate: true })
onBeforeUnmount(stopObserving)
</script>

<template>
  <Teleport to="body">
    <Transition name="selection-notice">
      <aside
        v-if="isVisible"
        class="selection-notice"
        role="status"
        :aria-label="t('selectionNotice.label')"
      >
        <svg class="selection-notice__quote" width="36" height="28" viewBox="61 52 36 28" aria-hidden="true">
          <path d="M69.7731 80C68.1597 80 66.7815 79.6877 65.6387 79.0632C64.563 78.4387 63.6891 77.5713 63.0168 76.461C62.3445 75.4201 61.8403 74.171 61.5042 72.7138C61.1681 71.1871 61 69.7646 61 68.4461C61 64.9765 61.8403 61.8191 63.521 58.974C65.2689 56.0595 67.9244 53.7348 71.4874 52L72.395 53.8736C70.4454 54.7063 68.7311 56.0248 67.2521 57.829C65.8403 59.6332 65 61.4721 64.7311 63.3457C64.5294 64.6642 64.563 65.8786 64.8319 66.9888C66.1765 65.601 67.8908 64.9071 69.9748 64.9071C72.1261 64.9071 73.9076 65.5663 75.3193 66.8848C76.7311 68.2032 77.437 70.0768 77.437 72.5056C77.437 74.7261 76.6975 76.5304 75.2185 77.9182C73.7395 79.3061 71.9244 80 69.7731 80ZM89.3361 80C87.7227 80 86.3445 79.6877 85.2017 79.0632C84.126 78.4387 83.2521 77.5713 82.5798 76.461C81.9076 75.4201 81.4034 74.171 81.0672 72.7138C80.7311 71.1871 80.563 69.7646 80.563 68.4461C80.563 64.9765 81.4034 61.8191 83.084 58.974C84.8319 56.0595 87.4874 53.7348 91.0504 52L91.958 53.8736C90.0084 54.7063 88.2941 56.0248 86.8151 57.829C85.4034 59.6332 84.563 61.4721 84.2941 63.3457C84.0924 64.6642 84.126 65.8786 84.395 66.9888C85.7395 65.601 87.4538 64.9071 89.5378 64.9071C91.6891 64.9071 93.4706 65.5663 94.8824 66.8848C96.2941 68.2032 97 70.0768 97 72.5056C97 74.7261 96.2605 76.5304 94.7815 77.9182C93.3025 79.3061 91.4874 80 89.3361 80Z" fill="currentColor" />
        </svg>

        <p class="selection-notice__text">{{ t('selectionNotice.text') }}</p>

        <button class="selection-notice__close" type="button" :aria-label="t('selectionNotice.close')" @click="closeNotice">
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <path d="m4 4 14 14M18 4 4 18" fill="none" stroke="currentColor" stroke-width="1.4" />
          </svg>
        </button>

        <span class="selection-notice__dots" aria-hidden="true" />
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.selection-notice {
  position: fixed;
  z-index: 5000;
  top: 50%;
  left: 50%;
  width: min(550px, calc(100vw - 32px));
  height: 146px;
  padding: 0;
  overflow: hidden;
  color: #efe4c9;
  background: #175445;
  border-radius: 8px;
  box-shadow: 0 4px 50px rgb(46 32 0 / 20%);
  transform: translate(-50%, -50%);
}

.selection-notice__quote {
  position: absolute;
  z-index: 1;
  top: 6px;
  left: 11px;
}

.selection-notice__text {
  position: absolute;
  z-index: 1;
  top: 41px;
  left: 41px;
  width: 420px;
  margin: 0;
  font-family: Manrope, ui-sans-serif, system-ui, sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
}

.selection-notice__close {
  position: absolute;
  z-index: 2;
  top: 20px;
  right: 20px;
  display: grid;
  width: 24px;
  height: 24px;
  padding: 1px;
  color: #efe4c9;
  cursor: pointer;
  background: transparent;
  border: 0;
  place-items: center;
}

.selection-notice__close:focus-visible {
  outline: 2px solid #efe4c9;
  outline-offset: 2px;
}

.selection-notice__dots {
  position: absolute;
  top: 0;
  right: -83px;
  width: 248px;
  height: 389px;
  opacity: 1;
  background-image: radial-gradient(circle, rgb(239 228 201 / 52%) 1.3px, transparent 1.35px);
  background-position: 0 0;
  background-size: 13px 16.8px;
  mask-image:
    linear-gradient(90deg, transparent 0, rgb(0 0 0 / 20%) 26%, #000 100%),
    linear-gradient(180deg, #000 0, #000 44%, transparent 77%);
  mask-composite: intersect;
}

.selection-notice-enter-active,
.selection-notice-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.selection-notice-enter-from,
.selection-notice-leave-to {
  opacity: 0;
  transform: translate(-50%, calc(-50% + 12px));
}

@media (max-width: 600px) {
  .selection-notice {
    height: 146px;
  }

  .selection-notice__quote {
    left: 10px;
  }

  .selection-notice__text {
    right: 44px;
    left: 40px;
    width: auto;
    font-size: 15px;
    line-height: 1.45;
  }

  .selection-notice__close {
    top: 18px;
    right: 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .selection-notice-enter-active,
  .selection-notice-leave-active {
    transition: none;
  }
}
</style>
