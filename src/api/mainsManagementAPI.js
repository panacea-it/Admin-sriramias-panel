import axiosInstance from './axiosInstance'

/**
 * Mains Management — Admin Panel API integration.
 * Backend: /api/mains-management/* (GET + query params, Super Admin JWT).
 * Mirrors the CBT pattern (src/api/cbtManagementAPI.js): endpoint constants,
 * pure mappers backend -> UI shape, and fetchers that accept an AbortSignal.
 */

const MAINS_DASHBOARD_ENDPOINT = '/mains-management/dashboard'
const MAINS_FACULTY_SUBJECTS_ENDPOINT = '/mains-management/faculty-subjects'
const MAINS_TOPIC_TESTS_ENDPOINT = (topicId) =>
  `/mains-management/topics/${encodeURIComponent(topicId)}/tests`
const MAINS_TEST_RESULTS_ENDPOINT = (testId) =>
  `/mains-management/tests/${encodeURIComponent(testId)}/results`

const sliceDate = (value) => (value ? String(value).slice(0, 10) : '—')

/* ------------------------------- Level 1 ---------------------------------- */

/** Maps a dashboard `evaluationProgress` card → <EvaluationProgressCards /> shape. */
export function mapMainsEvaluationCard(item = {}) {
  return {
    id: item.testId,
    mainsAnswerWritingId: item.mainsAnswerWritingId,
    testName: item.testName || '',
    facultyLabel: item.facultyName || '',
    studentsAssigned: item.studentsAssigned ?? 0,
    studentsUploaded: item.uploadedAnswerSheets ?? 0,
    studentsEvaluated: item.evaluatedCount ?? 0,
    pendingEvaluations: item.pendingCount ?? 0,
    evaluationPct: item.evaluationPercentage ?? 0,
    // Dashboard cards don't carry subjectId/topicId, so deep-link is disabled.
    subjectId: item.facultySubjectId || null,
    topicId: item.topicId || null,
  }
}

/** Maps a faculty-subjects table row → <MainsFacultySubjectsTable /> shape. */
export function mapMainsFacultyRow(item = {}) {
  return {
    subjectId: item.facultySubjectId,
    facultySubjectCode: item.facultySubjectCode || '',
    subjectName: item.subjectName || '',
    facultyName: item.teacherName || '',
    totalTopics: item.topicsCount ?? 0,
    totalTests: item.testsPdfCount ?? 0,
    lastUpdated: item.lastUpdated || null,
  }
}

export async function fetchMainsDashboard({ progressLimit = 3 } = {}, signal) {
  const response = await axiosInstance.get(MAINS_DASHBOARD_ENDPOINT, {
    params: { progressLimit },
    signal,
  })
  const list = response?.data?.data?.evaluationProgress
  return Array.isArray(list) ? list.map(mapMainsEvaluationCard) : []
}

export async function fetchMainsFacultySubjects(
  { search = '', page = 1, limit = 100, sort = 'lastUpdated' } = {},
  signal,
) {
  const response = await axiosInstance.get(MAINS_FACULTY_SUBJECTS_ENDPOINT, {
    params: { search, page, limit, sort },
    signal,
  })
  const list = response?.data?.data
  return Array.isArray(list) ? list.map(mapMainsFacultyRow) : []
}

/* ------------------------------- Level 2 ---------------------------------- */

/** Maps a faculty-subject detail topic → <MainsTopicsManagementTable /> row. */
export function mapMainsTopicRow(item = {}) {
  return {
    id: item.topicId,
    topicCode: item.topicCode || '',
    title: item.topicName || '',
    testCount: item.testsPdfCount ?? 0,
  }
}

export async function fetchMainsFacultyDetails(facultySubjectId, signal) {
  const response = await axiosInstance.get(
    `${MAINS_FACULTY_SUBJECTS_ENDPOINT}/${encodeURIComponent(facultySubjectId)}`,
    { signal },
  )
  const data = response?.data?.data || {}
  const faculty = {
    subjectId: data.facultySubjectId || facultySubjectId,
    facultySubjectCode: data.facultySubjectCode || '',
    subjectName: data.subjectName || '',
    facultyName: data.teacherName || '',
    totalTopics: data.topicsCount ?? (Array.isArray(data.topics) ? data.topics.length : 0),
    totalTests: data.testsPdfCount ?? 0,
  }
  const topics = Array.isArray(data.topics) ? data.topics.map(mapMainsTopicRow) : []
  return { faculty, topics }
}

/* ------------------------------- Level 3 ---------------------------------- */

/** Maps a topic test → <MainsTestsManagementTable /> row. */
export function mapMainsTestRow(item = {}) {
  const uploaded = item.answerSheetsUploaded ?? item.answerSheetUploads ?? 0
  const evaluated = item.evaluatedCount ?? 0
  return {
    id: item.testId,
    mainsAnswerWritingId: item.mainsAnswerWritingId,
    title: item.testName || '',
    uploadedDate: sliceDate(item.uploadedDate),
    studentsAssigned: item.studentsAssigned ?? 0,
    studentsDownloaded: item.pdfDownloads ?? 0,
    studentsUploaded: uploaded,
    studentsEvaluated: evaluated,
    pendingEvaluations: item.pendingCount ?? 0,
    evaluationStatusLabel: item.evaluationStatus || 'Not Started',
    evaluationPct: uploaded > 0 ? Math.round((evaluated / uploaded) * 100) : 0,
  }
}

export async function fetchMainsTopicTests({ topicId, search = '', page = 1, limit = 100 } = {}, signal) {
  const response = await axiosInstance.get(MAINS_TOPIC_TESTS_ENDPOINT(topicId), {
    params: { search, page, limit },
    signal,
  })
  const body = response?.data || {}
  const list = body.data
  const header = body.topic || {}
  return {
    topic: {
      id: header.topicId || topicId,
      title: header.topicName || '',
      facultyLabel: header.facultySubjectName || '',
    },
    tests: Array.isArray(list) ? list.map(mapMainsTestRow) : [],
  }
}

/* ------------------------------- Level 4 ---------------------------------- */

/** Maps a single student result row → <MainsStudentResultsTable /> shape. */
export function mapMainsResultRow(item = {}) {
  return {
    id: item.studentId,
    studentName: item.studentName || '',
    registerNumber: item.registerNumber || '',
    uploadedStatus: item.uploadedStatus || 'Not Uploaded',
    marks: item.marks ?? (item.marksValue != null ? `${item.marksValue}` : '—'),
    marksValue: item.marksValue ?? null,
    maxMarks: item.totalMarks ?? 0,
    rank: item.rank ?? '—',
    evaluatedBy: item.evaluatedBy || '—',
    evaluationDate: item.evaluationDate || '—',
    passFailStatus: item.passFailStatus || '—',
    filterEvaluated: item.evaluationDate ? 'Evaluated' : 'Pending',
  }
}

export async function fetchMainsTestResults(
  { testId, search = '', status = 'all', page = 1, limit = 100 } = {},
  signal,
) {
  const response = await axiosInstance.get(MAINS_TEST_RESULTS_ENDPOINT(testId), {
    params: { search, status, page, limit },
    signal,
  })
  const data = response?.data?.data || {}
  const evalSummary = data.evaluationSummary || {}
  const analytics = data.analytics || {}
  const resultCards = data.resultCards || {}
  const students = data.students || {}
  const rows = Array.isArray(students.data) ? students.data.map(mapMainsResultRow) : []

  const uploaded = evalSummary.uploaded ?? 0
  const evaluated = evalSummary.evaluated ?? 0

  const summary = {
    studentsAssigned: evalSummary.assigned ?? 0,
    totalDownloads: evalSummary.downloads ?? 0,
    totalUploaded: uploaded,
    totalEvaluated: evaluated,
    pendingEvaluations: evalSummary.pending ?? 0,
    evaluationPct: uploaded > 0 ? Math.round((evaluated / uploaded) * 100) : 0,
    totalStudents: resultCards.totalStudents ?? students.total ?? 0,
    passed: resultCards.passed ?? analytics.totalPassed ?? 0,
    failed: resultCards.failed ?? analytics.totalFailed ?? 0,
    highestMarks: analytics.highestMarks ?? 0,
    lowestMarks: analytics.lowestMarks ?? 0,
    averageMarks: analytics.averageMarks ?? 0,
    topRanker: analytics.topRanker?.studentName || '—',
    passMarks: data.passMarks ?? null,
    totalMarks: data.totalMarks ?? null,
  }

  return { test: data.test || null, summary, rows }
}
