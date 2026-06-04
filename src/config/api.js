import axios from 'axios'
import { clearAuthStorage, getAuthToken } from '../utils/authStorage'

export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') ||
  import.meta.env.REACT_APP_BASE_URL?.replace(/\/api\/?$/, '') ||
  'https://new-sriramias.onrender.com'

function isDemoToken(token) {
  return typeof token === 'string' && token.startsWith('demo-token-')
}

function resolveBaseURL() {
  if (import.meta.env.DEV) {
    return ''
  }

  const raw = String(BASE_URL).replace(/\/$/, '')
  return raw.endsWith('/api') ? raw.slice(0, -4) : raw
}

const api = axios.create({
  baseURL: resolveBaseURL(),
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken() || localStorage.getItem('SuperAdminToken')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = String(error.config?.url || '')
    const token = getAuthToken()

    // In "demo" mode we intentionally use a local-only token; some backend routes may 401.
    // Don't force-logout in that scenario—let the page handle the error state.
    if (status === 401 && !url.includes('/auth/login') && !isDemoToken(token)) {
      clearAuthStorage()
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)

export default api
