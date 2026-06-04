import axios from 'axios'
import { BASE_URL } from '../config/api'
import { getAuthToken } from '../utils/authStorage'

function resolveBaseURL() {
  if (import.meta.env.DEV) {
    return ''
  }

  const raw = String(BASE_URL).replace(/\/$/, '')
  return raw.endsWith('/api') ? raw.slice(0, -4) : raw
}

const axiosInstance = axios.create({
  baseURL: resolveBaseURL(),
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('SuperAdminToken') || getAuthToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default axiosInstance
