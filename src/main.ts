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

document.body.classList.add('aos-first-render')

createApp(App).use(Quasar).use(router).use(i18n).mount('#app')

const revealVisibleAosItems = () => {
  if (document.body.classList.contains('aos-disabled')) {
    return
  }

  const viewportWidth = window.innerWidth || document.documentElement.clientWidth
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight

  document.querySelectorAll<HTMLElement>('[data-aos]').forEach((element) => {
    const rect = element.getBoundingClientRect()
    const isVisible =
      rect.bottom >= 0 && rect.right >= 0 && rect.top <= viewportHeight && rect.left <= viewportWidth

    if (isVisible) {
      element.classList.add('aos-animate')
    }
  })
}

const finishInitialAosRender = () => {
  requestAnimationFrame(() => {
    document.body.classList.remove('aos-first-render')
  })
}

const refreshAos = () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      AOS.refreshHard()
      revealVisibleAosItems()
      window.setTimeout(revealVisibleAosItems, 120)
      window.setTimeout(revealVisibleAosItems, 420)
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
finishInitialAosRender()
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
