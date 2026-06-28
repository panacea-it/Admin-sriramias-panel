import { getApiErrorMessage } from './apiError'

export const ASSERTION_ANSWER_OPTIONS = [
  { value: 'BOTH_TRUE_REASON_EXPLAINS', label: 'Both true & R explains A' },
  { value: 'BOTH_TRUE_REASON_NOT_EXPLAINS', label: 'Both true but R not explanation' },
  { value: 'ASSERTION_TRUE_REASON_FALSE', label: 'A true, R false' },
  { value: 'ASSERTION_FALSE_REASON_TRUE', label: 'A false, R true' },
]

export const QUESTION_BANK_SORT_OPTIONS = [
  { value: 'createdAt_desc', sortBy: 'createdAt', sortOrder: 'desc', label: 'Created (Newest)' },
  { value: 'createdAt_asc', sortBy: 'createdAt', sortOrder: 'asc', label: 'Created (Oldest)' },
  { value: 'questionCode_asc', sortBy: 'questionCode', sortOrder: 'asc', label: 'Code (A–Z)' },
  { value: 'questionCode_desc', sortBy: 'questionCode', sortOrder: 'desc', label: 'Code (Z–A)' },
  { value: 'subject_asc', sortBy: 'subject', sortOrder: 'asc', label: 'Subject (A–Z)' },
  { value: 'difficulty_asc', sortBy: 'difficulty', sortOrder: 'asc', label: 'Difficulty' },
  { value: 'usageCount_desc', sortBy: 'usageCount', sortOrder: 'desc', label: 'Usage (High–Low)' },
  { value: 'type_asc', sortBy: 'type', sortOrder: 'asc', label: 'Type' },
  { value: 'category_asc', sortBy: 'category', sortOrder: 'asc', label: 'Category' },
]

export const BULK_TEMPLATE_SLUGS = {
  MCQ: 'mcq',
  NUMERICAL: 'numerical',
  MATCH_THE_FOLLOWING: 'match-the-following',
  ASSERTION_REASON: 'assertion-reason',
  DESCRIPTIVE: 'descriptive',
}

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
  ASSERTION_ANSWER_OPTIONS.map(({ value, label }) => [label, value]),
)
Object.assign(ASSERTION_UI_TO_ENUM, {
  'Both A and R are true, and R is the correct explanation of A': 'BOTH_TRUE_REASON_EXPLAINS',
  'Both A and R are true, but R is not the correct explanation of A': 'BOTH_TRUE_REASON_NOT_EXPLAINS',
  'A is true, but R is false': 'ASSERTION_TRUE_REASON_FALSE',
  'A is false, but R is true': 'ASSERTION_FALSE_REASON_TRUE',
})

export function typeUiToApi(value) {
  return TYPE_UI_TO_API[value] || String(value || '').toUpperCase().replace(/\s+/g, '_')
}

export function typeApiToUi(value) {
  return TYPE_API_TO_UI[String(value || '').toUpperCase()] || value || ''
}

export function categoryUiToApi(value) {
  const raw = String(value || '').toUpperCase()
  return raw === 'MAINS' || raw === 'Mains' ? 'MAINS' : 'PRELIMS'
}

export function categoryApiToUi(value) {
  return String(value || '').toUpperCase() === 'MAINS' ? 'Mains' : 'Prelims'
}

export function statusUiToApi(value) {
  const raw = String(value || '').toUpperCase()
  if (raw === 'INACTIVE' || raw === 'DEACTIVATED' || raw === 'IN ACTIVE') return 'INACTIVE'
  return 'ACTIVE'
}

export function statusApiToUi(value) {
  return String(value || '').toUpperCase() === 'INACTIVE' ? 'Deactivated' : 'Active'
}

export function difficultyUiToApi(value) {
  const raw = String(value || '').toUpperCase()
  if (raw === 'HARD') return 'HARD'
  if (raw === 'MEDIUM') return 'MEDIUM'
  return 'EASY'
}

export function difficultyApiToUi(value) {
  const raw = String(value || '').toUpperCase()
  if (raw === 'HARD') return 'Hard'
  if (raw === 'MEDIUM') return 'Medium'
  return 'Easy'
}

export function resolveQuestionBankSortPreset(preset) {
  return QUESTION_BANK_SORT_OPTIONS.find((opt) => opt.value === preset) || QUESTION_BANK_SORT_OPTIONS[0]
}

export function mapQuestionBankFilterToApi(filters = {}) {
  /** @type {import('../types/questionBank.types').QuestionListFilters} */
  const params = {
    page: filters.page ?? 1,
    limit: filters.limit ?? 10,
    sortBy: filters.sortBy ?? 'createdAt',
    sortOrder: filters.sortOrder ?? 'desc',
  }

  const search = String(filters.search || '').trim()
  if (search) params.search = search

  if (filters.type && filters.type !== 'all') params.type = typeUiToApi(filters.type)
  if (filters.category && filters.category !== 'all') params.category = categoryUiToApi(filters.category)
  if (filters.subject && filters.subject !== 'all') params.subject = filters.subject
  if (filters.topic && filters.topic !== 'all') params.topic = filters.topic
  if (filters.difficulty && filters.difficulty !== 'all') params.difficulty = difficultyUiToApi(filters.difficulty)
  if (filters.status && filters.status !== 'all') params.status = statusUiToApi(filters.status)
  if (filters.tags && filters.tags !== 'all') params.tags = filters.tags

  return params
}

export function mapAnalyticsFilterToApi(filters = {}) {
  const params = mapQuestionBankFilterToApi(filters)
  delete params.page
  delete params.limit
  delete params.sortBy
  delete params.sortOrder
  return params
}

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
      if (!pairs.length) {
        for (let i = 1; i <= 4; i += 1) {
          content.left[i - 1] = String(doc[`left${i}`] ?? content.left[i - 1] ?? '')
          content.right[i - 1] = String(doc[`right${i}`] ?? content.right[i - 1] ?? '')
        }
      }
      break
    }
    case 'ASSERTION_REASON':
      content.assertion = String(doc.assertion ?? '')
      content.reason = String(doc.reason ?? '')
      content.correctAnswer =
        ASSERTION_ENUM_TO_UI[String(doc.correctAnswer || '').toUpperCase()] ||
        doc.correctAnswerLabel ||
        ''
      break
    default:
      break
  }

  return content
}

/** @param {Record<string, unknown> | null | undefined} doc */
export function mapApiQuestionToLocal(doc) {
  if (!doc || typeof doc !== 'object') return null
  const mongoId = doc._id ?? doc.id
  const questionCode = doc.questionCode ?? ''
  if (!mongoId && !questionCode) return null

  return {
    _id: String(mongoId ?? questionCode),
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
    questionText: doc.questionText || '',
    questionPreview: doc.questionPreview || doc.questionText || '',
    explanation: doc.explanation || '',
    imageUrl: doc.imageUrl || null,
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
    content: buildContentFromApi(doc),
  }
}

export function normalizeQuestionListResponse(data, { page = 1, limit = 10 } = {}) {
  const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
  const items = rows.map(mapApiQuestionToLocal).filter(Boolean)
  const total = Number(data?.total ?? items.length) || 0
  const resolvedPage = Number(data?.page ?? page) || page
  const resolvedLimit = Number(data?.limit ?? limit) || limit
  const totalPages = Number(data?.totalPages ?? Math.max(1, Math.ceil(total / resolvedLimit))) || 1

  return {
    items,
    total,
    page: resolvedPage,
    limit: resolvedLimit,
    totalPages,
    hasNextPage: Boolean(data?.hasNextPage ?? resolvedPage < totalPages),
    hasPrevPage: Boolean(data?.hasPrevPage ?? resolvedPage > 1),
  }
}

export function normalizeQuestionAnalyticsResponse(data) {
  const payload = data?.data ?? data ?? {}
  return {
    totalQuestions: Number(payload.totalQuestions ?? 0) || 0,
    easyCount: Number(payload.easyCount ?? 0) || 0,
    mediumHardCount: Number(payload.mediumHardCount ?? 0) || 0,
  }
}

export function extractEnumArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

function appendIfDefined(formData, key, value) {
  if (value === undefined || value === null) return
  formData.append(key, value)
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

function appendTypeSpecificFields(formData, form) {
  const content = form.content || {}
  const type = typeUiToApi(form.type)

  if (type === 'MCQ') {
    const options = [...(Array.isArray(content.options) ? content.options : []), '', '', '', ''].slice(0, 4)
    appendIfDefined(formData, 'optionA', String(options[0] || '').trim())
    appendIfDefined(formData, 'optionB', String(options[1] || '').trim())
    appendIfDefined(formData, 'optionC', String(options[2] || '').trim())
    appendIfDefined(formData, 'optionD', String(options[3] || '').trim())
    appendIfDefined(formData, 'correctAnswer', 'ABCD'[Number(content.correctOptionIndex ?? 0) || 0] || 'A')
  } else if (type === 'NUMERICAL') {
    appendIfDefined(formData, 'numericalAnswer', String(content.numericalAnswer || '').trim())
  } else if (type === 'MATCH_THE_FOLLOWING') {
    appendIfDefined(formData, 'prompt', String(content.prompt || content.question || '').trim())
    const left = Array.isArray(content.left) ? content.left : []
    const right = Array.isArray(content.right) ? content.right : []
    for (let i = 0; i < 4; i += 1) {
      appendIfDefined(formData, `left${i + 1}`, String(left[i] || '').trim())
      appendIfDefined(formData, `right${i + 1}`, String(right[i] || '').trim())
    }
  } else if (type === 'ASSERTION_REASON') {
    appendIfDefined(formData, 'assertion', String(content.assertion || '').trim())
    appendIfDefined(formData, 'reason', String(content.reason || '').trim())
    const label = String(content.correctAnswer || '')
    appendIfDefined(formData, 'correctAnswer', ASSERTION_UI_TO_ENUM[label] || label)
  }
}

/** @param {Record<string, unknown>} form */
export function buildCreateQuestionFormData(form) {
  const fd = new FormData()
  const content = form.content || {}
  const type = typeUiToApi(form.type)

  fd.append('category', categoryUiToApi(form.category))
  fd.append('type', type)
  fd.append('status', statusUiToApi(form.status))
  fd.append('subject', String(form.subject || '').trim())
  fd.append('topic', String(form.topic || '').trim())
  fd.append('difficulty', difficultyUiToApi(form.difficulty))
  fd.append('tags', (Array.isArray(form.tags) ? form.tags : []).join(','))
  fd.append('questionText', String(content.question || content.prompt || '').trim())
  fd.append('explanation', String(content.explanation || '').trim())

  appendTypeSpecificFields(fd, form)

  if (form.imageFile instanceof File) {
    fd.append('image', form.imageFile)
  } else if (typeof content.imageDataUrl === 'string' && content.imageDataUrl.startsWith('data:')) {
    const file = dataUrlToFile(content.imageDataUrl)
    if (file) fd.append('image', file)
  }

  return fd
}

function normalizeFormSnapshot(form) {
  const content = form.content || {}
  const type = typeUiToApi(form.type)
  const snapshot = {
    category: categoryUiToApi(form.category),
    status: statusUiToApi(form.status),
    subject: String(form.subject || '').trim(),
    topic: String(form.topic || '').trim(),
    difficulty: difficultyUiToApi(form.difficulty),
    tags: (Array.isArray(form.tags) ? form.tags : []).join(','),
    questionText: String(content.question || content.prompt || '').trim(),
    explanation: String(content.explanation || '').trim(),
  }

  if (type === 'MCQ') {
    const options = [...(Array.isArray(content.options) ? content.options : []), '', '', '', ''].slice(0, 4)
    snapshot.optionA = String(options[0] || '').trim()
    snapshot.optionB = String(options[1] || '').trim()
    snapshot.optionC = String(options[2] || '').trim()
    snapshot.optionD = String(options[3] || '').trim()
    snapshot.correctAnswer = 'ABCD'[Number(content.correctOptionIndex ?? 0) || 0] || 'A'
  } else if (type === 'NUMERICAL') {
    snapshot.numericalAnswer = String(content.numericalAnswer || '').trim()
  } else if (type === 'MATCH_THE_FOLLOWING') {
    snapshot.prompt = String(content.prompt || content.question || '').trim()
    const left = Array.isArray(content.left) ? content.left : []
    const right = Array.isArray(content.right) ? content.right : []
    for (let i = 0; i < 4; i += 1) {
      snapshot[`left${i + 1}`] = String(left[i] || '').trim()
      snapshot[`right${i + 1}`] = String(right[i] || '').trim()
    }
  } else if (type === 'ASSERTION_REASON') {
    snapshot.assertion = String(content.assertion || '').trim()
    snapshot.reason = String(content.reason || '').trim()
    const label = String(content.correctAnswer || '')
    snapshot.correctAnswer = ASSERTION_UI_TO_ENUM[label] || label
  }

  return snapshot
}

/** @param {Record<string, unknown>} original @param {Record<string, unknown>} current */
export function buildPartialUpdateFormData(original, current) {
  const prev = normalizeFormSnapshot(original)
  const next = normalizeFormSnapshot(current)
  const fd = new FormData()
  let changed = false

  Object.keys(next).forEach((key) => {
    if (next[key] !== prev[key]) {
      fd.append(key, next[key])
      changed = true
    }
  })

  if (current.removeImage) {
    fd.append('removeImage', 'true')
    changed = true
  }

  if (current.imageFile instanceof File) {
    fd.append('image', current.imageFile)
    changed = true
  } else if (
    typeof current.content?.imageDataUrl === 'string' &&
    current.content.imageDataUrl.startsWith('data:') &&
    current.content.imageDataUrl !== original.content?.imageDataUrl
  ) {
    const file = dataUrlToFile(current.content.imageDataUrl)
    if (file) {
      fd.append('image', file)
      changed = true
    }
  }

  return changed ? fd : null
}

export function mapApiValidationErrors(error) {
  const errors = error?.response?.data?.errors
  if (!Array.isArray(errors)) return {}
  return errors.reduce((acc, item) => {
    if (item?.field) acc[item.field] = item.message
    return acc
  }, {})
}

export function getQuestionBankErrorMessage(error, fallback = 'Something went wrong') {
  return getApiErrorMessage(error, fallback)
}

export function nextQuestionStatus(current) {
  return statusApiToUi(current) === 'Active' ? 'Deactivated' : 'Active'
}

export function bulkTemplateSlugForType(typeUi) {
  const apiType = typeUiToApi(typeUi)
  return BULK_TEMPLATE_SLUGS[apiType] || 'mcq'
}

export function triggerBlobDownload(blob, fileName) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export function mapDuplicatePrefillToForm(data) {
  const mapped = mapApiQuestionToLocal(data)
  if (!mapped) return null
  delete mapped._id
  delete mapped.id
  delete mapped.questionCode
  return mapped
}
