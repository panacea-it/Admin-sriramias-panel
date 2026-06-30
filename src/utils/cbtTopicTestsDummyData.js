import { hashCode } from './evaluationProgressMetrics'

/** Demo rows matching the CBT topic details reference UI. */
const DEMO_TOPIC_TEST_SERIES = [
  {
    title: 'Historical Background Test Series',
    studentsAssigned: 201,
    studentsDownloaded: 201,
    studentsUploaded: 195,
  },
  {
    title: 'Making of the Constitution Series',
    studentsAssigned: 200,
    studentsDownloaded: 200,
    studentsUploaded: 185,
  },
  {
    title: 'Salient Features Series',
    studentsAssigned: 237,
    studentsDownloaded: 237,
    studentsUploaded: 230,
  },
]

/**
 * Frontend-only fallback when a topic has no tests from hierarchy/API.
 * Keeps the topic details table populated for UI review.
 */
export function getCbtDummyTopicTests({ topicId, topicTitle, faculty } = {}) {
  const key = String(topicId || topicTitle || 'cbt-topic')
  const facultyLabel = faculty
    ? faculty.facultySubjectLabel ||
      `${faculty.subjectName || ''} — ${faculty.facultyName || ''}`.trim()
    : ''

  return DEMO_TOPIC_TEST_SERIES.map((row, index) => ({
    id: `dummy-cbt-${hashCode(key)}-${index}`,
    title: row.title,
    uploadedDate: '2026-06-29',
    studentsAssigned: row.studentsAssigned,
    studentsDownloaded: row.studentsDownloaded,
    studentsUploaded: row.studentsUploaded,
    studentsEvaluated: 0,
    pendingEvaluations: row.studentsUploaded,
    evaluationPct: 0,
    evaluationStatus: 'In Progress',
    evaluationStatusLabel: 'In Progress',
    facultyLabel,
  }))
}
