import axiosInstance from './axiosInstance'
import { throwApiError } from '../utils/apiError'
import {
  DEFAULT_FACULTY_SUBJECT_CATEGORIES,
  normalizeFacultySubjectCategoriesResponse,
} from '../utils/facultySubjectHelpers'

const BASE = '/faculty-subjects'

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

export async function getFacultySubjectById(facultySubjectId, { signal } = {}) {
  try {
    const response = await axiosInstance.get(
      `${BASE}/${encodeURIComponent(facultySubjectId)}`,
      { signal },
    )
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
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
