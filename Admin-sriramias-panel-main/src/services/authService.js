import apiClient, { API_ENDPOINTS } from '../config/api'

function toAuthError(error) {
  const status = error?.response?.status
  const data = error?.response?.data

  if (status === 429) {
    return {
      message:
        (typeof data === 'object' && (data.message || data.error)) ||
        'Too many login attempts. Please wait and try again.',
      status: 429,
    }
  }

  if (status === 401) {
    return {
      message:
        (typeof data === 'object' && (data.message || data.error)) ||
        'Invalid email or password. Please check your credentials.',
      status: 401,
    }
  }

  if (status === 403) {
    return {
      message:
        (typeof data === 'object' && (data.message || data.error)) ||
        'Access denied. Your account may be restricted.',
      status: 403,
    }
  }

  if (status >= 500) {
    return {
      message: 'Server error. Please try again later.',
      status,
    }
  }

  if (error?.code === 'ECONNABORTED') {
    return { message: 'Request timed out. Please try again.' }
  }

  if (error?.code === 'ERR_NETWORK' || !error?.response) {
    return {
      message:
        'Network error — check your connection, API base URL (VITE_API_BASE_URL), or restart the dev server.',
    }
  }

  if (typeof data === 'string') {
    return { message: data }
  }
  if (data && typeof data === 'object') {
    return {
      message: data.message || data.error || 'Login failed',
      ...data,
    }
  }

  return { message: error?.message || 'Login failed' }
}

export const loginSuperAdmin = async (payload) => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.LOGIN_SUPER_ADMIN, payload)
    return response.data
  } catch (error) {
    throw toAuthError(error)
  }
}
