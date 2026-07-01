import axios from 'axios'
import { resolveApiBaseUrlWithSuffix } from '../config/api'
import { isFrontendOnly } from '../config/appMode'
import { emitAuthLogout } from '../utils/authEvents'
import { clearAuthStorage, getAuthToken, isOfflineAuthToken } from '../utils/authStorage'

export const DEFAULT_REQUEST_TIMEOUT_MS = 60000
export const UPLOAD_REQUEST_TIMEOUT_MS = 120000

export function resolveApiBaseUrl() {
  if (isFrontendOnly) {
    return '/api'
  }
  return resolveApiBaseUrlWithSuffix()
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: DEFAULT_REQUEST_TIMEOUT_MS,
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
  const token = getAuthToken() || localStorage.getItem('SuperAdminToken')
  if (token) config.headers.Authorization = `Bearer ${token}`

  // FormData: remove Content-Type so the browser sets multipart boundary.
  if (config.data instanceof FormData && config.headers) {
    config.timeout = config.timeout ?? UPLOAD_REQUEST_TIMEOUT_MS
    if (typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type')
    } else {
      delete config.headers['Content-Type']
      delete config.headers.common?.['Content-Type']
    }
  }

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
      const token = getAuthToken() || localStorage.getItem('SuperAdminToken')
      if (!isFrontendOnly && !isOfflineAuthToken(token)) {
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

export { buildApiUrl } from '../config/api'
export default api
