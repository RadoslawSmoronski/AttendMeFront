import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'
import type { TokenResult } from '@/api/AttendMeBackendClientBase'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const username = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  async function login(loginName: string, password: string) {
    try {
      const result: TokenResult = await api.userLogin(loginName, password)

      token.value = result.token || null
      username.value = loginName
    } catch (error) {
      console.error('Store login error: ', error)
    }
  }

  function logout() {
    token.value = null
    username.value = null

    api.userTokenResult = undefined

    sessionStorage.removeItem('attend-me:userAuthData')
  }

  return {
    token,
    username,
    isAuthenticated,
    login,
    logout,
  }
})
