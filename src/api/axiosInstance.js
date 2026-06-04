import axios from 'axios'
import { isDemoAuthEnabled, isFrontendOnly } from '../config/appMode'
import { emitAuthLogout } from '../utils/authEvents'
import { clearAuthStorage, getAuthToken } from '../utils/authStorage'

export function resolveApiBaseUrl() {
  if (isFrontendOnly) {
    return '/api'
  }

  if (import.meta.env.DEV) {
    return '/api'
  }

  const configured = import.meta.env.VITE_API_BASE_URL?.trim()
  if (configured) {
    const raw = configured.replace(/\/$/, '')
    return raw.endsWith('/api') ? raw : `${raw}/api`
  }

  return '/api'
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
})

api.interceptors.request.use((config) => {
  if (isFrontendOnly) {
    return Promise.reject(
      Object.assign(new Error('API disabled in frontend-only mode'), {
        code: 'ERR_FRONTEND_ONLY',
        config,
      }),
    )
  }
  const token = getAuthToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (isFrontendOnly || error.code === 'ERR_FRONTEND_ONLY') {
      return Promise.reject(error)
    }

    const isLoginRequest = error.config?.url?.includes('/auth/login')
    const skipAuthRedirect = Boolean(error.config?.skipAuthRedirect)
    if (error.response?.status === 401 && !isLoginRequest && !skipAuthRedirect) {
      if (!isFrontendOnly && !isDemoAuthEnabled) {
        clearAuthStorage()
        emitAuthLogout()
        if (window.location.pathname !== '/login') {
          window.location.assign('/login')
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api
