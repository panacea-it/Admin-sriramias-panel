import { isFrontendOnly } from '../config/appMode'
import {  DEFAULT_WORKSPACE_RUBRIC,
  OVERSIGHT_EXAM_TYPES,
  OVERSIGHT_PRIORITIES,
  OVERSIGHT_STATUSES,
  SEED_EVALUATION_PAPERS,
  SEED_OVERSIGHT_BATCHES,
  SEED_OVERSIGHT_CENTERS,
  SEED_OVERSIGHT_MENTORS,
  SEED_OVERSIGHT_PROGRAMS,
  SEED_OVERSIGHT_STATS,
  SEED_OVERSIGHT_SUBJECTS,
  SEED_OVERSIGHT_SUBTOPICS,
  SEED_OVERSIGHT_TESTS,
} from '../data/evaluationOversightSeed'

const DELAY_MS = 160
const STORE_KEY = 'ems_evaluation_papers_v2'

/** In dev, use local seed unless VITE_EVALUATION_OVERSIGHT_USE_API=true (remote may lack these routes). */
function useEvaluationOversightSeed() {
  if (isFrontendOnly) return true
  if (import.meta.env.VITE_EVALUATION_OVERSIGHT_USE_SEED === 'true') return true
  if (import.meta.env.DEV && import.meta.env.VITE_EVALUATION_OVERSIGHT_USE_API !== 'true') {
    return true
  }
  return false
}
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

function loadPapers() {
  if (typeof window === 'undefined') return [...SEED_EVALUATION_PAPERS]
  const raw = window.localStorage.getItem(STORE_KEY)
  if (!raw) {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(SEED_EVALUATION_PAPERS))
    return [...SEED_EVALUATION_PAPERS]
  }
  const parsed = safeJsonParse(raw, SEED_EVALUATION_PAPERS)
  return Array.isArray(parsed) ? parsed : [...SEED_EVALUATION_PAPERS]
}

function savePapers(list) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORE_KEY, JSON.stringify(list))
}

function nowStamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function mentorInitials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function computeRubricTotal(rubric = []) {
  return rubric.reduce((sum, r) => sum + (Number(r.score) || 0), 0)
}

function computeRubricMax(rubric = []) {
  return rubric.reduce((sum, r) => sum + (Number(r.max) || 0), 0)
}

function formatScoreDisplay(paper) {
  if (paper.status === 'Evaluated' && paper.scoreObtained != null) {
    return `${paper.scoreObtained}/${paper.scoreMax ?? 100}`
  }
  if (paper.status === 'In Progress') return 'Pending'
  if (paper.status === 'Overdue') return 'Pending'
  return '--'
}

function deriveStats(papers) {
  const pending = papers.filter((p) => p.status !== 'Evaluated').length
  const today = new Date().toISOString().slice(0, 10)
  const evaluatedToday = papers.filter(
    (p) => p.status === 'Evaluated' && String(p.evaluatedAt || '').slice(0, 10) === today,
  ).length
  return {
    totalPapers: SEED_OVERSIGHT_STATS.totalPapers,
    totalPapersTrend: SEED_OVERSIGHT_STATS.totalPapersTrend,
    pendingEvaluation: pending || SEED_OVERSIGHT_STATS.pendingEvaluation,
    pendingLabel: SEED_OVERSIGHT_STATS.pendingLabel,
    evaluatedToday: evaluatedToday || SEED_OVERSIGHT_STATS.evaluatedToday,
    evaluatedTodayLabel: SEED_OVERSIGHT_STATS.evaluatedTodayLabel,
    avgEvaluationTime: SEED_OVERSIGHT_STATS.avgEvaluationTime,
    avgTimeTrend: SEED_OVERSIGHT_STATS.avgTimeTrend,
  }
}

function filterPapers(papers, params = {}) {
  let rows = [...papers]
  if (params.batchId && params.batchId !== 'all') {
    rows = rows.filter((r) => String(r.batchId) === String(params.batchId))
  }
  if (params.subjectId && params.subjectId !== 'all') {
    rows = rows.filter((r) => String(r.subjectId) === String(params.subjectId))
  }
  if (params.subTopicId && params.subTopicId !== 'all') {
    rows = rows.filter((r) => String(r.subTopicId) === String(params.subTopicId))
  }
  if (params.mentorId && params.mentorId !== 'all') {
    rows = rows.filter((r) => String(r.mentorId) === String(params.mentorId))
  }
  if (params.testId && params.testId !== 'all') {
    rows = rows.filter((r) => String(r.testId) === String(params.testId))
  }
  if (params.status && params.status !== 'all') {
    rows = rows.filter((r) => String(r.status) === String(params.status))
  }
  if (params.priority && params.priority !== 'all') {
    rows = rows.filter((r) => String(r.priority) === String(params.priority))
  }
  if (params.examType && params.examType !== 'all') {
    rows = rows.filter((r) => String(r.examType) === String(params.examType))
  }
  if (params.centerId && params.centerId !== 'all') {
    rows = rows.filter((r) => String(r.centerId) === String(params.centerId))
  }
  if (params.programId && params.programId !== 'all') {
    rows = rows.filter((r) => String(r.programId) === String(params.programId))
  }
  if (params.submittedFrom) {
    const from = new Date(params.submittedFrom)
    rows = rows.filter((r) => {
      const d = new Date(r.submittedAt)
      return !Number.isNaN(d.getTime()) && d >= from
    })
  }
  if (params.submittedTo) {
    const to = new Date(params.submittedTo)
    to.setHours(23, 59, 59, 999)
    rows = rows.filter((r) => {
      const d = new Date(r.submittedAt)
      return !Number.isNaN(d.getTime()) && d <= to
    })
  }
  const q = String(params.search || '').trim().toLowerCase()
  if (q) {
    rows = rows.filter((r) =>
      [
        r.studentName,
        r.rollNumber,
        r.testName,
        r.subjectName,
        r.mentorName,
        r.status,
        r.centerName,
        r.programName,
        r.batchName,
      ].some((v) => String(v || '').toLowerCase().includes(q)),
    )
  }
  return rows
}

function buildFilterOptions(params = {}) {
  const batchId = params.batchId || 'all'
  const subjectId = params.subjectId || 'all'
  const programId = params.programId || 'all'

  const batches = SEED_OVERSIGHT_BATCHES.map((b) => ({ value: b.id, label: b.label }))
  const subjects = SEED_OVERSIGHT_SUBJECTS.filter((s) => {
    if (programId !== 'all' && s.programId !== programId) return false
    if (batchId === 'all') return true
    return s.batchIds.includes(batchId)
  }).map((s) => ({ value: s.id, label: s.label }))

  const subTopics = SEED_OVERSIGHT_SUBTOPICS.filter(
    (st) => subjectId === 'all' || st.subjectId === subjectId,
  ).map((st) => ({ value: st.id, label: st.label }))

  const tests = SEED_OVERSIGHT_TESTS.filter((t) => {
    if (batchId !== 'all' && !t.batchIds.includes(batchId)) return false
    if (subjectId !== 'all' && t.subjectId !== subjectId) return false
    return true
  }).map((t) => ({ value: t.id, label: t.label }))

  const mentors = SEED_OVERSIGHT_MENTORS.filter(
    (m) => subjectId === 'all' || m.subjectIds.includes(subjectId),
  ).map((m) => ({
    value: m.id,
    label: m.name,
    available: m.available,
    pendingCount: m.pendingCount,
  }))

  const programs = SEED_OVERSIGHT_PROGRAMS.filter((p) => p.id !== 'PROG-ALL').map((p) => ({
    value: p.id,
    label: p.label,
  }))

  return {
    batches: [{ value: 'all', label: 'All Batches' }, ...batches],
    subjects: [{ value: 'all', label: 'All Subjects' }, ...subjects],
    subTopics: [{ value: 'all', label: 'All Sub-topics' }, ...subTopics],
    tests: [{ value: 'all', label: 'All Tests' }, ...tests],
    mentors: [{ value: 'all', label: 'All Mentors' }, ...mentors],
    statuses: [{ value: 'all', label: 'All Statuses' }, ...OVERSIGHT_STATUSES.map((s) => ({ value: s, label: s }))],
    priorities: [{ value: 'all', label: 'All Priorities' }, ...OVERSIGHT_PRIORITIES.map((p) => ({ value: p, label: p }))],
    examTypes: [{ value: 'all', label: 'All Exam Types' }, ...OVERSIGHT_EXAM_TYPES.map((e) => ({ value: e, label: e }))],
    centers: [{ value: 'all', label: 'All Centers' }, ...SEED_OVERSIGHT_CENTERS.map((c) => ({ value: c.id, label: c.label }))],
    programs: [{ value: 'all', label: 'All Programs' }, ...programs],
  }
}

export async function fetchEvaluationDashboardStats(params = {}) {
  if (!useEvaluationOversightSeed()) {
    try {
      const { default: api } = await import('./axiosInstance')
      const res = await api.get('/evaluation-oversight/stats', { params, skipAuthRedirect: true })
      if (res.data?.data) return res.data.data
    } catch {
      /* fallback */
    }
  }
  await delay()
  const papers = loadPapers()
  const filtered = filterPapers(papers, params)
  return deriveStats(filtered)
}

export async function fetchEvaluationFilterOptions(params = {}) {
  if (!useEvaluationOversightSeed()) {
    try {
      const { default: api } = await import('./axiosInstance')
      const res = await api.get('/evaluation-oversight/filters', { params, skipAuthRedirect: true })
      if (res.data?.data) return res.data.data
    } catch {
      /* fallback */
    }
  }
  await delay()
  return buildFilterOptions(params)
}

function normalizePaperRow(row) {
  if (!row) return row
  const normalized = {
    ...row,
    id: row.id || row.paperId,
    mentorInitials: row.mentorInitials || mentorInitials(row.mentorName),
  }
  normalized.scoreDisplay = row.scoreDisplay ?? formatScoreDisplay(normalized)
  return normalized
}

export async function fetchEvaluationTableData(params = {}) {
  if (!useEvaluationOversightSeed()) {
    try {
      const { default: api } = await import('./axiosInstance')
      const res = await api.get('/evaluation-oversight/papers', { params, skipAuthRedirect: true })
      const list = res.data?.data
      if (Array.isArray(list)) return list.map(normalizePaperRow)
    } catch {
      /* fallback */
    }
  }
  await delay()
  return filterPapers(loadPapers(), params).map(normalizePaperRow)
}

export async function fetchEvaluationPaperById(paperId) {
  if (!useEvaluationOversightSeed()) {
    try {
      const { default: api } = await import('./axiosInstance')
      const res = await api.get(`/evaluation-oversight/papers/${encodeURIComponent(String(paperId))}`, {
        skipAuthRedirect: true,
      })
      if (res.data?.data) return res.data.data
    } catch {
      /* fallback */
    }
  }
  await delay()
  const row = loadPapers().find((p) => String(p.id) === String(paperId))
  if (!row) {
    const err = new Error('Evaluation paper not found')
    err.status = 404
    throw err
  }
  return row
}

export async function fetchMentorsForSubject(subjectId, { excludeId } = {}) {
  await delay(80)
  return SEED_OVERSIGHT_MENTORS.filter(
    (m) => m.subjectIds.includes(subjectId) && String(m.id) !== String(excludeId || ''),
  ).map((m) => ({
    id: m.id,
    name: m.name,
    title: m.title,
    available: m.available,
    pendingCount: m.pendingCount,
  }))
}

export async function assignEvaluator(paperId, mentorId) {
  if (!useEvaluationOversightSeed()) {
    try {
      const { default: api } = await import('./axiosInstance')
      const res = await api.post(
        `/evaluation-oversight/papers/${encodeURIComponent(String(paperId))}/assign`,
        { mentorId },
        { skipAuthRedirect: true },
      )
      if (res.data?.data) return res.data.data
    } catch (err) {
      if (err?.response?.data?.message) throw new Error(err.response.data.message)
    }
  }
  await delay()
  const mentor = SEED_OVERSIGHT_MENTORS.find((m) => String(m.id) === String(mentorId))
  if (!mentor) throw new Error('Mentor not found')

  const list = loadPapers()
  const idx = list.findIndex((p) => String(p.id) === String(paperId))
  if (idx < 0) throw new Error('Paper not found')
  const paper = list[idx]
  if (!mentor.subjectIds.includes(paper.subjectId)) {
    throw new Error('Mentor must belong to the same subject')
  }

  const updated = {
    ...paper,
    mentorId: mentor.id,
    mentorName: mentor.name,
    mentorInitials: mentorInitials(mentor.name),
    mentorAvailable: mentor.available,
    status: paper.status === 'Not Started' ? 'In Progress' : paper.status,
    updatedAt: nowStamp(),
  }
  updated.scoreDisplay = formatScoreDisplay(updated)
  const next = [...list]
  next[idx] = updated
  savePapers(next)
  return updated
}

export async function saveEvaluationDraft(paperId, patch = {}) {
  if (!useEvaluationOversightSeed()) {
    try {
      const { default: api } = await import('./axiosInstance')
      const res = await api.post(
        `/evaluation-oversight/papers/${encodeURIComponent(String(paperId))}/draft`,
        patch,
        { skipAuthRedirect: true },
      )
      if (res.data?.data) return res.data.data
    } catch (err) {
      if (err?.response?.data?.message) throw new Error(err.response.data.message)
    }
  }
  await delay()
  const list = loadPapers()
  const idx = list.findIndex((p) => String(p.id) === String(paperId))
  if (idx < 0) throw new Error('Paper not found')
  const current = list[idx]
  if (current.locked) throw new Error('Evaluation is locked')

  const rubric = patch.rubric ?? current.rubric ?? DEFAULT_WORKSPACE_RUBRIC
  const total = computeRubricTotal(rubric)
  const max = current.scoreMax ?? computeRubricMax(rubric)

  const updated = {
    ...current,
    ...patch,
    rubric,
    scoreObtained: patch.scoreObtained ?? total,
    status: 'In Progress',
    locked: false,
    updatedAt: nowStamp(),
    scoreDisplay: 'Pending',
  }
  const next = [...list]
  next[idx] = updated
  savePapers(next)
  return updated
}

export async function publishEvaluationResult(paperId, patch = {}) {
  if (!useEvaluationOversightSeed()) {
    try {
      const { default: api } = await import('./axiosInstance')
      const res = await api.post(
        `/evaluation-oversight/papers/${encodeURIComponent(String(paperId))}/publish`,
        patch,
        { skipAuthRedirect: true },
      )
      if (res.data?.data) return res.data.data
    } catch (err) {
      if (err?.response?.data?.message) throw new Error(err.response.data.message)
    }
  }
  await delay()
  const list = loadPapers()
  const idx = list.findIndex((p) => String(p.id) === String(paperId))
  if (idx < 0) throw new Error('Paper not found')
  const current = list[idx]
  if (current.locked) return current

  const rubric = patch.rubric ?? current.rubric ?? DEFAULT_WORKSPACE_RUBRIC
  const total = computeRubricTotal(rubric)
  const max = current.scoreMax ?? 100
  if (total <= 0) throw new Error('Enter scores before publishing')

  const updated = {
    ...current,
    ...patch,
    rubric,
    scoreObtained: Math.round(total * 10) / 10,
    scoreMax: max,
    status: 'Evaluated',
    locked: true,
    evaluatedAt: new Date().toISOString(),
    updatedAt: nowStamp(),
    scoreDisplay: `${Math.round(total * 10) / 10}/${max}`,
  }
  const next = [...list]
  next[idx] = updated
  savePapers(next)
  return updated
}

export async function savePaperAnnotations(paperId, annotations = []) {
  return saveEvaluationDraft(paperId, { annotations })
}

export async function exportEvaluationCsv(params = {}) {
  if (!useEvaluationOversightSeed()) {
    try {
      const { default: api } = await import('./axiosInstance')
      const res = await api.get('/evaluation-oversight/export', {
        params,
        responseType: 'blob',
        skipAuthRedirect: true,
      })
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `evaluation-oversight-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      const rows = await fetchEvaluationTableData(params)
      return { count: rows.length }
    } catch (err) {
      if (err?.response?.data?.message) throw new Error(err.response.data.message)
      if (err?.message && !err?.response) throw err
    }
  }

  const rows = await fetchEvaluationTableData(params)
  const headers = [
    'Student Name',
    'Roll Number',
    'Batch',
    'Program',
    'Test Name',
    'Subject',
    'Exam Type',
    'Priority',
    'Center',
    'Mentor',
    'Status',
    'Score',
    'Submitted At',
    'Evaluated At',
  ]
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        r.studentName,
        r.rollNumber,
        r.batchName,
        r.programName,
        r.testName,
        r.subjectName,
        r.examType,
        r.priority,
        r.centerName,
        r.mentorName || 'Unassigned',
        r.status,
        r.scoreDisplay,
        r.submittedAt,
        r.evaluatedAt,
      ]
        .map(escape)
        .join(','),
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `evaluation-oversight-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  return { count: rows.length }
}

export async function downloadEvaluationPaper(paper) {
  await delay(120)
  const sheet = paper?.answerSheet
  const safeName = String(paper?.rollNumber || paper?.studentName || 'answer-sheet')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (sheet?.dataUrl) {
    const a = document.createElement('a')
    a.href = sheet.dataUrl
    a.download = sheet.fileName || `${safeName}.pdf`
    a.click()
    return
  }

  if (sheet?.url) {
    const a = document.createElement('a')
    a.href = sheet.url
    a.download = sheet.fileName || `${safeName}.pdf`
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.click()
    return
  }

  const content = [
    'Answer Sheet',
    '============',
    `Student: ${paper?.studentName || '—'}`,
    `Roll Number: ${paper?.rollNumber || '—'}`,
    `Test: ${paper?.testName || '—'}`,
    `Subject: ${paper?.subjectName || '—'}`,
    `Status: ${paper?.status || '—'}`,
    '',
    '[Demo placeholder — attach scanned PDF in production]',
  ].join('\n')

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${safeName}-answer-sheet.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export function getTestMeta(testId) {
  return SEED_OVERSIGHT_TESTS.find((t) => String(t.id) === String(testId))
}

function workloadLevel(pendingCount) {
  if (pendingCount >= 25) return 'high'
  if (pendingCount >= 12) return 'medium'
  return 'low'
}

function countPendingForMentor(mentorId, papers = loadPapers()) {
  return papers.filter(
    (p) => String(p.mentorId) === String(mentorId) && p.status !== 'Evaluated',
  ).length
}

export function fetchAssignmentSubjects(batchId) {
  const subjects = SEED_OVERSIGHT_SUBJECTS.filter(
    (s) => batchId === 'all' || !batchId || s.batchIds.includes(batchId),
  ).map((s) => ({ value: s.id, label: s.label }))
  return Promise.resolve(subjects)
}

export function fetchAssignmentTopics(subjectId) {
  const topics = SEED_OVERSIGHT_SUBTOPICS.filter(
    (t) => subjectId && t.subjectId === subjectId,
  ).map((t) => ({ value: t.id, label: t.label }))
  return Promise.resolve(topics)
}

export function fetchAssignmentTests(batchId, subjectId, topicId) {
  const papers = loadPapers().filter((p) => p.status !== 'Evaluated')
  const testIds = new Set(
    papers
      .filter((p) => {
        if (subjectId && p.subjectId !== subjectId) return false
        if (batchId && batchId !== 'all' && p.batchId !== batchId) return false
        if (topicId && p.subTopicId !== topicId) return false
        return true
      })
      .map((p) => p.testId),
  )
  const tests = SEED_OVERSIGHT_TESTS.filter((t) => {
    if (subjectId && t.subjectId !== subjectId) return false
    if (batchId && batchId !== 'all' && !t.batchIds.includes(batchId)) return false
    if (topicId && testIds.size > 0 && !testIds.has(t.id)) return false
    return true
  }).map((t) => ({ value: t.id, label: t.label }))
  return Promise.resolve(tests)
}

export async function fetchAssignmentPendingPapers({
  batchId,
  subjectId,
  topicId,
  testId,
  status = 'all',
}) {
  await delay()
  let rows = loadPapers().filter((p) => p.status !== 'Evaluated')
  if (batchId && batchId !== 'all') rows = rows.filter((p) => p.batchId === batchId)
  if (subjectId) rows = rows.filter((p) => p.subjectId === subjectId)
  if (topicId) rows = rows.filter((p) => p.subTopicId === topicId)
  if (testId) rows = rows.filter((p) => p.testId === testId)
  if (status && status !== 'all') rows = rows.filter((p) => p.status === status)
  return rows.map((p) => ({
    id: p.id,
    studentName: p.studentName,
    rollNumber: p.rollNumber,
    status: p.status,
    lastUpdate: p.updatedAt,
    mentorId: p.mentorId,
  }))
}

export async function fetchAssignmentEvaluators(subjectId, { excludeMentorId } = {}) {
  await delay(100)
  const papers = loadPapers()
  let mentors = SEED_OVERSIGHT_MENTORS.filter(
    (m) =>
      m.subjectIds.includes(subjectId) &&
      m.available !== false &&
      String(m.id) !== String(excludeMentorId || ''),
  )

  return mentors.map((m) => {
    const pending = countPendingForMentor(m.id, papers)
    return {
      id: m.id,
      name: m.name,
      title: m.title,
      pendingCount: pending,
      workloadLevel: workloadLevel(pending),
      available: m.available,
    }
  })
}

export async function fetchCurrentPrimaryAssignment({
  batchId,
  subjectId,
  topicId,
  testId,
}) {
  await delay(80)
  const papers = loadPapers().filter(
    (p) =>
      p.subjectId === subjectId &&
      p.testId === testId &&
      p.status !== 'Evaluated' &&
      p.mentorId &&
      (!batchId || batchId === 'all' || p.batchId === batchId) &&
      (!topicId || p.subTopicId === topicId),
  )
  if (!papers.length) return null

  const counts = {}
  for (const p of papers) {
    counts[p.mentorId] = (counts[p.mentorId] || 0) + 1
  }
  const topId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const mentor = SEED_OVERSIGHT_MENTORS.find((m) => m.id === topId)
  if (!mentor) return null

  const pending = counts[topId] || 0
  const due = new Date()
  due.setDate(due.getDate() + 7)
  return {
    mentorId: mentor.id,
    name: mentor.name,
    title: mentor.title,
    initials: mentorInitials(mentor.name),
    pendingPapers: pending,
    dueDate: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }
}

export async function bulkAssignEvaluator({ paperIds, mentorId, subjectId }) {
  if (!useEvaluationOversightSeed()) {
    try {
      const { default: api } = await import('./axiosInstance')
      const res = await api.post(
        '/evaluation-oversight/assignment/bulk-assign',
        { paperIds, mentorId, subjectId },
        { skipAuthRedirect: true },
      )
      if (res.data?.data) return res.data.data
    } catch (err) {
      if (err?.response?.data?.message) throw new Error(err.response.data.message)
    }
  }
  await delay(200)
  const mentor = SEED_OVERSIGHT_MENTORS.find((m) => String(m.id) === String(mentorId))
  if (!mentor) throw new Error('Mentor not found')
  if (subjectId && !mentor.subjectIds.includes(subjectId)) {
    throw new Error('Mentor must belong to the selected subject')
  }
  if (!mentor.available) throw new Error('Selected mentor is unavailable')

  const ids = new Set((paperIds || []).map(String))
  if (!ids.size) throw new Error('Select at least one paper')

  const list = loadPapers()
  const updated = []
  const next = list.map((paper) => {
    if (!ids.has(String(paper.id))) return paper
    if (paper.subjectId !== subjectId) return paper
    if (paper.status === 'Evaluated') return paper
    const row = {
      ...paper,
      mentorId: mentor.id,
      mentorName: mentor.name,
      mentorInitials: mentorInitials(mentor.name),
      mentorAvailable: mentor.available,
      status: paper.status === 'Not Started' ? 'In Progress' : paper.status,
      updatedAt: nowStamp(),
      reassignedAt: new Date().toISOString(),
    }
    row.scoreDisplay = formatScoreDisplay(row)
    updated.push(row)
    return row
  })

  savePapers(next)
  return { count: updated.length, papers: updated }
}
