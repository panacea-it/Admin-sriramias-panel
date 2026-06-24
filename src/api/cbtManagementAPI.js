import axiosInstance from './axiosInstance'

const CBT_DASHBOARD_ENDPOINT = '/cbt-management/dashboard'
const CBT_LIST_ENDPOINT = '/cbt-management/list'
const CBT_TOPICS_ENDPOINT = '/cbt-management/topics'
const CBT_TESTS_ENDPOINT = '/cbt-management/tests'
const CBT_RESULTS_ENDPOINT = '/cbt-management/results'
const CBT_ANALYTICS_ENDPOINT = '/cbt-management/results/analytics'
const CBT_EXPORT_CSV_ENDPOINT = '/cbt-management/results/export-csv'
const CBT_EXPORT_PDF_ENDPOINT = '/cbt-management/results/export-pdf'

const ATTEMPT_STATUS_LABELS = {
  COMPLETED: 'Completed',
  IN_PROGRESS: 'In Progress',
  NOT_STARTED: 'Not Attempted',
  NOT_ATTEMPTED: 'Not Attempted',
}

/**
 * Maps a single CBT dashboard `evaluationProgress` entry from the backend
 * (POST /api/cbt-management/dashboard) into the shape expected by
 * <EvaluationProgressCards />.
 */
export function mapCbtEvaluationCard(item = {}) {
  return {
    id: item.testId,
    prelimsTestId: item.prelimsTestId,
    testName: item.testName,
    subjectName: item.subjectName || '',
    facultyLabel: item.facultyName || item.subjectName || '',
    studentsAssigned: item.studentsAssigned ?? 0,
    studentsUploaded: item.answerSheetsUploaded ?? 0,
    studentsEvaluated: item.evaluated ?? 0,
    pendingEvaluations: item.pending ?? 0,
    pdfDownloads: item.pdfDownloads ?? 0,
    evaluationPct: item.evaluationPercentage ?? 0,
  }
}

/**
 * Fetches the CBT management dashboard (latest evaluation progress).
 * Returns an array of cards already mapped for the UI.
 */
export async function fetchCbtDashboard({ progressLimit = 3 } = {}, signal) {
  const response = await axiosInstance.post(
    CBT_DASHBOARD_ENDPOINT,
    { progressLimit },
    { signal },
  )

  const list = response?.data?.data?.evaluationProgress
  return Array.isArray(list) ? list.map(mapCbtEvaluationCard) : []
}

/**
 * Maps a single CBT faculty-subject entry from the backend
 * (POST /api/cbt-management/list) into the row shape expected by
 * <CbtMappingTable /> (Academic Test Mapping).
 */
export function mapCbtMappingRow(item = {}) {
  return {
    subjectId: item.facultySubjectId,
    subjectName: item.subjectName || '',
    facultyName: item.facultyName || '',
    facultySubjectLabel: item.facultySubjectLabel || '',
    totalTopics: item.totalTopics ?? 0,
    totalTestSeries: item.totalTestSeries ?? 0,
    studentsAttempted: item.totalStudentsAttempted ?? 0,
    averageScorePct: item.averageScore ?? 0,
    lastUpdated: item.lastUpdated || null,
  }
}

/**
 * Fetches the CBT faculty-subject mappings (Academic Test Mapping table).
 * Returns an array of rows already mapped for the UI. Search and pagination
 * are handled client-side by the table, so we request a single large page.
 */
export async function fetchCbtFacultySubjects(
  { search = '', page = 1, limit = 100, sortBy = 'updatedAt', sortOrder = 'desc' } = {},
  signal,
) {
  const response = await axiosInstance.post(
    CBT_LIST_ENDPOINT,
    { search, page, limit, sortBy, sortOrder },
    { signal },
  )

  const list = response?.data?.data
  return Array.isArray(list) ? list.map(mapCbtMappingRow) : []
}

/**
 * Maps a single CBT topic entry from the backend
 * (POST /api/cbt-management/topics) into the row shape expected by
 * <CbtTopicsTable /> on the faculty detail page.
 */
export function mapCbtTopicRow(item = {}) {
  return {
    id: item.topicId,
    folderId: item.folderId,
    title: item.topicName || '',
    testCount: item.testSeriesCount ?? 0,
    updatedAt: item.lastUpdated || null,
  }
}

/**
 * Fetches the topics for a CBT faculty subject (faculty detail page).
 * Returns an array of rows already mapped for the UI. The backend wraps the
 * topic rows under `data` (paginatedResponse), so we read `data` directly.
 */
export async function fetchCbtTopics(
  { facultySubjectId, search = '', page = 1, limit = 100 } = {},
  signal,
) {
  const response = await axiosInstance.post(
    CBT_TOPICS_ENDPOINT,
    { facultySubjectId, search, page, limit },
    { signal },
  )

  const list = response?.data?.data
  return Array.isArray(list) ? list.map(mapCbtTopicRow) : []
}

/**
 * Maps a single CBT test entry from the backend
 * (POST /api/cbt-management/tests) into the row shape expected by
 * <CbtTestsTable />.
 */
export function mapCbtTestRow(item = {}) {
  return {
    id: item.testId,
    prelimsTestId: item.prelimsTestId,
    title: item.testName || '',
    uploadedDate: item.uploadedDate ? String(item.uploadedDate).slice(0, 10) : '—',
    studentsAssigned: item.studentsAssigned ?? 0,
    studentsDownloaded: item.pdfDownloads ?? 0,
    studentsUploaded: item.answerSheetsUploaded ?? 0,
    attemptsCount: item.attemptsCount ?? 0,
    evaluationStatus: item.evaluationStatus || 'Pending',
  }
}

/**
 * Fetches the tests under a topic (topic detail page).
 * Returns the topic header and the mapped test rows. Test rows live under
 * `data` (paginatedResponse); the topic header is on the root `topic` key.
 */
export async function fetchCbtTests(
  { topicId, search = '', page = 1, limit = 100 } = {},
  signal,
) {
  const response = await axiosInstance.post(
    CBT_TESTS_ENDPOINT,
    { topicId, search, page, limit },
    { signal },
  )

  const list = response?.data?.data
  return {
    topic: response?.data?.topic || null,
    tests: Array.isArray(list) ? list.map(mapCbtTestRow) : [],
  }
}

/**
 * Maps a single CBT result row from the backend
 * (POST /api/cbt-management/results) into the row shape expected by
 * <CbtStudentResultsView />.
 */
export function mapCbtResultRow(item = {}) {
  return {
    id: item.studentId,
    studentName: item.studentName || '',
    rollNumber: item.rollNumber || '',
    attemptStatus: ATTEMPT_STATUS_LABELS[item.attemptStatus] || item.attemptStatus || '—',
    score: item.scoreValue ?? 0,
    maxMarks: item.totalMarks ?? 0,
    accuracyPct: item.accuracy ?? 0,
    negativeMarks: item.negativeMarks ?? 0,
    rank: item.rank ?? '—',
    timeTaken: item.timeTaken || '—',
    submissionDate: item.submissionTime ? String(item.submissionTime).slice(0, 10) : '—',
    resultStatus: item.resultStatus === 'PUBLISHED' ? 'Published' : 'Unpublished',
  }
}

/**
 * Fetches the student results table for a test (student results page).
 * The backend caps `limit` at 100; the table paginates/filters client-side.
 */
export async function fetchCbtResults(
  {
    testId,
    search = '',
    attemptStatus = 'ALL',
    resultStatus = 'ALL',
    page = 1,
    limit = 100,
  } = {},
  signal,
) {
  const response = await axiosInstance.post(
    CBT_RESULTS_ENDPOINT,
    { testId, search, attemptStatus, resultStatus, page, limit },
    { signal },
  )

  const body = response?.data || {}
  const list = body.data
  return {
    test: body.test || null,
    totalStudents: body.totalStudents ?? 0,
    attempted: body.attempted ?? 0,
    rows: Array.isArray(list) ? list.map(mapCbtResultRow) : [],
  }
}

/**
 * Maps the CBT results analytics payload
 * (POST /api/cbt-management/results/analytics) for the charts and summary
 * cards on the student results page.
 */
export function mapCbtAnalytics(data = {}) {
  return {
    test: data.test || null,
    totalStudents: data.totalStudents ?? 0,
    attempted: data.attempted ?? 0,
    averageScore: data.averageScore ?? 0,
    averageAccuracy: data.averageAccuracy ?? 0,
    scoreDistribution: Array.isArray(data.scoreDistribution)
      ? data.scoreDistribution.map((d) => ({
          range: d.range || d.label || '',
          students: d.students ?? 0,
        }))
      : [],
    accuracyTrend: Array.isArray(data.accuracyTrend)
      ? data.accuracyTrend.map((d, i) => ({
          label: d.label || d.series || `S${i + 1}`,
          accuracy: d.accuracy ?? 0,
        }))
      : [],
    topScorers: Array.isArray(data.topScorers)
      ? data.topScorers.map((s, i) => ({
          id: `${i}-${s.studentName || ''}`,
          rank: s.rank ?? i + 1,
          studentName: s.studentName || '',
          score: s.score ?? 0,
        }))
      : [],
    needsImprovement: Array.isArray(data.needsImprovement)
      ? data.needsImprovement.map((s, i) => ({
          id: `${i}-${s.rollNumber || s.studentName || ''}`,
          studentName: s.studentName || '',
          rollNumber: s.rollNumber || '',
          accuracyPct: s.accuracy ?? 0,
        }))
      : [],
  }
}

export async function fetchCbtAnalytics(
  { testId, search = '', attemptStatus = 'ALL', resultStatus = 'ALL' } = {},
  signal,
) {
  const response = await axiosInstance.post(
    CBT_ANALYTICS_ENDPOINT,
    { testId, search, attemptStatus, resultStatus },
    { signal },
  )

  return mapCbtAnalytics(response?.data?.data || {})
}

function triggerBlobDownload(blob, fallbackName, contentDisposition) {
  let filename = fallbackName
  const match = /filename="?([^";]+)"?/i.exec(contentDisposition || '')
  if (match?.[1]) filename = match[1].trim()

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Downloads the server-generated CSV of CBT results. */
export async function exportCbtResultsCsv({ testId, filters = {} } = {}) {
  const response = await axiosInstance.post(
    CBT_EXPORT_CSV_ENDPOINT,
    { testId, filters },
    { responseType: 'blob' },
  )
  triggerBlobDownload(
    response.data,
    `cbt-results-${testId}.csv`,
    response.headers?.['content-disposition'],
  )
}

/** Downloads the server-generated PDF of CBT results. */
export async function exportCbtResultsPdf({ testId, filters = {} } = {}) {
  const response = await axiosInstance.post(
    CBT_EXPORT_PDF_ENDPOINT,
    { testId, filters },
    { responseType: 'blob' },
  )
  triggerBlobDownload(
    response.data,
    `cbt-results-${testId}.pdf`,
    response.headers?.['content-disposition'],
  )
}
