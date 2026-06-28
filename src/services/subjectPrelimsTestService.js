import axiosInstance from '../api/axiosInstance'
import { throwApiError } from '../utils/apiError'

const BASE = '/prelims-tests'

export async function getPrelimsTestCreateForm(body = {}, { signal } = {}) {
  try {
    const response = await axiosInstance.post(`${BASE}/create-form`, body, { signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function getPrelimsTestDashboardSummary(body = {}, { signal } = {}) {
  try {
    const response = await axiosInstance.post(`${BASE}/dashboard-summary`, body, { signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function getPrelimsTests(body = {}, { signal } = {}) {
  try {
    const response = await axiosInstance.post(`${BASE}/list`, body, { signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function getPrelimsTestById(id, { signal } = {}) {
  try {
    const response = await axiosInstance.post(`${BASE}/view`, { id }, { signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function createPrelimsTest(formData) {
  try {
    const response = await axiosInstance.post(BASE, formData)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function updatePrelimsTest(id, body) {
  try {
    const response = await axiosInstance.put(`${BASE}/${encodeURIComponent(id)}`, body)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function updatePrelimsTestPublishStatus(id, publishStatus) {
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

export async function deletePrelimsTest(id) {
  try {
    const response = await axiosInstance.delete(`${BASE}/${encodeURIComponent(id)}`)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function duplicatePrelimsTest(id, body = {}) {
  try {
    const response = await axiosInstance.post(
      `${BASE}/${encodeURIComponent(id)}/duplicate`,
      body,
    )
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function uploadPrelimsQuestions(formData) {
  try {
    const response = await axiosInstance.post(`${BASE}/questions/upload`, formData)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function reuploadPrelimsQuestions(formData) {
  try {
    const response = await axiosInstance.post(`${BASE}/questions/reupload`, formData)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function getPrelimsQuestions(body = {}, { signal } = {}) {
  try {
    const response = await axiosInstance.post(`${BASE}/questions/list`, body, { signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function getPrelimsQuestion(body = {}, { signal } = {}) {
  try {
    const response = await axiosInstance.post(`${BASE}/questions/view`, body, { signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function updatePrelimsQuestion(testId, questionId, body) {
  try {
    const response = await axiosInstance.put(
      `${BASE}/${encodeURIComponent(testId)}/questions/${encodeURIComponent(questionId)}`,
      body,
    )
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function deletePrelimsQuestion(testId, questionId) {
  try {
    const response = await axiosInstance.delete(
      `${BASE}/${encodeURIComponent(testId)}/questions/${encodeURIComponent(questionId)}`,
    )
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function getPrelimsQuestionSheet(body = {}, { signal } = {}) {
  try {
    const response = await axiosInstance.post(`${BASE}/questions/sheet/view`, body, { signal })
    return response.data
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
    if (error?.response) throw error
    throwApiError(error)
  }
}

export async function removePrelimsQuestionSheet(body) {
  try {
    const response = await axiosInstance.delete(`${BASE}/questions/sheet`, { data: body })
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}
