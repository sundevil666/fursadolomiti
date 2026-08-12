import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'
import 'aos/dist/aos.css'
import '@/styles/base.css'
import '@/styles/main.scss'
import '@/styles/buttons.css'

import AOS from 'aos'
import { Quasar } from 'quasar'
import { nextTick, watch } from 'vue'
import { createApp } from 'vue'

import App from '@/App.vue'
import { i18n } from '@/i18n'
import { router } from '@/router'

createApp(App).use(Quasar).use(router).use(i18n).mount('#app')

const refreshAos = () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      AOS.refreshHard()
    })
  })
}

AOS.init({
  once: true,
  duration: 720,
  easing: 'ease-out-cubic',
  offset: 0,
  anchorPlacement: 'top-bottom',
  disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
})

refreshAos()
window.addEventListener('load', refreshAos, { once: true })

router.afterEach(() => {
  refreshAos()
})

watch(
  () => i18n.global.locale.value,
  () => {
    refreshAos()
  },
)
