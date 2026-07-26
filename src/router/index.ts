import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import MainLayout from '@/layouts/MainLayout.vue'
import HomePage from '@/pages/HomePage.vue'
import HotelsPage from '@/pages/HotelsPage.vue'
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage.vue'
import RentalPage from '@/pages/RentalPage.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: HomePage,
      },
      {
        path: 'hotels',
        name: 'hotels',
        component: HotelsPage,
      },
      {
        path: 'rental',
        name: 'rental',
        component: RentalPage,
      },
      {
        path: 'privacy-policy',
        name: 'privacy-policy',
        component: PrivacyPolicyPage,
      },
    ],
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
