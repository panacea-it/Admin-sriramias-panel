import api from '../config/api'
import {
  FREE_LEARNING_RESOURCE_TYPES,
  getFreeLearningResourceLabel,
} from '../constants/freeLearningResourceConstants'
import { throwApiError } from '../utils/apiError'

function unwrapList(data) {
  return Array.isArray(data?.data) ? data.data : []
}

function unwrapOne(data) {
  return data?.data ?? data
}

function isRouteNotFound(error) {
  const status = error?.response?.status
  const message = String(error?.response?.data?.message || '').toLowerCase()
  return status === 404 || message.includes('route not found')
}

function emptyImage() {
  return { url: '', public_id: '' }
}

function buildFallbackResource(resourceType) {
  return {
    resourceType,
    heading: getFreeLearningResourceLabel(resourceType),
    description: '',
    image1: emptyImage(),
    image2: emptyImage(),
    image3: emptyImage(),
    updatedAt: null,
  }
}

function buildFallbackResourceList() {
  return FREE_LEARNING_RESOURCE_TYPES.map((resourceType) =>
    buildFallbackResource(resourceType),
  )
}

export async function fetchFreeLearningResources() {
  try {
    const response = await api.get('/api/free-learning-resources')
    return unwrapList(response.data)
  } catch (error) {
    if (isRouteNotFound(error)) {
      return buildFallbackResourceList()
    }
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
    if (isRouteNotFound(error)) {
      return buildFallbackResource(resourceType)
    }
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
