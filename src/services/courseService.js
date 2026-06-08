import api from '../config/api'
import { throwApiError } from '../utils/apiError'

export async function getCourses(params = {}) {
  try {
    const response = await api.get('/api/courses', { params })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function createCourse(formData) {
  try {
    const response = await api.post('/api/courses', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}
