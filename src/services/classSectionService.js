import axiosInstance from './axiosInstance'
import { throwApiError } from '../utils/apiError'

const CLASS_SECTIONS_BASE = '/api/academics/classes'

function stripEmptyParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value != null && value !== ''),
  )
}

/** POST /api/academics/classes/list */
export async function getClassSections(params = {}) {
  try {
    const response = await axiosInstance.post(`${CLASS_SECTIONS_BASE}/list`, stripEmptyParams(params))
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** POST /api/academics/classes/details */
export async function getClassSectionById(id) {
  try {
    const response = await axiosInstance.post(`${CLASS_SECTIONS_BASE}/details`, { id })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** POST /api/academics/classes */
export async function createClassSection(payload) {
  try {
    const response = await axiosInstance.post(CLASS_SECTIONS_BASE, payload)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** PUT /api/academics/classes/:id */
export async function updateClassSection(id, payload) {
  try {
    const response = await axiosInstance.put(`${CLASS_SECTIONS_BASE}/${id}`, payload)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** PATCH /api/academics/classes/:id/status */
export async function updateClassSectionStatus(id, status) {
  try {
    const response = await axiosInstance.patch(`${CLASS_SECTIONS_BASE}/${id}/status`, { status })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** DELETE /api/academics/classes/delete */
export async function deleteClassSection(id) {
  try {
    const response = await axiosInstance.delete(`${CLASS_SECTIONS_BASE}/delete`, { data: { id } })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** POST /api/academics/classes/dropdown */
export async function getClassSectionsDropdown(subjectId) {
  const id = String(subjectId || '').trim()
  if (!/^[a-f0-9]{24}$/i.test(id)) {
    throw new Error('A valid subject id is required to load classes.')
  }

  try {
    const response = await axiosInstance.post(`${CLASS_SECTIONS_BASE}/dropdown`, { subjectId: id })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export const classSectionService = {
  getClassSections,
  getClassSectionById,
  createClassSection,
  updateClassSection,
  updateClassSectionStatus,
  deleteClassSection,
  getClassSectionsDropdown,
}

export default classSectionService
