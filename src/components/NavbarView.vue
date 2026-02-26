<template>
  <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
    <div class="d-flex align-items-center">
      <div
        class="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center me-3 user-select-none"
        style="width: 48px; height: 48px; font-size: 1.2rem"
      >
        {{ initials }}
      </div>
      <div>
        <h5 class="mb-0 fw-bold">{{ authStore.firstName }} {{ authStore.lastName }}</h5>
        <span class="badge" :class="authStore.isLecturer ? 'bg-secondary' : 'bg-info'">
          {{ authStore.isLecturer ? 'LECTURER' : 'STUDENT' }}
        </span>
      </div>
    </div>

    <div class="gap-2 d-flex">
      <button
        v-if="route.path !== '/'"
        @click="router.push('/')"
        class="btn btn-outline-secondary btn-sm"
      >
        <i class="bi bi-arrow-left me-1"></i> Back
      </button>

      <button
        v-if="!authStore.isLecturer"
        @click="router.push('/attendance-qr')"
        class="btn btn-success btn-sm"
      >
        <i class="bi bi-qr-code me-1"></i> Register Attendance
      </button>

      <button @click="logout" class="btn btn-outline-danger btn-sm">Logout</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const initials = computed(() => {
  const f = authStore.firstName?.[0] || ''
  const l = authStore.lastName?.[0] || ''
  return (f + l).toUpperCase()
})

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
