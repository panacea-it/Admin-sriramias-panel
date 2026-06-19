import api from '../config/api'
import { throwApiError } from '../utils/apiError'

function unwrapList(data) {
  return Array.isArray(data?.data) ? data.data : []
}

function unwrapOne(data) {
  return data?.data ?? data
}

export async function fetchFreeLearningResources() {
  try {
    const response = await api.get('/api/free-learning-resources')
    return unwrapList(response.data)
  } catch (error) {
    throwApiError(error)
  }
}

export async function fetchFreeLearningResourceByType(resourceType) {
  try {
    const response = await api.get(
      `/api/free-learning-resources/${encodeURIComponent(resourceType)}`,
    )
    return unwrapOne(response.data)
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateFreeLearningResource(resourceType, formData) {
  try {
    const response = await api.put(
      `/api/free-learning-resources/${encodeURIComponent(resourceType)}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    )
    return unwrapOne(response.data)
  } catch (error) {
    throwApiError(error)
  }
}
