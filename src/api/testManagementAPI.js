import {
  SEED_QUESTIONS,
  SEED_TEST_CONFIGS,
  SEED_TEST_INTEGRATIONS,
  SEED_RESULTS,
} from '../data/testManagementSeed'
import {
  SEED_BATCHES,
  SEED_RESULTS_ENGINE,
  SEED_STUDENTS,
  SEED_SUBJECTS,
  SEED_TESTS,
} from '../data/resultsAnalyticsEngineSeed'
import { computeAIRRanks } from '../utils/testManagement/rankingEngine'

const DELAY_MS = 160

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

function loadStore(key, seed) {
  if (typeof window === 'undefined') return seed
  const raw = window.localStorage.getItem(key)
  if (!raw) {
    window.localStorage.setItem(key, JSON.stringify(seed))
    return seed
  }
  const parsed = safeJsonParse(raw, seed)
  return Array.isArray(parsed) ? parsed : seed
}

function saveStore(key, list) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(list))
}

const KEYS = {
  questions: 'tm_questions_bank_v1',
  questionsLegacy: 'tm_questions_v1',
  configs: 'tm_configs_v1',
  integrations: 'tm_integrations_v1',
  results: 'tm_results_v1',
  resultsEngine: 'tm_results_engine_v1',
}

function filterByQuery(list, q, keys) {
  const query = String(q || '').trim().toLowerCase()
  if (!query) return list
  return list.filter((row) =>
    keys.some((k) => String(row[k] || '').toLowerCase().includes(query)),
  )
}

function normalizeStatus(status) {
  if (status === 'In Active') return 'Deactivated'
  return status
}

function inferCategory(row) {
  if (row?.category === 'Prelims' || row?.category === 'Mains') return row.category
  if (row?.type === 'MCQ' || row?.type === 'True/False') return 'Prelims'
  return 'Mains'
}

function extractQuestionText(row) {
  const c = row?.content || {}
  return (
    c.question ??
    c.stem ??
    c.prompt ??
    c.statement ??
    c.assertion ??
    ''
  )
}

function migrateLegacyQuestions(list) {
  if (!Array.isArray(list)) return SEED_QUESTIONS
  return list.map((row) => {
    const category = inferCategory(row)
    const questionText = extractQuestionText(row)
    const content = { ...(row.content || {}) }
    if (questionText && !content.question) content.question = questionText
    if (category === 'Prelims') {
      const opts = Array.isArray(content.options) ? content.options : []
      content.options = [...opts.map((o) => String(o ?? '')), '', '', '', ''].slice(0, 4)
      content.correctOptionIndex = Number(content.correctOptionIndex ?? 0) || 0
    }
    return {
      ...row,
      status: normalizeStatus(row.status),
      category,
      content,
    }
  })
}

function loadQuestionsStore() {
  if (typeof window === 'undefined') return SEED_QUESTIONS
  const current = window.localStorage.getItem(KEYS.questions)
  if (current) {
    const parsed = safeJsonParse(current, SEED_QUESTIONS)
    return Array.isArray(parsed) ? parsed : SEED_QUESTIONS
  }
  const legacyRaw = window.localStorage.getItem(KEYS.questionsLegacy)
  if (legacyRaw) {
    const migrated = migrateLegacyQuestions(safeJsonParse(legacyRaw, SEED_QUESTIONS))
    saveStore(KEYS.questions, migrated)
    return migrated
  }
  return loadStore(KEYS.questions, SEED_QUESTIONS)
}

// ------------------ Questions ------------------

async function fetchQuestionsLocal(params = {}) {
  await delay()
  let rows = loadQuestionsStore()
  rows = rows.map((r) => ({
    ...r,
    status: normalizeStatus(r.status),
    category: inferCategory(r),
    __questionText: extractQuestionText(r),
    __tagsText: Array.isArray(r.tags) ? r.tags.join(' ') : '',
  }))
  rows = filterByQuery(rows, params.search, ['id', 'type', 'subject', 'topic', 'difficulty', 'category', '__questionText', '__tagsText'])
  if (params.status && params.status !== 'all') rows = rows.filter((r) => r.status === params.status)
  if (params.type && params.type !== 'all') rows = rows.filter((r) => String(r.type) === String(params.type))
  if (params.subject && params.subject !== 'all') rows = rows.filter((r) => String(r.subject) === String(params.subject))
  if (params.topic && params.topic !== 'all') rows = rows.filter((r) => String(r.topic) === String(params.topic))
  if (params.difficulty && params.difficulty !== 'all') rows = rows.filter((r) => String(r.difficulty) === String(params.difficulty))
  if (params.tags && params.tags !== 'all') {
    const tag = String(params.tags).toLowerCase()
    rows = rows.filter((r) => (Array.isArray(r.tags) ? r.tags : []).some((t) => String(t).toLowerCase() === tag))
  }
  return rows.map((r) => {
    const { __questionText, __tagsText, ...rest } = r
    void __questionText
    void __tagsText
    return rest
  })
}

async function upsertQuestionLocal(payload, { id, isEdit } = {}) {
  await delay()
  const list = loadQuestionsStore()
  const now = new Date().toISOString().slice(0, 10)
  if (isEdit && id) {
    const next = list.map((q) =>
      String(q.id) === String(id)
        ? { ...q, ...payload, status: normalizeStatus(payload.status ?? q.status), category: inferCategory(payload) }
        : q,
    )
    saveStore(KEYS.questions, next)
    return next.find((q) => String(q.id) === String(id))
  }
  const nextId = payload.id || `Q-${Math.floor(1000 + Math.random() * 9000)}`
  const row = {
    id: nextId,
    createdAt: payload.createdAt || now,
    createdBy: payload.createdBy || 'Admin',
    status: normalizeStatus(payload.status || 'Active'),
    category: inferCategory(payload),
    ...payload,
  }
  saveStore(KEYS.questions, [row, ...list])
  return row
}

async function deleteQuestionLocal(id) {
  await delay()
  saveStore(KEYS.questions, loadQuestionsStore().filter((q) => String(q.id) !== String(id)))
}

export async function fetchQuestions(params = {}) {
  return fetchQuestionsLocal(params)
}

export async function upsertQuestion(payload, meta) {
  return upsertQuestionLocal(payload, meta)
}

export async function deleteQuestion(id) {
  return deleteQuestionLocal(id)
}

export async function getQuestionAnalytics(params = {}) {
  await delay()
  const rows = await fetchQuestionsLocal(params)
  const easyCount = rows.filter((row) => row.difficulty === 'Easy').length
  const mediumHardCount = rows.filter(
    (row) => row.difficulty === 'Medium' || row.difficulty === 'Hard',
  ).length
  return {
    totalQuestions: rows.length,
    easyCount,
    mediumHardCount,
  }
}

export async function getQuestionFilterOptions({ subject } = {}) {
  await delay()
  const rows = await fetchQuestionsLocal({})
  const subjects = Array.from(new Set(rows.map((row) => row.subject).filter(Boolean))).sort()
  const topics = Array.from(
    new Set(
      rows
        .filter((row) => !subject || subject === 'all' || row.subject === subject)
        .map((row) => row.topic)
        .filter(Boolean),
    ),
  ).sort()
  const tags = Array.from(new Set(rows.flatMap((row) => row.tags || []))).sort()
  return { subjects, topics, tags }
}

export async function updateQuestionStatus(id, status) {
  await delay()
  const list = loadQuestionsStore()
  const next = list.map((row) =>
    String(row.id) === String(id) ? { ...row, status: normalizeStatus(status) } : row,
  )
  saveStore(KEYS.questions, next)
  return next.find((row) => String(row.id) === String(id))
}

export async function duplicateQuestion(id) {
  await delay()
  const source = loadQuestionsStore().find((row) => String(row.id) === String(id))
  if (!source) throw new Error('Question not found')
  const copy = {
    ...source,
    id: `Q-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'Active',
  }
  saveStore(KEYS.questions, [copy, ...loadQuestionsStore()])
  return copy
}

export async function downloadQuestionTemplate() {
  await delay()
  return new Blob(['Question Bank Template'], { type: 'application/vnd.ms-excel' })
}

export async function validateBulkQuestions() {
  await delay()
  return { valid: true, rows: [] }
}

export async function importBulkQuestions() {
  await delay()
  return { success: true, imported: 0 }
}

// ------------------ Configs (tagging only) ------------------

async function fetchConfigsLocal(params = {}) {
  await delay()
  let rows = loadStore(KEYS.configs, SEED_TEST_CONFIGS)
  rows = filterByQuery(rows, params.search, ['id', 'testName', 'subject', 'status'])
  if (params.status && params.status !== 'all') rows = rows.filter((r) => r.status === params.status)
  if (params.subject && params.subject !== 'all') rows = rows.filter((r) => r.subject === params.subject)
  return rows
}

async function upsertConfigLocal(payload, { id, isEdit } = {}) {
  await delay()
  const list = loadStore(KEYS.configs, SEED_TEST_CONFIGS)
  const now = new Date().toISOString().slice(0, 10)
  if (isEdit && id) {
    const next = list.map((c) => (String(c.id) === String(id) ? { ...c, ...payload, updatedAt: now } : c))
    saveStore(KEYS.configs, next)
    return next.find((c) => String(c.id) === String(id))
  }
  const nextId = payload.id || `TC-${Math.floor(2000 + Math.random() * 7000)}`
  const row = { id: nextId, updatedAt: now, status: 'Draft', taggedQuestionIds: [], ...payload }
  saveStore(KEYS.configs, [row, ...list])
  return row
}

async function deleteConfigLocal(id) {
  await delay()
  saveStore(KEYS.configs, loadStore(KEYS.configs, SEED_TEST_CONFIGS).filter((c) => String(c.id) !== String(id)))
}

export async function fetchTestConfigs(params = {}) {
  return fetchConfigsLocal(params)
}

export async function upsertTestConfig(payload, meta) {
  return upsertConfigLocal(payload, meta)
}

export async function deleteTestConfig(id) {
  return deleteConfigLocal(id)
}

// ------------------ Integrations ------------------

async function fetchIntegrationsLocal(params = {}) {
  await delay()
  let rows = loadStore(KEYS.integrations, SEED_TEST_INTEGRATIONS)
  rows = filterByQuery(rows, params.search, ['id', 'testName', 'course', 'batch', 'faculty', 'subject', 'status'])
  if (params.status && params.status !== 'all') rows = rows.filter((r) => r.status === params.status)
  return rows
}

async function upsertIntegrationLocal(payload, { id, isEdit } = {}) {
  await delay()
  const list = loadStore(KEYS.integrations, SEED_TEST_INTEGRATIONS)
  const now = new Date().toISOString().slice(0, 10)
  if (isEdit && id) {
    const next = list.map((c) => (String(c.id) === String(id) ? { ...c, ...payload } : c))
    saveStore(KEYS.integrations, next)
    return next.find((c) => String(c.id) === String(id))
  }
  const nextId = payload.id || `TI-${Math.floor(3000 + Math.random() * 6000)}`
  const row = { id: nextId, scheduleDate: payload.scheduleDate || now, status: payload.status || 'Draft', ...payload }
  saveStore(KEYS.integrations, [row, ...list])
  return row
}

async function deleteIntegrationLocal(id) {
  await delay()
  saveStore(KEYS.integrations, loadStore(KEYS.integrations, SEED_TEST_INTEGRATIONS).filter((c) => String(c.id) !== String(id)))
}

export async function fetchTestIntegrations(params = {}) {
  return fetchIntegrationsLocal(params)
}

export async function upsertTestIntegration(payload, meta) {
  return upsertIntegrationLocal(payload, meta)
}

export async function deleteTestIntegration(id) {
  return deleteIntegrationLocal(id)
}

// ------------------ Results & Analytics ------------------

async function fetchResultsLocal(params = {}) {
  await delay()
  let rows = loadStore(KEYS.results, SEED_RESULTS)
  rows = filterByQuery(rows, params.search, ['id', 'testName', 'student', 'status'])
  return rows
}

export async function fetchResults(params = {}) {
  return fetchResultsLocal(params)
}

// ------------------ Result & Analytics Engine ------------------

function byId(list, id) {
  return list.find((x) => String(x.id) === String(id))
}

function normalizeDate(value) {
  if (!value) return null
  const s = String(value)
  // Expect YYYY-MM-DD from inputs
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

function withinRange(date, start, end) {
  if (!date) return false
  const d = String(date)
  if (start && d < start) return false
  if (end && d > end) return false
  return true
}

function buildEngineRow(result, stores) {
  const student = byId(stores.students, result.studentId)
  const test = byId(stores.tests, result.testId)
  const subject = test ? byId(stores.subjects, test.subjectId) : null
  const batch = student ? byId(stores.batches, student.batchId) : null
  const total = Number(test?.totalMarks ?? 100) || 100
  const score = Math.max(0, Number(result.score) || 0)
  const percentage = Math.round((score / Math.max(total, 1)) * 1000) / 10

  return {
    id: result.id,
    resultId: result.id,
    studentId: result.studentId,
    studentName: student?.name ?? 'Unknown Student',
    rollNumber: student?.rollNumber ?? '-',
    batchId: student?.batchId ?? null,
    batchName: batch?.name ?? '—',
    testId: result.testId,
    testName: test?.name ?? 'Unknown Test',
    subjectId: test?.subjectId ?? null,
    subject: subject?.name ?? 'General',
    total,
    score,
    percentage,
    status: result.status,
    evaluatedAt: result.evaluatedAt,
    testDate: test?.date ?? null,
  }
}

function loadEngineStore() {
  const seed = SEED_RESULTS_ENGINE
  return loadStore(KEYS.resultsEngine, seed)
}

function saveEngineStore(next) {
  saveStore(KEYS.resultsEngine, next)
}

function getEngineStores() {
  return {
    batches: SEED_BATCHES,
    students: SEED_STUDENTS,
    tests: SEED_TESTS,
    subjects: SEED_SUBJECTS,
  }
}

export async function fetchResultsEngine(params = {}) {
  await delay()
  const stores = getEngineStores()
  const raw = loadEngineStore()
  let rows = raw.map((r) => buildEngineRow(r, stores))

  // Attach AIR ranks per test for published/evaluated rows
  const ranksByResultId = computeAIRRanks(rows)
  rows = rows.map((r) => ({ ...r, airRank: ranksByResultId.get(r.id) ?? null }))

  const q = String(params.search ?? '').trim().toLowerCase()
  if (q) {
    rows = rows.filter((r) => {
      return (
        String(r.resultId).toLowerCase().includes(q) ||
        String(r.studentName).toLowerCase().includes(q) ||
        String(r.rollNumber).toLowerCase().includes(q) ||
        String(r.testName).toLowerCase().includes(q) ||
        String(r.subject).toLowerCase().includes(q) ||
        String(r.batchName).toLowerCase().includes(q)
      )
    })
  }

  if (params.batchId && params.batchId !== 'all') rows = rows.filter((r) => String(r.batchId) === String(params.batchId))
  if (params.studentId && params.studentId !== 'all') rows = rows.filter((r) => String(r.studentId) === String(params.studentId))
  if (params.testId && params.testId !== 'all') rows = rows.filter((r) => String(r.testId) === String(params.testId))
  if (params.subjectId && params.subjectId !== 'all') rows = rows.filter((r) => String(r.subjectId) === String(params.subjectId))
  if (params.status && params.status !== 'all') rows = rows.filter((r) => String(r.status) === String(params.status))

  const start = normalizeDate(params.dateFrom)
  const end = normalizeDate(params.dateTo)
  if (start || end) {
    rows = rows.filter((r) => withinRange(r.testDate, start, end))
  }

  // Sort: latest test date first, then score desc
  rows.sort((a, b) => {
    const ad = String(a.testDate ?? '')
    const bd = String(b.testDate ?? '')
    if (ad !== bd) return bd.localeCompare(ad)
    return (Number(b.score) || 0) - (Number(a.score) || 0)
  })

  return rows
}

export async function fetchResultsEngineMeta() {
  await delay()
  return {
    batches: SEED_BATCHES,
    students: SEED_STUDENTS,
    tests: SEED_TESTS,
    subjects: SEED_SUBJECTS,
    statuses: ['Processing', 'Evaluated', 'Published'],
  }
}

export async function publishResultEngine(resultId) {
  await delay()
  const list = loadEngineStore()
  const idx = list.findIndex((r) => String(r.id) === String(resultId))
  if (idx < 0) throw new Error('Result not found')
  const row = list[idx]
  const next = [...list]
  next[idx] = {
    ...row,
    status: 'Published',
    evaluatedAt: row.evaluatedAt || new Date().toISOString().slice(0, 10),
  }
  saveEngineStore(next)
  return next[idx]
}

