import api from './api'
import { throwApiError } from '../utils/apiError'

const CLASSROOMS_BASE = '/api/classrooms'

function stripEmptyParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value != null && value !== ''),
  )
}

/** @param {import('../types/classroom.types').ClassroomListParams} [params] */
export async function getClassrooms(params = {}) {
  try {
    const { data } = await api.get(CLASSROOMS_BASE, { params: stripEmptyParams(params) })
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getClassroomById(classroomId) {
  try {
    const { data } = await api.get(`${CLASSROOMS_BASE}/${classroomId}`)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

/** @param {import('../types/classroom.types').ClassroomDropdownParams} [params] */
export async function getClassroomDropdown(params = {}) {
  try {
    const { data } = await api.get(`${CLASSROOMS_BASE}/dropdown`, {
      params: stripEmptyParams(params),
    })
    return data
  } catch (error) {
    throwApiError(error)
  }
}

/** @param {import('../types/classroom.types').CreateClassroomPayload} payload */
export async function createClassroom(payload) {
  try {
    const { data } = await api.post(CLASSROOMS_BASE, payload)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

/** @param {import('../types/classroom.types').UpdateClassroomPayload} payload */
export async function updateClassroom(classroomId, payload) {
  try {
    const { data } = await api.put(`${CLASSROOMS_BASE}/${classroomId}`, payload)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

/** @param {import('../types/classroom.types').ClassroomStatus} status */
export async function updateClassroomStatus(classroomId, status) {
  try {
    const { data } = await api.patch(`${CLASSROOMS_BASE}/status/${classroomId}`, { status })
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteClassroom(classroomId) {
  try {
    const { data } = await api.delete(`${CLASSROOMS_BASE}/${classroomId}`)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export const classroomService = {
  getClassrooms,
  getClassroomById,
  getClassroomDropdown,
  createClassroom,
  updateClassroom,
  updateClassroomStatus,
  deleteClassroom,
}

export default classroomService
