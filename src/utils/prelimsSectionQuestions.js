export const PRELIMS_QUESTION_TYPES = [
  { value: 'mcq', label: 'MCQ' },
  { value: 'multiSelect', label: 'Multi Select' },
  { value: 'trueFalse', label: 'True/False' },
]

export const PRELIMS_DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

export const PRELIMS_SECTION_BULK_ACCEPT =
  '.xlsx,.xls,.csv,.docx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export const PRELIMS_SECTION_TEMPLATE_CSV = [
  'QuestionNo,QuestionType,QuestionText,OptionA,OptionB,OptionC,OptionD,CorrectAnswer,Explanation,Difficulty,Marks,NegativeMarks,Status',
  '1,mcq,Sample question text?,Option A,Option B,Option C,Option D,1,Optional explanation,medium,,,active',
].join('\n')

export function downloadPrelimsSectionTemplate() {
  const blob = new Blob([PRELIMS_SECTION_TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'prelims-section-questions-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function createEmptyPrelimsSectionQuestion(slotNo = 1) {
  return {
    questionId: `pq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    questionNo: slotNo,
    questionType: 'mcq',
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    difficulty: 'medium',
    marks: '',
    negativeMarks: '',
    image: '',
    status: 'active',
  }
}

export function parseSectionQuestionCount(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (!digits) return 0
  const n = parseInt(digits, 10)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(500, n)
}

export function normalizePrelimsSectionQuestion(raw = {}, index = 0) {
  const questionNo = parseInt(String(raw.questionNo ?? index + 1), 10) || index + 1
  const options = Array.isArray(raw.options)
    ? raw.options.map((o) => String(o || '').trim()).slice(0, 4)
    : [raw.optionA, raw.option1, raw.option2, raw.option3, raw.option4]
        .filter((_, i) => i === 0 || raw[`option${i}`] !== undefined)
        .map((o) => String(o || '').trim())

  while (options.length < 4) options.push('')

  const typeRaw = String(raw.questionType || 'mcq')
    .toLowerCase()
    .replace(/[\s/_-]+/g, '')
  const questionType =
    typeRaw === 'multiselect'
      ? 'multiSelect'
      : typeRaw === 'truefalse'
        ? 'trueFalse'
        : 'mcq'

  const status =
    String(raw.status || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active'

  const difficultyRaw = String(raw.difficulty || 'medium').toLowerCase()
  const difficulty = ['easy', 'hard'].includes(difficultyRaw) ? difficultyRaw : 'medium'

  return {
    questionId: raw.questionId || createEmptyPrelimsSectionQuestion(questionNo).questionId,
    questionNo,
    questionType,
    questionText: String(raw.questionText || raw.question || '').trim(),
    options:
      questionType === 'trueFalse'
        ? [options[0] || 'True', options[1] || 'False', '', '']
        : options,
    correctAnswer: String(raw.correctAnswer || raw.answer || '').trim(),
    explanation: String(raw.explanation || '').trim(),
    difficulty,
    marks: raw.marks === '' || raw.marks == null ? '' : String(raw.marks),
    negativeMarks:
      raw.negativeMarks === '' || raw.negativeMarks == null ? '' : String(raw.negativeMarks),
    image: String(raw.image || raw.imageFileName || '').trim(),
    status,
  }
}

export function normalizePrelimsSectionQuestions(rawQuestions = []) {
  if (!Array.isArray(rawQuestions)) return []
  const seen = new Set()
  return rawQuestions
    .map((q, i) => normalizePrelimsSectionQuestion(q, i))
    .filter((q) => {
      const key = String(q.questionNo)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

export function resizeSectionQuestionsForCount(questions = [], count = 0) {
  const safeCount = Math.max(0, Math.min(500, count))
  const byNo = new Map()
  for (const q of normalizePrelimsSectionQuestions(questions)) {
    const no = parseInt(String(q.questionNo), 10)
    if (Number.isFinite(no) && no >= 1 && no <= safeCount && !byNo.has(no)) {
      byNo.set(no, { ...q, questionNo: no })
    }
  }
  const next = []
  for (let i = 1; i <= safeCount; i += 1) {
    next.push(byNo.get(i) || createEmptyPrelimsSectionQuestion(i))
  }
  return next
}

export function deriveSectionQuestionCount(section = {}) {
  const explicit = parseSectionQuestionCount(section.questionCount)
  if (explicit > 0) return explicit
  const fromTotal = parseSectionQuestionCount(section.totalQuestions)
  if (fromTotal > 0) return fromTotal
  const qs = section.questions || []
  return qs.length ? Math.max(...qs.map((q) => q.questionNo || 0), qs.length) : 0
}

export function questionToSectionDraft(question, slotNo) {
  const q = question || createEmptyPrelimsSectionQuestion(slotNo)
  return {
    questionNo: String(q.questionNo ?? slotNo),
    questionType: q.questionType || 'mcq',
    questionText: q.questionText || '',
    option1: q.options?.[0] || '',
    option2: q.options?.[1] || '',
    option3: q.options?.[2] || '',
    option4: q.options?.[3] || '',
    correctAnswer: q.correctAnswer || '',
    explanation: q.explanation || '',
    difficulty: q.difficulty || 'medium',
    marks: q.marks ?? '',
    negativeMarks: q.negativeMarks ?? '',
    image: q.image || '',
    status: q.status || 'active',
  }
}

export function draftToSectionQuestion(draft, existingQuestion) {
  const options = [draft.option1, draft.option2, draft.option3, draft.option4].map((o) =>
    String(o || '').trim(),
  )
  return normalizePrelimsSectionQuestion(
    {
      questionId: existingQuestion?.questionId,
      questionNo: draft.questionNo,
      questionType: draft.questionType,
      questionText: draft.questionText,
      options,
      correctAnswer: draft.correctAnswer,
      explanation: draft.explanation,
      difficulty: draft.difficulty,
      marks: draft.marks,
      negativeMarks: draft.negativeMarks,
      image: draft.image,
      status: draft.status,
    },
    parseInt(String(draft.questionNo), 10) - 1,
  )
}

export function isPrelimsSectionQuestionComplete(question) {
  if (question?.status === 'inactive') return true
  if (!question?.questionText?.trim()) return false
  const type = question.questionType || 'mcq'
  const options = (question.options || []).map((o) => String(o || '').trim())
  if (type === 'trueFalse') {
    if (!options[0] || !options[1]) return false
  } else if (options.filter(Boolean).length < 2) {
    return false
  }
  if (!String(question.correctAnswer || '').trim()) return false
  return true
}

export function countCompletedSectionQuestions(questions = []) {
  return normalizePrelimsSectionQuestions(questions).filter(isPrelimsSectionQuestionComplete).length
}

export function validatePrelimsSectionQuestionDraft(draft, { slotNo, allQuestions = [] } = {}) {
  const errors = {}
  const no = parseInt(String(draft.questionNo), 10)
  if (!Number.isFinite(no) || no < 1) errors.questionNo = 'Invalid question number'
  else if (no !== slotNo) {
    const dup = allQuestions.some(
      (q, i) => i !== slotNo - 1 && parseInt(String(q.questionNo), 10) === no,
    )
    if (dup) errors.questionNo = `Question number ${no} is already used`
  }

  if (!String(draft.questionText || '').trim()) errors.questionText = 'Question text is required'

  const type = draft.questionType || 'mcq'
  const opts = [draft.option1, draft.option2, draft.option3, draft.option4].map((o) =>
    String(o || '').trim(),
  )

  if (type === 'trueFalse') {
    if (!opts[0] || !opts[1]) errors.options = 'True and False options are required'
  } else if (opts.filter(Boolean).length < 2) {
    errors.options = 'At least two options are required'
  }

  if (!String(draft.correctAnswer || '').trim()) {
    errors.correctAnswer = 'Correct answer is required'
  } else if (type !== 'multiSelect' && !/^[1-4]$/.test(String(draft.correctAnswer).trim())) {
    errors.correctAnswer = 'Select a valid correct answer'
  }

  return errors
}

/** Convert bulk-imported legacy questions into section question format. */
export function mapBulkImportToSectionQuestions(incoming = []) {
  return incoming.map((q, index) =>
    normalizePrelimsSectionQuestion(
      {
        questionNo: q.questionNo ?? index + 1,
        questionType: 'mcq',
        questionText: q.question,
        options: q.options,
        correctAnswer: q.answer,
        difficulty: 'medium',
        status: 'active',
      },
      index,
    ),
  )
}

export function findDuplicateSectionQuestionNos(questions = []) {
  const seen = new Set()
  const dups = new Set()
  for (const q of questions) {
    const key = String(q.questionNo)
    if (seen.has(key)) dups.add(key)
    else seen.add(key)
  }
  return dups
}
