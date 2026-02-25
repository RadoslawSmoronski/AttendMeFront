<template>
  <div class="container mt-4 text-center">
    <div class="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
      <button @click="router.back()" class="btn btn-link text-decoration-none text-muted p-0">
        <i class="bi bi-arrow-left"></i> Exit
      </button>
      <h5 class="fw-bold m-0">Scanner Mode</h5>
      <div style="width: 50px"></div>
    </div>

    <div
      class="scan-area mx-auto mb-4 border bg-dark rounded shadow-sm"
      style="max-width: 460px; aspect-ratio: 1/1; position: relative; overflow: hidden"
    >
      <qrcode-stream @detect="onScan" @error="onErr">
        <div v-if="loading" class="text-white mt-5 pt-5">
          <div class="spinner-border spinner-border-sm me-2"></div>
          starting cam...
        </div>
      </qrcode-stream>
    </div>

    <div
      v-if="txt"
      :class="'alert mx-auto shadow-sm ' + (isErr ? 'alert-danger' : 'alert-success')"
      style="max-width: 460px"
    >
      <strong class="d-block">{{ isErr ? 'Scan Error' : 'Success!' }}</strong>
      {{ txt }}
    </div>

    <div class="text-muted small mt-2">
      <p v-if="cName">
        Session: <span class="text-primary fw-bold">{{ cName }}</span>
      </p>
      <p><i class="bi bi-qr-code-scan"></i> Align student's QR code within the frame</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { QrcodeStream } from 'vue-qrcode-reader'
import { api } from '@/api'

const route = useRoute()
const router = useRouter()
const sId = parseInt(route.params.id as string)

// simple state
const loading = ref(true)
const txt = ref('')
const isErr = ref(false)
const cName = ref('')

// toast-like notification
const setMsg = (str: string, err = false) => {
  txt.value = str
  isErr.value = err
  // reset after few sec
  setTimeout(() => {
    txt.value = ''
  }, 3500)
}

// authorize scanner via token
const loadScanner = async () => {
  try {
    const res: any = await api.courseSessionAttendanceScannerTokenGet(sId)
    const tok = res.token || res

    // set token directly into api client
    ;(api as any).deviceTokenResult = { token: tok }

    loading.value = false
  } catch (e) {
    console.error('auth err', e)
    setMsg('Scanner auth failed - check session', true)
  }
}

// handle qr result
const onScan = async (codes: any[]) => {
  const raw = codes[0]?.rawValue
  if (!raw) return

  try {
    // send scanned ticket to server
    const r: any = await api.courseSessionAttendanceRegister(raw)

    // show student name if possible
    const name = r.userName ? `${r.userName} ${r.userSurname}` : 'Student'
    setMsg('Registered: ' + name, false)
  } catch (e: any) {
    console.log('api err', e)
    const m = e.response?.data?.message || 'Invalid or old QR code'
    setMsg(m, true)
  }
}

const onErr = (e: any) => {
  loading.value = false
  setMsg('Camera error: ' + e.name, true)
}

onMounted(() => {
  loadScanner()

  // just get session title
  api
    .courseTeacherSessionGet(sId)
    .then((r: any) => {
      cName.value = r.courseName
    })
    .catch((e) => console.log('header fail', e))
})
</script>

<style scoped>
.scan-area {
  background: #000;
}
</style>
