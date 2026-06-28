import axiosInstance from '../api/axiosInstance'
import { throwApiError } from '../utils/apiError'

const BASE = '/mains-answer-writing'

export async function getMainsAnswerWritingCreateForm(params = {}, { signal } = {}) {
  try {
    const response = await axiosInstance.get(`${BASE}/create-form`, { params, signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function getMainsAnswerWritingDashboardSummary(params = {}, { signal } = {}) {
  try {
    const response = await axiosInstance.get(`${BASE}/dashboard-summary`, { params, signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function getMainsAnswerWritings(params = {}, { signal } = {}) {
  try {
    const response = await axiosInstance.get(BASE, { params, signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function getMainsAnswerWritingById(id, { signal } = {}) {
  try {
    const response = await axiosInstance.get(`${BASE}/${encodeURIComponent(id)}`, { signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function getMainsSubjectsDropdown({ signal } = {}) {
  try {
    const response = await axiosInstance.get(`${BASE}/filter/subjects-dropdown`, { signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function getMainsTopicsDropdown(facultySubjectId, { signal } = {}) {
  try {
    const response = await axiosInstance.get(`${BASE}/filter/topics-dropdown`, {
      params: { facultySubjectId },
      signal,
    })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function createMainsAnswerWriting(formData) {
  try {
    const response = await axiosInstance.post(BASE, formData)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function updateMainsAnswerWriting(id, formDataOrBody) {
  try {
    const response = await axiosInstance.put(`${BASE}/${encodeURIComponent(id)}`, formDataOrBody)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function updateMainsAnswerWritingPublishStatus(id, publishStatus) {
  try {
    const response = await axiosInstance.patch(
      `${BASE}/${encodeURIComponent(id)}/publish-status`,
      { publishStatus },
    )
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function deleteMainsAnswerWriting(id) {
  try {
    const response = await axiosInstance.delete(`${BASE}/${encodeURIComponent(id)}`)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}
