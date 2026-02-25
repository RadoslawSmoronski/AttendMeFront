import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'
import type { TokenResult, User } from '@/api/AttendMeBackendClientBase'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string | null>(null)
  const firstName = ref<string>('')
  const lastName = ref<string>('')
  const isTeacher = ref<boolean | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value)

  const isLecturer = computed(() => isTeacher.value === true)

  // Actions
  async function login(loginName: string, password: string) {
    try {
      const result: TokenResult = await api.userLogin(loginName, password)
      token.value = result.token || null

      if (token.value) {
        const user: User = await api.userGet(undefined)

        firstName.value = user.name || ''
        lastName.value = user.surname || ''
        isTeacher.value = !!user.isTeacher

        sessionStorage.setItem('attend-me:fname', firstName.value)
        sessionStorage.setItem('attend-me:lname', lastName.value)
        sessionStorage.setItem('attend-me:isTeacher', JSON.stringify(isTeacher.value))
      }
    } catch (error) {
      console.error('Login process failed:', error)
      throw error
    }
  }

  function logout() {
    token.value = null
    firstName.value = ''
    lastName.value = ''
    isTeacher.value = null

    api.userTokenResult = undefined

    sessionStorage.removeItem('attend-me:fname')
    sessionStorage.removeItem('attend-me:lname')
    sessionStorage.removeItem('attend-me:userAuthData')
    sessionStorage.removeItem('attend-me:isTeacher')
  }

  function initialize() {
    if (api.userTokenResult && api.userTokenResult.token) {
      token.value = api.userTokenResult.token
    }

    const savedFname = sessionStorage.getItem('attend-me:fname')
    const savedLname = sessionStorage.getItem('attend-me:lname')
    const savedRole = sessionStorage.getItem('attend-me:isTeacher')

    if (savedFname) firstName.value = savedFname
    if (savedLname) lastName.value = savedLname
    if (savedRole) isTeacher.value = JSON.parse(savedRole)
  }

  return {
    token,
    firstName,
    lastName,
    isTeacher,
    isLecturer,
    isAuthenticated,
    login,
    logout,
    initialize,
  }
})
