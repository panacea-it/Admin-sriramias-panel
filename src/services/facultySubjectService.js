import axiosInstance from '../api/axiosInstance'
import { isRateLimitError, throwApiError } from '../utils/apiError'
import { createCachedRequest } from '../utils/apiRequestCache'
import {
  DEFAULT_FACULTY_SUBJECT_CATEGORIES,
  normalizeFacultySubjectCategoriesResponse,
} from '../utils/facultySubjectHelpers'

const BASE = '/faculty-subjects'
const facultySubjectDetailCache = createCachedRequest({ ttlMs: 120_000 })

export function clearFacultySubjectDetailCache(facultySubjectId) {
  if (facultySubjectId == null || facultySubjectId === '') {
    facultySubjectDetailCache.clear()
    return
  }
  facultySubjectDetailCache.clear(String(facultySubjectId))
}

export async function getFacultySubjects(params = {}, { signal } = {}) {
  try {
    const response = await axiosInstance.get(BASE, { params, signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function getFacultySubject(id, { signal, bypassCache = false } = {}) {
  const resolved = String(id || '').trim()
  if (!resolved) {
    throw Object.assign(new Error('Faculty subject id is required'), { status: 400 })
  }

  try {
    return await facultySubjectDetailCache.fetch(
      resolved,
      async () => {
        const response = await axiosInstance.get(`${BASE}/${encodeURIComponent(resolved)}`, {
          signal,
        })
        return response.data
      },
      { bypass: bypassCache },
    )
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (isRateLimitError(error)) {
      const stale = facultySubjectDetailCache.getCached(resolved)
      if (stale !== undefined) return stale
    }
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function createFacultySubject(payload) {
  try {
    const response = await axiosInstance.post(BASE, payload)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function updateFacultySubject(id, payload) {
  try {
    const response = await axiosInstance.put(`${BASE}/${encodeURIComponent(id)}`, payload)
    clearFacultySubjectDetailCache(id)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function changeFacultySubjectStatus(id, status) {
  try {
    const response = await axiosInstance.patch(`${BASE}/status/${encodeURIComponent(id)}`, {
      status,
    })
    clearFacultySubjectDetailCache(id)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function deleteFacultySubject(id) {
  try {
    const response = await axiosInstance.delete(`${BASE}/${encodeURIComponent(id)}`)
    clearFacultySubjectDetailCache(id)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function getFacultySubjectCreateForm(subjectIdOrParams, options = {}) {
  const params =
    subjectIdOrParams != null && typeof subjectIdOrParams === 'object'
      ? subjectIdOrParams
      : subjectIdOrParams
        ? { subjectId: subjectIdOrParams }
        : undefined
  const { signal } = options
  try {
    const response = await axiosInstance.get(`${BASE}/create-form`, { params, signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    throwApiError(error)
  }
}

export async function getFacultySubjectCategories({ signal } = {}) {
  try {
    const response = await axiosInstance.get(`${BASE}/categories`, { signal })
    return normalizeFacultySubjectCategoriesResponse(response.data)
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (import.meta.env.DEV) {
      console.warn('[faculty-subjects] categories API failed; using defaults', error)
    }
    return DEFAULT_FACULTY_SUBJECT_CATEGORIES
  }
}

export async function getFacultySubjectsDropdown(params = {}, { signal } = {}) {
  try {
    const response = await axiosInstance.get(`${BASE}/dropdown`, { params, signal })
    const body = response.data
    return Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : []
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    throwApiError(error)
  }
}

export async function getFacultySubjectSummary(id, { signal } = {}) {
  try {
    const response = await axiosInstance.get(`${BASE}/summary/${encodeURIComponent(id)}`, {
      signal,
    })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

/** GET /api/faculty-subjects/:id/content-tree */
export async function getFacultySubjectContentTree(id, { signal } = {}) {
  const resolved = String(id || '').trim()
  if (!resolved) {
    throw Object.assign(new Error('Faculty subject id is required'), { status: 400 })
  }
  try {
    const response = await axiosInstance.get(
      `${BASE}/${encodeURIComponent(resolved)}/content-tree`,
      { signal },
    )
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

/** POST /api/faculty-subjects/content/categories — sidebar + table combined */
export async function listFacultySubjectContentCategories(body, { signal } = {}) {
  try {
    const response = await axiosInstance.post(`${BASE}/content/categories`, body, { signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

/** POST /api/faculty-subjects/content/folders — create folder (only create path) */
export async function createFacultySubjectContentFolder(payload) {
  try {
    const response = await axiosInstance.post(`${BASE}/content/folders`, payload)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

/** PUT /api/faculty-subjects/content/folders/:id */
export async function updateFacultySubjectContentFolder(id, payload) {
  try {
    const response = await axiosInstance.put(
      `${BASE}/content/folders/${encodeURIComponent(id)}`,
      payload,
    )
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}
