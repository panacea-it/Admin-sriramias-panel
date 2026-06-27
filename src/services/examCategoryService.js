import axiosInstance from './axiosInstance'
import { getCentersDropdown } from './centerService'
import { throwApiError } from '../utils/apiError'
import { createCachedRequest } from '../utils/apiRequestCache'

export { getCentersDropdown }

const categoryDetailCache = new Map()
const categoryDetailInFlight = new Map()
const categoriesListCache = createCachedRequest({ ttlMs: 30_000 })
const programsByCenterCache = createCachedRequest({ ttlMs: 2 * 60_000 })

export function clearCategoryDetailCache(categoryId) {
  if (categoryId == null || categoryId === '') {
    categoryDetailCache.clear()
    return
  }
  categoryDetailCache.delete(String(categoryId))
}

export function clearExamCategoriesListCache() {
  categoriesListCache.clear()
}

function invalidateListCacheAfterMutation() {
  clearExamCategoriesListCache()
  clearCategoryDetailCache()
}

export async function getProgramsByCenter(centerId) {
  const key = String(centerId || '')
  if (!key) return []

  try {
    return await programsByCenterCache.fetch(key, async () => {
      const response = await axiosInstance.get(`/api/programs/by-center/${key}`)
      return response.data
    })
  } catch (error) {
    throwApiError(error)
  }
}

function stripEmptyParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value != null && value !== ''),
  )
}

export async function getExamCategories(params = {}, { bypassCache = false } = {}) {
  try {
    const query = stripEmptyParams(params)
    return await categoriesListCache.fetch(
      query,
      async () => {
        const response = await axiosInstance.get('/api/categories', { params: query })
        return response.data
      },
      { bypass: bypassCache },
    )
  } catch (error) {
    throwApiError(error)
  }
}

export async function getExamCategoryDropdown({ centerId, programId }) {
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

export async function getExamCategoryById(categoryId) {
  const key = String(categoryId || '')
  if (!key) {
    throwApiError(new Error('Category id is required'))
  }

  if (categoryDetailCache.has(key)) {
    return categoryDetailCache.get(key)
  }

  const pending = categoryDetailInFlight.get(key)
  if (pending) {
    return pending
  }

  const request = axiosInstance
    .get(`/api/categories/${key}`)
    .then((response) => {
      categoryDetailCache.set(key, response.data)
      categoryDetailInFlight.delete(key)
      return response.data
    })
    .catch((error) => {
      categoryDetailInFlight.delete(key)
      throwApiError(error)
    })

  categoryDetailInFlight.set(key, request)
  return request
}

export async function createExamCategory(payload) {
  try {
    const response = await axiosInstance.post('/api/categories', payload)
    invalidateListCacheAfterMutation()
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateExamCategory(categoryId, payload) {
  try {
    const response = await axiosInstance.put(`/api/categories/${categoryId}`, payload)
    invalidateListCacheAfterMutation()
    clearCategoryDetailCache(categoryId)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateExamCategoryStatus(categoryId, status) {
  try {
    const response = await axiosInstance.patch(`/api/categories/status/${categoryId}`, {
      status,
    })
    clearExamCategoriesListCache()
    clearCategoryDetailCache(categoryId)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteExamCategory(categoryId) {
  try {
    const response = await axiosInstance.delete(`/api/categories/${categoryId}`)
    invalidateListCacheAfterMutation()
    clearCategoryDetailCache(categoryId)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}
