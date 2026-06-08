import axiosInstance from './axiosInstance'
import { throwApiError } from '../utils/apiError'

export async function getSubjects(params = {}) {
  try {
    const response = await axiosInstance.get('/api/subjects', { params })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getSubjectById(subjectId) {
  try {
    const response = await axiosInstance.get(`/api/subjects/${subjectId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function createSubject(payload) {
  try {
    const response = await axiosInstance.post('/api/subjects', payload)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateSubject(subjectId, payload) {
  try {
    const response = await axiosInstance.put(`/api/subjects/${subjectId}`, payload)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateSubjectStatus(subjectId, status) {
  try {
    const response = await axiosInstance.patch(`/api/subjects/status/${subjectId}`, {
      status,
    })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteSubject(subjectId) {
  try {
    const response = await axiosInstance.delete(`/api/subjects/${subjectId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getSubjectsDropdown() {
  try {
    const response = await axiosInstance.get('/api/subjects/dropdown')
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}
