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
          <span class="badge bg-secondary">LECTURER</span>
        </div>
      </div>
      <button @click="logout" class="btn btn-outline-danger btn-sm">Logout</button>
    </div>

    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="dropdown">
        <button
          class="btn btn-outline-primary dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
        >
          View: {{ filterLabel }}
        </button>
        <ul class="dropdown-menu">
          <li>
            <a class="dropdown-item" href="#" @click.prevent="currentFilter = 'today'">Today</a>
          </li>
          <li>
            <a class="dropdown-item" href="#" @click.prevent="currentFilter = 'tomorrow'"
              >Tomorrow</a
            >
          </li>
          <li>
            <a class="dropdown-item" href="#" @click.prevent="currentFilter = 'week'"
              >Next 7 Days</a
            >
          </li>
          <li><hr class="dropdown-divider" /></li>
          <li>
            <a class="dropdown-item" href="#" @click.prevent="currentFilter = 'all'"
              >All Sessions</a
            >
          </li>
        </ul>
      </div>
      <span class="text-muted small">Found: {{ filteredSessions.length }}</span>
    </div>

    <div class="list-group shadow-sm" style="max-height: 65vh; overflow-y: auto">
      <div v-if="loading" class="text-center p-5">
        <div class="spinner-border text-primary"></div>
      </div>

      <button
        v-else-if="filteredSessions.length > 0"
        v-for="session in filteredSessions"
        :key="session.id"
        @click="router.push(`/session/${session.id}`)"
        class="list-group-item list-group-item-action p-3 border-start border-primary border-4 mb-1"
      >
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-1 fw-bold text-dark">{{ session.courseName }}</h6>
            <div class="small text-muted mb-1">
              Group: <strong>{{ session.groupName }}</strong> | Room:
              <strong>{{ session.roomName }}</strong>
            </div>
            <div class="small text-primary">
              <i class="bi bi-calendar3 me-1"></i> {{ formatDateTime(session.startTime) }}
            </div>
          </div>
          <i class="bi bi-chevron-right text-muted"></i>
        </div>
      </button>

      <div v-else class="list-group-item p-5 text-center text-muted">No sessions found.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { api } from '@/api'

interface SessionView {
  id: number
  courseName: string
  groupName: string
  roomName: string
  startTime: string
}

const authStore = useAuthStore()
const router = useRouter()

const allSessions = ref<SessionView[]>([])
const loading = ref(true)
const currentFilter = ref<'all' | 'today' | 'tomorrow' | 'week'>('all')

const initials = computed(() => {
  const f = authStore.firstName?.[0] || ''
  const l = authStore.lastName?.[0] || ''
  return (f + l).toUpperCase()
})

const filterLabel = computed(() => {
  const labels = { all: 'All', today: 'Today', tomorrow: 'Tomorrow', week: 'Week' }
  return labels[currentFilter.value]
})

const filteredSessions = computed(() => {
  const now = new Date()
  const todayStr = now.toDateString()

  return allSessions.value.filter((session) => {
    const sDate = new Date(session.startTime)

    if (currentFilter.value === 'today') {
      return sDate.toDateString() === todayStr
    }
    if (currentFilter.value === 'tomorrow') {
      const tmrw = new Date(now)
      tmrw.setDate(tmrw.getDate() + 1)
      return sDate.toDateString() === tmrw.toDateString()
    }
    if (currentFilter.value === 'week') {
      const nextWeek = new Date(now)
      nextWeek.setDate(nextWeek.getDate() + 7)
      return sDate >= now && sDate <= nextWeek
    }
    return true
  })
})

const fetchSessions = async () => {
  loading.value = true
  try {
    const { items } = (await api.courseTeacherSessionsGet({ pageNumber: 1, pageSize: 9999 })) as any

    allSessions.value = (items || []).map((item: any) => ({
      id: item.courseSessionId,
      courseName: item.courseName,
      groupName: item.courseGroupName,
      roomName: item.locationName,
      startTime: item.dateStart,
    }))
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

const logout = () => {
  authStore.logout()
  router.push('/login')
}

onMounted(fetchSessions)
</script>
