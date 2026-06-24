import axiosInstance from './axiosInstance'
import { isRateLimitError, throwApiError } from '../utils/apiError'
import { createCachedRequest } from '../utils/apiRequestCache'
import { normalizeFoldersListResponse } from '../utils/facultySubjectFolderHelpers'

const CREATE_UPDATE_BASE = '/faculty-subjects/content/folders'
const LEGACY_LIST_BASE = '/folders'
const foldersListCache = createCachedRequest({ ttlMs: 60_000 })

export function clearContentFoldersListCache() {
  foldersListCache.clear()
}

async function requestFolderList(url, params, { signal } = {}) {
  const response = await axiosInstance.get(url, { params, signal })
  return response.data
}

function folderMatchesCategory(folder, category) {
  const expected = String(category || '').trim().toUpperCase()
  if (!expected) return true
  const actual = String(folder?.category || '').trim().toUpperCase()
  if (!actual) return true
  if (actual === expected) return true
  if (expected === 'RECORDING' && actual === 'RECORDED_CLASS') return true
  if (expected === 'RECORDED_CLASS' && actual === 'RECORDING') return true
  return false
}

async function fetchFoldersForSubject(params, { signal } = {}) {
  const category = String(params.category || '').trim()
  const subjectParams = {
    facultySubjectId: String(params.facultySubjectId || '').trim(),
  }

  const attempts = [
    () => requestFolderList(CREATE_UPDATE_BASE, params, { signal }),
    () => requestFolderList(LEGACY_LIST_BASE, params, { signal }),
  ]

  if (category) {
    attempts.push(() => requestFolderList(CREATE_UPDATE_BASE, subjectParams, { signal }))
    attempts.push(() => requestFolderList(LEGACY_LIST_BASE, subjectParams, { signal }))
  }

  let lastResponse = null
  for (const attempt of attempts) {
    try {
      const data = await attempt()
      lastResponse = data
      const rows = normalizeFoldersListResponse(data)
      if (!rows.length) continue
      if (!category || rows.every((row) => folderMatchesCategory(row, category))) {
        return data
      }
      if (category) {
        return {
          ...data,
          data: rows.filter((row) => folderMatchesCategory(row, category)),
        }
      }
      return data
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
      const status = error?.response?.status
      if (status && status !== 404 && status !== 405) throw error
    }
  }

  return lastResponse ?? { data: [] }
}

export async function getContentFolders(
  facultySubjectId,
  category,
  { signal, bypassCache = false } = {},
) {
  const cacheKey = `${facultySubjectId}:${category}`
  const params = {
    facultySubjectId: String(facultySubjectId || '').trim(),
    category: String(category || '').trim(),
  }

  try {
    return await foldersListCache.fetch(
      cacheKey,
      () => fetchFoldersForSubject(params, { signal }),
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

export async function createContentFolder(payload) {
  try {
    const response = await axiosInstance.post(CREATE_UPDATE_BASE, payload)
    clearContentFoldersListCache()
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function updateContentFolder(folderId, payload) {
  try {
    const response = await axiosInstance.put(
      `${CREATE_UPDATE_BASE}/${encodeURIComponent(folderId)}`,
      payload,
    )
    clearContentFoldersListCache()
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function deleteContentFolder(folderId) {
  try {
    const response = await axiosInstance.delete(
      `${LEGACY_LIST_BASE}/${encodeURIComponent(folderId)}`,
    )
    clearContentFoldersListCache()
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

/** POST /api/faculty-subjects/content/categories — list folder content by category */
export async function postFacultySubjectCategoryContent(
  { facultySubjectId, category, folderId },
  { signal } = {},
) {
  try {
    const response = await axiosInstance.post(
      '/faculty-subjects/content/categories',
      {
        facultySubjectId: String(facultySubjectId || '').trim(),
        category: String(category || '').trim(),
        folderId: String(folderId || '').trim(),
      },
      { signal },
    )
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}
