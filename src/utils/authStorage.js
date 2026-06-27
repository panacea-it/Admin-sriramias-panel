const TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'auth_refresh_token'
const USER_KEY = 'auth_user'
const REMEMBER_KEY = 'auth_remember'
const SUPER_ADMIN_TOKEN_KEY = 'SuperAdminToken'

export function clearAuthStorage() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(REMEMBER_KEY)
  localStorage.removeItem(SUPER_ADMIN_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

function useRemembered() {
  return localStorage.getItem(REMEMBER_KEY) === '1'
}

export function getAuthToken() {
  return (
    sessionStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem(SUPER_ADMIN_TOKEN_KEY)
  )
}

/** Demo / employee mock tokens from offline login — not valid for live API calls. */
export function isOfflineAuthToken(token = getAuthToken()) {
  if (!token) return false
  const value = String(token)
  return value.startsWith('demo-token-') || value.startsWith('employee-token-')
}

export function canUseLiveApi() {
  return Boolean(getAuthToken()) && !isOfflineAuthToken()
}

export function getStoredUserJson() {
  return sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY)
}

export function persistAuth(token, user, { remember = false, refreshToken } = {}) {
  const userJson = JSON.stringify(user)
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(USER_KEY, userJson)
  localStorage.setItem(SUPER_ADMIN_TOKEN_KEY, token)

  if (refreshToken) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    if (remember) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    }
  }

  if (remember) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, userJson)
    localStorage.setItem(REMEMBER_KEY, '1')
  } else {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.setItem(REMEMBER_KEY, '0')
  }
}

export function isRememberMeEnabled() {
  return useRemembered()
}
