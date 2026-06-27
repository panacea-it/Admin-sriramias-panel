import api, { UPLOAD_REQUEST_TIMEOUT_MS } from './axiosInstance'
import { getApiErrorMessage } from '../utils/apiError'

function unwrapList(response) {
  return Array.isArray(response?.data?.data) ? response.data.data : []
}

function unwrapMutation(response) {
  return response?.data ?? response
}

function toError(error, fallback) {
  const err = new Error(getApiErrorMessage(error, fallback))
  err.cause = error
  return err
}

export async function fetchToppers() {
  try {
    const response = await api.get('/our-toppers')
    return unwrapList(response)
  } catch (error) {
    throw toError(error, 'Failed to fetch toppers')
  }
}

export async function fetchTopperById(id) {
  try {
    const response = await api.get(`/our-toppers/${encodeURIComponent(id)}`)
    return response?.data?.data ?? null
  } catch (error) {
    throw toError(error, 'Failed to fetch topper')
  }
}

export async function createTopper(formData) {
  try {
    const response = await api.post('/our-toppers', formData, {
      timeout: UPLOAD_REQUEST_TIMEOUT_MS,
    })
    return unwrapMutation(response)
  } catch (error) {
    throw toError(error, 'Failed to create topper')
  }
}

export async function updateTopper(id, formData) {
  try {
    const response = await api.put(`/our-toppers/${encodeURIComponent(id)}`, formData, {
      timeout: UPLOAD_REQUEST_TIMEOUT_MS,
    })
    return unwrapMutation(response)
  } catch (error) {
    throw toError(error, 'Failed to update topper')
  }
}

export async function deleteTopper(id) {
  try {
    const response = await api.delete(`/our-toppers/${encodeURIComponent(id)}`)
    return unwrapMutation(response)
  } catch (error) {
    throw toError(error, 'Failed to delete topper')
  }
}

export async function toggleTopperDisplay(id) {
  try {
    const response = await api.patch(`/our-toppers/${encodeURIComponent(id)}/display`)
    return unwrapMutation(response)
  } catch (error) {
    throw toError(error, 'Failed to update display status')
  }
}

export async function toggleTopperTop10(id) {
  try {
    const response = await api.patch(`/our-toppers/${encodeURIComponent(id)}/top10`)
    return unwrapMutation(response)
  } catch (error) {
    throw toError(error, 'Failed to update Top 10 status')
  }
}
