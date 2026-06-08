import { isFrontendOnly } from '../config/appMode'
import {
  SEED_EVALUATIONS,
  SEED_EVALUATION_EVALUATORS,
  SEED_EVALUATION_STUDENTS,
  SEED_EVALUATION_TESTS,
} from '../data/evaluationManagementSeed'

const DELAY_MS = 180

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
  return parsed ?? seed
}

function saveStore(key, value) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

const KEYS = {
  evaluations: 'ems_evaluations_v1',
  evaluators: 'ems_evaluators_v1',
  students: 'ems_students_v1',
  tests: 'ems_tests_v1',
}

function nowStamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function addHistory(evaluation, event) {
  const next = {
    ...evaluation,
    history: [
      ...(Array.isArray(evaluation.history) ? evaluation.history : []),
      {
        id: `H-${Math.floor(1000 + Math.random() * 9000)}`,
        at: new Date().toISOString(),
        ...event,
      },
    ],
    updatedAt: nowStamp(),
  }
  return next
}

function filterByQuery(list, q, keys) {
  const query = String(q || '').trim().toLowerCase()
  if (!query) return list
  return list.filter((row) => keys.some((k) => String(row[k] || '').toLowerCase().includes(query)))
}

function loadEvaluations() {
  const list = loadStore(KEYS.evaluations, SEED_EVALUATIONS)
  return Array.isArray(list) ? list : SEED_EVALUATIONS
}

function saveEvaluations(list) {
  saveStore(KEYS.evaluations, list)
}

function loadLookups() {
  const students = loadStore(KEYS.students, SEED_EVALUATION_STUDENTS)
  const tests = loadStore(KEYS.tests, SEED_EVALUATION_TESTS)
  const evaluators = loadStore(KEYS.evaluators, SEED_EVALUATION_EVALUATORS)
  return {
    students: Array.isArray(students) ? students : SEED_EVALUATION_STUDENTS,
    tests: Array.isArray(tests) ? tests : SEED_EVALUATION_TESTS,
    evaluators: Array.isArray(evaluators) ? evaluators : SEED_EVALUATION_EVALUATORS,
  }
}

export async function fetchEvaluationLookups() {
  if (isFrontendOnly) {
    await delay()
    return loadLookups()
  }
  try {
    const { default: api } = await import('./axiosInstance')
    const response = await api.get('/evaluation/lookups', { skipAuthRedirect: true })
    const body = response.data
    if (body?.students && body?.tests && body?.evaluators) return body
    await delay()
    return loadLookups()
  } catch {
    await delay()
    return loadLookups()
  }
}

export async function fetchEvaluations(params = {}) {
  if (isFrontendOnly) return fetchEvaluationsLocal(params)
  try {
    const { default: api } = await import('./axiosInstance')
    const response = await api.get('/evaluation', { params, skipAuthRedirect: true })
    const body = response.data
    const list = Array.isArray(body) ? body : body?.data ?? []
    if (Array.isArray(list) && list.length > 0) return list
    return fetchEvaluationsLocal(params)
  } catch {
    return fetchEvaluationsLocal(params)
  }
}

async function fetchEvaluationsLocal(params = {}) {
  await delay()
  const { students, tests, evaluators } = loadLookups()
  const studentMap = new Map(students.map((s) => [String(s.id), s]))
  const testMap = new Map(tests.map((t) => [String(t.id), t]))
  const evaluatorMap = new Map(evaluators.map((e) => [String(e.id), e]))

  let rows = loadEvaluations().map((e) => {
    const stu = studentMap.get(String(e.studentId))
    const tst = testMap.get(String(e.testId))
    const evl = evaluatorMap.get(String(e.evaluatorId))
    return {
      ...e,
      studentName: stu?.name || '—',
      testName: tst?.name || '—',
      evaluatorName: evl?.name || '—',
    }
  })

  rows = filterByQuery(rows, params.search, ['id', 'studentName', 'testName', 'evaluatorName', 'status'])

  if (params.studentId && params.studentId !== 'all') rows = rows.filter((r) => String(r.studentId) === String(params.studentId))
  if (params.testId && params.testId !== 'all') rows = rows.filter((r) => String(r.testId) === String(params.testId))
  if (params.evaluatorId && params.evaluatorId !== 'all') rows = rows.filter((r) => String(r.evaluatorId) === String(params.evaluatorId))
  if (params.status && params.status !== 'all') rows = rows.filter((r) => String(r.status) === String(params.status))

  const from = params.from ? new Date(params.from) : null
  const to = params.to ? new Date(params.to) : null
  if (from || to) {
    rows = rows.filter((r) => {
      const d = new Date(String(r.updatedAt || r.createdAt || ''))
      if (Number.isNaN(d.getTime())) return true
      if (from && d < from) return false
      if (to && d > to) return false
      return true
    })
  }

  return rows
}

export async function fetchEvaluationById(evaluationId) {
  if (isFrontendOnly) return fetchEvaluationByIdLocal(evaluationId)
  try {
    const { default: api } = await import('./axiosInstance')
    const response = await api.get(`/evaluation/${encodeURIComponent(String(evaluationId))}`, { skipAuthRedirect: true })
    return response.data?.data ?? response.data
  } catch {
    return fetchEvaluationByIdLocal(evaluationId)
  }
}

async function fetchEvaluationByIdLocal(evaluationId) {
  await delay()
  const row = loadEvaluations().find((e) => String(e.id) === String(evaluationId))
  if (!row) {
    const err = new Error('Evaluation not found')
    err.status = 404
    throw err
  }
  return row
}

export async function assignEvaluations(payload) {
  if (isFrontendOnly) return assignEvaluationsLocal(payload)
  try {
    const { default: api } = await import('./axiosInstance')
    const response = await api.post('/evaluation/assign', payload, { skipAuthRedirect: true })
    return response.data?.data ?? response.data
  } catch {
    return assignEvaluationsLocal(payload)
  }
}

async function assignEvaluationsLocal(payload = {}) {
  await delay()
  const {
    studentIds = [],
    studentId,
    testId,
    evaluatorId,
    deadline,
    priority = 'Normal',
    actor = 'Admin',
  } = payload

  const ids = Array.isArray(studentIds) && studentIds.length ? studentIds : studentId ? [studentId] : []
  if (!ids.length) throw new Error('Select at least one student')
  if (!testId) throw new Error('Select a test')
  if (!evaluatorId) throw new Error('Select an evaluator')

  const list = loadEvaluations()
  const now = new Date().toISOString().slice(0, 10)

  const created = ids.map((sid) => {
    const id = `EVAL-${Math.floor(10000 + Math.random() * 90000)}`
    const row = {
      id,
      studentId: sid,
      testId,
      evaluatorId,
      status: 'Pending',
      marks: null,
      remarks: '',
      rubric: [],
      internalComments: '',
      highlightNotes: '',
      recheck: null,
      answerSheet: { fileName: null, url: null, pages: null },
      annotations: [],
      history: [
        { id: `H-${Math.floor(1000 + Math.random() * 9000)}`, type: 'ASSIGNED', actor, at: new Date().toISOString(), message: 'Evaluation assigned' },
      ],
      createdAt: nowStamp(),
      updatedAt: nowStamp(),
      deadline: deadline || now,
      priority,
    }
    return row
  })

  saveEvaluations([...created, ...list])
  return created
}

export async function saveEvaluationDraft(evaluationId, patch, meta = {}) {
  if (isFrontendOnly) return saveEvaluationDraftLocal(evaluationId, patch, meta)
  try {
    const { default: api } = await import('./axiosInstance')
    const response = await api.post('/evaluation/save', { evaluationId, ...patch }, { skipAuthRedirect: true })
    return response.data?.data ?? response.data
  } catch {
    return saveEvaluationDraftLocal(evaluationId, patch, meta)
  }
}

async function saveEvaluationDraftLocal(evaluationId, patch = {}, meta = {}) {
  await delay()
  const list = loadEvaluations()
  const idx = list.findIndex((e) => String(e.id) === String(evaluationId))
  if (idx < 0) throw new Error('Evaluation not found')
  const actor = meta.actor || 'Mentor'

  const current = list[idx]
  if (current.locked) throw new Error('This evaluation is locked (published)')

  const updated = addHistory(
    {
      ...current,
      ...patch,
      status: current.status === 'Published' ? 'Published' : 'Draft Saved',
    },
    { type: 'DRAFT_SAVED', actor, message: 'Draft saved' },
  )

  const next = [...list]
  next[idx] = updated
  saveEvaluations(next)
  return updated
}

export async function publishEvaluation(evaluationId, meta = {}) {
  if (isFrontendOnly) return publishEvaluationLocal(evaluationId, meta)
  try {
    const { default: api } = await import('./axiosInstance')
    const response = await api.post('/evaluation/publish', { evaluationId }, { skipAuthRedirect: true })
    return response.data?.data ?? response.data
  } catch {
    return publishEvaluationLocal(evaluationId, meta)
  }
}

async function publishEvaluationLocal(evaluationId, meta = {}) {
  await delay()
  const list = loadEvaluations()
  const idx = list.findIndex((e) => String(e.id) === String(evaluationId))
  if (idx < 0) throw new Error('Evaluation not found')
  const actor = meta.actor || 'Mentor'

  const current = list[idx]
  if (current.locked) return current
  if (current.marks == null || Number.isNaN(Number(current.marks))) {
    throw new Error('Enter total marks before publishing')
  }

  const updated = addHistory(
    { ...current, status: 'Published', locked: true },
    { type: 'PUBLISHED', actor, message: 'Published final evaluation' },
  )

  const next = [...list]
  next[idx] = updated
  saveEvaluations(next)
  return updated
}

export async function requestRecheck(evaluationId, payload = {}, meta = {}) {
  if (isFrontendOnly) return requestRecheckLocal(evaluationId, payload, meta)
  try {
    const { default: api } = await import('./axiosInstance')
    const response = await api.post(`/evaluation/${encodeURIComponent(String(evaluationId))}/recheck`, payload, { skipAuthRedirect: true })
    return response.data?.data ?? response.data
  } catch {
    return requestRecheckLocal(evaluationId, payload, meta)
  }
}

async function requestRecheckLocal(evaluationId, payload = {}, meta = {}) {
  await delay()
  const list = loadEvaluations()
  const idx = list.findIndex((e) => String(e.id) === String(evaluationId))
  if (idx < 0) throw new Error('Evaluation not found')
  const actor = meta.actor || 'Admin'
  const current = list[idx]

  const recheck = {
    requested: true,
    requestedAt: new Date().toISOString(),
    secondaryEvaluatorId: payload.secondaryEvaluatorId || null,
    originalMarks: current.marks ?? null,
    revisedMarks: null,
    remarks: String(payload.remarks || '').trim(),
  }

  const updated = addHistory(
    { ...current, status: 'Rechecking', recheck, locked: false },
    { type: 'RECHECK_REQUESTED', actor, message: 'Recheck requested' },
  )

  const next = [...list]
  next[idx] = updated
  saveEvaluations(next)
  return updated
}

export async function saveAnnotations(evaluationId, annotations = [], meta = {}) {
  return saveEvaluationDraft(evaluationId, { annotations }, meta)
}

export async function attachAnswerSheet(evaluationId, fileMeta = {}, meta = {}) {
  return saveEvaluationDraft(evaluationId, { answerSheet: { ...(fileMeta || {}) } }, meta)
}

