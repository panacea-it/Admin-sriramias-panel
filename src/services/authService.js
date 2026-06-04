import apiClient, { API_ENDPOINTS, BASE_URL, buildApiUrl } from '../config/api'

function toAuthError(error) {
  console.log('Login Error:', error.response?.data)
  console.log('Status:', error.response?.status)

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
        'Network error — check your connection, API base URL (VITE_API_BASE_URL), or restart the dev server.',
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
  const url = buildApiUrl(API_ENDPOINTS.LOGIN_SUPER_ADMIN)

  console.log('BASE_URL:', BASE_URL)
  console.log('Login Payload:', payload)
  console.log('Login URL:', url)

  try {
    const response = await apiClient.post(API_ENDPOINTS.LOGIN_SUPER_ADMIN, payload)
    console.log('Login Response:', response.data)
    return response.data
  } catch (error) {
    throw toAuthError(error)
  }
}
