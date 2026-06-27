import { SEED_OMR_EXAMS } from '../data/omrSeed'
import {
  buildOmrExamApiPayload,
  inferOmrFileType,
  mapApiOmrExamToLocal,
  normalizeOmrExamsListResponse,
} from '../utils/omrApiHelpers'

const STORAGE_KEY = 'tm_omr_exams_v1'
const DELAY_MS = 160

function delay(ms = DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function loadExams() {
  if (typeof window === 'undefined') return [...SEED_OMR_EXAMS]
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_OMR_EXAMS))
    return [...SEED_OMR_EXAMS]
  }
  const parsed = safeJsonParse(raw, SEED_OMR_EXAMS)
  return Array.isArray(parsed) ? parsed : [...SEED_OMR_EXAMS]
}

function saveExams(exams) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(exams))
}

function nextExamId() {
  return `omr-${Date.now().toString(36)}`
}

function filterExams(exams, params = {}) {
  let rows = exams.filter((row) => !row.deletedAt)

  const q = String(params.search || '').trim().toLowerCase()
  if (q) {
    rows = rows.filter((row) => row.examName?.toLowerCase().includes(q))
  }

  const status = String(params.status || 'ALL').toUpperCase()
  if (status === 'ACTIVE') {
    rows = rows.filter((row) => row.status === 'Active')
  } else if (status === 'INACTIVE') {
    rows = rows.filter((row) => row.status === 'Deactivated')
  }

  const sortBy = params.sortBy || 'createdAt'
  const sortOrder = params.sortOrder === 'asc' ? 1 : -1
  rows.sort((a, b) => {
    const av = a[sortBy] ?? ''
    const bv = b[sortBy] ?? ''
    if (av < bv) return -1 * sortOrder
    if (av > bv) return 1 * sortOrder
    return 0
  })

  return rows
}

function wrapExam(exam) {
  return { data: { exam } }
}

let listCache = null
let listCacheKey = ''
const detailCache = new Map()

export function clearOmrExamsListCache() {
  listCache = null
  listCacheKey = ''
}

export function clearOmrExamDetailCache(examId) {
  if (examId == null || examId === '') {
    detailCache.clear()
    return
  }
  detailCache.delete(String(examId))
}

function invalidateAfterMutation(examId) {
  clearOmrExamsListCache()
  if (examId != null) clearOmrExamDetailCache(examId)
}

function triggerBrowserDownload(href, fileName) {
  const link = document.createElement('a')
  link.href = href
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function getOmrExams(params = {}, { bypassCache = false } = {}) {
  await delay()
  const cacheKey = JSON.stringify(params)
  if (!bypassCache && listCache && listCacheKey === cacheKey) {
    return listCache
  }

  const exams = filterExams(loadExams(), params)
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || 100
  const start = (page - 1) * limit
  const paged = exams.slice(start, start + limit)

  const response = {
    data: {
      exams: paged,
      pagination: {
        page,
        limit,
        total: exams.length,
        totalPages: Math.max(1, Math.ceil(exams.length / limit)),
      },
    },
  }

  listCache = response
  listCacheKey = cacheKey
  return response
}

export async function getOmrExamById(examId) {
  await delay()
  const key = String(examId || '')
  if (!key) throw new Error('Exam id is required')

  if (detailCache.has(key)) return detailCache.get(key)

  const exam = loadExams().find((row) => String(row.id) === key && !row.deletedAt)
  if (!exam) throw new Error('OMR exam not found')

  const response = wrapExam(exam)
  detailCache.set(key, response)
  return response
}

export async function createOmrExam(form) {
  await delay()
  const payload = buildOmrExamApiPayload(form)
  const now = new Date().toISOString()
  const exam = {
    id: nextExamId(),
    examName: payload.examName,
    examDate: payload.examDate,
    status: form.status === 'Deactivated' ? 'Deactivated' : 'Active',
    resultSheetUploaded: false,
    resultSheet: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }

  const list = loadExams()
  list.unshift(exam)
  saveExams(list)
  invalidateAfterMutation()

  return wrapExam(exam)
}

export async function updateOmrExam(examId, form) {
  await delay()
  const payload = buildOmrExamApiPayload(form)
  const list = loadExams()
  const idx = list.findIndex((row) => String(row.id) === String(examId) && !row.deletedAt)
  if (idx < 0) throw new Error('OMR exam not found')

  const updated = {
    ...list[idx],
    examName: payload.examName,
    examDate: payload.examDate,
    status: form.status === 'Deactivated' ? 'Deactivated' : 'Active',
    updatedAt: new Date().toISOString(),
  }

  list[idx] = updated
  saveExams(list)
  invalidateAfterMutation(examId)

  return wrapExam(updated)
}

export async function deleteOmrExam(examId) {
  await delay()
  const list = loadExams()
  const idx = list.findIndex((row) => String(row.id) === String(examId) && !row.deletedAt)
  if (idx < 0) throw new Error('OMR exam not found')

  list[idx] = {
    ...list[idx],
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  saveExams(list)
  invalidateAfterMutation(examId)

  return { success: true }
}

function attachResultSheet(examId, file, uploadedBy = 'Admin') {
  const list = loadExams()
  const idx = list.findIndex((row) => String(row.id) === String(examId) && !row.deletedAt)
  if (idx < 0) throw new Error('OMR exam not found')

  const now = new Date().toISOString()
  const resultSheet = {
    fileName: file.name,
    fileType: inferOmrFileType(file.name),
    mimeType: file.type || 'application/octet-stream',
    uploadedBy,
    uploadedAt: now,
  }

  list[idx] = {
    ...list[idx],
    resultSheetUploaded: true,
    resultSheet,
    updatedAt: now,
  }
  saveExams(list)
  invalidateAfterMutation(examId)
  return wrapExam(list[idx])
}

export async function uploadOmrResultSheet(examId, file, meta = {}) {
  await delay()
  if (!file) throw new Error('File is required')
  return attachResultSheet(examId, file, meta.uploadedBy || 'Admin')
}

export async function replaceOmrResultSheet(examId, file, meta = {}) {
  await delay()
  if (!file) throw new Error('File is required')
  return attachResultSheet(examId, file, meta.uploadedBy || 'Admin')
}

export async function deleteOmrResultSheet(examId) {
  await delay()
  const list = loadExams()
  const idx = list.findIndex((row) => String(row.id) === String(examId) && !row.deletedAt)
  if (idx < 0) throw new Error('OMR exam not found')

  list[idx] = {
    ...list[idx],
    resultSheetUploaded: false,
    resultSheet: null,
    updatedAt: new Date().toISOString(),
  }
  saveExams(list)
  invalidateAfterMutation(examId)

  return { success: true }
}

export async function downloadOmrResultSheet(examId) {
  await delay()
  const response = await getOmrExamById(examId)
  const exam = mapApiOmrExamToLocal(response)
  if (!exam?.resultSheet?.fileName) {
    throw new Error('No result sheet available for download')
  }

  const content = `OMR Result Sheet\nExam: ${exam.examName}\nDate: ${exam.examDate}\n`
  const blob = new Blob([content], { type: 'text/plain' })
  const url = window.URL.createObjectURL(blob)
  triggerBrowserDownload(url, exam.resultSheet.fileName)
  window.URL.revokeObjectURL(url)
  return { success: true }
}

export { normalizeOmrExamsListResponse, mapApiOmrExamToLocal }
