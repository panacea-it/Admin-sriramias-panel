import {
  FREE_RESOURCE_CATEGORY,
  isAllowedFreeResourceCategory,
  MAX_FREE_RESOURCE_QUESTIONS,
  MIN_OPTIONS,
  MAX_OPTIONS,
  normalizeFreeResourceCategory,
  OPTION_LABELS,
} from './freeResourceFormConstants'
import { isPyqPaperFieldRequired } from './pyqPaperHelpers'

export function parseQuestionCount(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (!digits) return 0
  const n = parseInt(digits, 10)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(MAX_FREE_RESOURCE_QUESTIONS, n)
}

export function createEmptyOption(index = 0) {
  return {
    id: `opt-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    label: OPTION_LABELS[index] || String.fromCharCode(65 + index),
    text: '',
  }
}

export function createEmptyFreeResourceQuestion(questionNo, { light = false } = {}) {
  const options = [createEmptyOption(0), createEmptyOption(1), createEmptyOption(2), createEmptyOption(3)]
  return {
    id: `frq-${questionNo}-${Date.now()}`,
    questionNo,
    question: '',
    optionType: 'single',
    options,
    correctAnswers: [],
    explanation: light ? '' : '',
    questionImageName: '',
    explanationImageName: '',
    marks: light ? '' : '1',
    negativeMarks: '',
    saved: false,
  }
}

export function resizeFreeResourceQuestions(questions = [], count = 0) {
  const safeCount = Math.max(0, Math.min(MAX_FREE_RESOURCE_QUESTIONS, count))
  const byNo = new Map()
  for (const q of questions) {
    const no = parseInt(String(q.questionNo), 10)
    if (Number.isFinite(no) && no >= 1 && no <= safeCount && !byNo.has(no)) {
      byNo.set(no, { ...q, questionNo: no })
    }
  }
  const next = []
  for (let i = 1; i <= safeCount; i += 1) {
    next.push(byNo.get(i) || createEmptyFreeResourceQuestion(i))
  }
  return next
}

function stripHtml(html = '') {
  return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function isFreeResourceQuestionComplete(q, { light = false } = {}) {
  if (!stripHtml(q?.question)) return false
  const filled = (q.options || []).filter((o) => String(o?.text || '').trim())
  if (filled.length < MIN_OPTIONS) return false
  const answers = Array.isArray(q.correctAnswers) ? q.correctAnswers : []
  if (!answers.length) return false
  if (q.optionType === 'single' && answers.length !== 1) return false
  if (!light && q.optionType === 'multiple' && answers.length < 1) return false
  return true
}

export function validateFreeResourceQuestion(q, index, { light = false } = {}) {
  const errors = {}
  const slot = index + 1
  if (!stripHtml(q?.question)) errors.question = 'Question is required'

  const options = q?.options || []
  const texts = options.map((o) => String(o?.text || '').trim()).filter(Boolean)
  if (texts.length < MIN_OPTIONS) errors.options = `At least ${MIN_OPTIONS} options required`

  const seen = new Set()
  for (const t of texts) {
    const key = t.toLowerCase()
    if (seen.has(key)) {
      errors.options = 'Duplicate option text is not allowed'
      break
    }
    seen.add(key)
  }

  const answers = Array.isArray(q.correctAnswers) ? q.correctAnswers : []
  if (!answers.length) errors.correctAnswers = 'Select the correct answer(s)'
  if (q.optionType === 'single' && answers.length > 1) {
    errors.correctAnswers = 'Single correct allows only one answer'
  }

  for (const ans of answers) {
    const opt = options.find((o) => o.id === ans || o.label === ans)
    if (!opt?.text?.trim()) errors.correctAnswers = 'Correct answer must match a filled option'
  }

  if (!light && q.negativeMarks && Number(q.negativeMarks) < 0) {
    errors.negativeMarks = 'Invalid negative marks'
  }

  if (Object.keys(errors).length) errors._slot = slot
  return errors
}

export function validateFreeResourceForm(values, { isEdit = false } = {}) {
  const errors = {}
  const category = normalizeFreeResourceCategory(values.category)
  if (!category) errors.category = 'Select a category'
  else if (!isAllowedFreeResourceCategory(category)) {
    errors.category = 'Select a valid category'
  }

  const require = (key, message = 'This field is required') => {
    const v = values[key]
    if (v == null || String(v).trim() === '') errors[key] = message
  }

  switch (category) {
    case 'NCERT Books':
      require('subject')
      require('className')
      require('bookName')
      require('bookFileName', 'Upload book PDF')
      break
    case FREE_RESOURCE_CATEGORY.PREVIOUS_YEAR:
      require('paperType')
      if (isPyqPaperFieldRequired(values.paperType)) {
        require('paper', 'Select paper')
      }
      require('year')
      require('paperName')
      require('questionPaperFileName', 'Upload question paper PDF')
      break
    case FREE_RESOURCE_CATEGORY.MOCK_TEST:
      require('examCategory')
      require('mockTestTitle', 'Mock test title is required')
      require('paperType')
      if (isPyqPaperFieldRequired(values.paperType)) {
        require('paper', 'Select paper')
      }
      require('subject')
      require('topic')
      require('duration')
      require('totalMarks')
      break
    case FREE_RESOURCE_CATEGORY.STUDY_MATERIAL:
      require('mainsCategory', 'Select mains category')
      require('studyMaterialName', 'Study material name is required')
      require('studyMaterialFileName', 'Upload study material')
      break
    default:
      break
  }

  return errors
}

/** Map bulk-import row to free-resource question shape */
export function bulkRowToFreeResourceQuestion(row, index, { light = false } = {}) {
  if (!row || typeof row !== 'object') return null
  const lower = Object.fromEntries(
    Object.keys(row).map((k) => [k.toLowerCase().trim(), row[k]]),
  )
  const question =
    lower.question || lower['question text'] || lower.q || ''
  const questionNo =
    parseInt(
      lower.questionno || lower['question no'] || lower.no || index + 1,
      10,
    ) || index + 1

  const optionTexts = []
  for (let i = 0; i < MAX_OPTIONS; i += 1) {
    const key = `option${i + 1}`
    const letter = OPTION_LABELS[i].toLowerCase()
    const val = lower[key] || lower[`option ${i + 1}`] || lower[letter]
    if (val != null && String(val).trim()) optionTexts.push(String(val).trim())
  }

  if (!String(question).trim() && !optionTexts.length) return null

  const options = optionTexts.length
    ? optionTexts.map((text, i) => ({ ...createEmptyOption(i), text }))
    : [createEmptyOption(0), createEmptyOption(1), createEmptyOption(2), createEmptyOption(3)]

  while (options.length < MIN_OPTIONS) options.push(createEmptyOption(options.length))

  let answerRaw = lower.answer || lower.correct || lower['correct answer'] || ''
  const answers = []
  const tokens = String(answerRaw)
    .split(/[,;|]/)
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean)

  for (const t of tokens) {
    if (/^[1-6]$/.test(t)) {
      const idx = parseInt(t, 10) - 1
      if (options[idx]) answers.push(options[idx].id)
    } else if (/^[A-F]$/.test(t)) {
      const opt = options.find((o) => o.label === t)
      if (opt) answers.push(opt.id)
    }
  }

  const optionType =
    lower.optiontype === 'multiple' ||
    lower['option type'] === 'multiple' ||
    answers.length > 1
      ? 'multiple'
      : 'single'

  const q = createEmptyFreeResourceQuestion(questionNo, { light })
  return {
    ...q,
    questionNo,
    question: String(question).trim(),
    options: options.slice(0, MAX_OPTIONS),
    optionType,
    correctAnswers: optionType === 'single' ? answers.slice(0, 1) : answers,
    explanation: String(lower.explanation || '').trim(),
    marks: String(lower.marks || (light ? '1' : '1')),
    negativeMarks: String(lower.negativemarks || lower['negative marks'] || ''),
    saved: true,
  }
}

export async function parseFreeResourceBulkFile(file) {
  const name = file.name.toLowerCase()
  const ext = name.split('.').pop()

  if (ext === 'json') {
    const text = await file.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      return { success: [], failed: [{ row: 1, message: 'Invalid JSON file' }] }
    }
    const rows = Array.isArray(data) ? data : data?.questions || []
    const success = []
    const failed = []
    rows.forEach((row, i) => {
      try {
        const q = bulkRowToFreeResourceQuestion(row, i)
        if (q) success.push(q)
        else failed.push({ row: i + 1, message: 'Empty question row' })
      } catch (err) {
        failed.push({ row: i + 1, message: err.message || 'Parse error' })
      }
    })
    return { success, failed }
  }

  const { parseQuestionBulkFile } = await import('./batchQuestionBulkUpload')
  const result = await parseQuestionBulkFile(file)
  const success = []
  const failed = []
  ;(result.questions || []).forEach((legacy, i) => {
    const q = bulkRowToFreeResourceQuestion(
      {
        questionNo: legacy.questionNo,
        question: legacy.question,
        option1: legacy.options?.[0],
        option2: legacy.options?.[1],
        option3: legacy.options?.[2],
        option4: legacy.options?.[3],
        answer: legacy.answer,
      },
      i,
    )
    if (q) success.push(q)
    else failed.push({ row: i + 1, message: 'Could not map question' })
  })
  return { success, failed, note: result.metadata?.note }
}

export function saveDraftToStorage(draftId, values) {
  try {
    const payload = { id: draftId, savedAt: new Date().toISOString(), values }
    localStorage.setItem(
      `free-resource-draft:${draftId}`,
      JSON.stringify(payload),
    )
  } catch {
    /* ignore quota */
  }
}

export function loadDraftFromStorage(draftId) {
  try {
    const raw = localStorage.getItem(`free-resource-draft:${draftId}`)
    if (!raw) return null
    return JSON.parse(raw)?.values ?? null
  } catch {
    return null
  }
}

export function clearDraftStorage(draftId) {
  try {
    localStorage.removeItem(`free-resource-draft:${draftId}`)
  } catch {
    /* ignore */
  }
}
