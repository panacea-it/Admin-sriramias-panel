import api from './axiosInstance'
import { isFrontendOnly } from '../config/appMode'
import { getApiErrorMessage } from '../utils/apiError'
import {
  fetchQuestions as fetchQuestionsLocal,
  upsertQuestion as upsertQuestionLocal,
  deleteQuestion as deleteQuestionLocal,
} from './testManagementAPI'

/**
 * Question Bank API integration (backend: /api/question-bank).
 * Mirrors the Test Configuration pattern: a single module with enum mappers
 * between the UI shape (nested `content`, "Active"/"Easy"/"MCQ") and the flat
 * form-data backend shape ("ACTIVE"/"EASY"/"MCQ", optionA-D, matchData, ...).
 *
 * Flip QUESTION_BANK_API_DISABLED to true (or set VITE_FRONTEND_ONLY) to fall
 * back to the local seed/localStorage store in testManagementAPI.
 */
export const QUESTION_BANK_API_DISABLED = false
const QB_PATH = '/question-bank'

export function isQuestionBankLocal() {
  return QUESTION_BANK_API_DISABLED
}

/* --------------------------------- enums ---------------------------------- */

const TYPE_UI_TO_API = {
  MCQ: 'MCQ',
  Numerical: 'NUMERICAL',
  'Match the Following': 'MATCH_THE_FOLLOWING',
  'Assertion Reason': 'ASSERTION_REASON',
  Descriptive: 'DESCRIPTIVE',
}
const TYPE_API_TO_UI = {
  MCQ: 'MCQ',
  NUMERICAL: 'Numerical',
  MATCH_THE_FOLLOWING: 'Match the Following',
  ASSERTION_REASON: 'Assertion Reason',
  DESCRIPTIVE: 'Descriptive',
}
const ASSERTION_ENUM_TO_UI = {
  BOTH_TRUE_REASON_EXPLAINS: 'Both A and R are true, and R is the correct explanation of A',
  BOTH_TRUE_REASON_NOT_EXPLAINS: 'Both A and R are true, but R is not the correct explanation of A',
  ASSERTION_TRUE_REASON_FALSE: 'A is true, but R is false',
  ASSERTION_FALSE_REASON_TRUE: 'A is false, but R is true',
}
const ASSERTION_UI_TO_ENUM = Object.fromEntries(
  Object.entries(ASSERTION_ENUM_TO_UI).map(([enumKey, label]) => [label, enumKey]),
)
const BULK_TEMPLATE_SLUGS = {
  MCQ: 'mcq',
  Numerical: 'numerical',
  'Match the Following': 'match-the-following',
  'Assertion Reason': 'assertion-reason',
  Descriptive: 'descriptive',
}

function typeUiToApi(value) {
  return TYPE_UI_TO_API[value] || String(value || '').toUpperCase().replace(/\s+/g, '_')
}
function typeApiToUi(value) {
  return TYPE_API_TO_UI[String(value || '').toUpperCase()] || value || ''
}
function categoryUiToApi(value) {
  return String(value || '').toLowerCase() === 'mains' ? 'MAINS' : 'PRELIMS'
}
function categoryApiToUi(value) {
  return String(value || '').toUpperCase() === 'MAINS' ? 'Mains' : 'Prelims'
}
function statusUiToApi(value) {
  return String(value || '').toLowerCase() === 'inactive' ? 'INACTIVE' : 'ACTIVE'
}
function statusApiToUi(value) {
  return String(value || '').toUpperCase() === 'INACTIVE' ? 'Inactive' : 'Active'
}
function difficultyUiToApi(value) {
  const raw = String(value || '').toUpperCase()
  if (raw === 'HARD') return 'HARD'
  if (raw === 'MEDIUM') return 'MEDIUM'
  return 'EASY'
}
function difficultyApiToUi(value) {
  const raw = String(value || '').toUpperCase()
  if (raw === 'HARD') return 'Hard'
  if (raw === 'MEDIUM') return 'Medium'
  return 'Easy'
}

/* ------------------------------- mappers ---------------------------------- */

function buildContentFromApi(doc) {
  const content = {
    question: doc.questionText || '',
    explanation: doc.explanation || '',
    imageDataUrl: doc.imageUrl || '',
    options: ['', '', '', ''],
    correctOptionIndex: 0,
    numericalAnswer: '',
    prompt: '',
    left: ['', '', '', ''],
    right: ['', '', '', ''],
    mapping: [0, 1, 2, 3],
    assertion: '',
    reason: '',
    correctAnswer: '',
  }

  switch (String(doc.type || '').toUpperCase()) {
    case 'MCQ': {
      content.options = [doc.optionA, doc.optionB, doc.optionC, doc.optionD].map((o) => String(o ?? ''))
      const idx = 'ABCD'.indexOf(String(doc.correctAnswer || '').trim().toUpperCase())
      content.correctOptionIndex = idx >= 0 ? idx : 0
      break
    }
    case 'NUMERICAL':
      content.numericalAnswer = String(doc.numericalAnswer ?? '')
      break
    case 'MATCH_THE_FOLLOWING': {
      const pairs = doc.matchData?.pairs || []
      content.prompt = String(doc.matchData?.prompt ?? doc.prompt ?? '')
      content.left = [...pairs.map((p) => String(p.left ?? '')), '', '', '', ''].slice(0, 4)
      content.right = [...pairs.map((p) => String(p.right ?? '')), '', '', '', ''].slice(0, 4)
      break
    }
    case 'ASSERTION_REASON':
      content.assertion = String(doc.assertion ?? '')
      content.reason = String(doc.reason ?? '')
      content.correctAnswer = ASSERTION_ENUM_TO_UI[String(doc.correctAnswer || '').toUpperCase()] || ''
      break
    default:
      break
  }

  return content
}

export function mapApiQuestionToLocal(doc) {
  if (!doc || typeof doc !== 'object') return null
  const mongoId = doc._id ?? doc.id
  const questionCode = doc.questionCode ?? ''
  if (!mongoId && !questionCode) return null
  return {
    id: String(mongoId ?? questionCode),
    questionCode: String(questionCode || mongoId),
    category: categoryApiToUi(doc.category),
    type: typeApiToUi(doc.type),
    subject: doc.subject || '',
    topic: doc.topic || '',
    difficulty: difficultyApiToUi(doc.difficulty),
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    status: statusApiToUi(doc.status),
    usageCount: Number(doc.usageCount ?? 0) || 0,
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
    content: buildContentFromApi(doc),
  }
}

function dataUrlToFile(dataUrl, filename = 'question-image') {
  const [meta, b64] = String(dataUrl).split(',')
  if (!b64) return null
  const mime = (meta.match(/data:(.*?);base64/) || [])[1] || 'image/png'
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  const ext = (mime.split('/')[1] || 'png').split('+')[0]
  return new File([bytes], `${filename}.${ext}`, { type: mime })
}

function buildQuestionFormData(payload) {
  const fd = new FormData()
  const content = payload.content || {}
  const type = typeUiToApi(payload.type)

  fd.append('category', categoryUiToApi(payload.category))
  fd.append('type', type)
  fd.append('status', statusUiToApi(payload.status))
  fd.append('subject', String(payload.subject || '').trim())
  fd.append('topic', String(payload.topic || '').trim())
  fd.append('difficulty', difficultyUiToApi(payload.difficulty))
  fd.append('tags', (Array.isArray(payload.tags) ? payload.tags : []).join(','))

  const questionText = String(content.question || content.prompt || '').trim()
  fd.append('questionText', questionText)
  fd.append('explanation', String(content.explanation || '').trim())

  if (type === 'MCQ') {
    const options = [...(Array.isArray(content.options) ? content.options : []), '', '', '', ''].slice(0, 4)
    fd.append('optionA', String(options[0] || '').trim())
    fd.append('optionB', String(options[1] || '').trim())
    fd.append('optionC', String(options[2] || '').trim())
    fd.append('optionD', String(options[3] || '').trim())
    fd.append('correctAnswer', 'ABCD'[Number(content.correctOptionIndex ?? 0) || 0] || 'A')
  } else if (type === 'NUMERICAL') {
    fd.append('numericalAnswer', String(content.numericalAnswer || '').trim())
  } else if (type === 'MATCH_THE_FOLLOWING') {
    fd.append('prompt', String(content.prompt || content.question || '').trim())
    const left = Array.isArray(content.left) ? content.left : []
    const right = Array.isArray(content.right) ? content.right : []
    for (let i = 0; i < 4; i += 1) {
      fd.append(`left${i + 1}`, String(left[i] || '').trim())
      fd.append(`right${i + 1}`, String(right[i] || '').trim())
    }
  } else if (type === 'ASSERTION_REASON') {
    fd.append('assertion', String(content.assertion || '').trim())
    fd.append('reason', String(content.reason || '').trim())
    const label = String(content.correctAnswer || '')
    fd.append('correctAnswer', ASSERTION_UI_TO_ENUM[label] || label)
  }

  if (typeof content.imageDataUrl === 'string' && content.imageDataUrl.startsWith('data:')) {
    const file = dataUrlToFile(content.imageDataUrl)
    if (file) fd.append('image', file)
  }

  return fd
}

function buildListParams(params = {}) {
  const query = { page: 1, limit: 100 }
  const search = String(params.search || '').trim()
  if (search) query.search = search
  if (params.type && params.type !== 'all') query.type = typeUiToApi(params.type)
  if (params.category && params.category !== 'all') query.category = categoryUiToApi(params.category)
  if (params.subject && params.subject !== 'all') query.subject = params.subject
  if (params.topic && params.topic !== 'all') query.topic = params.topic
  if (params.difficulty && params.difficulty !== 'all') query.difficulty = difficultyUiToApi(params.difficulty)
  if (params.status && params.status !== 'all') query.status = statusUiToApi(params.status)
  if (params.tags && params.tags !== 'all') query.tags = params.tags
  return query
}

function triggerBlobDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

/* ------------------------------ list / CRUD ------------------------------- */

export async function fetchQuestions(params = {}) {
  if (isQuestionBankLocal()) return fetchQuestionsLocal(params)
  try {
    const response = await api.get(QB_PATH, { params: buildListParams(params) })
    const body = response.data
    const arr = Array.isArray(body) ? body : body?.data ?? []
    return (Array.isArray(arr) ? arr : []).map(mapApiQuestionToLocal).filter(Boolean)
  } catch (err) {
    throw new Error(getApiErrorMessage(err) || 'Failed to load questions')
  }
}

export async function getQuestionById(id) {
  if (isQuestionBankLocal()) {
    const list = await fetchQuestionsLocal({})
    return list.find((q) => String(q.id) === String(id)) || null
  }
  const response = await api.get(`${QB_PATH}/${id}`)
  return mapApiQuestionToLocal(response.data?.data ?? response.data)
}

export async function upsertQuestion(payload, meta = {}) {
  if (isQuestionBankLocal()) return upsertQuestionLocal(payload, meta)
  try {
    const formData = buildQuestionFormData(payload)
    const response =
      meta?.isEdit && meta?.id
        ? await api.put(`${QB_PATH}/${meta.id}`, formData)
        : await api.post(QB_PATH, formData)
    return mapApiQuestionToLocal(response.data?.data ?? response.data)
  } catch (err) {
    throw new Error(getApiErrorMessage(err) || 'Failed to save question')
  }
}

export async function deleteQuestion(id) {
  if (isQuestionBankLocal()) return deleteQuestionLocal(id)
  try {
    await api.delete(`${QB_PATH}/${id}`)
  } catch (err) {
    throw new Error(getApiErrorMessage(err) || 'Failed to delete question')
  }
}

export async function updateQuestionStatus(id, statusUi) {
  if (isQuestionBankLocal()) {
    return upsertQuestionLocal({ status: statusUi }, { isEdit: true, id })
  }
  try {
    const response = await api.patch(`${QB_PATH}/${id}/status`, { status: statusUiToApi(statusUi) })
    return mapApiQuestionToLocal(response.data?.data ?? response.data)
  } catch (err) {
    throw new Error(getApiErrorMessage(err) || 'Failed to update status')
  }
}

export async function duplicateQuestion(id) {
  if (isQuestionBankLocal()) {
    const list = await fetchQuestionsLocal({})
    const row = list.find((q) => String(q.id) === String(id))
    if (!row) return null
    const { id: _omit, questionCode: _omitCode, ...rest } = row
    void _omit
    void _omitCode
    return { ...rest, status: 'Active' }
  }
  try {
    const response = await api.post(`${QB_PATH}/${id}/duplicate`)
    const prefill = mapApiQuestionToLocal(response.data?.data ?? response.data) || {}
    delete prefill.id
    delete prefill.questionCode
    return prefill
  } catch (err) {
    throw new Error(getApiErrorMessage(err) || 'Failed to duplicate question')
  }
}

/* ------------------------------- analytics -------------------------------- */

export async function getQuestionAnalytics(params = {}) {
  if (isQuestionBankLocal()) {
    const rows = await fetchQuestionsLocal(params)
    const easyCount = rows.filter((r) => r.difficulty === 'Easy').length
    const mediumHardCount = rows.filter((r) => r.difficulty === 'Medium' || r.difficulty === 'Hard').length
    return { totalQuestions: rows.length, easyCount, mediumHardCount }
  }
  try {
    const query = buildListParams(params)
    delete query.page
    delete query.limit
    const response = await api.get(`${QB_PATH}/analytics`, { params: query })
    const data = response.data?.data ?? response.data ?? {}
    return {
      totalQuestions: Number(data.totalQuestions ?? 0) || 0,
      easyCount: Number(data.easyCount ?? 0) || 0,
      mediumHardCount: Number(data.mediumHardCount ?? 0) || 0,
    }
  } catch {
    return { totalQuestions: 0, easyCount: 0, mediumHardCount: 0 }
  }
}

/* ----------------------------- filter options ----------------------------- */

function extractArray(response) {
  const body = response?.data
  const arr = Array.isArray(body) ? body : body?.data ?? []
  return Array.isArray(arr) ? arr : []
}

export async function getQuestionFilterOptions({ subject } = {}) {
  if (isQuestionBankLocal()) {
    const rows = await fetchQuestionsLocal({})
    const subjects = Array.from(new Set(rows.map((r) => r.subject).filter(Boolean))).sort()
    const topics = Array.from(
      new Set(
        rows
          .filter((r) => !subject || subject === 'all' || r.subject === subject)
          .map((r) => r.topic)
          .filter(Boolean),
      ),
    ).sort()
    const tags = Array.from(new Set(rows.flatMap((r) => r.tags || []).filter(Boolean))).sort()
    return { subjects, topics, tags }
  }
  try {
    const topicParams = subject && subject !== 'all' ? { params: { subject } } : undefined
    const [subjectsRes, topicsRes, tagsRes] = await Promise.all([
      api.get(`${QB_PATH}/subjects`),
      api.get(`${QB_PATH}/topics`, topicParams),
      api.get(`${QB_PATH}/tags`),
    ])
    return {
      subjects: extractArray(subjectsRes).filter(Boolean),
      topics: extractArray(topicsRes).filter(Boolean),
      tags: extractArray(tagsRes).flat().filter(Boolean),
    }
  } catch {
    return { subjects: [], topics: [], tags: [] }
  }
}

/* ------------------------------- bulk upload ------------------------------ */

export async function downloadQuestionTemplate(typeUi) {
  const slug = BULK_TEMPLATE_SLUGS[typeUi] || 'mcq'
  const response = await api.get(`${QB_PATH}/bulk/templates/${slug}`, { responseType: 'blob' })
  triggerBlobDownload(response.data, `${slug}-template.xlsx`)
}

export async function validateBulkQuestions(file) {
  const formData = new FormData()
  formData.append('file', file)
  try {
    const response = await api.post(`${QB_PATH}/bulk/validate`, formData)
    return response.data?.data ?? response.data
  } catch (err) {
    const data = err?.response?.data?.data
    if (data) return data
    throw new Error(getApiErrorMessage(err) || 'Failed to validate file')
  }
}

export async function importBulkQuestions(file, duplicateModeUi = 'skip') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('duplicateMode', duplicateModeUi === 'upload_anyway' ? 'UPLOAD_ANYWAY' : 'SKIP')
  try {
    const response = await api.post(`${QB_PATH}/bulk/import`, formData)
    return response.data?.data ?? response.data
  } catch (err) {
    throw new Error(getApiErrorMessage(err) || 'Failed to import questions')
  }
}
