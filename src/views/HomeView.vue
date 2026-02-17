<template>
  <div class="container mt-5">
    <div class="card p-5 text-center shadow">
      <h1>You've succesfully logged in.</h1>
      <button @click="logout" class="btn btn-outline-danger mt-3">Logout</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
