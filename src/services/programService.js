import axiosInstance from './axiosInstance'
import { throwApiError } from '../utils/apiError'
import { createCachedRequest } from '../utils/apiRequestCache'
import { getCentersDropdown, normalizeCentersDropdown } from './centerService'

const programsListCache = createCachedRequest({ ttlMs: 30_000 })

export function clearProgramsListCache() {
  programsListCache.clear()
}

function invalidateProgramsListCache() {
  clearProgramsListCache()
}

export async function getCentersDropdownForPrograms() {
  const data = await getCentersDropdown()
  return normalizeCentersDropdown(data)
}

export async function getLegacyCategories() {
  try {
    const response = await axiosInstance.get('/api/legacy-categories')
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getPrograms(params = {}, { bypassCache = false } = {}) {
  try {
    return await programsListCache.fetch(
      params,
      async () => {
        const response = await axiosInstance.get('/api/programs', { params })
        return response.data
      },
      { bypass: bypassCache },
    )
  } catch (error) {
    throwApiError(error)
  }
}

export async function getProgramById(programId) {
  try {
    const response = await axiosInstance.get(`/api/programs/${programId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function createProgram(payload) {
  try {
    const response = await axiosInstance.post('/api/programs', payload)
    invalidateProgramsListCache()
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateProgram(programId, payload) {
  try {
    const response = await axiosInstance.put(`/api/programs/${programId}`, payload)
    invalidateProgramsListCache()
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateProgramStatus(programId, status) {
  try {
    const response = await axiosInstance.patch(`/api/programs/status/${programId}`, {
      status,
    })
    invalidateProgramsListCache()
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteProgram(programId) {
  try {
    const response = await axiosInstance.delete(`/api/programs/${programId}`)
    invalidateProgramsListCache()
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getProgramDropdown(centerId) {
  const key = String(centerId || '')
  if (!key) return { success: true, count: 0, data: [] }

  try {
    const response = await axiosInstance.get(`/api/programs/by-center/${key}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}
