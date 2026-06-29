import api from '../config/api'
import { throwApiError } from '../utils/apiError'

function stripEmptyParams(params = {}) {
  const out = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    out[key] = value
  }
  return out
}

export async function getCourses(params = {}, { signal } = {}) {
  try {
    const response = await api.get('/api/courses', {
      params: stripEmptyParams(params),
      signal,
    })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getCourse(id) {
  try {
    const response = await api.get(`/api/courses/${id}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function findCourse(id) {
  try {
    const response = await api.post('/api/courses/find', { id })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getCourseBySlug(slug) {
  try {
    const response = await api.get(`/api/courses/slug/${slug}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getCoursesDropdown(params = {}, { signal } = {}) {
  try {
    const response = await api.get('/api/courses/dropdown', {
      params: stripEmptyParams(params),
      signal,
    })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getCoursesForEnquiry(params = {}) {
  try {
    const response = await api.get('/api/courses/enquiry', {
      params: stripEmptyParams(params),
    })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getCoursesGrouped() {
  try {
    const response = await api.get('/api/courses/grouped')
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function createCourse(formData) {
  try {
    const response = await api.post('/api/courses', formData)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateCourse(id, formData) {
  try {
    const response = await api.put(`/api/courses/${id}`, formData)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateCourseStatus(id, status) {
  try {
    const response = await api.patch(`/api/courses/status/${id}`, { status })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteCourse(id) {
  try {
    const response = await api.delete(`/api/courses/${id}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export const courseService = {
  getCourses,
  getCourse,
  findCourse,
  getCourseBySlug,
  getCoursesDropdown,
  getCoursesForEnquiry,
  getCoursesGrouped,
  createCourse,
  updateCourse,
  updateCourseStatus,
  deleteCourse,
}

export default courseService
