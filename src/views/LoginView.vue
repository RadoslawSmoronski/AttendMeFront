<template>
  <div class="container d-flex justify-content-center align-items-center vh-100">
    <div class="card shadow-sm" style="max-width: 400px; width: 100%">
      <div class="card-body p-4">
        <h3 class="card-title text-center mb-4">Login Panel</h3>

        <form @submit.prevent="onLogin">
          <div class="mb-3">
            <label for="login" class="form-label">Username</label>
            <input
              v-model="loginField"
              type="text"
              class="form-control"
              id="login"
              placeholder="Your username"
              required
            />
          </div>

          <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <input
              v-model="passwordField"
              type="password"
              class="form-control"
              id="password"
              placeholder="Your password"
              required
            />
          </div>

          <div v-if="errorMsg" class="alert alert-danger py-2" role="alert">
            {{ errorMsg }}
          </div>

          <div class="d-grid gap-2 mt-4">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Sign In
            </button>
          </div>

          <template v-if="isDeviceRegistered">
            <hr class="my-4 text-muted" />
            <div class="d-grid gap-2">
              <button
                type="button"
                @click="router.push('/attendance-qr')"
                class="btn btn-outline-success"
              >
                <i class="bi bi-qr-code me-2"></i> Show Attendance QR
              </button>
            </div>
          </template>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loginField = ref('')
const passwordField = ref('')
const errorMsg = ref('')
const loading = ref(false)

// Variable to control if the QR button should be visible
const isDeviceRegistered = ref(false)

// Check if device token exists when page loads
onMounted(() => {
  if (localStorage.getItem('device_token')) {
    isDeviceRegistered.value = true
  }
})

async function onLogin() {
  loading.value = true
  errorMsg.value = ''

  try {
    await authStore.login(loginField.value, passwordField.value)

    router.push('/')
  } catch (err: any) {
    console.error('Login Error:', err)
    errorMsg.value = 'Wrong data or server error.'
  } finally {
    loading.value = false
  }
}
</script>
