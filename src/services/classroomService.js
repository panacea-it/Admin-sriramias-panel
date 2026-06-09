import api from '../config/api'
import { throwApiError } from '../utils/apiError'
import { createCachedRequest } from '../utils/apiRequestCache'

const classroomsListCache = createCachedRequest({ ttlMs: 30_000 })
const citiesByCenterCache = createCachedRequest({ ttlMs: 60_000 })

export function clearClassroomsListCache() {
  classroomsListCache.clear()
}

export function clearCitiesByCenterCache() {
  citiesByCenterCache.clear()
}

function invalidateClassroomsListCache() {
  clearClassroomsListCache()
  clearCitiesByCenterCache()
}

function isValidCenterId(centerId) {
  const key = String(centerId ?? '').trim()
  return Boolean(key && key !== 'all' && key !== 'undefined' && key !== 'null')
}

export async function getCentersDropdown() {
  try {
    const response = await api.get('/api/centers/dropdown')
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getCitiesByCenter(centerId) {
  if (!isValidCenterId(centerId)) {
    return []
  }

  const key = String(centerId).trim()

  try {
    return await citiesByCenterCache.fetch(key, async () => {
      const response = await api.get(`/api/cities/by-center/${key}`)
      return response.data
    })
  } catch (error) {
    throwApiError(error)
  }
}

export async function getClassrooms(params = {}, { bypassCache = false } = {}) {
  try {
    return await classroomsListCache.fetch(
      params,
      async () => {
        const response = await api.get('/api/classrooms', { params })
        return response.data
      },
      { bypass: bypassCache },
    )
  } catch (error) {
    throwApiError(error)
  }
}

export async function getClassroomById(classroomId) {
  try {
    const response = await api.get(`/api/classrooms/${classroomId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function createClassroom(payload) {
  try {
    const response = await api.post('/api/classrooms', payload)
    invalidateClassroomsListCache()
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateClassroom(classroomId, payload) {
  try {
    const response = await api.put(`/api/classrooms/${classroomId}`, payload)
    invalidateClassroomsListCache()
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateClassroomStatus(classroomId, status) {
  try {
    const response = await api.patch(`/api/classrooms/status/${classroomId}`, { status })
    invalidateClassroomsListCache()
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteClassroom(classroomId) {
  try {
    const response = await api.delete(`/api/classrooms/${classroomId}`)
    invalidateClassroomsListCache()
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}
