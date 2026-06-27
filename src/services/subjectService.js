import axiosInstance from './axiosInstance'
import { throwApiError } from '../utils/apiError'

const SUBJECTS_BASE = '/api/subjects'

function stripEmptyParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value != null && value !== ''),
  )
}

export async function getSubjects(params = {}) {
  try {
    const response = await axiosInstance.get(SUBJECTS_BASE, {
      params: stripEmptyParams(params),
    })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getSubjectById(subjectId) {
  try {
    const response = await axiosInstance.get(`${SUBJECTS_BASE}/${subjectId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function createSubject(payload) {
  try {
    const response = await axiosInstance.post(SUBJECTS_BASE, payload)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateSubject(subjectId, payload) {
  try {
    const response = await axiosInstance.put(`${SUBJECTS_BASE}/${subjectId}`, payload)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateSubjectStatus(subjectId, status) {
  try {
    const response = await axiosInstance.patch(`${SUBJECTS_BASE}/status/${subjectId}`, {
      status,
    })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteSubject(subjectId) {
  try {
    const response = await axiosInstance.delete(`${SUBJECTS_BASE}/${subjectId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getSubjectsDropdown() {
  try {
    const response = await axiosInstance.get(`${SUBJECTS_BASE}/dropdown`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export const subjectService = {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  updateSubjectStatus,
  deleteSubject,
  getSubjectsDropdown,
}

export default subjectService
