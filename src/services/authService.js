import apiClient from './apiClient'

const LOGIN_SUPER_ADMIN_PATH = '/api/auth/login-super-admin'

function toAuthError(error) {
  if (error?.response?.status === 401) {
    const data = error.response.data
    return {
      message:
        (typeof data === 'object' && (data.message || data.error)) ||
        'Invalid credentials',
      status: 401,
    }
  }

  if (error?.response?.status >= 500) {
    return {
      message: 'Server error. Please try again later.',
      status: error.response.status,
    }
  }

  if (error?.code === 'ECONNABORTED') {
    return { message: 'Request timed out. Please try again.' }
  }

  if (error?.code === 'ERR_NETWORK' || !error?.response) {
    return {
      message:
        'Network error — check your connection or restart the dev server (npm run dev).',
    }
  }

  const data = error?.response?.data
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
    const response = await apiClient.post(LOGIN_SUPER_ADMIN_PATH, payload)
    return response.data
  } catch (error) {
    throw toAuthError(error)
  }
}
