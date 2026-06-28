/** @typedef {import('../types/mainsManagement.types').MainsFacultySubjectRow} MainsFacultySubjectRow */

export const MAINS_RESULTS_STATUS_MAP = {
  all: 'all',
  Evaluated: 'all',
  Pending: 'pending_evaluation',
  uploaded: 'uploaded',
  not_uploaded: 'not_uploaded',
  passed: 'passed',
  failed: 'failed',
  pending: 'pending_evaluation',
}

function formatDateYYYYMMDD(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function extractTeacherName(facultySubjectName, subjectName) {
  if (!facultySubjectName) return ''
  const prefix = subjectName ? `${subjectName} by ` : ''
  if (prefix && facultySubjectName.toLowerCase().startsWith(prefix.toLowerCase())) {
    return facultySubjectName.slice(prefix.length).trim()
  }
  const byIndex = facultySubjectName.lastIndexOf(' by ')
  if (byIndex >= 0) return facultySubjectName.slice(byIndex + 4).trim()
  return facultySubjectName
}

export function mapEvaluationProgressCard(item, index = 0) {
  return {
    id: item.testId || `${item.testName || 'test'}-${index}`,
    testName: item.testName || '—',
    facultyLabel: item.facultyName || '',
    studentsAssigned: item.studentsAssigned ?? 0,
    studentsUploaded: item.uploadedAnswerSheets ?? 0,
    studentsEvaluated: item.evaluatedCount ?? 0,
    pendingEvaluations: item.pendingCount ?? 0,
    evaluationPct: item.evaluationPercentage ?? 0,
  }
}

export function mapDashboardResponse(response) {
  const payload = response?.data ?? response
  const items = payload?.evaluationProgress ?? []
  return items.map(mapEvaluationProgressCard)
}

/** @returns {MainsFacultySubjectRow} */
export function mapFacultySubjectRow(item = {}) {
  return {
    subjectId: item.facultySubjectId,
    facultySubjectId: item.facultySubjectId,
    subjectName: item.subjectName || '',
    facultyName: item.teacherName || '',
    facultySubject: item.facultySubject || '',
    totalTopics: item.topicsCount ?? 0,
    totalTests: item.testsPdfCount ?? 0,
    lastUpdated: item.lastUpdated || null,
  }
}

export function normalizeFacultySubjectsResponse(response, { page = 1, limit = 10 } = {}) {
  const rows = (response?.data ?? []).map(mapFacultySubjectRow)
  const total = response?.total ?? rows.length
  const totalPages =
    response?.totalPages ?? Math.max(1, Math.ceil(total / limit) || 1)

  return {
    items: rows,
    total,
    page: response?.page ?? page,
    limit: response?.limit ?? limit,
    totalPages,
  }
}

export function mapFacultySubjectDetails(data) {
  if (!data) return { faculty: null, topics: [] }

  const subjectName = data.subjectName || ''
  const facultySubjectName = data.facultySubjectName || ''

  return {
    faculty: {
      subjectId: data.facultySubjectId,
      facultySubjectId: data.facultySubjectId,
      subjectName,
      facultyName: extractTeacherName(facultySubjectName, subjectName),
      facultySubjectName,
      totalTopics: data.cards?.topics ?? 0,
      totalTests: data.cards?.testsPdfs ?? 0,
      subjectLabel: data.cards?.subject ?? subjectName,
    },
    topics: (data.topics ?? []).map((topic) => ({
      id: topic.topicId,
      topicId: topic.topicId,
      title: topic.topicName || '—',
      testCount: topic.testsPdfCount ?? 0,
    })),
  }
}

export function mapTopicTestRow(item = {}) {
  return {
    id: item.testId,
    testId: item.testId,
    title: item.testName || '—',
    uploadedDate: formatDateYYYYMMDD(item.uploadedDate),
    studentsAssigned: item.studentsAssigned ?? 0,
    studentsDownloaded: item.pdfDownloads ?? 0,
    studentsUploaded: item.answerSheetsUploaded ?? 0,
    evaluationStatusLabel: item.evaluationStatus || 'Not Started',
  }
}

export function normalizeTopicTestsResponse(response, topicId, { page = 1, limit = 10 } = {}) {
  const topicMeta = response?.topic ?? {}
  const rows = (response?.data ?? []).map(mapTopicTestRow)
  const total = response?.total ?? rows.length
  const totalPages =
    response?.totalPages ?? Math.max(1, Math.ceil(total / limit) || 1)

  return {
    topic: {
      id: topicId,
      topicId,
      title: topicMeta.topicName || '—',
      facultyLabel: topicMeta.facultySubjectName || '',
    },
    items: rows,
    total,
    page: response?.page ?? page,
    limit: response?.limit ?? limit,
    totalPages,
  }
}

export function mapStudentResultRow(item = {}) {
  const hasMarks = Boolean(item.marks && item.marks !== '—')
  const isUploaded = item.uploadedStatus === 'Uploaded'
  const filterEvaluated = isUploaded && hasMarks ? 'Evaluated' : 'Pending'

  return {
    studentName: item.studentName || '—',
    registerNumber: item.registerNumber || '—',
    uploadedStatus: item.uploadedStatus || 'Not Uploaded',
    marks: item.marks ?? '—',
    rank: item.rank ?? '—',
    evaluatedBy: item.evaluatedBy || '—',
    evaluationDate: item.evaluationDate || '—',
    filterEvaluated,
  }
}

export function normalizeTestResultsResponse(data, { page = 1, limit = 20 } = {}) {
  const payload = data?.data ?? data
  const evalSummary = payload?.evaluationSummary ?? {}
  const resultCards = payload?.resultCards ?? {}
  const analytics = payload?.analytics ?? {}
  const students = payload?.students ?? {}
  const rows = (students.data ?? []).map(mapStudentResultRow)

  return {
    test: {
      testId: payload?.test?.testId,
      testName: payload?.test?.testName || 'Results',
      facultySubjectName: payload?.test?.facultySubjectName || '',
      topicName: payload?.test?.topicName || '',
    },
    summary: {
      studentsAssigned: evalSummary.assigned ?? 0,
      totalDownloads: evalSummary.downloads ?? 0,
      totalUploaded: evalSummary.uploaded ?? 0,
      totalEvaluated: evalSummary.evaluated ?? 0,
      pendingEvaluations: evalSummary.pending ?? 0,
      totalStudents: resultCards.totalStudents ?? 0,
      totalPassed: resultCards.passed ?? 0,
      totalFailed: resultCards.failed ?? 0,
      highestMarks: analytics.highestMarks ?? 0,
      lowestMarks: analytics.lowestMarks ?? 0,
      averageMarks: analytics.averageMarks ?? 0,
      topRanker: analytics.topRanker?.studentName ?? '—',
      passMarks: payload?.passMarks,
      totalMarks: payload?.totalMarks,
    },
    rows,
    total: students.total ?? rows.length,
    page: students.page ?? page,
    limit: students.limit ?? limit,
    totalPages:
      students.totalPages ?? Math.max(1, Math.ceil((students.total ?? rows.length) / limit) || 1),
  }
}

export function filterEvaluatedStudentRows(rows = []) {
  return rows.filter((row) => row.filterEvaluated === 'Evaluated')
}
