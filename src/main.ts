import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'
import '@/styles/main.scss'
import '@/styles/buttons.css'

import { Quasar } from 'quasar'
import { createApp } from 'vue'

import App from '@/App.vue'
import { i18n } from '@/i18n'
import { router } from '@/router'

createApp(App).use(Quasar).use(router).use(i18n).mount('#app')
