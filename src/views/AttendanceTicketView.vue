<template>
  <div class="container d-flex justify-content-center align-items-center vh-100">
    <div class="card shadow-sm text-center" style="max-width: 400px; width: 100%">
      <div class="card-body p-4">
        <h3 class="card-title mb-4">Attendance QR</h3>

        <div v-if="!hasDeviceToken" class="alert alert-danger small">
          Device is not registered. Please register your device using the link provided by your
          teacher first.
        </div>

        <div v-else>
          <div v-if="attendanceConfirmed" class="text-success py-4">
            <i class="bi bi-check-circle-fill" style="font-size: 4rem"></i>
            <h4 class="mt-3 fw-bold">Attendance Registered!</h4>
            <p class="text-muted small">You can close this screen now.</p>
          </div>

          <div v-else>
            <p class="text-muted small mb-4">
              Bring your phone close to the teacher's camera to scan this code.
            </p>

            <div class="d-flex justify-content-center bg-light p-3 rounded mb-3">
              <qrcode-vue v-if="ticketValue" :value="ticketValue" :size="200" level="M" />
              <div v-else class="spinner-border text-primary m-5" role="status"></div>
            </div>

            <p class="small text-muted mb-0">
              <i class="bi bi-arrow-clockwise me-1"></i> Auto-refreshing every 2s...
            </p>
          </div>
        </div>

        <div class="d-grid gap-2 mt-4">
          <button @click="router.push('/login')" class="btn btn-secondary">Back to Login</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/api'
import QrcodeVue from 'qrcode.vue' // Import QR code generator

const router = useRouter()

// State variables
const hasDeviceToken = ref(false)
const ticketValue = ref('')
const attendanceConfirmed = ref(false)

// Variable to hold our interval ID so we can stop it later
let timerId: any = null

onMounted(() => {
  // 1. Check if device is registered
  const deviceToken = localStorage.getItem('device_token')

  if (deviceToken) {
    hasDeviceToken.value = true

    // IMPORTANT: In many backend setups, you need to tell your API client
    // to use the device_token for this specific request, not the login token!
    // Example (depends on your api.ts setup):
    // api.defaults.headers.common['Authorization'] = `Bearer ${deviceToken}`

    // 2. Fetch the first ticket immediately
    fetchTicket()

    // 3. Start fetching a new ticket every 2 seconds
    timerId = setInterval(fetchTicket, 2000)
  }
})

// Stop the timer when user leaves the page
onUnmounted(() => {
  if (timerId) {
    clearInterval(timerId)
  }
})

// Function to get the ticket from backend
async function fetchTicket() {
  // If already confirmed, stop fetching to save network calls
  if (attendanceConfirmed.value) return

  try {
    const response: any = await api.userAttendanceTicketGet()

    // Update the QR code value
    ticketValue.value = response.token || response.ticket || response

    // Check if the backend says attendance was just registered
    if (response.lastRegisteredAttendance) {
      attendanceConfirmed.value = true
      clearInterval(timerId) // Stop the timer, we are done!
    }
  } catch (err: any) {
    console.error('Failed to get ticket:', err)

    // If backend returned 403 (device token invalid/expired/forbidden)
    const status = err?.status || err?.result?.status || err?.statusCode || err?.response?.status
    if (status === 403) {
      try {
        // remove stored device token and clear client device auth
        localStorage.removeItem('device_token')
        if (typeof (api as any).deviceAuthReset === 'function') (api as any).deviceAuthReset()
      } catch (e) {
        console.warn('Failed to clear device auth:', e)
      }

      // stop polling and redirect to login so user can re-register/login
      if (timerId) clearInterval(timerId)
      hasDeviceToken.value = false
      router.push('/login')
    }
  }
}
</script>
