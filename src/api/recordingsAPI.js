import axiosInstance from './axiosInstance'
import { throwApiError } from '../utils/apiError'
import { withRateLimitRetry } from '../utils/rateLimitRetry'

const BASE = '/recordings'

export async function getRecordingsCreateForm(facultySubjectId, { signal } = {}) {
  try {
    const response = await axiosInstance.get(`${BASE}/create-form`, {
      params: { facultySubjectId: String(facultySubjectId || '').trim() },
      signal,
    })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    throwApiError(error)
  }
}

export async function getTeachersDropdown({ page = 1, limit = 50, signal } = {}) {
  try {
    const response = await axiosInstance.get('/teachers', {
      params: { page, limit },
      signal,
    })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    throwApiError(error)
  }
}

export async function getAllTeachersDropdown({ signal } = {}) {
  const allRows = []
  let page = 1
  let totalPages = 1

  do {
    const data = await getTeachersDropdown({ page, limit: 50, signal })
    const rows = Array.isArray(data?.data) ? data.data : []
    allRows.push(...rows)
    totalPages = Number(data?.totalPages) || 1
    page += 1
  } while (page <= totalPages)

  return { success: true, data: allRows, count: allRows.length }
}

export async function getRecordingTopicsDropdown({ batchId, facultySubjectId, signal } = {}) {
  try {
    const response = await axiosInstance.get(`${BASE}/topics-dropdown`, {
      params: {
        batchId: String(batchId || '').trim(),
        facultySubjectId: String(facultySubjectId || '').trim(),
      },
      signal,
    })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    throwApiError(error)
  }
}

export async function getRecordingsDashboardSummary({ facultySubjectId, folderId, signal } = {}) {
  try {
    const response = await axiosInstance.get(`${BASE}/dashboard-summary`, {
      params: {
        facultySubjectId: String(facultySubjectId || '').trim(),
        folderId: String(folderId || '').trim(),
      },
      signal,
    })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    throwApiError(error)
  }
}

export async function getRecordings(
  { facultySubjectId, folderId, search = '', page = 1, limit = 20 } = {},
  { signal } = {},
) {
  try {
    const params = {
      facultySubjectId: String(facultySubjectId || '').trim(),
      folderId: String(folderId || '').trim(),
      page,
      limit,
    }
    const trimmedSearch = String(search || '').trim()
    if (trimmedSearch) params.search = trimmedSearch

    const response = await axiosInstance.get(BASE, { params, signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    throwApiError(error)
  }
}

export async function getRecordingById(recordingId, { signal } = {}) {
  try {
    const response = await axiosInstance.get(
      `${BASE}/${encodeURIComponent(recordingId)}`,
      { signal },
    )
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    throwApiError(error)
  }
}

export async function createRecording(formData) {
  try {
    const response = await withRateLimitRetry(() => axiosInstance.post(BASE, formData))
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function updateRecording(recordingId, payload, { multipart = false } = {}) {
  try {
    const response = await axiosInstance.put(
      `${BASE}/${encodeURIComponent(recordingId)}`,
      payload,
    )
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function updateRecordingVisibility(recordingId, visibility) {
  try {
    const response = await axiosInstance.patch(
      `${BASE}/${encodeURIComponent(recordingId)}/visibility`,
      { visibility: String(visibility || '').trim() },
    )
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function playRecording(recordingId) {
  try {
    const response = await axiosInstance.post(
      `${BASE}/${encodeURIComponent(recordingId)}/play`,
    )
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteRecording(recordingId) {
  try {
    const response = await axiosInstance.delete(
      `${BASE}/${encodeURIComponent(recordingId)}`,
    )
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export { getCentersDropdown } from './liveClassesHttpAPI'
export { postBatchesDropdown } from './batchesAPI'
export { postFacultySubjectCategoryContent } from './facultySubjectFoldersAPI'
