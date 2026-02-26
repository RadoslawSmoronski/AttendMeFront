<template>
  <div class="container mt-4">
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
          <span class="badge bg-info">STUDENT</span>
        </div>
      </div>
      <div class="gap-2 d-flex">
        <button @click="router.push('/')" class="btn btn-outline-secondary btn-sm">
          <i class="bi bi-arrow-left me-1"></i> Back to Dashboard
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

    <div v-if="loading" class="text-center p-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <div v-else class="row">
      <div class="col-md-6">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-body p-4">
            <h5 class="fw-bold mb-4">{{ currentSession?.courseName || 'Course' }}</h5>

            <p class="mb-1 text-dark">
              Date: <strong>{{ formatDate(currentSession?.dateStart) }}</strong>
            </p>
            <p class="mb-1 text-dark">
              Time:
              <strong
                >{{ formatTime(currentSession?.dateStart) }} -
                {{ formatTime(currentSession?.dateEnd) }}</strong
              >
            </p>
            <p class="mb-4 text-dark">
              Location:
              <strong>{{
                currentSession?.locationName || currentSession?.roomName || 'N/A'
              }}</strong>
            </p>

            <div class="mb-2">
              <div class="text-uppercase small fw-bold text-muted mb-2">Attendance:</div>
              <div
                class="badge p-3 shadow-sm"
                :class="isPresent ? 'bg-success' : 'bg-danger'"
                style="font-size: 1.2rem; width: 160px"
              >
                {{ isPresent ? 'PRESENT' : 'ABSENT' }}
              </div>
            </div>

            <hr class="my-4 text-muted" />
            <p class="small text-muted">
              Details about this specific session and your attendance status.
            </p>
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-body p-4">
            <h5 class="fw-bold mb-4">Course Summary</h5>

            <div class="mb-4">
              <div class="d-flex justify-content-between mb-1">
                <span class="small fw-bold">Attendance Rate</span>
                <span class="small text-muted">{{ attendedCount }} of {{ totalSessions }}</span>
              </div>
              <div class="progress" style="height: 12px">
                <div class="progress-bar bg-success" :style="{ width: attendancePercent + '%' }">
                  {{ attendancePercent }}%
                </div>
              </div>
            </div>

            <div class="mb-2">
              <div class="d-flex justify-content-between mb-1">
                <span class="small fw-bold">Course Progress</span>
                <span class="small text-muted">{{ finishedSessions }} of {{ totalSessions }}</span>
              </div>
              <div class="progress" style="height: 12px">
                <div class="progress-bar bg-primary" :style="{ width: progressPercent + '%' }">
                  {{ progressPercent }}%
                </div>
              </div>
            </div>

            <hr class="my-4 text-muted" />
            <p class="small text-muted">
              Attendance data is automatically synced when you register using your device.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { api } from '@/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
// two params now: groupId for the course group and sessionId for the specific meeting
const groupId = parseInt(route.params.groupId as string)
const sessionId = parseInt(route.params.sessionId as string)

const allSessions = ref<any[]>([])
const attendanceLog = ref<any[]>([])
const loading = ref(true)

const initials = computed(() => {
  const f = authStore.firstName?.[0] || ''
  const l = authStore.lastName?.[0] || ''
  return (f + l).toUpperCase()
})

// === NEW: derive the specific session and attendance status shown on the left card ===
const currentSession = computed(() => {
  // pick the session that matches the sessionId parameter (falls back to first session if missing)
  return (
    allSessions.value.find((s) => s.courseSessionId === sessionId || s.id === sessionId) ||
    allSessions.value[0] ||
    {}
  )
})

const isPresent = computed(() => {
  const targetId = sessionId || currentSession.value.courseSessionId || currentSession.value.id
  if (!targetId) return false
  // look for a log entry for that specific session
  return attendanceLog.value.some((l) => l.courseSessionId === targetId)
})
// ==============================================================================

// number of sessions scheduled for this course
const totalSessions = computed(() => allSessions.value.length)

const attendedCount = computed(() => {
  return allSessions.value.filter((s) =>
    attendanceLog.value.some(
      (l) => l.courseSessionId === s.courseSessionId || l.courseSessionId === s.id,
    ),
  ).length
})

// percentage of sessions the student has attended
const attendancePercent = computed(() =>
  totalSessions.value ? Math.round((attendedCount.value / totalSessions.value) * 100) : 0,
)

// how many sessions have already ended (used for progress bar)
const finishedSessions = computed(() => {
  return allSessions.value.filter((s) => new Date(s.dateEnd) < new Date()).length
})

const progressPercent = computed(() =>
  totalSessions.value ? Math.round((finishedSessions.value / totalSessions.value) * 100) : 0,
)

const fetchData = async () => {
  loading.value = true
  try {
    // fetch all sessions for the group – the single sessionId is used only locally
    const [sessionsList, logs]: [any, any] = await Promise.all([
      api.courseStudentGroupSessionsGet(groupId),
      api.courseStudentAttendanceGet(groupId),
    ])

    allSessions.value = sessionsList
    attendanceLog.value = logs
  } catch (err) {
    console.error('Failed to load course data:', err)
  } finally {
    loading.value = false
  }
}

// use 'pl-PL' locale so dates look like "18 października 2025" and times "13:00"
const formatDate = (dateStr: string): string => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const formatTime = (dateStr: string): string => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
}

const logout = (): void => {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  fetchData()
})
</script>
