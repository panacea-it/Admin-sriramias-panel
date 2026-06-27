/**
 * Evaluation Oversight API — local seed + localStorage (no live backend).
 */

import {
  SEED_EVALUATION_PAPERS,
  SEED_OVERSIGHT_STATS,
  SEED_OVERSIGHT_BATCHES,
  SEED_OVERSIGHT_PROGRAMS,
  SEED_OVERSIGHT_CENTERS,
  SEED_OVERSIGHT_SUBJECTS,
  SEED_OVERSIGHT_SUBTOPICS,
  SEED_OVERSIGHT_TESTS,
  SEED_OVERSIGHT_MENTORS,
  DEFAULT_WORKSPACE_RUBRIC,
  OVERSIGHT_STATUSES,
  OVERSIGHT_PRIORITIES,
  OVERSIGHT_EXAM_TYPES,
} from '../data/evaluationOversightSeed'

const STORAGE_KEY = 'eo_papers_v1'
const DELAY_MS = 120

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
  if (typeof window === 'undefined') {
    return SEED_EVALUATION_PAPERS.map((p) => ({ ...p }))
  }
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const seed = SEED_EVALUATION_PAPERS.map((p) => ({ ...p }))
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
  const parsed = safeJsonParse(raw, null)
  return Array.isArray(parsed) ? parsed : SEED_EVALUATION_PAPERS.map((p) => ({ ...p }))
}

function savePapers(papers) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(papers))
}

function updatePaper(paperId, patch) {
  const papers = loadPapers()
  const idx = papers.findIndex((p) => String(p.id) === String(paperId))
  if (idx < 0) throw new Error('Paper not found')
  papers[idx] = { ...papers[idx], ...patch, updatedAt: new Date().toISOString() }
  savePapers(papers)
  return papers[idx]
}

function initials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function isAll(v) {
  return v == null || v === '' || v === 'all'
}

function withAll(label, list = []) {
  return [{ value: 'all', label }, ...list]
}

function mentorPendingCount(mentorId, papers = loadPapers()) {
  if (!mentorId) return 0
  return papers.filter(
    (p) =>
      String(p.mentorId) === String(mentorId) &&
      !['Evaluated'].includes(p.status),
  ).length
}

function findMentor(mentorId) {
  return SEED_OVERSIGHT_MENTORS.find((m) => String(m.id) === String(mentorId)) || null
}

function findTest(testId) {
  return SEED_OVERSIGHT_TESTS.find((t) => String(t.id) === String(testId)) || null
}

function normalizeStatusEnum(status) {
  const map = {
    'Not Started': 'NOT_STARTED',
    Assigned: 'ASSIGNED',
    'In Progress': 'IN_PROGRESS',
    Evaluated: 'EVALUATED',
    Overdue: 'OVERDUE',
    Pending: 'PENDING',
  }
  return map[status] || status
}

/** Map stored paper → table row shape. */
function mapPaperToTableRow(paper = {}) {
  return {
    id: paper.id,
    submissionId: paper.id,
    studentName: paper.studentName || '',
    rollNumber: paper.rollNumber || '',
    testName: paper.testName || '',
    subjectName: paper.subjectName || '',
    examType: paper.examType || '',
    priority: paper.priority || 'Normal',
    centerName: paper.centerName || '',
    mentorId: paper.mentorId || null,
    mentorName: paper.mentorName || null,
    mentorInitials: paper.mentorInitials || (paper.mentorName ? initials(paper.mentorName) : null),
    status: paper.status || 'Not Started',
    statusEnum: normalizeStatusEnum(paper.status),
    scoreDisplay: paper.scoreDisplay || '--',
    batchId: paper.batchId || null,
    batchName: paper.batchName || '',
    programId: paper.programId || null,
    subjectId: paper.subjectId || null,
    testId: paper.testId || null,
    submittedAt: paper.submittedAt || null,
    updatedAt: paper.updatedAt || null,
  }
}

function matchesSearch(paper, search) {
  const q = String(search || '').trim().toLowerCase()
  if (!q) return true
  const hay = [
    paper.studentName,
    paper.rollNumber,
    paper.testName,
    paper.subjectName,
    paper.batchName,
    paper.centerName,
    paper.mentorName,
    paper.id,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return hay.includes(q)
}

function filterPapers(params = {}) {
  let rows = loadPapers()

  if (!isAll(params.batchId)) {
    rows = rows.filter((p) => String(p.batchId) === String(params.batchId))
  }
  if (!isAll(params.programId)) {
    rows = rows.filter((p) => String(p.programId) === String(params.programId))
  }
  if (!isAll(params.mentorId)) {
    rows = rows.filter((p) => String(p.mentorId) === String(params.mentorId))
  }
  if (!isAll(params.subjectId)) {
    rows = rows.filter((p) => String(p.subjectId) === String(params.subjectId))
  }
  if (!isAll(params.subTopicId)) {
    rows = rows.filter((p) => String(p.subTopicId) === String(params.subTopicId))
  }
  if (!isAll(params.testId)) {
    rows = rows.filter((p) => String(p.testId) === String(params.testId))
  }
  if (!isAll(params.centerId)) {
    rows = rows.filter((p) => String(p.centerId) === String(params.centerId))
  }
  if (!isAll(params.status)) {
    rows = rows.filter((p) => String(p.status) === String(params.status))
  }
  if (!isAll(params.priority)) {
    rows = rows.filter((p) => String(p.priority) === String(params.priority))
  }
  if (!isAll(params.examType)) {
    rows = rows.filter((p) => String(p.examType) === String(params.examType))
  }
  if (params.submittedFrom) {
    const from = new Date(params.submittedFrom)
    rows = rows.filter((p) => p.submittedAt && new Date(p.submittedAt) >= from)
  }
  if (params.submittedTo) {
    const to = new Date(params.submittedTo)
    rows = rows.filter((p) => p.submittedAt && new Date(p.submittedAt) <= to)
  }
  if (params.search) {
    rows = rows.filter((p) => matchesSearch(p, params.search))
  }

  return rows
}

function mapPaperToDetail(paper = {}) {
  const test = findTest(paper.testId)
  const rubric =
    Array.isArray(paper.rubric) && paper.rubric.length
      ? paper.rubric.map((r) => ({ ...r }))
      : DEFAULT_WORKSPACE_RUBRIC.map((r) => ({ ...r }))

  return {
    id: paper.id,
    studentName: paper.studentName || '',
    rollNumber: paper.rollNumber || '',
    batchName: paper.batchName || '',
    testId: paper.testId || null,
    testName: paper.testName || test?.label || '',
    subjectName: paper.subjectName || '',
    questionText: test?.questionText || paper.questionText || '',
    questionMarks: test?.questionMarks || paper.questionMarks || 20,
    scoreMax: paper.scoreMax || test?.maxMarks || 20,
    scoreObtained: paper.scoreObtained ?? 0,
    status: paper.status || 'Not Started',
    statusEnum: normalizeStatusEnum(paper.status),
    locked: !!paper.locked,
    mentorId: paper.mentorId || null,
    mentorName: paper.mentorName || null,
    rubric,
    annotations: (paper.annotations || []).map((a, i) => ({
      id: a.id || `ann-${i}`,
      page: a.pageNo ?? a.page ?? 1,
      pageNo: a.pageNo ?? a.page ?? 1,
      annotationType: a.annotationType || a.type || 'HIGHLIGHT',
      type: a.annotationType || a.type || 'HIGHLIGHT',
      content: a.content || '',
      coordinates: a.coordinates || {},
      color: a.color || '#FFEB3B',
    })),
    answerType: paper.answerType || (paper.answerText ? 'text' : null),
    answerText: paper.answerText || '',
    answerSheet: {
      fileName: paper.answerSheet?.fileName || null,
      url: paper.answerSheet?.url || null,
      dataUrl: paper.answerSheet?.dataUrl || null,
      pages: paper.answerSheet?.pages || 1,
      pageImages: paper.answerSheet?.pageImages || [],
    },
    priority: paper.priority || 'Normal',
    examType: paper.examType || test?.examType || '',
  }
}

function rubricToScores(rubric = []) {
  const get = (k) => rubric.find((r) => r.key === k) || {}
  const c = get('conceptual')
  const l = get('language')
  const s = get('structure')
  return {
    conceptualScore: Number(c.score) || 0,
    conceptualRemarks: c.feedback || '',
    languageScore: Number(l.score) || 0,
    languageRemarks: l.feedback || '',
    structureScore: Number(s.score) || 0,
    structureRemarks: s.feedback || '',
  }
}

function rubricTotal(rubric = []) {
  return rubric.reduce((sum, r) => sum + (Number(r.score) || 0), 0)
}

function workloadLevel(pendingCount = 0) {
  if (pendingCount >= 25) return 'high'
  if (pendingCount >= 12) return 'medium'
  return 'low'
}

function subjectsForBatch(batchId) {
  if (isAll(batchId)) return SEED_OVERSIGHT_SUBJECTS
  return SEED_OVERSIGHT_SUBJECTS.filter((s) => (s.batchIds || []).includes(batchId))
}

function topicsForSubject(subjectId) {
  if (isAll(subjectId)) return []
  return SEED_OVERSIGHT_SUBTOPICS.filter((t) => t.subjectId === subjectId)
}

function testsForSubject(subjectId, topicId, batchId) {
  if (isAll(subjectId)) return []
  return SEED_OVERSIGHT_TESTS.filter((t) => {
    if (t.subjectId !== subjectId) return false
    if (!isAll(batchId) && !(t.batchIds || []).includes(batchId)) return false
    return true
  })
}

function mentorsForSubject(subjectId) {
  if (isAll(subjectId)) return SEED_OVERSIGHT_MENTORS
  return SEED_OVERSIGHT_MENTORS.filter((m) => (m.subjectIds || []).includes(subjectId))
}

// ---------------------------------------------------------------------------
// 1. Dashboard & List
// ---------------------------------------------------------------------------

export async function fetchEvaluationDashboardStats() {
  await delay()
  const d = SEED_OVERSIGHT_STATS
  return {
    totalPapers: d.totalPapers ?? 0,
    pendingEvaluation: d.pendingEvaluation ?? 0,
    pendingLabel: d.pendingLabel || 'Awaiting evaluation',
    evaluatedToday: d.evaluatedToday ?? 0,
    evaluatedTodayLabel: d.evaluatedTodayLabel || 'Completed today',
    avgEvaluationTime: d.avgEvaluationTime || `${d.avgEvaluationTimeMinutes ?? 0}m`,
  }
}

export async function fetchEvaluationFilterOptions(params = {}) {
  await delay()
  const papers = loadPapers()
  const batchId = params.batchId
  const subjectId = params.subjectId

  const batches = SEED_OVERSIGHT_BATCHES.map((b) => ({
    value: b.id,
    label: b.label,
    programId: SEED_OVERSIGHT_SUBJECTS.find((s) => (s.batchIds || []).includes(b.id))?.programId,
  }))

  const programs = SEED_OVERSIGHT_PROGRAMS.map((p) => ({
    value: p.id,
    label: p.label,
  }))

  const subjects = subjectsForBatch(batchId).map((s) => ({
    value: s.id,
    label: s.label,
  }))

  const subTopics = (isAll(subjectId) ? SEED_OVERSIGHT_SUBTOPICS : topicsForSubject(subjectId)).map(
    (t) => ({ value: t.id, label: t.label }),
  )

  const tests = (
    isAll(subjectId)
      ? SEED_OVERSIGHT_TESTS
      : testsForSubject(subjectId, params.subTopicId, batchId)
  ).map((t) => ({ value: t.id, label: t.label }))

  const mentors = SEED_OVERSIGHT_MENTORS.map((m) => ({
    value: m.id,
    label: m.name,
    pendingCount: mentorPendingCount(m.id, papers),
  }))

  return {
    batches: withAll('All Batches', batches),
    programs: withAll('All Programs', programs),
    subjects: withAll('All Subjects', subjects),
    subTopics: withAll('All Topics', subTopics),
    tests: withAll('All Tests', tests),
    mentors: withAll('All Mentors', mentors),
    statuses: withAll(
      'All Statuses',
      OVERSIGHT_STATUSES.map((s) => ({ value: s, label: s })),
    ),
    priorities: withAll(
      'All Priorities',
      OVERSIGHT_PRIORITIES.map((p) => ({ value: p, label: p })),
    ),
    examTypes: withAll(
      'All Exam Types',
      OVERSIGHT_EXAM_TYPES.map((e) => ({ value: e, label: e })),
    ),
    centers: withAll(
      'All Centers',
      SEED_OVERSIGHT_CENTERS.map((c) => ({ value: c.id, label: c.label })),
    ),
  }
}

export async function fetchEvaluationTableData(params = {}) {
  await delay()
  return filterPapers(params).map(mapPaperToTableRow)
}

export async function exportEvaluationCsv(params = {}) {
  await delay()
  const rows = filterPapers(params).map(mapPaperToTableRow)
  const headers = [
    'Submission ID',
    'Student',
    'Roll Number',
    'Test',
    'Subject',
    'Exam Type',
    'Priority',
    'Center',
    'Mentor',
    'Status',
    'Score',
    'Batch',
    'Submitted At',
  ]
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        r.submissionId,
        r.studentName,
        r.rollNumber,
        r.testName,
        r.subjectName,
        r.examType,
        r.priority,
        r.centerName,
        r.mentorName || '',
        r.status,
        r.scoreDisplay,
        r.batchName,
        r.submittedAt || '',
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

// ---------------------------------------------------------------------------
// 2. Assign Evaluators
// ---------------------------------------------------------------------------

export async function fetchMentorsForSubject(subjectId, { excludeId } = {}) {
  await delay()
  const papers = loadPapers()
  return mentorsForSubject(subjectId)
    .filter((m) => String(m.id) !== String(excludeId || ''))
    .map((m) => ({
      id: m.id,
      name: m.name,
      title: m.title || '',
      available: m.available !== false,
      pendingCount: mentorPendingCount(m.id, papers),
    }))
}

export async function assignEvaluator(paperId, mentorId) {
  await delay()
  const mentor = findMentor(mentorId)
  if (!mentor) throw new Error('Mentor not found')
  const updated = updatePaper(paperId, {
    mentorId: mentor.id,
    mentorName: mentor.name,
    mentorInitials: initials(mentor.name),
    status: 'Assigned',
  })
  return {
    id: paperId,
    mentorId: updated.mentorId,
    mentorName: updated.mentorName,
    mentorInitials: updated.mentorInitials,
  }
}

export async function bulkAssignEvaluator({ paperIds, mentorId }) {
  if (!paperIds?.length) throw new Error('Select at least one paper')
  if (!mentorId) throw new Error('Select an evaluator')
  await delay()
  const mentor = findMentor(mentorId)
  if (!mentor) throw new Error('Mentor not found')
  let count = 0
  for (const id of paperIds) {
    try {
      updatePaper(id, {
        mentorId: mentor.id,
        mentorName: mentor.name,
        mentorInitials: initials(mentor.name),
        status: 'Assigned',
      })
      count += 1
    } catch {
      /* skip missing */
    }
  }
  return {
    count,
    mentor: { _id: mentor.id, name: mentor.name, initials: initials(mentor.name) },
  }
}

export async function reassignEvaluator(submissionId, mentorId, reason = 'Reassigned') {
  await delay()
  const mentor = findMentor(mentorId)
  if (!mentor) throw new Error('Mentor not found')
  const updated = updatePaper(submissionId, {
    mentorId: mentor.id,
    mentorName: mentor.name,
    mentorInitials: initials(mentor.name),
  })
  return {
    submissionId,
    mentorId: updated.mentorId,
    mentorName: updated.mentorName,
    reason,
  }
}

export async function fetchAssignmentBatches() {
  await delay()
  return SEED_OVERSIGHT_BATCHES.map((b) => ({ value: b.id, label: b.label }))
}

export async function fetchAssignmentSubjects(batchId) {
  await delay()
  return subjectsForBatch(batchId).map((s) => ({ value: s.id, label: s.label }))
}

export async function fetchAssignmentTopics(subjectId) {
  await delay()
  if (isAll(subjectId)) return []
  return topicsForSubject(subjectId).map((t) => ({ value: t.id, label: t.label }))
}

export async function fetchAssignmentTests(_batchId, subjectId, topicId) {
  await delay()
  if (isAll(subjectId)) return []
  return testsForSubject(subjectId, topicId, _batchId).map((t) => ({
    value: t.id,
    label: t.label,
  }))
}

export async function fetchCurrentPrimaryAssignment({ batchId, subjectId, topicId, testId } = {}) {
  await delay()
  if (isAll(batchId) || isAll(testId)) return null

  const papers = filterPapers({ batchId, subjectId, subTopicId: topicId, testId }).filter(
    (p) => p.mentorId,
  )
  if (!papers.length) return null

  const counts = new Map()
  for (const p of papers) {
    const key = String(p.mentorId)
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  let topMentorId = null
  let topCount = 0
  for (const [id, c] of counts) {
    if (c > topCount) {
      topMentorId = id
      topCount = c
    }
  }
  const mentor = findMentor(topMentorId)
  if (!mentor) return null

  const allPapers = loadPapers()
  return {
    mentorId: mentor.id,
    name: mentor.name,
    title: mentor.title || '',
    initials: initials(mentor.name),
    pendingPapers: mentorPendingCount(mentor.id, allPapers),
    dueDate: '',
  }
}

export async function fetchAssignmentPendingPapers({
  batchId,
  subjectId,
  topicId,
  testId,
  status = 'all',
} = {}) {
  await delay()
  let rows = filterPapers({ batchId, subjectId, subTopicId: topicId, testId }).map((p) => ({
    id: p.id,
    studentName: p.studentName || '',
    rollNumber: p.rollNumber || '',
    status: p.status || 'Not Started',
    lastUpdate: p.updatedAt || p.submittedAt || null,
    mentorId: p.mentorId || null,
  }))
  if (status && status !== 'all') {
    rows = rows.filter((r) => r.status === status)
  }
  return rows
}

export async function fetchAssignmentEvaluators(subjectId, { excludeMentorId } = {}) {
  await delay()
  const papers = loadPapers()
  return mentorsForSubject(subjectId)
    .filter((m) => String(m.id) !== String(excludeMentorId || ''))
    .map((m) => {
      const pending = mentorPendingCount(m.id, papers)
      return {
        id: m.id,
        name: m.name,
        title: m.title || '',
        pendingCount: pending,
        workloadLevel: workloadLevel(pending),
        available: m.available !== false,
      }
    })
}

// ---------------------------------------------------------------------------
// 3. View Paper & Evaluation
// ---------------------------------------------------------------------------

export async function fetchEvaluationPaperById(paperId) {
  await delay()
  const paper = loadPapers().find((p) => String(p.id) === String(paperId))
  if (!paper) throw new Error('Paper not found')
  return mapPaperToDetail(paper)
}

export async function fetchSubmissionPdfBlobUrl(submissionId) {
  await delay()
  const paper = loadPapers().find((p) => String(p.id) === String(submissionId))
  if (!paper) return null

  const dataUrl = paper.answerSheet?.dataUrl
  if (dataUrl) return dataUrl

  const url = paper.answerSheet?.url
  if (!url) return null

  try {
    const blob = new Blob(['%PDF-1.4\n% Local seed placeholder\n'], { type: 'application/pdf' })
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}

export async function saveEvaluationDraft(paperId, patch = {}) {
  await delay()
  const rubric = patch.rubric || DEFAULT_WORKSPACE_RUBRIC
  const total = rubricTotal(rubric)
  const updated = updatePaper(paperId, {
    rubric: rubric.map((r) => ({ ...r })),
    scoreObtained: total,
    status: 'In Progress',
    locked: false,
    ...rubricToScores(rubric),
  })
  return {
    id: paperId,
    scoreObtained: updated.scoreObtained ?? total,
    status: 'In Progress',
  }
}

export async function publishEvaluationResult(paperId, patch = {}) {
  await delay()
  const rubric = patch.rubric || DEFAULT_WORKSPACE_RUBRIC
  const total = rubricTotal(rubric)
  const paper = loadPapers().find((p) => String(p.id) === String(paperId))
  const max = paper?.scoreMax || 20
  const updated = updatePaper(paperId, {
    rubric: rubric.map((r) => ({ ...r })),
    scoreObtained: total,
    scoreDisplay: `${total}/${max}`,
    status: 'Evaluated',
    locked: true,
    evaluatedAt: new Date().toISOString(),
    ...rubricToScores(rubric),
  })
  return {
    id: paperId,
    scoreObtained: updated.scoreObtained ?? total,
    scoreMax: max,
    status: 'Evaluated',
    locked: true,
  }
}

export async function savePaperAnnotations(paperId, annotations = []) {
  await delay()
  const payload = (annotations || []).map((a, i) => ({
    id: a.id || `ann-${Date.now()}-${i}`,
    pageNo: a.pageNo || a.page || 1,
    annotationType: String(a.annotationType || a.type || 'HIGHLIGHT').toUpperCase(),
    content: a.content || a.text || '',
    coordinates:
      a.coordinates ||
      (a.x != null ? { x: a.x, y: a.y, width: a.width, height: a.height } : {}),
    color: a.color || '#FFEB3B',
  }))
  updatePaper(paperId, { annotations: payload })
  return { saved: payload.length }
}

// ---------------------------------------------------------------------------
// Helpers retained for component compatibility
// ---------------------------------------------------------------------------

export function getTestMeta() {
  return undefined
}

export async function downloadEvaluationPaper(paper) {
  const safeName = String(paper?.rollNumber || paper?.studentName || 'answer-sheet')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (paper?.answerType === 'text' && paper?.answerText) {
    const blob = new Blob([paper.answerText], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${safeName}-answer.txt`
    a.click()
    URL.revokeObjectURL(url)
    return
  }

  if (paper?.id && paper?.answerSheet?.url) {
    try {
      const blobUrl = await fetchSubmissionPdfBlobUrl(paper.id)
      if (blobUrl) {
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = paper.answerSheet.fileName || `${safeName}.pdf`
        a.click()
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
        return
      }
    } catch {
      /* fall through */
    }
  }

  const sheet = paper?.answerSheet
  if (sheet?.dataUrl) {
    const a = document.createElement('a')
    a.href = sheet.dataUrl
    a.download = sheet.fileName || `${safeName}.pdf`
    a.click()
    return
  }

  if (sheet?.url) {
    window.open(sheet.url, '_blank', 'noopener,noreferrer')
    return
  }

  throw new Error('No answer sheet available to download')
}
