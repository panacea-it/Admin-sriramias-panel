import axiosInstance from './axiosInstance'
import { throwApiError } from '../utils/apiError'

const CREATE_UPDATE_BASE = '/faculty-subjects/content/folders'
const LIST_DELETE_BASE = '/folders'

export async function createContentFolder(payload) {
  try {
    const response = await axiosInstance.post(CREATE_UPDATE_BASE, payload)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function getContentFolders(facultySubjectId, category, { signal } = {}) {
  try {
    const response = await axiosInstance.get(LIST_DELETE_BASE, {
      params: { facultySubjectId, category },
      signal,
    })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function updateContentFolder(folderId, payload) {
  try {
    const response = await axiosInstance.put(
      `${CREATE_UPDATE_BASE}/${encodeURIComponent(folderId)}`,
      payload,
    )
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function deleteContentFolder(folderId) {
  try {
    const response = await axiosInstance.delete(
      `${LIST_DELETE_BASE}/${encodeURIComponent(folderId)}`,
    )
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}
