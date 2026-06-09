import { ROLES } from '../constants/roles'

const ROLE_ALIASES = {
  superadmin: ROLES.SUPER_ADMIN,
  super_admin: ROLES.SUPER_ADMIN,
  centeradmin: ROLES.CENTER_ADMIN,
  center_admin: ROLES.CENTER_ADMIN,
  operationadmin: ROLES.OPERATION_ADMIN,
  operation_admin: ROLES.OPERATION_ADMIN,
  operationsadmin: ROLES.OPERATION_ADMIN,
  operations: ROLES.OPERATION_ADMIN,
  contentadmin: ROLES.CONTENT_ADMIN,
  content_admin: ROLES.CONTENT_ADMIN,
  mentoradmin: ROLES.MENTOR_ADMIN,
  mentor_admin: ROLES.MENTOR_ADMIN,
  teacheradmin: ROLES.TEACHER_ADMIN,
  teacher_admin: ROLES.TEACHER_ADMIN,
  counselingadmin: ROLES.COUNSELING_ADMIN,
  counseling_admin: ROLES.COUNSELING_ADMIN,
  counselloradmin: ROLES.COUNSELING_ADMIN,
  counseloradmin: ROLES.COUNSELING_ADMIN,
}

/** Normalize backend / legacy role strings to canonical role ids */
export function normalizeRole(role) {
  if (!role) return ROLES.SUPER_ADMIN

  const compact = String(role).toLowerCase().replace(/[\s-]+/g, '_')
  const squashed = compact.replace(/_/g, '')

  if (ROLE_ALIASES[compact]) return ROLE_ALIASES[compact]
  if (ROLE_ALIASES[squashed]) return ROLE_ALIASES[squashed]
  if (Object.values(ROLES).includes(compact)) return compact

  return compact || ROLES.SUPER_ADMIN
}

/**
 * Map API login response to { user, accessToken }.
 * Supports nested shapes: { data: { user, accessToken } }, { user, token }, etc.
 */
export function mapLoginResponse(apiResponse) {
  const root = apiResponse?.data ?? apiResponse
  const payload = root?.data ?? root

  const user = payload?.user ?? payload?.admin ?? payload?.superAdmin ?? root?.user
  const accessToken =
    payload?.accessToken ??
    payload?.token ??
    payload?.access_token ??
    root?.accessToken ??
    root?.token ??
    apiResponse?.token ??
    apiResponse?.data?.token

  const refreshToken =
    payload?.refreshToken ??
    payload?.refresh_token ??
    root?.refreshToken ??
    root?.refresh_token

  if (!user || !accessToken) {
    throw new Error(apiResponse?.message || root?.message || 'Invalid login response from server')
  }

  const name = user.name || user.fullName || user.email?.split('@')[0] || 'Admin'
  const email = user.email || ''
  const initials =
    user.avatar ||
    name
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

  return {
    user: {
      ...user,
      name,
      email,
      avatar: initials,
      role: normalizeRole(user.role),
      centers: user.centers || (user.center ? [user.center] : ['All Centers']),
    },
    accessToken,
    ...(refreshToken ? { refreshToken } : {}),
  }
}

export function normalizeStoredUser(user) {
  if (!user) return null
  return {
    ...user,
    role: normalizeRole(user.role),
  }
}

const LOGIN_STATUS_MESSAGES = {
  401: 'Invalid email or password. Please check your credentials.',
  403: 'Access denied. Your account may be restricted.',
  429: 'Too many login attempts. Please wait and try again.',
  500: 'Server error. Please try again later.',
  502: 'Backend unavailable. Start the API server or check VITE_API_BASE_URL, then restart npm run dev.',
  503: 'Service temporarily unavailable. Please try again shortly.',
}

export function getLoginErrorMessage(error) {
  if (typeof error === 'string') return error

  const status = error?.status ?? error?.response?.status
  if (status && LOGIN_STATUS_MESSAGES[status]) {
    const data = error?.response?.data
    if (status === 403 && typeof data === 'object' && (data?.message || data?.error)) {
      return data.message || data.error
    }
    return LOGIN_STATUS_MESSAGES[status]
  }

  if (error?.message && !error?.response) return error.message

  const data = error?.response?.data
  if (typeof data === 'string') return data
  if (data?.message) return data.message
  if (data?.error) return data.error
  if (Array.isArray(data?.errors) && data.errors[0]?.msg) return data.errors[0].msg
  if (error?.message) return error.message
  if (error?.code === 'ECONNABORTED') return 'Request timed out. Please try again.'
  if (error?.code === 'ERR_NETWORK') {
    return 'Network error — restart the dev server (npm run dev) and try again.'
  }
  if (!error?.response) return 'Unable to reach the server. Check your connection.'
  return 'Login failed. Please check your email and password.'
}

/** Normalize thrown login errors from AuthContext, authAPI, and axios. */
export function resolveLoginErrorMessage(error) {
  if (!error) return 'Login failed'

  const nested = error?.cause
  const fromCause =
    (typeof nested === 'object' && (nested?.message || getLoginErrorMessage(nested))) || null

  return error?.message || fromCause || getLoginErrorMessage(error)
}
