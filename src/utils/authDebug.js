const isAuthDebugEnabled =
  import.meta.env.DEV && import.meta.env.VITE_DEBUG_AUTH !== 'false'

function maskPassword(payload) {
  if (!payload || typeof payload !== 'object') return payload
  const { password, ...rest } = payload
  void password
  return { ...rest, password: password ? '***' : undefined }
}

export function logAuthRequest({ method, url, baseURL, payload }) {
  if (!isAuthDebugEnabled) return
  const fullUrl = baseURL ? `${baseURL.replace(/\/$/, '')}${url}` : url
  console.group('[auth] request')
  console.log('URL:', fullUrl)
  console.log('Method:', method)
  console.log('Body:', maskPassword(payload))
  console.groupEnd()
}

export function logAuthResponse({ status, headers, data }) {
  if (!isAuthDebugEnabled) return
  console.group('[auth] response')
  console.log('Status:', status)
  console.log('Headers:', headers)
  console.log('Data:', data)
  console.groupEnd()
}

export function logAuthError(error) {
  if (!isAuthDebugEnabled) return
  console.group('[auth] error')
  console.log('Message:', error?.message)
  console.log('Code:', error?.code)
  console.log('Status:', error?.response?.status)
  console.log('Response headers:', error?.response?.headers)
  console.log('Response data:', error?.response?.data)
  console.log('Axios error:', error)
  if (error?.request && !error?.response) {
    console.log('Network request (no response):', error.request)
  }
  console.groupEnd()
}

export function logAuthResolvedBaseUrl(baseURL, source) {
  if (!isAuthDebugEnabled) return
  console.log(`[auth] baseURL (${source}):`, baseURL || '(relative — Vite proxy /api)')
}
