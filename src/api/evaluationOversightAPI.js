import api from './axiosInstance'

/**
 * Evaluation Oversight API client.
 *
 * Wires the Test Management → Evaluation Oversight screens to the live backend
 * (`/api/evaluation-oversight/*`). Every endpoint is POST. Responses are mapped
 * into the shapes the existing UI components expect.
 */

const BASE = '/evaluation-oversight'
/** Backend Joi validation caps list/export body `limit` at 100. */
const LIST_PAGE_SIZE = 100

const STATUS_LABELS = {
  NOT_STARTED: 'Not Started',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  EVALUATED: 'Evaluated',
  OVERDUE: 'Overdue',
}

const PRIORITY_LABELS = {
  HIGH: 'High',
  NORMAL: 'Normal',
  LOW: 'Low',
}

const EXAM_TYPE_LABELS = {
  MAINS: 'Mains',
  DESCRIPTIVE: 'Descriptive',
  CBT: 'CBT',
  PRELIMS: 'Prelims',
}

function apiError(err, fallback) {
  const message = err?.response?.data?.message || err?.message || fallback
  const wrapped = new Error(message)
  wrapped.status = err?.response?.status
  return wrapped
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

/** Map UI filter state → backend list/export request body. */
function buildListBody(params = {}, extra = {}) {
  const body = { ...extra }
  if (!isAll(params.batchId)) body.batchId = params.batchId
  if (!isAll(params.programId)) body.programId = params.programId
  if (!isAll(params.mentorId)) body.mentorId = params.mentorId
  if (!isAll(params.subjectId)) body.subjectId = params.subjectId
  if (!isAll(params.subTopicId)) body.topicId = params.subTopicId
  if (!isAll(params.testId)) body.testId = params.testId
  if (!isAll(params.centerId)) body.centerId = params.centerId
  body.status = isAll(params.status) ? 'ALL' : params.status
  body.priority = isAll(params.priority) ? 'ALL' : params.priority
  body.examType = isAll(params.examType) ? 'ALL' : params.examType
  if (params.submittedFrom) body.submittedFrom = params.submittedFrom
  if (params.submittedTo) body.submittedTo = params.submittedTo
  const search = String(params.search || '').trim()
  if (search) body.search = search
  return body
}

/** Map a backend list row → table row shape. */
function mapRow(item = {}) {
  const statusLabel = item.statusLabel || STATUS_LABELS[item.status] || item.status || 'Not Started'
  return {
    id: item.submissionId,
    submissionId: item.submissionId,
    studentName: item.studentName || '',
    rollNumber: item.rollNumber || '',
    testName: item.testName || '',
    subjectName: item.subject || '',
    examType: item.type || EXAM_TYPE_LABELS[item.examType] || '',
    priority: PRIORITY_LABELS[item.priority] || item.priority || 'Normal',
    centerName: item.center || '',
    mentorId: item.mentorAssigned?._id || null,
    mentorName: item.mentorAssigned?.name || null,
    mentorInitials: item.mentorAssigned?.initials || null,
    status: statusLabel,
    statusEnum: item.status || null,
    scoreDisplay: item.score || '--',
    batchId: item.batchId || null,
    batchName: item.batchName || '',
    programId: item.programId || null,
    subjectId: item.facultySubjectId || null,
    testId: item.testId || null,
    submittedAt: item.submittedAt || null,
    updatedAt: item.updatedAt || null,
  }
}

// ---------------------------------------------------------------------------
// 1. Dashboard & List
// ---------------------------------------------------------------------------

export async function fetchEvaluationDashboardStats() {
  try {
    const res = await api.post(`${BASE}/dashboard`, {}, { skipAuthRedirect: true })
    const d = res.data?.data || {}
    return {
      totalPapers: d.totalPapers ?? 0,
      pendingEvaluation: d.pendingEvaluation ?? 0,
      pendingLabel: 'Awaiting evaluation',
      evaluatedToday: d.evaluatedToday ?? 0,
      evaluatedTodayLabel: 'Completed today',
      avgEvaluationTime: `${d.avgEvaluationTimeMinutes ?? 0}m`,
    }
  } catch (err) {
    throw apiError(err, 'Failed to load dashboard stats')
  }
}

function withAll(label, list = []) {
  return [{ value: 'all', label }, ...list]
}

export async function fetchEvaluationFilterOptions(params = {}) {
  try {
    const body = {}
    if (!isAll(params.batchId)) body.batchId = params.batchId
    if (!isAll(params.subjectId)) body.facultySubjectId = params.subjectId
    if (!isAll(params.subTopicId)) body.topicId = params.subTopicId
    const res = await api.post(`${BASE}/filter-options`, body, { skipAuthRedirect: true })
    const d = res.data?.data || {}

    return {
      batches: withAll(
        'All Batches',
        (d.batches || []).map((b) => ({ value: b._id, label: b.batchName, programId: b.programId })),
      ),
      programs: withAll(
        'All Programs',
        (d.programs || []).map((p) => ({ value: p._id, label: p.programName })),
      ),
      subjects: withAll(
        'All Subjects',
        (d.subjects || []).map((s) => ({ value: s._id, label: s.subjectName })),
      ),
      subTopics: withAll(
        'All Topics',
        (d.topics || []).map((t) => ({ value: t._id, label: t.topicName })),
      ),
      tests: withAll(
        'All Tests',
        (d.tests || []).map((t) => ({ value: t._id, label: t.testName })),
      ),
      mentors: withAll(
        'All Mentors',
        (d.mentors || []).map((m) => ({
          value: m._id,
          label: m.name,
          pendingCount: m.pendingCount,
        })),
      ),
      statuses: withAll(
        'All Statuses',
        (d.evaluationStatuses || [])
          .filter((s) => s !== 'ALL')
          .map((s) => ({ value: s, label: STATUS_LABELS[s] || s })),
      ),
      priorities: withAll(
        'All Priorities',
        (d.priorities || [])
          .filter((p) => p !== 'ALL')
          .map((p) => ({ value: p, label: PRIORITY_LABELS[p] || p })),
      ),
      examTypes: withAll(
        'All Exam Types',
        (d.examTypes || [])
          .filter((e) => e !== 'ALL')
          .map((e) => ({ value: e, label: EXAM_TYPE_LABELS[e] || e })),
      ),
      centers: withAll(
        'All Centers',
        (d.centers || []).map((c) => ({ value: c._id, label: c.label || c.centerName })),
      ),
    }
  } catch (err) {
    throw apiError(err, 'Failed to load filter options')
  }
}

/** Fetch all matching list rows by paging at the backend max (100 per request). */
async function fetchAllListRows(params = {}) {
  let page = 1
  let totalPages = 1
  const rows = []

  do {
    const body = buildListBody(params, { page, limit: LIST_PAGE_SIZE })
    const res = await api.post(`${BASE}/list`, body, { skipAuthRedirect: true })
    const list = res.data?.data
    if (Array.isArray(list)) rows.push(...list.map(mapRow))
    totalPages = Number(res.data?.totalPages) || 1
    page += 1
  } while (page <= totalPages)

  return rows
}

export async function fetchEvaluationTableData(params = {}) {
  try {
    return await fetchAllListRows(params)
  } catch (err) {
    throw apiError(err, 'Failed to load evaluations')
  }
}

export async function exportEvaluationCsv(params = {}) {
  try {
    // Validated body must respect limit ≤ 100; export service fetches up to 10k internally.
    const body = buildListBody(params, { page: 1, limit: LIST_PAGE_SIZE })
    const res = await api.post(`${BASE}/export`, body, {
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

    let count
    try {
      const text = await blob.text()
      count = Math.max(0, text.trim().split('\n').length - 1)
    } catch {
      count = undefined
    }
    return { count }
  } catch (err) {
    throw apiError(err, 'Export failed')
  }
}

// ---------------------------------------------------------------------------
// 2. Assign Evaluators
// ---------------------------------------------------------------------------

/** Mentors available for a subject (mentors are role-scoped, subject is advisory). */
export async function fetchMentorsForSubject(_subjectId, { excludeId } = {}) {
  try {
    const res = await api.post(`${BASE}/filter-options`, {}, { skipAuthRedirect: true })
    const mentors = res.data?.data?.mentors || []
    return mentors
      .filter((m) => String(m._id) !== String(excludeId || ''))
      .map((m) => ({
        id: m._id,
        name: m.name,
        title: m.employeeId || '',
        available: true,
        pendingCount: m.pendingCount || 0,
      }))
  } catch (err) {
    throw apiError(err, 'Failed to load mentors')
  }
}

/** Quick-assign a single paper to a mentor (table action / modal). */
export async function assignEvaluator(paperId, mentorId) {
  try {
    const res = await api.post(
      `${BASE}/assign`,
      { submissionIds: [paperId], mentorId, reason: 'Assigned via oversight' },
      { skipAuthRedirect: true },
    )
    const mentor = res.data?.data?.mentor || {}
    return {
      id: paperId,
      mentorId: mentor._id || mentorId,
      mentorName: mentor.name || '',
      mentorInitials: initials(mentor.name),
    }
  } catch (err) {
    throw apiError(err, 'Assignment failed')
  }
}

/** Bulk-assign many papers to a mentor (assignment workspace). */
export async function bulkAssignEvaluator({ paperIds, mentorId }) {
  if (!paperIds?.length) throw new Error('Select at least one paper')
  if (!mentorId) throw new Error('Select an evaluator')
  try {
    const res = await api.post(
      `${BASE}/assign`,
      { submissionIds: paperIds, mentorId, reason: 'Bulk assignment' },
      { skipAuthRedirect: true },
    )
    const data = res.data?.data || {}
    return { count: data.assigned ?? paperIds.length, mentor: data.mentor || null }
  } catch (err) {
    throw apiError(err, 'Assignment failed')
  }
}

/** Reassign a single paper to a different mentor. */
export async function reassignEvaluator(submissionId, mentorId, reason = 'Reassigned') {
  try {
    const res = await api.post(
      `${BASE}/reassign`,
      { submissionId, mentorId, reason },
      { skipAuthRedirect: true },
    )
    return res.data?.data || {}
  } catch (err) {
    throw apiError(err, 'Reassignment failed')
  }
}

/** Internal: assign/preview drives the assignment workspace (mentors, primary, pending). */
async function fetchAssignPreview({ batchId, subjectId, topicId, testId, search = '' } = {}) {
  if (isAll(batchId) || isAll(testId)) return null
  const body = { batchId, testId }
  if (!isAll(subjectId)) body.facultySubjectId = subjectId
  if (!isAll(topicId)) body.topicId = topicId
  if (search?.trim()) body.search = search.trim()
  const res = await api.post(`${BASE}/assign/preview`, body, { skipAuthRedirect: true })
  return res.data?.data || null
}

function workloadLevel(pendingCount = 0) {
  if (pendingCount >= 25) return 'high'
  if (pendingCount >= 12) return 'medium'
  return 'low'
}

export async function fetchAssignmentBatches() {
  const res = await api.post(`${BASE}/filter-options`, {}, { skipAuthRedirect: true })
  return (res.data?.data?.batches || []).map((b) => ({ value: b._id, label: b.batchName }))
}

export async function fetchAssignmentSubjects(batchId) {
  const body = isAll(batchId) ? {} : { batchId }
  const res = await api.post(`${BASE}/filter-options`, body, { skipAuthRedirect: true })
  return (res.data?.data?.subjects || []).map((s) => ({ value: s._id, label: s.subjectName }))
}

export async function fetchAssignmentTopics(subjectId) {
  if (isAll(subjectId)) return []
  const res = await api.post(
    `${BASE}/filter-options`,
    { facultySubjectId: subjectId },
    { skipAuthRedirect: true },
  )
  return (res.data?.data?.topics || []).map((t) => ({ value: t._id, label: t.topicName }))
}

export async function fetchAssignmentTests(_batchId, subjectId, topicId) {
  if (isAll(subjectId)) return []
  const body = { facultySubjectId: subjectId }
  if (!isAll(topicId)) body.topicId = topicId
  const res = await api.post(`${BASE}/filter-options`, body, { skipAuthRedirect: true })
  return (res.data?.data?.tests || []).map((t) => ({ value: t._id, label: t.testName }))
}

export async function fetchCurrentPrimaryAssignment({ batchId, subjectId, topicId, testId } = {}) {
  try {
    const preview = await fetchAssignPreview({ batchId, subjectId, topicId, testId })
    const primary = preview?.primaryAssignment
    if (!primary) return null
    return {
      mentorId: primary._id,
      name: primary.name,
      title: '',
      initials: initials(primary.name),
      pendingPapers: primary.pendingPapers || 0,
      dueDate: '',
    }
  } catch {
    return null
  }
}

export async function fetchAssignmentPendingPapers({
  batchId,
  subjectId,
  topicId,
  testId,
  status = 'all',
} = {}) {
  try {
    const preview = await fetchAssignPreview({ batchId, subjectId, topicId, testId })
    let rows = (preview?.pendingStudents || []).map((p) => ({
      id: p.submissionId,
      studentName: p.studentName || '',
      rollNumber: p.rollNumber || '',
      status: STATUS_LABELS[p.status] || p.status || 'Not Started',
      lastUpdate: p.lastUpdated || null,
      mentorId: null,
    }))
    if (status && status !== 'all') {
      rows = rows.filter((r) => r.status === status)
    }
    return rows
  } catch (err) {
    throw apiError(err, 'Failed to load pending papers')
  }
}

export async function fetchAssignmentEvaluators(_subjectId, { excludeMentorId } = {}) {
  try {
    const res = await api.post(`${BASE}/filter-options`, {}, { skipAuthRedirect: true })
    const mentors = res.data?.data?.mentors || []
    return mentors
      .filter((m) => String(m._id) !== String(excludeMentorId || ''))
      .map((m) => {
        const pending = m.pendingCount || 0
        return {
          id: m._id,
          name: m.name,
          title: m.employeeId || '',
          pendingCount: pending,
          workloadLevel: workloadLevel(pending),
          available: true,
        }
      })
  } catch (err) {
    throw apiError(err, 'Failed to load evaluators')
  }
}

// ---------------------------------------------------------------------------
// 3. View Paper & Evaluation
// ---------------------------------------------------------------------------

function mapSubmissionDetail(d = {}) {
  const ev = d.evaluation || {}
  const rubric = [
    {
      key: 'conceptual',
      label: 'Conceptual Clarity',
      max: 10,
      score: ev.conceptualScore ?? 0,
      feedback: ev.conceptualRemarks || '',
      remarksLabel: 'Section Remarks',
      placeholder: 'Specific feedback on concepts...',
    },
    {
      key: 'language',
      label: 'Language & Tone',
      max: 5,
      score: ev.languageScore ?? 0,
      feedback: ev.languageRemarks || '',
      remarksLabel: 'Grammar & Syntax notes',
      placeholder: 'Feedback on language...',
    },
    {
      key: 'structure',
      label: 'Structure',
      max: 5,
      score: ev.structureScore ?? 0,
      feedback: ev.structureRemarks || '',
      remarksLabel: 'Flow & Continuity',
      placeholder: 'Feedback on logical flow...',
    },
  ]

  const status = d.statusLabel || STATUS_LABELS[d.status] || d.status || 'Not Started'

  return {
    id: d.submissionId,
    studentName: d.student?.name || '',
    rollNumber: d.student?.rollNumber || '',
    batchName: d.student?.batchName || '',
    testId: d.test?.testId || null,
    testName: d.test?.testName || '',
    subjectName: d.test?.subject || '',
    questionText: d.test?.questionsText || '',
    questionMarks: d.test?.totalMarks || 20,
    scoreMax: ev.maxScore || d.test?.totalMarks || 20,
    scoreObtained: ev.totalScore ?? 0,
    status,
    statusEnum: d.status || null,
    locked: !!ev.publishedStatus,
    mentorId: d.mentor?._id || null,
    mentorName: d.mentor?.name || null,
    rubric,
    annotations: (d.annotations || []).map((a) => ({
      id: a._id,
      page: a.pageNo,
      pageNo: a.pageNo,
      annotationType: a.annotationType,
      type: a.annotationType,
      content: a.content,
      coordinates: a.coordinates,
      color: a.color,
    })),
    answerType: d.answer?.type || null,
    answerText: d.answer?.text || '',
    answerSheet: {
      fileName: d.answer?.file?.fileName || null,
      url: d.answer?.pdfUrl || d.answer?.file?.url || null,
      dataUrl: null,
      pages: 1,
      pageImages: [],
    },
    priority: 'Normal',
    examType: '',
  }
}

export async function fetchEvaluationPaperById(paperId) {
  try {
    const res = await api.post(
      `${BASE}/submission/detail`,
      { submissionId: paperId },
      { skipAuthRedirect: true },
    )
    return mapSubmissionDetail(res.data?.data || {})
  } catch (err) {
    throw apiError(err, 'Failed to load paper')
  }
}

/** Fetch answer PDF via backend proxy (avoids CORS / X-Frame-Options on external URLs). */
export async function fetchSubmissionPdfBlobUrl(submissionId) {
  const res = await api.post(
    `${BASE}/submission/pdf`,
    { submissionId },
    { responseType: 'blob', skipAuthRedirect: true },
  )
  const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/pdf' })
  return URL.createObjectURL(blob)
}

/** Convert workspace rubric array → backend score payload. */
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

export async function saveEvaluationDraft(paperId, patch = {}) {
  try {
    const res = await api.post(
      `${BASE}/evaluation/draft`,
      { submissionId: paperId, ...rubricToScores(patch.rubric) },
      { skipAuthRedirect: true },
    )
    const data = res.data?.data || {}
    return {
      id: paperId,
      scoreObtained: data.totalScore ?? patch.scoreObtained ?? 0,
      status: 'In Progress',
    }
  } catch (err) {
    throw apiError(err, 'Failed to save draft')
  }
}

export async function publishEvaluationResult(paperId, patch = {}) {
  try {
    const res = await api.post(
      `${BASE}/evaluation/publish`,
      { submissionId: paperId, ...rubricToScores(patch.rubric) },
      { skipAuthRedirect: true },
    )
    const data = res.data?.data || {}
    return {
      id: paperId,
      scoreObtained: data.totalScore ?? patch.scoreObtained ?? 0,
      scoreMax: 20,
      status: 'Evaluated',
      locked: true,
    }
  } catch (err) {
    throw apiError(err, 'Failed to publish results')
  }
}

export async function savePaperAnnotations(paperId, annotations = []) {
  try {
    const payload = (annotations || []).map((a) => ({
      pageNo: a.pageNo || a.page || 1,
      annotationType: String(a.annotationType || a.type || 'HIGHLIGHT').toUpperCase(),
      content: a.content || a.text || '',
      coordinates:
        a.coordinates ||
        (a.x != null
          ? { x: a.x, y: a.y, width: a.width, height: a.height }
          : {}),
      color: a.color || '#FFEB3B',
    }))
    const res = await api.post(
      `${BASE}/annotations/save`,
      { submissionId: paperId, annotations: payload },
      { skipAuthRedirect: true },
    )
    return res.data?.data || { saved: payload.length }
  } catch (err) {
    throw apiError(err, 'Failed to save annotations')
  }
}

// ---------------------------------------------------------------------------
// Helpers retained for component compatibility
// ---------------------------------------------------------------------------

/** Test metadata is carried on the paper object now; kept as a safe stub. */
export function getTestMeta() {
  return undefined
}

/** Download the student's answer sheet (proxied PDF or typed text). */
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
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = paper.answerSheet.fileName || `${safeName}.pdf`
      a.click()
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
      return
    } catch {
      /* fall through to direct URL */
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
