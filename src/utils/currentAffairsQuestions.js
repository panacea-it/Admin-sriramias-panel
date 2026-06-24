export const MAX_SECTION_QUESTIONS = 100
export const QUESTION_LIST_RENDER_CHUNK = 25

const OPTION_LETTERS = ['A', 'B', 'C', 'D']

export function getOptionLetter(index) {
  return OPTION_LETTERS[index] || String(index + 1)
}

export function createEmptyCurrentAffairsQuestionAtNo(questionNo) {
  const no = Number(questionNo)
  return {
    id: `ca-q-${no}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    questionNo: String(no),
    question: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    answer: '',
    explanation: '',
    imageName: '',
    image: null,
  }
}

/** @deprecated Prefer createEmptyCurrentAffairsQuestionAtNo for range-based lists */
export function createEmptyCurrentAffairsQuestion(index = 0) {
  return createEmptyCurrentAffairsQuestionAtNo(index + 1)
}

export function parseSectionRange(sectionFrom, sectionTo) {
  const fieldErrors = {}
  const fromRaw = String(sectionFrom ?? '').trim()
  const toRaw = String(sectionTo ?? '').trim()

  if (!fromRaw) fieldErrors.sectionFrom = 'From is required'
  if (!toRaw) fieldErrors.sectionTo = 'To is required'

  if (Object.keys(fieldErrors).length) {
    return { valid: false, fieldErrors, from: null, to: null, count: 0 }
  }

  const from = parseInt(fromRaw, 10)
  const to = parseInt(toRaw, 10)

  if (!Number.isFinite(from) || from < 1) {
    fieldErrors.sectionFrom = 'Enter a valid From value (1 or greater)'
  }
  if (!Number.isFinite(to) || to < 1) {
    fieldErrors.sectionTo = 'Enter a valid To value (1 or greater)'
  }

  if (Object.keys(fieldErrors).length) {
    return { valid: false, fieldErrors, from: null, to: null, count: 0 }
  }

  if (from > to) {
    fieldErrors.sectionRange = 'From value must be less than or equal to To value'
    fieldErrors.sectionFrom = 'From cannot be greater than To'
  }

  const count = to - from + 1
  if (count > MAX_SECTION_QUESTIONS) {
    fieldErrors.sectionRange = `Maximum ${MAX_SECTION_QUESTIONS} questions allowed`
    fieldErrors.sectionTo = `Reduce range to ${MAX_SECTION_QUESTIONS} questions or fewer`
  }

  if (Object.keys(fieldErrors).length) {
    return { valid: false, fieldErrors, from, to, count }
  }

  return { valid: true, fieldErrors: {}, from, to, count }
}

/** Build question blocks for inclusive range [from..to], preserving existing answers by questionNo */
export function generateQuestionsFromRange(from, to, existing = []) {
  const byNo = new Map()
  for (const q of existing) {
    const no = parseInt(String(q.questionNo), 10)
    if (Number.isFinite(no) && no >= from && no <= to && !byNo.has(no)) {
      byNo.set(no, { ...q, questionNo: String(no) })
    }
  }

  const questions = []
  for (let n = from; n <= to; n += 1) {
    questions.push(byNo.get(n) || createEmptyCurrentAffairsQuestionAtNo(n))
  }
  return questions
}

export function renumberCurrentAffairsQuestions(questions = [], { startAt = 1 } = {}) {
  return questions.map((q, i) => ({
    ...q,
    questionNo: String(startAt + i),
  }))
}

export function validateCurrentAffairsQuestion(q, index) {
  const errors = {}
  const prefix = `q${index}`

  if (!String(q.question || '').trim()) {
    errors[`${prefix}.question`] = 'Question is required'
  }

  const opts = [q.option1, q.option2, q.option3, q.option4].map((o) => String(o || '').trim())
  const filled = opts.filter(Boolean)
  if (filled.length < 2) {
    errors[`${prefix}.options`] = 'At least two options are required'
  }

  if (!String(q.answer || '').trim()) {
    errors[`${prefix}.answer`] = 'Select the correct answer'
  }

  return errors
}

export function duplicateCurrentAffairsQuestion(question, nextQuestionNo) {
  return {
    ...question,
    id: `ca-q-dup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    questionNo: String(nextQuestionNo),
    image: null,
    imageName: question.imageName ? `${question.imageName}` : '',
  }
}

export function bulkRowToCurrentAffairsQuestion(row, index) {
  if (!row || typeof row !== 'object') return null
  const keys = Object.keys(row)
  const lower = Object.fromEntries(keys.map((k) => [k.toLowerCase().trim(), row[k]]))

  const question =
    lower.question || lower['question text'] || lower.q || ''
  const questionNo =
    lower.questionno ||
    lower['question no'] ||
    lower['question number'] ||
    lower.no ||
    index + 1

  const parseAnswer = (raw) => {
    const t = String(raw || '').trim().toUpperCase()
    if (/^[1-4]$/.test(t)) return t
    if (/^[A-D]$/.test(t)) return String('ABCD'.indexOf(t) + 1)
    return String(raw || '').trim()
  }

  const option1 = lower.option1 || lower['option 1'] || lower.a || ''
  const option2 = lower.option2 || lower['option 2'] || lower.b || ''
  const option3 = lower.option3 || lower['option 3'] || lower.c || ''
  const option4 = lower.option4 || lower['option 4'] || lower.d || ''

  if (!String(question).trim()) return null

  const no = parseInt(String(questionNo), 10) || index + 1
  return {
    ...createEmptyCurrentAffairsQuestionAtNo(no),
    question: String(question).trim(),
    option1: String(option1).trim(),
    option2: String(option2).trim(),
    option3: String(option3).trim(),
    option4: String(option4).trim(),
    answer: parseAnswer(lower.answer || lower.correct || lower['correct answer']),
    explanation: String(lower.explanation || lower.exp || '').trim(),
  }
}
