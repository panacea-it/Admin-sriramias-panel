import axiosInstance from './axiosInstance'
import { throwApiError } from '../utils/apiError'
import { getCentersDropdown, normalizeCentersDropdown } from './centerService'

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

export async function getPrograms(params = {}) {
  try {
    const response = await axiosInstance.get('/api/programs', { params })
    return response.data
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
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateProgram(programId, payload) {
  try {
    const response = await axiosInstance.put(`/api/programs/${programId}`, payload)
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
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteProgram(programId) {
  try {
    const response = await axiosInstance.delete(`/api/programs/${programId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}
