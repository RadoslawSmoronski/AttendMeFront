<template>
  <div class="container d-flex justify-content-center align-items-center vh-100">
    <div class="card shadow-sm" style="max-width: 400px; width: 100%">
      <div class="card-body p-4">
        <div v-if="isRegistered" class="text-center">
          <h3 class="card-title text-success mb-3">
            <i class="bi bi-check-circle-fill me-2"></i>Registered
          </h3>
          <p class="text-muted small mb-4">Your device is ready to use for attendance tracking.</p>
          <div class="d-grid gap-2 mt-4">
            <button @click="router.push('/login')" class="btn btn-success">Go to Login</button>
            <button @click="resetDevice" class="btn btn-outline-danger">Remove Local Device</button>
          </div>
        </div>

        <div v-else-if="!myToken" class="text-center">
          <h3 class="card-title text-danger mb-3">Missing Token</h3>
          <p class="text-muted small mb-0">
            Please open this page using the exact registration link provided by your teacher.
          </p>
        </div>

        <div v-else>
          <h3 class="card-title text-center mb-4">Device Registration</h3>

          <form @submit.prevent="sendRegistration">
            <div class="mb-3">
              <label for="devName" class="form-label">Device Name</label>
              <input
                v-model="form.deviceName"
                type="text"
                class="form-control"
                id="devName"
                placeholder="e.g. My iPhone"
                required
              />
            </div>

            <div class="mb-3">
              <label for="fName" class="form-label">First Name</label>
              <input
                v-model="form.studentName"
                type="text"
                class="form-control"
                id="fName"
                placeholder="Your first name"
                required
              />
            </div>

            <div class="mb-3">
              <label for="lName" class="form-label">Last Name</label>
              <input
                v-model="form.studentSurname"
                type="text"
                class="form-control"
                id="lName"
                placeholder="Your last name"
                required
              />
            </div>

            <div class="mb-3">
              <label for="albumId" class="form-label">Album Number</label>
              <input
                v-model="form.albumIdNumber"
                type="number"
                class="form-control"
                id="albumId"
                placeholder="Your album number"
                required
              />
            </div>

            <div v-if="errorMsg" class="alert alert-danger py-2" role="alert">
              {{ errorMsg }}
            </div>

            <div class="d-grid gap-2 mt-4">
              <button type="submit" class="btn btn-primary" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                Register
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/api'

const route = useRoute()
const router = useRouter()

// View states
const isRegistered = ref(false)
const myToken = ref('')
const loading = ref(false)
const errorMsg = ref('')

// Form data grouped into one object
const form = ref({
  deviceName: '',
  studentName: '',
  studentSurname: '',
  albumIdNumber: '',
})

onMounted(() => {
  // Check if device is already registered locally
  if (localStorage.getItem('device_token')) {
    isRegistered.value = true
    return
  }

  // Look for token in URL or session storage
  const token = (route.query.token as string) || sessionStorage.getItem('temp_device_token')

  if (token) {
    myToken.value = token
    // Save token to session and clean the URL
    sessionStorage.setItem('temp_device_token', token)
    router.replace({ path: '/register-device' })
  }
})

async function sendRegistration() {
  loading.value = true
  errorMsg.value = ''

  try {
    // Map form data to the exact names required by the API
    const payload = {
      deviceName: form.value.deviceName,
      studentName: form.value.studentName,
      studentSurname: form.value.studentSurname,
      albumIdNumber: Number(form.value.albumIdNumber),
    }

    const response: any = await api.userDeviceRegisterWithToken(myToken.value, payload)

    // Save permanent token and clean session
    localStorage.setItem('device_token', response.token || response)
    sessionStorage.removeItem('temp_device_token')

    isRegistered.value = true
  } catch (err: any) {
    console.error('Registration Error:', err)
    // Try to surface server-provided message when available
    if (err && err.result) {
      // generated client throws ProblemDetails as result
      const r = err.result
      errorMsg.value = r.detail || r.title || JSON.stringify(r)
    } else if (err && err.response) {
      errorMsg.value = err.response
    } else {
      errorMsg.value = 'Registration failed. Check your data or ask for a new link.'
    }
  } finally {
    loading.value = false
  }
}

function resetDevice() {
  if (confirm('Are you sure you want to remove this device locally?')) {
    localStorage.removeItem('device_token')
    isRegistered.value = false
    myToken.value = ''
    errorMsg.value = ''
  }
}
</script>
