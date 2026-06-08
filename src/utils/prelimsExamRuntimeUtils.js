import { normalizeTestSeriesBlock } from './batchTestSeriesForm'

/** Deterministic shuffle using a seed (e.g. studentId + testId). */
export function seededShuffle(items = [], seed = '') {
  const list = [...items]
  let h = 2166136261
  const str = String(seed)
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  let state = h >>> 0
  const rand = () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}

function parseCorrectIndices(correctAnswer = '') {
  return String(correctAnswer || '')
    .split(/[,|/]/g)
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 1)
}

/** Shuffle options while preserving correct answer indices. */
export function shuffleQuestionOptions(question, seed = '') {
  const options = (question.options || []).map((o) => String(o || ''))
  const correctIndices = parseCorrectIndices(question.correctAnswer || question.answer)
  const indexed = options.map((text, i) => ({ text, originalIndex: i + 1 }))
  const filled = indexed.filter((o) => o.text.trim())
  const shuffled = seededShuffle(filled, `${seed}-opts-${question.questionId || question.id || question.questionNo}`)
  const newCorrect = correctIndices
    .map((orig) => {
      const pos = shuffled.findIndex((o) => o.originalIndex === orig)
      return pos >= 0 ? pos + 1 : null
    })
    .filter((n) => n != null)
  return {
    ...question,
    options: shuffled.map((o) => o.text),
    correctAnswer: newCorrect.length ? newCorrect.join(',') : question.correctAnswer,
    answer: newCorrect.length === 1 ? String(newCorrect[0]) : question.answer,
    _optionOrder: shuffled.map((o) => o.originalIndex),
  }
}

export function applyQuestionRandomization(questions = [], { shuffleQuestions, shuffleOptions, seed }) {
  let list = [...questions]
  if (shuffleQuestions) {
    list = seededShuffle(list, `${seed}-questions`)
  }
  if (shuffleOptions) {
    list = list.map((q) => shuffleQuestionOptions(q, seed))
  }
  return list
}

function getPeriodKey(type, date = new Date()) {
  if (type === 'daily') return date.toISOString().slice(0, 10)
  if (type === 'weekly') {
    const d = new Date(date)
    const day = d.getUTCDay()
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1)
    d.setUTCDate(diff)
    return d.toISOString().slice(0, 10)
  }
  return 'lifetime'
}

/** Count attempts in the current restriction window. */
export function countAttemptsInWindow(attemptHistory = [], restrictionType = 'lifetime', now = new Date()) {
  if (restrictionType === 'lifetime') return attemptHistory.length
  const key = getPeriodKey(restrictionType, now)
  return attemptHistory.filter((a) => {
    const at = new Date(a.attemptedAt || a.date || a)
    if (Number.isNaN(at.getTime())) return false
    return getPeriodKey(restrictionType, at) === key
  }).length
}

export function resolveAttemptStatus(testSeriesRaw = {}, attemptHistory = []) {
  const ts = normalizeTestSeriesBlock(testSeriesRaw)
  if (!ts.attemptLimitEnabled) {
    return {
      allowed: true,
      unlimited: true,
      maxAttempts: null,
      usedAttempts: attemptHistory.length,
      remainingAttempts: null,
      showRemainingAttempts: false,
      message: null,
    }
  }

  const max = ts.maxAttempts || 1
  const used = countAttemptsInWindow(attemptHistory, ts.attemptRestrictionType)
  const remaining = Math.max(0, max - used)
  const allowed = remaining > 0

  return {
    allowed,
    unlimited: false,
    maxAttempts: max,
    usedAttempts: used,
    remainingAttempts: remaining,
    showRemainingAttempts: Boolean(ts.showRemainingAttempts),
    attemptRestrictionType: ts.attemptRestrictionType,
    message: allowed
      ? null
      : 'You have already used all attempts for this test.',
  }
}

export function buildPrelimsExamRuntimeConfig(testSeriesRaw = {}, { studentSeed = '' } = {}) {
  const ts = normalizeTestSeriesBlock(testSeriesRaw)
  return {
    attemptLimitEnabled: ts.attemptLimitEnabled,
    maxAttempts: ts.maxAttempts,
    attemptRestrictionType: ts.attemptRestrictionType,
    showRemainingAttempts: ts.showRemainingAttempts,
    shuffleQuestions: ts.shuffleQuestions,
    shuffleOptions: ts.shuffleOptions,
    shuffleSections: ts.sectionWiseEnabled ? ts.shuffleSections : false,
    studentSeed,
  }
}
