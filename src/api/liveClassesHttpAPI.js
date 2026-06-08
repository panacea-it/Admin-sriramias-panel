import axiosInstance from './axiosInstance'
import { throwApiError } from '../utils/apiError'

const BASE = '/live-classes'

export async function getLiveClasses(params = {}, { signal } = {}) {
  try {
    const response = await axiosInstance.get(BASE, { params, signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    throwApiError(error)
  }
}

export async function getLiveClassById(liveClassId, { signal } = {}) {
  try {
    const response = await axiosInstance.get(
      `${BASE}/${encodeURIComponent(liveClassId)}`,
      { signal },
    )
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    throwApiError(error)
  }
}

export async function createLiveClass(payload) {
  try {
    const response = await axiosInstance.post(BASE, payload)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateLiveClass(liveClassId, payload) {
  try {
    const response = await axiosInstance.put(
      `${BASE}/${encodeURIComponent(liveClassId)}`,
      payload,
    )
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateLiveClassPublishStatus(liveClassId, publishStatus) {
  try {
    const response = await axiosInstance.patch(
      `${BASE}/${encodeURIComponent(liveClassId)}/publish-status`,
      { publishStatus },
    )
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function duplicateLiveClass(liveClassId) {
  try {
    const response = await axiosInstance.post(
      `${BASE}/${encodeURIComponent(liveClassId)}/duplicate`,
    )
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteLiveClass(liveClassId) {
  try {
    const response = await axiosInstance.delete(
      `${BASE}/${encodeURIComponent(liveClassId)}`,
    )
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export { getBatchesDropdown } from './batchesAPI'

export async function getCentersDropdown({ signal } = {}) {
  try {
    const response = await axiosInstance.get('/centers/dropdown', { signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    throwApiError(error)
  }
}

export async function getClassroomsDropdown(centerId, { signal } = {}) {
  try {
    const response = await axiosInstance.get('/classrooms/dropdown', {
      params: { centerId },
      signal,
    })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    throwApiError(error)
  }
}
