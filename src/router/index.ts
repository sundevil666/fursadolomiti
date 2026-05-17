import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import MainLayout from '@/layouts/MainLayout.vue'
import HelicoptersPage from '@/pages/HelicoptersPage.vue'
import HomePage from '@/pages/HomePage.vue'
import HotelsPage from '@/pages/HotelsPage.vue'
import RentalPage from '@/pages/RentalPage.vue'
import WebcamsPage from '@/pages/WebcamsPage.vue'

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
        path: 'helicopters',
        name: 'helicopters',
        component: HelicoptersPage,
      },
      {
        path: 'webcams',
        name: 'webcams',
        component: WebcamsPage,
      },
    ],
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
