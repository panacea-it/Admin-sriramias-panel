import axios from 'axios'
import { resolveApiHostBaseUrl } from '../config/api'
import { getAuthToken } from '../utils/authStorage'

function resolveBaseURL() {
  return resolveApiHostBaseUrl()
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
