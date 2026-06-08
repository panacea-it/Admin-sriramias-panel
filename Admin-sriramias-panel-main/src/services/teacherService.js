import axiosInstance from './axiosInstance'
import { throwApiError } from '../utils/apiError'

export async function getTeachers(params = {}) {
  try {
    const response = await axiosInstance.get('/api/teachers', { params })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getTeacherById(teacherId) {
  try {
    const response = await axiosInstance.get(`/api/teachers/${teacherId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function createTeacher(payload) {
  try {
    const response = await axiosInstance.post('/api/teachers', payload)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateTeacher(teacherId, payload) {
  try {
    const response = await axiosInstance.put(`/api/teachers/${teacherId}`, payload)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateTeacherStatus(teacherId, status) {
  try {
    const response = await axiosInstance.patch(`/api/teachers/status/${teacherId}`, {
      status,
    })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteTeacher(teacherId) {
  try {
    const response = await axiosInstance.delete(`/api/teachers/${teacherId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}
