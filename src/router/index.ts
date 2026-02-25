import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: '/session/:id',
      name: 'session-details',
      component: () => import('../views/SessionDetailsView.vue'),
    },
    {
      path: '/scanner/:id',
      name: 'scanner',
      component: () => import('../views/ScannerView.vue'),
    },
    {
      path: '/register-device',
      name: 'register-device',
      component: () => import('../views/DeviceRegistrationView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/attendance-qr',
      name: 'attendance-qr',
      component: () => import('../views/AttendanceTicketView.vue'),
      meta: { requiresAuth: false },
    },
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' })
  } else {
    next()
  }
})

export default router
