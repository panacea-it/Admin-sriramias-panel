import api from '../config/api'
import { throwApiError } from '../utils/apiError'

const PUBLIC_BASE = import.meta.env.DEV ? '' : undefined

export async function fetchPortalFreeLearningResources() {
  try {
    const response = await api.get('/api/free-learning-resources', {
      baseURL: PUBLIC_BASE,
    })
    return Array.isArray(response.data?.data) ? response.data.data : []
  } catch (error) {
    throwApiError(error)
  }
}

export async function fetchPortalFreeLearningResource(resourceType) {
  try {
    const response = await api.get(
      `/api/free-learning-resources/${encodeURIComponent(resourceType)}`,
      { baseURL: PUBLIC_BASE },
    )
    return response.data?.data ?? response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function fetchHomepageFreeLearningResources() {
  try {
    const response = await api.get('/api/homepage', { baseURL: PUBLIC_BASE })
    return response.data?.data?.freeLearningResources || []
  } catch (error) {
    throwApiError(error)
  }
}
