import api from '../config/api'
import { throwApiError } from '../utils/apiError'

export async function getCenters() {
  try {
    const response = await api.get('/api/admin/centers/dropdown')
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getProgramsByCenter(centerId) {
  try {
    const response = await api.get(`/api/programs/by-center/${centerId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getCategories(centerId, programId) {
  try {
    const response = await api.get('/api/categories/filter', {
      params: {
        centerId: String(centerId),
        programId: String(programId),
      },
    })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getSubCategories(centerId, programId, categoryId) {
  try {
    const response = await api.get('/api/sub-categories/filter', {
      params: {
        centerId: String(centerId),
        programId: String(programId),
        categoryId: String(categoryId),
      },
    })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}
