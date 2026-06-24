import { QUESTION_BANK_TYPES, QUESTION_CATEGORIES, QUESTION_DIFFICULTIES, QUESTION_STATUSES } from '../data/testManagementSeed'

export const DEFAULT_QUESTION_STATUS = QUESTION_STATUSES[0]
export const DEFAULT_QUESTION_DIFFICULTY = QUESTION_DIFFICULTIES[0]
export const DEFAULT_QUESTION_CATEGORY = QUESTION_CATEGORIES[0]
export const DEFAULT_QUESTION_TYPE = QUESTION_BANK_TYPES[0]

export function createEmptyQuestionForm() {
  return {
    category: DEFAULT_QUESTION_CATEGORY,
    type: DEFAULT_QUESTION_TYPE,
    subject: '',
    topic: '',
    difficulty: DEFAULT_QUESTION_DIFFICULTY,
    tags: [],
    status: DEFAULT_QUESTION_STATUS,
    usageCount: 0,
    content: {
      question: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      explanation: '',
      imageDataUrl: '',
      numericalAnswer: '',
      prompt: '',
      left: ['', '', '', ''],
      right: ['', '', '', ''],
      mapping: [0, 1, 2, 3],
      assertion: '',
      reason: '',
      correctAnswer: '',
    },
  }
}

function normalizeStatus(status) {
  if (status === 'In Active') return 'Deactivated'
  return status
}

function inferCategoryFromLegacy(row) {
  return inferCategoryFromRow(row)
}

export function pickLegacyQuestionText(content = {}) {
  return (
    content.question ??
    content.stem ??
    content.prompt ??
    content.statement ??
    ''
  )
}

export function getQuestionPreviewText(row) {
  if (!row) return ''
  return String(pickLegacyQuestionText(row.content || {}) || row.title || '').trim()
}

export function inferCategoryFromRow(row) {
  if (row?.category === 'Prelims' || row?.category === 'Mains') return row.category
  if (row?.type === 'MCQ' || row?.type === 'True/False') return 'Prelims'
  return 'Mains'
}

export function nextQuestionStatus(current) {
  const normalized = current === 'In Active' ? 'Deactivated' : current
  return normalized === 'Active' ? 'Deactivated' : 'Active'
}

export function questionRowToForm(row) {
  const base = createEmptyQuestionForm()
  const category = inferCategoryFromLegacy(row)
  const legacyContent = row?.content || {}
  const question = String(pickLegacyQuestionText(legacyContent) || '')
  const opts = Array.isArray(legacyContent.options) ? legacyContent.options.map((o) => String(o ?? '')) : []
  const options = [...opts, '', '', '', ''].slice(0, 4)
  const correctOptionIndex = Number(legacyContent.correctOptionIndex ?? 0) || 0
  return {
    ...base,
    ...row,
    category,
    status: normalizeStatus(row?.status ?? base.status),
    type: row?.type || (category === 'Prelims' ? 'MCQ' : 'Descriptive'),
    subject: row?.subject || '',
    topic: row?.topic || '',
    difficulty: row?.difficulty || base.difficulty,
    tags: Array.isArray(row?.tags) ? row.tags : [],
    usageCount: Number(row?.usageCount ?? 0) || 0,
    content: {
      ...base.content,
      question,
      options,
      correctOptionIndex,
      explanation: String(legacyContent.explanation || ''),
      numericalAnswer: String(legacyContent.numericalAnswer || ''),
      prompt: String(legacyContent.prompt || ''),
      left: Array.isArray(legacyContent.left) ? legacyContent.left : base.content.left,
      right: Array.isArray(legacyContent.right) ? legacyContent.right : base.content.right,
      mapping: Array.isArray(legacyContent.mapping) ? legacyContent.mapping : base.content.mapping,
      assertion: String(legacyContent.assertion || ''),
      reason: String(legacyContent.reason || ''),
      correctAnswer: String(legacyContent.correctAnswer || ''),
    },
  }
}

export function validateQuestionForm(form) {
  const errors = {}
  if (!String(form.category || '').trim()) errors.category = 'Question category is required'
  if (!String(form.type || '').trim()) errors.type = 'Question type is required'
  if (!String(form.subject || '').trim()) errors.subject = 'Subject is required'
  if (!String(form.topic || '').trim()) errors.topic = 'Topic is required'
  if (!String(form.difficulty || '').trim()) errors.difficulty = 'Difficulty is required'
  if (!String(form.status || '').trim()) errors.status = 'Status is required'

  const content = form.content || {}
  const type = String(form.type || '')
  if (type === 'Assertion Reason') {
    if (!String(content.assertion || '').trim()) errors.assertion = 'Assertion is required'
    if (!String(content.reason || '').trim()) errors.reason = 'Reason is required'
    if (!String(content.correctAnswer || '').trim()) errors.correctAnswer = 'Select the correct option'
  } else if (type === 'Match the Following') {
    const left = Array.isArray(content.left) ? content.left : []
    const right = Array.isArray(content.right) ? content.right : []
    if (left.filter((x) => String(x || '').trim()).length < 2) errors.left = 'Add at least 2 left items'
    if (right.filter((x) => String(x || '').trim()).length < 2) errors.right = 'Add at least 2 right items'
  } else {
    if (!String(content.question || '').trim()) errors.question = 'Question text is required'
  }

  if (type === 'MCQ') {
    const options = Array.isArray(content.options) ? content.options : []
    const normalized = [...options.map((o) => String(o ?? '')), '', '', '', ''].slice(0, 4)
    if (normalized.some((o) => !o.trim())) errors.options = 'All 4 options are required'
    const idx = Number(content.correctOptionIndex)
    if (!Number.isFinite(idx) || idx < 0 || idx > 3) errors.correctOptionIndex = 'Select correct answer'
  }
  if (type === 'Numerical') {
    if (!String(content.numericalAnswer || '').trim()) errors.numericalAnswer = 'Numerical answer is required'
  }

  return errors
}

