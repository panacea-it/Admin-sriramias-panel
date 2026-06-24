import axiosInstance from './axiosInstance'
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

export async function getFacultySubjectById(
  facultySubjectId,
  { signal, bypassCache = false } = {},
) {
  const id = String(facultySubjectId || '').trim()
  if (!id) {
    throw Object.assign(new Error('Faculty subject id is required'), { status: 400 })
  }

  try {
    return await facultySubjectDetailCache.fetch(
      id,
      async () => {
        const response = await axiosInstance.get(`${BASE}/${encodeURIComponent(id)}`, { signal })
        return response.data
      },
      { bypass: bypassCache },
    )
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (isRateLimitError(error)) {
      const stale = facultySubjectDetailCache.getCached(id)
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

export async function updateFacultySubject(facultySubjectId, payload) {
  try {
    const response = await axiosInstance.put(
      `${BASE}/${encodeURIComponent(facultySubjectId)}`,
      payload,
    )
    clearFacultySubjectDetailCache(facultySubjectId)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function updateFacultySubjectStatus(facultySubjectId, status) {
  try {
    const response = await axiosInstance.patch(
      `${BASE}/status/${encodeURIComponent(facultySubjectId)}`,
      { status },
    )
    clearFacultySubjectDetailCache(facultySubjectId)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function deleteFacultySubject(facultySubjectId) {
  try {
    const response = await axiosInstance.delete(
      `${BASE}/${encodeURIComponent(facultySubjectId)}`,
    )
    clearFacultySubjectDetailCache(facultySubjectId)
    return response.data
  } catch (error) {
    if (error?.response) throw error
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

export async function getFacultySubjectCreateForm(subjectId, { signal } = {}) {
  try {
    const response = await axiosInstance.get(`${BASE}/create-form`, {
      params: { subjectId },
      signal,
    })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    throwApiError(error)
  }
}

export async function getSubjectsDropdown({ signal } = {}) {
  try {
    const response = await axiosInstance.get('/subjects/dropdown', { signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    throwApiError(error)
  }
}

/** GET /api/faculty-subjects/dropdown — batch subject picker */
export async function getFacultySubjectsDropdown({ signal } = {}) {
  try {
    const response = await axiosInstance.get(`${BASE}/dropdown`, { signal })
    const body = response.data
    return Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : []
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    throwApiError(error)
  }
}
