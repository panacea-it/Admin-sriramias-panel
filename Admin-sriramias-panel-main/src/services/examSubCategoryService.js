import axiosInstance from './axiosInstance'
import { throwApiError } from '../utils/apiError'

export { getCentersDropdown, getProgramsByCenter } from './examCategoryService'

export async function getCategoriesByCenterAndProgram(centerId, programId) {
  try {
    const response = await axiosInstance.get('/api/categories/filter', {
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

export async function getSubCategories(params = {}) {
  try {
    const response = await axiosInstance.get('/api/sub-categories', { params })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function filterSubCategories({ centerId, programId, categoryId } = {}) {
  try {
    const response = await axiosInstance.get('/api/sub-categories/filter', {
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

export async function getSubCategoryById(subCategoryId) {
  try {
    const response = await axiosInstance.get(`/api/sub-categories/${subCategoryId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function createSubCategory(payload) {
  try {
    const response = await axiosInstance.post('/api/sub-categories', payload)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateSubCategory(subCategoryId, payload) {
  try {
    const response = await axiosInstance.put(`/api/sub-categories/${subCategoryId}`, payload)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateSubCategoryStatus(subCategoryId, status) {
  try {
    const response = await axiosInstance.patch(`/api/sub-categories/status/${subCategoryId}`, {
      status,
    })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteSubCategory(subCategoryId) {
  try {
    const response = await axiosInstance.delete(`/api/sub-categories/${subCategoryId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}
