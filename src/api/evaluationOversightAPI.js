/**
 * Evaluation Oversight API — POST backend integration.
 * Contract: docs/EVALUATION_OVERSIGHT_FRONTEND_INTEGRATION.md
 */

import api from './axiosInstance'
import { canUseLiveApi } from '../utils/authStorage'
import { getApiErrorMessage } from '../utils/apiError'

const BASE = '/evaluation-oversight'

let lastAssignmentBatchId = ''
let assignPreviewCache = { key: '', data: null }

export function clearAssignPreviewCache() {
  assignPreviewCache = { key: '', data: null }
}

function toApiError(error, fallback = 'Request failed') {
  const message = getApiErrorMessage(error, fallback)
  const err = new Error(message)
  if (error?.response?.status) err.status = error.response.status
  if (error?.response?.data?.code) err.code = error.response.data.code
  return err
}

function unwrap(payload) {
  if (payload == null) return payload
  if (typeof payload === 'object' && payload.data !== undefined && ('success' in payload || 'statusCode' in payload)) {
    return payload.data
  }
  return payload
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

function withAll(label, list = []) {
  return [{ value: 'all', label }, ...list]
}

function mapSelect(items = [], valueKey = '_id', labelKey = 'label') {
  return items
    .filter((item) => item?.[valueKey] != null || item?.value != null)
    .map((item) => ({
      value: item[valueKey] ?? item.value ?? item.id,
      label: item[labelKey] ?? item.label ?? String(item[valueKey] ?? item.value ?? ''),
      ...(item.pendingCount != null ? { pendingCount: item.pendingCount } : {}),
      ...(item.programId != null ? { programId: item.programId } : {}),
    }))
}

function titleCaseToken(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  return raw
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatPriority(value) {
  const label = titleCaseToken(value)
  if (!label) return 'Normal'
  if (label.toLowerCase() === 'normal') return 'Normal'
  return label
}

function formatExamType(value) {
  const label = titleCaseToken(value)
  if (!label) return ''
  if (label.toLowerCase() === 'cbt') return 'CBT'
  return label
}

function toFilterEnum(value) {
  if (value == null || value === '' || value === 'all') return 'ALL'
  return String(value)
}

function assignOptionalFilters(body, params = {}) {
  const optional = {
    batchId: params.batchId,
    programId: params.programId,
    facultySubjectId: params.subjectId,
    topicId: params.subTopicId,
    testId: params.testId,
    mentorId: params.mentorId,
    centerId: params.centerId,
    submittedFrom: params.submittedFrom,
    submittedTo: params.submittedTo,
  }

  for (const [key, raw] of Object.entries(optional)) {
    const value = raw === 'all' ? '' : raw
    if (value != null && String(value).trim() !== '') {
      body[key] = value
    }
  }

  return body
}

function toListBody(params = {}, { page = 1, limit = 20 } = {}) {
  const body = {
    page: Number(page) || 1,
    limit: Math.min(Math.max(Number(limit) || 20, 1), 100),
    search: params.search || '',
    status: toFilterEnum(params.status),
    priority: toFilterEnum(params.priority),
    examType: toFilterEnum(params.examType),
  }

  return assignOptionalFilters(body, params)
}

function toExportBody(params = {}) {
  const body = {
    search: params.search || '',
    status: toFilterEnum(params.status),
    priority: toFilterEnum(params.priority),
    examType: toFilterEnum(params.examType),
  }
  return assignOptionalFilters(body, params)
}

function rubricFromEvaluation(ev = {}) {
  return [
    {
      key: 'conceptual',
      label: 'Conceptual Clarity',
      max: 10,
      score: Number(ev.conceptualScore) || 0,
      feedback: ev.conceptualRemarks || '',
      remarksLabel: 'Section Remarks',
      placeholder: 'Specific feedback on concepts...',
    },
    {
      key: 'language',
      label: 'Language & Tone',
      max: 5,
      score: Number(ev.languageScore) || 0,
      feedback: ev.languageRemarks || '',
      remarksLabel: 'Section Remarks',
      placeholder: 'Grammar, tone, and clarity...',
    },
    {
      key: 'structure',
      label: 'Structure',
      max: 5,
      score: Number(ev.structureScore) || 0,
      feedback: ev.structureRemarks || '',
      remarksLabel: 'Section Remarks',
      placeholder: 'Organization and flow...',
    },
  ]
}

function rubricToDraftBody(submissionId, rubric = []) {
  const get = (key) => rubric.find((r) => r.key === key) || {}
  const conceptual = get('conceptual')
  const language = get('language')
  const structure = get('structure')
  return {
    submissionId,
    conceptualScore: Number(conceptual.score) || 0,
    conceptualRemarks: conceptual.feedback || '',
    languageScore: Number(language.score) || 0,
    languageRemarks: language.feedback || '',
    structureScore: Number(structure.score) || 0,
    structureRemarks: structure.feedback || '',
  }
}

function workloadLevel(pendingCount = 0) {
  const count = Number(pendingCount) || 0
  if (count >= 25) return 'high'
  if (count >= 12) return 'medium'
  return 'low'
}

function mapWorkloadLevel(raw, pendingCount = 0) {
  const level = String(raw || '').toLowerCase()
  if (level === 'high' || level === 'medium' || level === 'low') return level
  return workloadLevel(pendingCount)
}

async function post(path, body = {}, { responseType, timeout } = {}) {
  if (!canUseLiveApi()) {
    throw new Error(
      'Evaluation Oversight requires a live API session. Sign out and sign in with valid Super Admin credentials.',
    )
  }
  try {
    const config = responseType || timeout ? { ...(responseType ? { responseType } : {}), ...(timeout ? { timeout } : {}) } : undefined
    const { data } = await api.post(`${BASE}${path}`, body, config)
    return data
  } catch (error) {
    throw toApiError(error, 'Request failed')
  }
}

/** Omit empty / `all` filter values for POST list/export bodies. */
export function stripOversightFilterParams(params = {}) {
  return toListBody(params)
}

function pickText(value, keys = ['name', 'label', 'title']) {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object') {
    for (const key of keys) {
      if (value[key] != null && value[key] !== '') return String(value[key])
    }
  }
  return ''
}

function normalizeMentorRef(value) {
  if (value == null) {
    return { mentorId: null, mentorName: null, mentorInitials: null }
  }

  if (typeof value === 'string') {
    return {
      mentorId: null,
      mentorName: value,
      mentorInitials: initials(value),
    }
  }

  if (typeof value === 'object') {
    const mentorName = pickText(value, ['name', 'mentorName', 'label'])
    return {
      mentorId: value._id || value.mentorId || value.id || null,
      mentorName: mentorName || null,
      mentorInitials: value.initials || (mentorName ? initials(mentorName) : null),
    }
  }

  return { mentorId: null, mentorName: null, mentorInitials: null }
}

function readActionFlag(row, ...keys) {
  for (const key of keys) {
    const value = row?.[key]
    if (typeof value === 'boolean') return value
  }
  return undefined
}

function mapListRow(row = {}) {
  const mentor = normalizeMentorRef(row.mentorAssigned ?? row.mentor ?? row.mentorName)
  return {
    id: row.submissionId || row.id || row._id,
    submissionId: row.submissionId || row.id || row._id,
    studentName: row.studentName || '',
    rollNumber: row.rollNumber || '',
    testName: row.testName || pickText(row.test, ['testName', 'name', 'label']) || '',
    subjectName:
      pickText(row.subject, ['name', 'label']) || row.subjectName || row.facultySubjectName || '',
    examType: formatExamType(pickText(row.type, ['name', 'label', 'key']) || row.examType),
    priority: formatPriority(pickText(row.priority, ['name', 'label', 'key']) || row.priority),
    centerName: pickText(row.center, ['name', 'label']) || row.centerName || '',
    mentorId: mentor.mentorId || row.mentorId || null,
    mentorName: mentor.mentorName,
    mentorInitials: mentor.mentorInitials,
    status: pickText(row.statusLabel, ['name', 'label']) || row.statusLabel || row.status || '',
    statusEnum: row.status || row.statusKey || '',
    scoreDisplay: row.score || row.scoreDisplay || '--',
    batchId: row.batchId || pickText(row.batch, ['_id', 'id', 'batchId']) || null,
    batchName: row.batchName || pickText(row.batch, ['name', 'label']) || '',
    programId: row.programId || pickText(row.program, ['_id', 'id']) || null,
    subjectId:
      row.facultySubjectId ||
      row.subjectId ||
      pickText(row.subject, ['_id', 'id', 'facultySubjectId']) ||
      null,
    subTopicId:
      row.topicId || row.subTopicId || pickText(row.topic, ['_id', 'id', 'topicId']) || null,
    testId: row.testId || pickText(row.test, ['_id', 'id', 'testId']) || null,
    submittedAt: row.submittedAt || null,
    updatedAt: row.lastUpdated || row.updatedAt || null,
    canAssign: readActionFlag(row, 'canAssign', 'can_assign'),
    canReassign: readActionFlag(row, 'canReassign', 'can_reassign'),
    canEvaluate: readActionFlag(row, 'canEvaluate', 'can_evaluate'),
    canView: readActionFlag(row, 'canView', 'can_view'),
  }
}

function mapDashboardStats(payload) {
  const d = unwrap(payload) || {}
  const minutes = d.avgEvaluationTimeMinutes ?? d.avgEvaluationTime
  return {
    totalPapers: d.totalPapers ?? 0,
    pendingEvaluation: d.pendingEvaluation ?? 0,
    pendingLabel: d.pendingLabel || 'Awaiting evaluation',
    evaluatedToday: d.evaluatedToday ?? 0,
    evaluatedTodayLabel: d.evaluatedTodayLabel || 'Completed today',
    avgEvaluationTime:
      typeof minutes === 'string'
        ? minutes
        : minutes != null && minutes !== ''
          ? `${minutes}m`
          : '—',
  }
}

function mapSubmissionDetail(payload, submissionId) {
  const d = unwrap(payload) || {}
  const ev = d.evaluation || {}
  const answer = d.answer || {}
  const locked = Boolean(d.published || d.evaluationLocked)
  const test = d.test || {}

  return {
    id: d.submissionId || d.id || submissionId,
    studentName: d.student?.name || d.studentName || '',
    rollNumber: d.student?.rollNumber || d.rollNumber || '',
    batchName: d.student?.batchName || d.batchName || '',
    testId: test.testId || test._id || d.testId || null,
    testName: pickText(test, ['testName', 'name']) || '',
    subjectName: pickText(test.subject, ['name', 'label']) || pickText(test, ['subject']) || '',
    questionText: test.questionsText || test.questionText || d.questionText || '',
    questionMarks: test.maxMarks || test.questionMarks || ev.maxScore || 20,
    scoreMax: ev.maxScore || test.maxMarks || 20,
    scoreObtained: ev.totalScore ?? 0,
    status: pickText(d.statusLabel, ['name', 'label']) || d.statusLabel || d.status || '',
    statusEnum: d.status || '',
    locked,
    mentorId: d.mentor?.mentorId || d.currentMentor?.mentorId || null,
    mentorName:
      d.mentor?.mentorName || d.mentor?.name || d.currentMentor?.mentorName || d.currentMentor?.name || null,
    rubric: rubricFromEvaluation(ev),
    annotations: (d.annotations || []).map((a, i) => ({
      id: a.id || `ann-${i}`,
      page: a.pageNo ?? a.page ?? 1,
      pageNo: a.pageNo ?? a.page ?? 1,
      annotationType: a.annotationType || a.type || 'HIGHLIGHT',
      type: a.annotationType || a.type || 'HIGHLIGHT',
      content: a.content || '',
      coordinates: a.coordinates || {},
      color: a.color || '#FFEB3B',
    })),
    answerType:
      answer.type === 'text' || answer.text || answer.answerText || d.answerText
        ? 'text'
        : answer.pdfUrl || answer.file?.url
          ? 'file'
          : null,
    answerText: answer.text || answer.answerText || d.answerText || '',
    remarks: ev.overallRemarks || ev.remarks || '',
    answerSheet: {
      fileName: answer.fileName || answer.file?.fileName || null,
      url: answer.pdfUrl || answer.file?.url || null,
      dataUrl: null,
      pages: answer.pages || 0,
      pageImages: answer.pageImages || [],
    },
    priority: formatPriority(d.priority),
    examType: formatExamType(d.examType || test.examType),
  }
}

function mapAssignPreviewBody(ctx = {}) {
  const body = {
    search: ctx.search || '',
    status: toFilterEnum(ctx.status),
  }

  const optional = {
    batchId: ctx.batchId,
    facultySubjectId: ctx.subjectId || ctx.facultySubjectId,
    topicId: ctx.topicId || ctx.subTopicId,
    testId: ctx.testId,
  }

  for (const [key, raw] of Object.entries(optional)) {
    const value = raw === 'all' ? '' : raw
    if (value != null && String(value).trim() !== '') {
      body[key] = value
    }
  }

  return body
}

async function loadAssignPreview(ctx = {}) {
  const key = JSON.stringify(mapAssignPreviewBody(ctx))
  if (assignPreviewCache.key === key && assignPreviewCache.data) {
    return assignPreviewCache.data
  }
  const raw = await post('/assign/preview', mapAssignPreviewBody(ctx))
  const data = unwrap(raw) || {}
  assignPreviewCache = { key, data }
  return data
}

function mapPrimaryAssignment(primary) {
  if (!primary) return null
  const name = primary.mentorName || primary.name || ''
  return {
    mentorId: primary.mentorId || primary.id || null,
    name,
    title: primary.title || 'Mentor Admin',
    initials: initials(name),
    pendingPapers: primary.pending ?? primary.pendingPapers ?? primary.pendingCount ?? 0,
    dueDate: primary.dueDate || primary.assignedDate || '',
  }
}

function mapAvailableMentor(mentor = {}) {
  const pending = mentor.pending ?? mentor.pendingCount ?? 0
  const id = mentor.mentorId || mentor.id
  return {
    id,
    name: mentor.mentorName || mentor.name || '',
    title: mentor.title || 'Mentor Admin',
    pendingCount: pending,
    workloadLevel: mapWorkloadLevel(mentor.currentWorkload || mentor.workload, pending),
    available: String(mentor.availability || 'AVAILABLE').toUpperCase() === 'AVAILABLE',
  }
}

function mapPendingPaper(row = {}) {
  return {
    id: row.submissionId || row.id || row._id,
    studentName: row.studentName || '',
    rollNumber: row.rollNumber || '',
    status: row.statusLabel || row.status || 'Not Started',
    lastUpdate: row.lastUpdated || row.updatedAt || null,
    mentorId: row.mentorId || null,
  }
}

// ---------------------------------------------------------------------------
// 1. Dashboard & List
// ---------------------------------------------------------------------------

export async function fetchEvaluationDashboardStats() {
  const data = await post('/dashboard', {})
  return mapDashboardStats(data)
}

export async function fetchEvaluationFilterOptions(params = {}) {
  const { batchId, subjectId, subTopicId } = params

  const [metaRaw, batchesRaw] = await Promise.all([post('/filters/meta', {}), post('/filters/batches', {})])
  const meta = unwrap(metaRaw) || {}
  const batchesData = unwrap(batchesRaw) || {}

  let facultySubjects = []
  let topics = []
  let tests = []

  if (batchId && batchId !== 'all') {
    const subjectsRaw = await post('/filters/faculty-subjects', { batchId })
    facultySubjects = unwrap(subjectsRaw)?.facultySubjects || []

    if (subjectId && subjectId !== 'all') {
      const topicsRaw = await post('/filters/topics', { batchId, facultySubjectId: subjectId })
      topics = unwrap(topicsRaw)?.topics || []

      const topicId = subTopicId && subTopicId !== 'all' ? subTopicId : ''
      const testsRaw = await post('/filters/tests', {
        batchId,
        facultySubjectId: subjectId,
        topicId,
      })
      tests = unwrap(testsRaw)?.tests || []
    }
  }

  return {
    batches: withAll('All Batches', mapSelect(batchesData.batches, '_id', 'label')),
    programs: withAll('All Programs', mapSelect(meta.programs, '_id', 'label')),
    subjects: withAll('All Subjects', mapSelect(facultySubjects, '_id', 'label')),
    subTopics: withAll('All Topics', mapSelect(topics, '_id', 'label')),
    tests: withAll('All Tests', mapSelect(tests, '_id', 'label')),
    mentors: withAll(
      'All Mentors',
      (meta.mentors || []).map((m) => ({
        value: m.mentorId || m.id,
        label: m.mentorName || m.name || '',
        pendingCount: m.pending ?? m.pendingCount,
      })),
    ),
    statuses: withAll(
      'All Statuses',
      (meta.statuses || []).map((s) => ({
        value: s.key || s.label,
        label: s.label || titleCaseToken(s.key),
      })),
    ),
    priorities: withAll(
      'All Priorities',
      (meta.priorities || []).map((p) => ({
        value: p.key || p.label,
        label: p.label || formatPriority(p.key),
      })),
    ),
    examTypes: withAll(
      'All Exam Types',
      (meta.examTypes || []).map((e) => ({
        value: e.key || e.label,
        label: e.label || formatExamType(e.key),
      })),
    ),
    centers: withAll('All Centers', mapSelect(meta.centers, '_id', 'label')),
  }
}

export async function fetchEvaluationTableData(params = {}) {
  const pageLimit = 20
  const allRows = []
  let page = 1
  let totalPages = 1

  do {
    const raw = await post('/list', toListBody(params, { page, limit: pageLimit }))
    const payload = unwrap(raw) || raw || {}
    const rows = Array.isArray(payload) ? payload : payload.data || []
    allRows.push(...rows.map(mapListRow))
    totalPages = Number(payload.totalPages) || 1
    if (rows.length < pageLimit) break
    page += 1
  } while (page <= totalPages)

  return allRows
}

export async function exportEvaluationCsv(params = {}) {
  let blob
  try {
    blob = await post('/export', toExportBody(params), { responseType: 'blob' })
  } catch (error) {
    throw toApiError(error, 'Export failed')
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `evaluation-oversight-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)

  let count = null
  try {
    const text = await blob.text()
    const lines = text.split('\n').filter((line) => line.trim())
    count = Math.max(0, lines.length - 1)
  } catch {
    /* optional */
  }

  return { count }
}

// ---------------------------------------------------------------------------
// 2. Assign Evaluators
// ---------------------------------------------------------------------------

function mapPreviewMentors(mentors = [], excludeId) {
  return mentors
    .filter((m) => String(m.mentorId || m.id) !== String(excludeId || ''))
    .map((m) => {
      const pending = m.pending ?? m.pendingCount ?? 0
      return {
        id: m.mentorId || m.id,
        name: m.mentorName || m.name || '',
        title: m.title || 'Mentor Admin',
        available: String(m.availability || 'AVAILABLE').toUpperCase() === 'AVAILABLE',
        pendingCount: pending,
      }
    })
}

export async function fetchMentorsForSubject(subjectId, options = {}) {
  const { excludeId, submissionId, isReassign, batchId, testId, topicId } = options

  if (isReassign) {
    if (!submissionId) {
      throw new Error('Submission is required to load reassignment mentors')
    }
    const raw = await post('/reassign/preview', { submissionId: String(submissionId) })
    const data = unwrap(raw) || {}
    return mapPreviewMentors(data.availableMentors || data.eligibleMentors || [], excludeId)
  }

  const previewBody = mapAssignPreviewBody({
    batchId,
    subjectId,
    topicId,
    testId,
  })
  if (!previewBody.facultySubjectId && subjectId) {
    previewBody.facultySubjectId = subjectId
  }

  const raw = await post('/assign/preview', previewBody)
  const data = unwrap(raw) || {}
  return mapPreviewMentors(data.availableMentors || [], excludeId)
}

export async function assignEvaluator(paperId, mentorId, options = {}) {
  if (options.isReassign) {
    const raw = await post('/reassign', {
      submissionId: String(paperId),
      mentorId,
      reason: options.reason || 'Reassigned',
    })
    const data = unwrap(raw) || {}
    const name = data.mentorName || data.name || ''
    return {
      id: paperId,
      mentorId,
      mentorName: name,
      mentorInitials: initials(name),
    }
  }

  const raw = await post('/assign', {
    submissionIds: [String(paperId)],
    mentorId,
    reason: options.reason || 'Initial assignment',
  })
  const data = unwrap(raw) || {}
  const mentor = data.mentor || {}
  const name = mentor.name || mentor.mentorName || data.mentorName || ''
  return {
    id: paperId,
    mentorId: mentor._id || mentor.mentorId || mentorId,
    mentorName: name,
    mentorInitials: mentor.initials || initials(name),
  }
}

export async function bulkAssignEvaluator({ paperIds, mentorId }) {
  const raw = await post('/assign', {
    submissionIds: paperIds,
    mentorId,
    reason: 'Bulk assignment',
  })
  const data = unwrap(raw) || {}
  const mentor = data.mentor || {}
  const name = mentor.name || mentor.mentorName || ''
  return {
    count: data.count ?? paperIds?.length ?? 0,
    mentor: {
      _id: mentor._id || mentor.mentorId || mentorId,
      name,
      initials: mentor.initials || initials(name),
    },
  }
}

export async function reassignEvaluator(submissionId, mentorId, reason = 'Reassigned') {
  const result = await assignEvaluator(submissionId, mentorId, { isReassign: true, reason })
  return {
    submissionId,
    mentorId: result.mentorId,
    mentorName: result.mentorName,
    reason,
  }
}

export async function fetchAssignmentBatches() {
  const raw = await post('/filters/batches', {})
  const data = unwrap(raw) || {}
  return mapSelect(data.batches, '_id', 'label')
}

export async function fetchAssignmentSubjects(batchId) {
  lastAssignmentBatchId = batchId || ''
  if (!batchId) return []
  const raw = await post('/filters/faculty-subjects', { batchId })
  const data = unwrap(raw) || {}
  return mapSelect(data.facultySubjects, '_id', 'label')
}

export async function fetchAssignmentTopics(subjectId) {
  if (!subjectId || !lastAssignmentBatchId) return []
  const raw = await post('/filters/topics', {
    batchId: lastAssignmentBatchId,
    facultySubjectId: subjectId,
  })
  const data = unwrap(raw) || {}
  return mapSelect(data.topics, '_id', 'label')
}

export async function fetchAssignmentTests(batchId, subjectId, topicId) {
  if (!batchId || !subjectId) return []
  lastAssignmentBatchId = batchId
  const raw = await post('/filters/tests', {
    batchId,
    facultySubjectId: subjectId,
    topicId: topicId || '',
  })
  const data = unwrap(raw) || {}
  return mapSelect(data.tests, '_id', 'label')
}

export async function fetchCurrentPrimaryAssignment(ctx = {}) {
  const data = await loadAssignPreview(ctx)
  return mapPrimaryAssignment(data.primaryAssignment)
}

export async function fetchAssignmentPendingPapers(ctx = {}) {
  const data = await loadAssignPreview(ctx)
  return (data.students || []).map(mapPendingPaper)
}

export async function fetchAssignmentEvaluators(subjectIdOrOptions, options = {}) {
  let subjectId
  let excludeMentorId
  let ctx = {}

  if (typeof subjectIdOrOptions === 'object' && subjectIdOrOptions !== null) {
    ctx = subjectIdOrOptions
    subjectId = ctx.subjectId
    excludeMentorId = ctx.excludeMentorId
  } else {
    subjectId = subjectIdOrOptions
    excludeMentorId = options.excludeMentorId
    ctx = options.context || { subjectId, ...options }
  }

  const previewCtx = {
    batchId: ctx.batchId || lastAssignmentBatchId,
    subjectId,
    topicId: ctx.topicId || ctx.subTopicId,
    testId: ctx.testId,
    status: ctx.status,
    search: ctx.search,
  }

  const data = await loadAssignPreview(previewCtx)
  return (data.availableMentors || [])
    .filter((m) => String(m.mentorId || m.id) !== String(excludeMentorId || ''))
    .map(mapAvailableMentor)
}

// ---------------------------------------------------------------------------
// 3. View Paper & Evaluation
// ---------------------------------------------------------------------------

export async function fetchEvaluationPaperById(paperId) {
  const submissionId = String(paperId || '').trim()
  if (!submissionId) throw new Error('Submission id is required')

  const raw = await post('/submission/detail', { submissionId }, { timeout: 120000 })
  return mapSubmissionDetail(raw, submissionId)
}

export async function fetchSubmissionPdfBlobUrl(submissionId) {
  const paper = await fetchEvaluationPaperById(submissionId)
  const url = paper?.answerSheet?.url
  if (!url) throw new Error('No PDF available')

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  try {
    const { data } = await api.get(url, { responseType: 'blob' })
    return URL.createObjectURL(data)
  } catch {
    return url
  }
}

export async function saveEvaluationDraft(paperId, patch = {}) {
  const body = rubricToDraftBody(paperId, patch.rubric || [])
  const raw = await post('/evaluation/draft', body)
  const data = unwrap(raw) || {}
  const total =
    (Number(body.conceptualScore) || 0) +
    (Number(body.languageScore) || 0) +
    (Number(body.structureScore) || 0)
  return {
    id: paperId,
    scoreObtained: data.totalScore ?? total,
    status: 'In Progress',
  }
}

export async function publishEvaluationResult(paperId, patch = {}) {
  const body = rubricToDraftBody(paperId, patch.rubric || [])
  const raw = await post('/evaluation/publish', body)
  const data = unwrap(raw) || {}
  const total =
    (Number(body.conceptualScore) || 0) +
    (Number(body.languageScore) || 0) +
    (Number(body.structureScore) || 0)
  return {
    id: paperId,
    scoreObtained: data.totalScore ?? total,
    scoreMax: data.maxScore ?? 20,
    status: 'Evaluated',
    locked: true,
  }
}

export async function savePaperAnnotations(paperId, annotations = []) {
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

  const raw = await post('/annotations/save', {
    submissionId: paperId,
    annotations: payload,
  })
  const data = unwrap(raw) || {}
  return { saved: data.saved ?? payload.length }
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

  const sheetUrl = paper?.answerSheet?.url
  if (sheetUrl) {
    const a = document.createElement('a')
    a.href = sheetUrl
    a.download = paper.answerSheet.fileName || `${safeName}.pdf`
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.click()
    return
  }

  if (paper?.id) {
    try {
      const blobUrl = await fetchSubmissionPdfBlobUrl(paper.id)
      if (blobUrl) {
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = paper.answerSheet?.fileName || `${safeName}.pdf`
        a.click()
        if (blobUrl.startsWith('blob:')) {
          setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
        }
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

  throw new Error('No answer sheet available to download')
}
