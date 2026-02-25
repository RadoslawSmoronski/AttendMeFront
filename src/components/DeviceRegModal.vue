<template>
  <div class="modal fade show d-block" style="background: rgba(0, 0, 0, 0.5)" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content border-0 shadow">
        <div class="modal-header bg-light border-bottom">
          <h5 class="modal-title fw-bold text-dark">
            <i class="bi bi-cpu me-2"></i>Device Management
          </h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>

        <div class="modal-body p-0">
          <div v-if="isLoading" class="text-center p-5">
            <div class="spinner-border text-primary" role="status"></div>
            <div class="mt-2 text-muted small">Loading device info...</div>
          </div>

          <div v-else class="table-responsive" style="max-height: 450px">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light small text-uppercase text-muted">
                <tr>
                  <th class="ps-4">Student</th>
                  <th>Album No.</th>
                  <th>Status / Device</th>
                  <th class="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in students" :key="s.id">
                  <td class="ps-4">
                    <div class="fw-bold">{{ s.name }} {{ s.surname }}</div>
                  </td>
                  <td class="text-muted small">{{ s.albumNo }}</td>

                  <td>
                    <span
                      v-if="deviceData[s.id] && deviceData[s.id].deviceName"
                      class="badge bg-success-subtle text-success border border-success-subtle px-3"
                    >
                      <i class="bi bi-phone me-1"></i> {{ deviceData[s.id].deviceName }}
                    </span>
                    <span v-else class="text-muted small italic">-</span>
                  </td>

                  <td class="text-end pe-4">
                    <div class="btn-group">
                      <button
                        v-if="deviceData[s.id] && deviceData[s.id].deviceName"
                        class="btn btn-sm btn-danger me-2"
                        @click="resetStudentDevice(s.id)"
                      >
                        Reset
                      </button>

                      <button
                        class="btn btn-sm btn-dark px-3"
                        @click="copyStudentLink(deviceData[s.id]?.link)"
                      >
                        Copy Link
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-footer bg-light py-2">
          <button type="button" class="btn btn-secondary btn-sm" @click="$emit('close')">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api'

const props = defineProps<{
  students: any[]
}>()

const emit = defineEmits(['close'])

// Simple state variables
const isLoading = ref(true)
const deviceData = ref<any>({}) // object to hold device name and link for each student

// Get data when modal opens
onMounted(async () => {
  isLoading.value = true

  // Simple for loop to get data for each student one by one
  for (let i = 0; i < props.students.length; i++) {
    const studentId = props.students[i].id

    let currentDeviceName = null
    let currentLink = null

    try {
      // 1. Get user details
      const userRes: any = await api.userGet(studentId)
      currentDeviceName = userRes.deviceName || userRes.deviceUserDeviceName || null

      // 2. Get register token
      const tokenRes: any = await api.userDeviceRegisterTokenGet(studentId)
      const myToken = tokenRes.token || tokenRes

      if (myToken) {
        currentLink = window.location.origin + '/register-device?token=' + myToken
      }
    } catch (err) {
      // if student already has device, token might throw error, just ignore it
      console.log('Could not get token for student: ' + studentId)
    }

    // save to our state object
    deviceData.value[studentId] = {
      deviceName: currentDeviceName,
      link: currentLink,
    }
  }

  isLoading.value = false
})

// Copy link to clipboard
const copyStudentLink = async (linkText: string) => {
  if (!linkText) {
    alert('No link available. Reset device first!')
    return
  }

  try {
    await navigator.clipboard.writeText(linkText)
    alert('Link copied!')
  } catch (err) {
    alert('Failed to copy link')
  }
}

// Reset device
const resetStudentDevice = async (userId: number) => {
  const isSure = confirm('Are you sure you want to reset?')
  if (!isSure) return

  try {
    await api.userDeviceReset(userId)
    alert('Device reset successful! Please close and open this window to refresh.')
    // close modal automatically after reset so teacher has to reopen and refresh data
    emit('close')
  } catch (e) {
    alert('Error resetting device.')
  }
}
</script>
