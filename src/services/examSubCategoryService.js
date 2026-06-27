import axiosInstance from './axiosInstance'
import { throwApiError } from '../utils/apiError'
import { isMongoObjectId } from '../utils/examCategoryApiHelpers'
import { createCachedRequest } from '../utils/apiRequestCache'

function assertMongoRecordId(subCategoryId, label = 'Sub-category id') {
  const key = String(subCategoryId ?? '').trim()
  if (!isMongoObjectId(key)) {
    throwApiError(new Error(`${label} must be a valid record id`))
  }
  return key
}

export { getCentersDropdown, getProgramsByCenter } from './examCategoryService'

const subCategoryDetailCache = new Map()
const subCategoryDetailInFlight = new Map()
const subCategoriesListCache = createCachedRequest({ ttlMs: 30_000 })

export function clearSubCategoryDetailCache(subCategoryId) {
  if (subCategoryId == null || subCategoryId === '') {
    subCategoryDetailCache.clear()
    return
  }
  subCategoryDetailCache.delete(String(subCategoryId))
}

export function clearExamSubCategoriesListCache() {
  subCategoriesListCache.clear()
}

function invalidateListCacheAfterMutation() {
  clearExamSubCategoriesListCache()
  clearSubCategoryDetailCache()
}

function stripEmptyParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value != null && value !== ''),
  )
}

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

export async function getSubCategories(params = {}, { bypassCache = false } = {}) {
  try {
    const query = stripEmptyParams(params)
    return await subCategoriesListCache.fetch(
      query,
      async () => {
        const response = await axiosInstance.get('/api/sub-categories', { params: query })
        return response.data
      },
      { bypass: bypassCache },
    )
  } catch (error) {
    throwApiError(error)
  }
}

/** @alias getSubCategories */
export const getExamSubCategories = getSubCategories

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

/** @alias filterSubCategories */
export const getExamSubCategoriesFilter = filterSubCategories

export async function getSubCategoryById(subCategoryId) {
  const key = assertMongoRecordId(subCategoryId)

  if (subCategoryDetailCache.has(key)) {
    return subCategoryDetailCache.get(key)
  }

  const pending = subCategoryDetailInFlight.get(key)
  if (pending) {
    return pending
  }

  const request = axiosInstance
    .get(`/api/sub-categories/${key}`)
    .then((response) => {
      subCategoryDetailCache.set(key, response.data)
      subCategoryDetailInFlight.delete(key)
      return response.data
    })
    .catch((error) => {
      subCategoryDetailInFlight.delete(key)
      throwApiError(error)
    })

  subCategoryDetailInFlight.set(key, request)
  return request
}

/** @alias getSubCategoryById */
export const getExamSubCategoryById = getSubCategoryById

export async function createSubCategory(payload) {
  try {
    const response = await axiosInstance.post('/api/sub-categories', payload)
    invalidateListCacheAfterMutation()
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** @alias createSubCategory */
export const createExamSubCategory = createSubCategory

export async function updateSubCategory(subCategoryId, payload) {
  try {
    const key = assertMongoRecordId(subCategoryId)
    const response = await axiosInstance.put(`/api/sub-categories/${key}`, payload)
    invalidateListCacheAfterMutation()
    clearSubCategoryDetailCache(key)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** @alias updateSubCategory */
export const updateExamSubCategory = updateSubCategory

export async function updateSubCategoryStatus(subCategoryId, status) {
  try {
    const key = assertMongoRecordId(subCategoryId)
    const response = await axiosInstance.patch(`/api/sub-categories/status/${key}`, {
      status,
    })
    clearExamSubCategoriesListCache()
    clearSubCategoryDetailCache(key)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** @alias updateSubCategoryStatus */
export const toggleExamSubCategoryStatus = updateSubCategoryStatus

export async function deleteSubCategory(subCategoryId) {
  try {
    const key = assertMongoRecordId(subCategoryId)
    const response = await axiosInstance.delete(`/api/sub-categories/${key}`)
    invalidateListCacheAfterMutation()
    clearSubCategoryDetailCache(key)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** @alias deleteSubCategory */
export const deleteExamSubCategory = deleteSubCategory
