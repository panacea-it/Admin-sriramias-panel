import api from '../config/api'
import { throwApiError } from '../utils/apiError'

export async function getCentersDropdown() {
  try {
    const response = await api.get('/api/centers/dropdown')
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getCitiesByCenter(centerId) {
  try {
    const response = await api.get(`/api/cities/by-center/${centerId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getClassrooms(params = {}) {
  try {
    const response = await api.get('/api/classrooms', { params })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getClassroomById(classroomId) {
  try {
    const response = await api.get(`/api/classrooms/${classroomId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function createClassroom(payload) {
  try {
    const response = await api.post('/api/classrooms', payload)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateClassroom(classroomId, payload) {
  try {
    const response = await api.put(`/api/classrooms/${classroomId}`, payload)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateClassroomStatus(classroomId, status) {
  try {
    const response = await api.patch(`/api/classrooms/status/${classroomId}`, { status })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteClassroom(classroomId) {
  try {
    const response = await api.delete(`/api/classrooms/${classroomId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}
