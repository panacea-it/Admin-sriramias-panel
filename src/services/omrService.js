import axiosInstance from './axiosInstance'
import { isFrontendOnly } from '../config/appMode'
import { throwApiError } from '../utils/apiError'
import { createCachedRequest } from '../utils/apiRequestCache'
import { SEED_OMR_EXAMS } from '../data/omrSeed'
import {
  buildOmrExamApiPayload,
  inferOmrFileType,
  mapApiOmrExamToLocal,
  normalizeOmrExamsListResponse,
} from '../utils/omrApiHelpers'

const STORAGE_KEY = 'omr_exams_v1'
const FILE_STORAGE_KEY = 'omr_result_files_v1'
const DELAY_MS = 160

/** Use local storage until OMR API is deployed. Set VITE_OMR_USE_MOCK=false when backend is ready. */
const USE_OMR_LOCAL =
  isFrontendOnly || import.meta.env.VITE_OMR_USE_MOCK !== 'false'

const omrListCache = createCachedRequest({ ttlMs: 30_000 })
const omrDetailCache = new Map()
const omrDetailInFlight = new Map()

function delay(ms = DELAY_MS) {
  return new Promise((r) => setTimeout(r, ms))
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function loadLocalExams() {
  if (typeof window === 'undefined') return [...SEED_OMR_EXAMS]
  ensureSeedResultFiles()
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_OMR_EXAMS))
    return [...SEED_OMR_EXAMS]
  }
  const parsed = safeJsonParse(raw, SEED_OMR_EXAMS)
  return Array.isArray(parsed) ? parsed.filter((row) => !row.deletedAt) : [...SEED_OMR_EXAMS]
}

function saveLocalExams(list) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function loadLocalFiles() {
  if (typeof window === 'undefined') return {}
  const raw = window.localStorage.getItem(FILE_STORAGE_KEY)
  if (!raw) return {}
  const parsed = safeJsonParse(raw, {})
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
}

function saveLocalFiles(map) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(FILE_STORAGE_KEY, JSON.stringify(map))
}

function toBase64DataUrl(content, mimeType = 'text/csv') {
  const bytes = new TextEncoder().encode(content)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return `data:${mimeType};base64,${btoa(binary)}`
}

function ensureSeedResultFiles() {
  const files = { ...loadLocalFiles() }
  let changed = false

  for (const exam of SEED_OMR_EXAMS) {
    if (!exam.resultSheetUploaded || !exam.resultSheet?.fileName) continue
    const key = String(exam.id)
    if (files[key]) continue

    const csv = `Exam,${exam.examName}\nStudent,Roll,Score\nSample Student,UPSC-001,85\n`
    files[key] = toBase64DataUrl(csv)
    changed = true
  }

  if (changed) saveLocalFiles(files)
}

function triggerBrowserDownload(href, fileName) {
  const link = document.createElement('a')
  link.href = href
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function buildFallbackResultBlob(exam) {
  const fileName = exam.resultSheet?.fileName || `omr-result-${exam.id}.csv`
  const fileType = inferOmrFileType(fileName)
  const rows = [
    ['Exam', exam.examName],
    ['Student', 'Roll', 'Score'],
    ['Sample Student', 'UPSC-001', '85'],
  ]
  const csv = rows.map((row) => row.join(',')).join('\n')

  if (fileType === 'pdf') {
    return {
      blob: new Blob([`OMR Result Sheet — ${exam.examName}\n\n${csv}`], { type: 'application/pdf' }),
      fileName,
    }
  }

  const mimeType =
    fileType === 'xlsx'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'text/csv'

  return { blob: new Blob([csv], { type: mimeType }), fileName }
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

function nextLocalId() {
  return `omr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function filterLocalExams(params = {}) {
  let rows = loadLocalExams()
  const search = String(params.search || '').trim().toLowerCase()
  if (search) {
    rows = rows.filter((row) => row.examName?.toLowerCase().includes(search))
  }
  if (params.status === 'ACTIVE') rows = rows.filter((row) => row.status === 'Active')
  if (params.status === 'INACTIVE') rows = rows.filter((row) => row.status === 'Inactive')
  return rows
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

function isOmrApiUnavailable(error) {
  const status = error?.response?.status
  return status === 404 || status === 501 || status === 502 || status === 503
}

async function withOmrLocal(localFn, apiCall) {
  if (USE_OMR_LOCAL) {
    await delay()
    return localFn()
  }
  try {
    return await apiCall()
  } catch (error) {
    if (isOmrApiUnavailable(error)) {
      await delay()
      return localFn()
    }
    throwApiError(error)
  }
}

export async function getOmrExams(params = {}, { bypassCache = false } = {}) {
  return withOmrLocal(
    () => ({ exams: filterLocalExams(params) }),
    () =>
      omrListCache.fetch(
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
      ),
  )
}

export async function getOmrExamById(examId) {
  const key = String(examId || '')
  if (!key) throwApiError(new Error('Exam id is required'))

  const loadLocal = async () => {
    const row = loadLocalExams().find((item) => String(item.id) === key)
    if (!row) throwApiError(new Error('OMR exam not found'))
    return row
  }

  if (USE_OMR_LOCAL) {
    await delay()
    return loadLocal()
  }

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
    .catch(async (error) => {
      omrDetailInFlight.delete(key)
      if (isOmrApiUnavailable(error)) {
        await delay()
        return loadLocal()
      }
      throwApiError(error)
    })

  omrDetailInFlight.set(key, request)
  return request
}

export async function createOmrExam(form) {
  const payload = buildOmrExamApiPayload(form)

  return withOmrLocal(
    () => {
      const now = new Date().toISOString()
      const row = {
        id: nextLocalId(),
        examName: payload.examName,
        examDate: payload.examDate,
        status: form.status === 'Inactive' ? 'Inactive' : 'Active',
        resultSheetUploaded: false,
        resultSheet: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      }
      const list = loadLocalExams()
      list.unshift(row)
      saveLocalExams(list)
      invalidateAfterMutation()
      return row
    },
    async () => {
      const response = await axiosInstance.post('/api/omr-exams', payload)
      invalidateAfterMutation()
      return response.data
    },
  )
}

export async function updateOmrExam(examId, form) {
  const payload = buildOmrExamApiPayload(form)

  return withOmrLocal(
    () => {
      const list = loadLocalExams()
      const idx = list.findIndex((row) => String(row.id) === String(examId))
      if (idx < 0) throwApiError(new Error('OMR exam not found'))
      const updated = {
        ...list[idx],
        examName: payload.examName,
        examDate: payload.examDate,
        status: form.status === 'Inactive' ? 'Inactive' : 'Active',
        updatedAt: new Date().toISOString(),
      }
      list[idx] = updated
      saveLocalExams(list)
      invalidateAfterMutation(examId)
      return updated
    },
    async () => {
      const response = await axiosInstance.put(`/api/omr-exams/${examId}`, payload)
      invalidateAfterMutation(examId)
      return response.data
    },
  )
}

export async function deleteOmrExam(examId) {
  return withOmrLocal(
    () => {
      const list = loadLocalExams()
      const idx = list.findIndex((row) => String(row.id) === String(examId))
      if (idx < 0) throwApiError(new Error('OMR exam not found'))
      list[idx] = { ...list[idx], deletedAt: new Date().toISOString() }
      saveLocalExams(list.filter((row) => !row.deletedAt))

      const files = loadLocalFiles()
      delete files[String(examId)]
      saveLocalFiles(files)

      invalidateAfterMutation(examId)
      return { success: true }
    },
    async () => {
      const response = await axiosInstance.delete(`/api/omr-exams/${examId}`)
      invalidateAfterMutation(examId)
      return response.data
    },
  )
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

async function localUploadResultSheet(examId, file, uploadedBy) {
  await delay(300)
  const dataUrl = await fileToBase64(file)
  const files = loadLocalFiles()
  files[String(examId)] = dataUrl
  saveLocalFiles(files)

  const list = loadLocalExams()
  const idx = list.findIndex((row) => String(row.id) === String(examId))
  if (idx < 0) throwApiError(new Error('OMR exam not found'))

  const uploadedAt = new Date().toISOString()
  const resultSheet = {
    fileName: file.name,
    fileType: inferOmrFileType(file.name),
    mimeType: file.type,
    uploadedBy,
    uploadedAt,
  }

  list[idx] = {
    ...list[idx],
    resultSheetUploaded: true,
    resultSheet,
    updatedAt: uploadedAt,
  }
  saveLocalExams(list)
  invalidateAfterMutation(examId)
  return mapApiOmrExamToLocal(list[idx])
}

function buildResultSheetFormData(file) {
  const formData = new FormData()
  formData.append('file', file)
  return formData
}

export async function uploadOmrResultSheet(examId, file, uploadedBy = 'Admin') {
  if (!file) throwApiError(new Error('File is required'))

  return withOmrLocal(
    () => localUploadResultSheet(examId, file, uploadedBy),
    async () => {
      const response = await axiosInstance.post(
        `/api/omr-exams/${examId}/result-sheet`,
        buildResultSheetFormData(file),
        { headers: { 'Content-Type': undefined } },
      )
      invalidateAfterMutation(examId)
      return response.data
    },
  )
}

export async function replaceOmrResultSheet(examId, file, uploadedBy = 'Admin') {
  if (!file) throwApiError(new Error('File is required'))

  return withOmrLocal(
    () => localUploadResultSheet(examId, file, uploadedBy),
    async () => {
      const response = await axiosInstance.put(
        `/api/omr-exams/${examId}/result-sheet`,
        buildResultSheetFormData(file),
        { headers: { 'Content-Type': undefined } },
      )
      invalidateAfterMutation(examId)
      return response.data
    },
  )
}

export async function deleteOmrResultSheet(examId) {
  return withOmrLocal(
    () => {
      const files = loadLocalFiles()
      delete files[String(examId)]
      saveLocalFiles(files)

      const list = loadLocalExams()
      const idx = list.findIndex((row) => String(row.id) === String(examId))
      if (idx < 0) throwApiError(new Error('OMR exam not found'))

      list[idx] = {
        ...list[idx],
        resultSheetUploaded: false,
        resultSheet: null,
        updatedAt: new Date().toISOString(),
      }
      saveLocalExams(list)
      invalidateAfterMutation(examId)
      return mapApiOmrExamToLocal(list[idx])
    },
    async () => {
      const response = await axiosInstance.delete(`/api/omr-exams/${examId}/result-sheet`)
      invalidateAfterMutation(examId)
      return response.data
    },
  )
}

export async function downloadOmrResultSheet(examId) {
  return withOmrLocal(
    () => {
      const exam = loadLocalExams().find((row) => String(row.id) === String(examId))
      if (!exam?.resultSheet?.fileName) throwApiError(new Error('No result sheet uploaded'))

      const dataUrl = loadLocalFiles()[String(examId)]
      if (dataUrl) {
        triggerBrowserDownload(dataUrl, exam.resultSheet.fileName)
        return { success: true }
      }

      const { blob, fileName } = buildFallbackResultBlob(exam)
      const url = window.URL.createObjectURL(blob)
      triggerBrowserDownload(url, fileName)
      window.URL.revokeObjectURL(url)
      return { success: true }
    },
    async () => {
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
    },
  )
}

export { normalizeOmrExamsListResponse, mapApiOmrExamToLocal }
