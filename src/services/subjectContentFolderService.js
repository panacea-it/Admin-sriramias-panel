import axiosInstance from '../api/axiosInstance'
import { isRateLimitError, throwApiError } from '../utils/apiError'
import { createCachedRequest } from '../utils/apiRequestCache'

const BASE = '/folders'
const foldersListCache = createCachedRequest({ ttlMs: 60_000 })

export function clearSubjectContentFoldersListCache() {
  foldersListCache.clear()
}

export async function listSubjectContentFolders(params = {}, { signal, bypassCache = false } = {}) {
  const cacheKey = JSON.stringify(params)

  try {
    return await foldersListCache.fetch(
      cacheKey,
      async () => {
        const response = await axiosInstance.get(BASE, { params, signal })
        return response.data
      },
      { bypass: bypassCache },
    )
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (isRateLimitError(error)) {
      const stale = foldersListCache.getCached(cacheKey)
      if (stale !== undefined) return stale
    }
    if (error?.response) throw error
    throwApiError(error)
  }
}

/** POST /api/folders/list — filters in body; page/limit in query string */
export async function listSubjectContentFoldersPost(
  body = {},
  pagination = {},
  { signal } = {},
) {
  try {
    const response = await axiosInstance.post(`${BASE}/list`, body, {
      params: pagination,
      signal,
    })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function getSubjectContentFolder(id, { signal } = {}) {
  try {
    const response = await axiosInstance.get(`${BASE}/${encodeURIComponent(id)}`, { signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function updateSubjectContentFolder(id, payload) {
  try {
    const response = await axiosInstance.put(`${BASE}/${encodeURIComponent(id)}`, payload)
    clearSubjectContentFoldersListCache()
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function deleteSubjectContentFolder(id) {
  try {
    const response = await axiosInstance.delete(`${BASE}/${encodeURIComponent(id)}`)
    clearSubjectContentFoldersListCache()
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

/** GET /api/folders/content */
export async function listFolderContent(params = {}, { signal } = {}) {
  try {
    const response = await axiosInstance.get(`${BASE}/content`, { params, signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

/** POST /api/folders/content */
export async function listFolderContentPost(body = {}, { signal } = {}) {
  try {
    const response = await axiosInstance.post(`${BASE}/content`, body, { signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

/** GET /api/folders/:id/content-summary */
export async function getFolderContentSummary(id, { signal } = {}) {
  try {
    const response = await axiosInstance.get(
      `${BASE}/${encodeURIComponent(id)}/content-summary`,
      { signal },
    )
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}
