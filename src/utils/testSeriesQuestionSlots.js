import {
  createEmptyQuestionDraft,
  normalizeTestSeriesQuestion,
} from './batchTestSeriesForm'

export const MAX_QUESTION_COUNT = 500
export const QUESTION_BLOCK_WINDOW_CHUNK = 25
export const COLLAPSE_ALL_ABOVE_COUNT = 8

export function parseQuestionCount(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (!digits) return 0
  const n = parseInt(digits, 10)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(MAX_QUESTION_COUNT, n)
}

export function createPlaceholderQuestion(questionNo) {
  return {
    id: `slot-${questionNo}-${Date.now()}`,
    questionNo,
    question: '',
    options: ['', '', '', ''],
    answer: '',
  }
}

export function questionToDraft(question, slotNo) {
  const q = question || createPlaceholderQuestion(slotNo)
  return {
    questionNo: String(q.questionNo ?? slotNo),
    question: q.question || '',
    option1: q.options?.[0] || '',
    option2: q.options?.[1] || '',
    option3: q.options?.[2] || '',
    option4: q.options?.[3] || '',
    answer: q.answer || '',
  }
}

export function draftToQuestion(draft, existingQuestion) {
  const options = [draft.option1, draft.option2, draft.option3, draft.option4].map((o) =>
    String(o || '').trim(),
  )
  return normalizeTestSeriesQuestion(
    {
      id: existingQuestion?.id,
      questionNo: draft.questionNo,
      question: draft.question,
      options,
      answer: draft.answer,
    },
    parseInt(String(draft.questionNo), 10) - 1,
  )
}

export function isQuestionComplete(question) {
  if (!question?.question?.trim()) return false
  const filledOptions = (question.options || []).filter((o) => String(o || '').trim())
  if (filledOptions.length < 2) return false
  if (!String(question.answer || '').trim()) return false
  return true
}

export function countCompletedQuestions(questions = []) {
  return questions.filter(isQuestionComplete).length
}

/** Resize slot list 1..count; preserve data for slots that remain. */
export function resizeQuestionsForCount(questions = [], count = 0) {
  const safeCount = Math.max(0, Math.min(MAX_QUESTION_COUNT, count))
  const byNo = new Map()
  for (const q of questions) {
    const no = parseInt(String(q.questionNo), 10)
    if (Number.isFinite(no) && no >= 1 && no <= safeCount && !byNo.has(no)) {
      byNo.set(no, { ...q, questionNo: no })
    }
  }

  const next = []
  for (let i = 1; i <= safeCount; i += 1) {
    next.push(byNo.get(i) || createPlaceholderQuestion(i))
  }
  return next
}

export function deriveQuestionCount(block = {}) {
  const explicit = parseQuestionCount(block.questionCount)
  if (explicit > 0) return explicit
  const questions = block.questions || []
  if (!questions.length) return 0
  const maxNo = Math.max(...questions.map((q) => q.questionNo || 0))
  return Math.max(questions.length, maxNo)
}

export function findDuplicateQuestionNumbers(questions = []) {
  const seen = new Map()
  const duplicates = []
  for (const q of questions) {
    const key = String(q.questionNo)
    if (seen.has(key)) {
      duplicates.push(key)
    } else {
      seen.set(key, q.id)
    }
  }
  return [...new Set(duplicates)]
}

export function validateQuestionDraft(draft, { slotNo, allQuestions = [] } = {}) {
  const errors = {}
  const no = parseInt(String(draft.questionNo), 10)
  if (!Number.isFinite(no) || no < 1) {
    errors.questionNo = 'Enter a valid question number'
  } else {
    const conflict = allQuestions.some(
      (q, idx) => q.questionNo === no && idx + 1 !== slotNo,
    )
    if (conflict) errors.questionNo = 'Question number already used'
  }

  if (!draft.question?.trim()) errors.question = 'Question is required'

  const options = [draft.option1, draft.option2, draft.option3, draft.option4]
  const filled = options.map((o) => String(o || '').trim()).filter(Boolean)
  if (filled.length < 2) {
    errors.options = 'Enter at least 2 options'
  }

  if (!String(draft.answer || '').trim()) {
    errors.answer = 'Select the correct answer'
  } else {
    const ans = parseInt(String(draft.answer), 10)
    if (!Number.isFinite(ans) || ans < 1 || ans > 4) {
      errors.answer = 'Select a valid option'
    } else if (!options[ans - 1]?.trim()) {
      errors.answer = 'Correct answer must match a filled option'
    }
  }

  return errors
}

/** Form-level validation for test series questions. */
export function validateTestSeriesQuestions(testSeriesBlock = {}, { errorPrefix = 'testSeries_' } = {}) {
  const errors = {}
  const count = deriveQuestionCount(testSeriesBlock)
  const questions = resizeQuestionsForCount(testSeriesBlock.questions || [], count)
  const p = errorPrefix

  if (count < 1) {
    errors[`${p}questions`] = 'Enter number of questions and complete each block'
    return errors
  }

  const duplicates = findDuplicateQuestionNumbers(questions)
  if (duplicates.length) {
    errors[`${p}questions`] = `Duplicate question numbers: ${duplicates.join(', ')}`
  }

  const incomplete = []
  for (let i = 0; i < count; i += 1) {
    const q = questions[i]
    if (!isQuestionComplete(q)) incomplete.push(i + 1)
  }

  if (incomplete.length) {
    errors[`${p}questions`] =
      incomplete.length === count
        ? `Complete all ${count} questions`
        : `Complete questions: ${incomplete.slice(0, 8).join(', ')}${incomplete.length > 8 ? '…' : ''}`
  }

  return errors
}

export { createEmptyQuestionDraft }
