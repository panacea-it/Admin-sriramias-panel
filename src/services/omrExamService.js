import api from '../config/api'
import { throwApiError } from '../utils/apiError'
import { withRateLimitRetry } from '../utils/rateLimitRetry'

const BASE_PATH = '/api/omr-exams'

function triggerBrowserDownload(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName || 'result-sheet'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

function parseContentDispositionFileName(header) {
  if (!header) return null
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(header)
  if (!match?.[1]) return null
  try {
    return decodeURIComponent(match[1].replace(/"/g, ''))
  } catch {
    return match[1].replace(/"/g, '')
  }
}

/** POST /api/omr-exams */
export async function createOmrExam(payload) {
  try {
    const response = await api.post(BASE_PATH, payload)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

/** POST /api/omr-exams/list */
export async function listOmrExams(params = {}) {
  try {
    const response = await withRateLimitRetry(() => api.post(`${BASE_PATH}/list`, params))
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** POST /api/omr-exams/search */
export async function searchOmrExams(params) {
  try {
    const response = await withRateLimitRetry(() => api.post(`${BASE_PATH}/search`, params))
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** POST /api/omr-exams/:id */
export async function getOmrExamById(id) {
  try {
    const response = await withRateLimitRetry(() => api.post(`${BASE_PATH}/${id}`, {}))
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** PUT /api/omr-exams/:id */
export async function updateOmrExam(id, payload) {
  try {
    const response = await api.put(`${BASE_PATH}/${id}`, payload)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

/** DELETE /api/omr-exams/:id */
export async function deleteOmrExam(id) {
  try {
    const response = await api.delete(`${BASE_PATH}/${id}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** POST /api/omr-exams/:id/result-sheet */
export async function uploadResultSheet(id, file) {
  try {
    const form = new FormData()
    form.append('file', file)
    const response = await api.post(`${BASE_PATH}/${id}/result-sheet`, form)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

/** PUT /api/omr-exams/:id/result-sheet */
export async function replaceResultSheet(id, file) {
  try {
    const form = new FormData()
    form.append('file', file)
    const response = await api.put(`${BASE_PATH}/${id}/result-sheet`, form)
    return response.data
  } catch (error) {
    if (error?.response) throw error
    throwApiError(error)
  }
}

/** POST /api/omr-exams/:id/result-sheet/download — mode: url */
export async function downloadResultSheetUrl(id) {
  try {
    const response = await api.post(`${BASE_PATH}/${id}/result-sheet/download`, { mode: 'url' })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

/** POST /api/omr-exams/:id/result-sheet/download — mode: file */
export async function downloadResultSheetBlob(id) {
  try {
    const response = await api.post(
      `${BASE_PATH}/${id}/result-sheet/download`,
      { mode: 'file' },
      { responseType: 'blob' },
    )
    const fileName =
      parseContentDispositionFileName(response.headers?.['content-disposition']) ||
      'result-sheet'
    return { blob: response.data, fileName }
  } catch (error) {
    throwApiError(error)
  }
}

/** POST /api/omr-exams/:id/result-sheet/download — triggers browser download */
export async function downloadOmrResultSheet(id, { fileName: preferredName } = {}) {
  const { blob, fileName } = await downloadResultSheetBlob(id)
  triggerBrowserDownload(blob, preferredName || fileName)
  return { success: true }
}

/** DELETE /api/omr-exams/:id/result-sheet */
export async function deleteResultSheet(id) {
  try {
    const response = await api.delete(`${BASE_PATH}/${id}/result-sheet`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}
