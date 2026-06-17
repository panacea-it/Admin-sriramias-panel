import axiosInstance from './axiosInstance'
import { throwApiError } from '../utils/apiError'
import { createCachedRequest } from '../utils/apiRequestCache'
import {
  buildOmrExamApiPayload,
  mapApiOmrExamToLocal,
  normalizeOmrExamsListResponse,
} from '../utils/omrApiHelpers'

const omrListCache = createCachedRequest({ ttlMs: 30_000 })
const omrDetailCache = new Map()
const omrDetailInFlight = new Map()

function triggerBrowserDownload(href, fileName) {
  const link = document.createElement('a')
  link.href = href
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function parseDownloadFileName(response, fallback) {
  const disposition = response?.headers?.['content-disposition']
  if (!disposition) return fallback
  const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)
  if (!match?.[1]) return fallback
  try {
    return decodeURIComponent(match[1].replace(/"/g, '').trim())
  } catch {
    return match[1].replace(/"/g, '').trim()
  }
}

export function clearOmrExamsListCache() {
  omrListCache.clear()
}

export function clearOmrExamDetailCache(examId) {
  if (examId == null || examId === '') {
    omrDetailCache.clear()
    return
  }
  omrDetailCache.delete(String(examId))
}

function invalidateAfterMutation(examId) {
  clearOmrExamsListCache()
  if (examId != null) clearOmrExamDetailCache(examId)
}

export async function getOmrExams(params = {}, { bypassCache = false } = {}) {
  try {
    return await omrListCache.fetch(
      params,
      async () => {
        const response = await axiosInstance.post('/api/omr-exams/list', {
          page: params.page || 1,
          limit: params.limit || 100,
          search: params.search || '',
          status: params.status || 'ALL',
          sortBy: params.sortBy || 'createdAt',
          sortOrder: params.sortOrder || 'desc',
        })
        return response.data
      },
      { bypass: bypassCache },
    )
  } catch (error) {
    throwApiError(error)
  }
}

export async function getOmrExamById(examId) {
  const key = String(examId || '')
  if (!key) throwApiError(new Error('Exam id is required'))

  if (omrDetailCache.has(key)) return omrDetailCache.get(key)

  const pending = omrDetailInFlight.get(key)
  if (pending) return pending

  const request = axiosInstance
    .post(`/api/omr-exams/${key}`, {})
    .then((response) => {
      omrDetailCache.set(key, response.data)
      omrDetailInFlight.delete(key)
      return response.data
    })
    .catch((error) => {
      omrDetailInFlight.delete(key)
      throwApiError(error)
    })

  omrDetailInFlight.set(key, request)
  return request
}

export async function createOmrExam(form) {
  const payload = buildOmrExamApiPayload(form)
  try {
    const response = await axiosInstance.post('/api/omr-exams', payload)
    invalidateAfterMutation()
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateOmrExam(examId, form) {
  const payload = buildOmrExamApiPayload(form)
  try {
    const response = await axiosInstance.put(`/api/omr-exams/${examId}`, payload)
    invalidateAfterMutation(examId)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteOmrExam(examId) {
  try {
    const response = await axiosInstance.delete(`/api/omr-exams/${examId}`)
    invalidateAfterMutation(examId)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

function buildResultSheetFormData(file) {
  const formData = new FormData()
  formData.append('file', file)
  return formData
}

export async function uploadOmrResultSheet(examId, file) {
  if (!file) throwApiError(new Error('File is required'))
  try {
    const response = await axiosInstance.post(
      `/api/omr-exams/${examId}/result-sheet`,
      buildResultSheetFormData(file),
      { headers: { 'Content-Type': undefined } },
    )
    invalidateAfterMutation(examId)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function replaceOmrResultSheet(examId, file) {
  if (!file) throwApiError(new Error('File is required'))
  try {
    const response = await axiosInstance.put(
      `/api/omr-exams/${examId}/result-sheet`,
      buildResultSheetFormData(file),
      { headers: { 'Content-Type': undefined } },
    )
    invalidateAfterMutation(examId)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteOmrResultSheet(examId) {
  try {
    const response = await axiosInstance.delete(`/api/omr-exams/${examId}/result-sheet`)
    invalidateAfterMutation(examId)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function downloadOmrResultSheet(examId) {
  try {
    const response = await axiosInstance.post(
      `/api/omr-exams/${examId}/result-sheet/download`,
      { mode: 'file' },
      { responseType: 'blob' },
    )

    let fileName = parseDownloadFileName(response, '')
    if (!fileName) {
      const exam = mapApiOmrExamToLocal(await getOmrExamById(examId))
      fileName = exam?.resultSheet?.fileName || `omr-result-${examId}`
    }

    const url = window.URL.createObjectURL(new Blob([response.data]))
    triggerBrowserDownload(url, fileName)
    window.URL.revokeObjectURL(url)
    return { success: true }
  } catch (error) {
    throwApiError(error)
  }
}

export { normalizeOmrExamsListResponse, mapApiOmrExamToLocal }
