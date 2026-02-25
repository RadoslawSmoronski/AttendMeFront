<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
      <div>
        <button
          @click="router.push('/')"
          class="btn btn-link text-decoration-none text-muted p-0 mb-2"
        >
          <i class="bi bi-arrow-left me-1"></i> Back
        </button>
        <h2 class="fw-bold mb-0 text-dark">{{ session?.courseName || 'Loading...' }}</h2>
        <div class="text-muted mt-1 small">
          <span class="me-3"
            >Group: <strong>{{ session?.groupName }}</strong></span
          >
          <span class="me-3"
            >Room: <strong>{{ session?.roomName || 'N/A' }}</strong></span
          >
          <span>Time: {{ formatHeaderTime(session?.startTime) }}</span>
        </div>
      </div>

      <div class="d-flex flex-column gap-2 align-items-end">
        <button class="btn btn-primary shadow-sm w-100" @click="goToQrScreen">
          <i class="bi bi-qr-code-scan me-2"></i> Show Scanner
        </button>

        <button @click="isRegModalOpen = true" class="btn btn-outline-primary btn-sm w-100">
          <i class="bi bi-phone me-1"></i> Device Registration
        </button>
      </div>
    </div>

    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="fw-bold mb-0">Attendance: {{ presentCount }} / {{ students.length }}</h5>

      <button @click="getStudents" class="btn btn-outline-secondary btn-sm" :disabled="loading">
        <i class="bi bi-arrow-clockwise" :class="{ 'spin-anim': loading }"></i> Refresh
      </button>
    </div>

    <div class="card shadow-sm border-0 overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light text-secondary">
            <tr>
              <th class="ps-4">#</th>
              <th>Full Name</th>
              <th>Album</th>
              <th>In-time</th>
              <th class="text-end pe-4">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && !students.length">
              <td colspan="5" class="text-center p-5 text-muted small">Loading...</td>
            </tr>

            <tr v-for="(s, i) in students" :key="s.id">
              <td class="ps-4 text-muted small">{{ i + 1 }}</td>
              <td class="fw-semibold">{{ s.name }} {{ s.surname }}</td>
              <td class="text-muted">{{ s.albumNo }}</td>
              <td class="small text-muted">
                {{ s.isPresent && s.checkInTime ? formatTimeOnly(s.checkInTime) : '--' }}
              </td>
              <td class="text-end pe-4">
                <span
                  v-if="s.isPresent"
                  class="badge bg-success-subtle text-success border border-success-subtle rounded-pill"
                >
                  PRESENT
                </span>
                <span
                  v-else
                  class="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill"
                >
                  ABSENT
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <DeviceRegModal v-if="isRegModalOpen" :students="students" @close="isRegModalOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/api'
import DeviceRegModal from '@/components/DeviceRegModal.vue'

const isRegModalOpen = ref(false)

const route = useRoute()
const router = useRouter()
const sId = parseInt(route.params.id as string)

// state vars
const session = ref<any>(null)
const students = ref<any[]>([])
const loading = ref(false)
let timer: any = null

const presentCount = computed(() => students.value.filter((x) => x.isPresent).length)

// load top info
const getDetails = async () => {
  try {
    const r: any = await api.courseTeacherSessionGet(sId)
    session.value = {
      courseName: r.courseName,
      groupName: r.courseGroupName || r.groupName,
      roomName: r.locationName || r.roomName,
      startTime: r.dateStart || r.startTime,
    }
  } catch (err) {
    console.log('header error', err)
  }
}

// get list from server
const getStudents = async () => {
  loading.value = true
  try {
    const res: any = await api.courseSessionAttendanceListGet(sId)
    const list = Array.isArray(res) ? res : res?.items || []

    // map fields to local state
    students.value = list.map((v: any) => ({
      id: v.attenderUserId,
      name: v.userName,
      surname: v.userSurname,
      albumNo: v.studentAlbumIdNumber,
      isPresent: v.wasUserPresent,
      checkInTime: v.attendanceLogMinDateCreated,
    }))
  } catch (err) {
    console.log('list error', err)
  } finally {
    loading.value = false
  }
}

// date/time formatting
const formatHeaderTime = (val: string) => {
  if (!val) return ''
  return new Date(val).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatTimeOnly = (val: string) => {
  return new Date(val).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
}

const goToQrScreen = () => {
  router.push(`/scanner/${sId}`)
}

onMounted(() => {
  getDetails()
  getStudents()

  // auto refresh every 5s for teacher
  timer = setInterval(getStudents, 5000)
})

onUnmounted(() => {
  // kill timer on exit
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.spin-anim {
  animation: spin 1.2s linear infinite;
}
@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
</style>
