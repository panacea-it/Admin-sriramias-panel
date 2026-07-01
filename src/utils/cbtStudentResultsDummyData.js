import { generateCbtStudentResults } from '../data/cbtStudentResultsSeed'

/** First rows aligned with the Student Results reference screenshots. */
const REFERENCE_ROWS = [
  {
    id: 'ref-1',
    studentName: 'Isha Singh',
    rollNumber: 'UPSC-2026-1001',
    attemptStatus: 'Completed',
    score: 87,
    maxMarks: 65,
    accuracyPct: 90,
    negativeMarks: 1.98,
    rank: 1,
    timeTaken: '29 min',
    submissionDate: '2026-06-15',
    resultStatus: 'Unpublished',
  },
  {
    id: 'ref-2',
    studentName: 'Pooja Patel',
    rollNumber: 'UPSC-2026-1005',
    attemptStatus: 'Completed',
    score: 83,
    maxMarks: 83,
    accuracyPct: 78,
    negativeMarks: 4.62,
    rank: 2,
    timeTaken: '55 min',
    submissionDate: '2026-02-11',
    resultStatus: 'Unpublished',
  },
  {
    id: 'ref-3',
    studentName: 'Ananya Singh',
    rollNumber: 'UPSC-2026-1009',
    attemptStatus: 'Completed',
    score: 79,
    maxMarks: 51,
    accuracyPct: 66,
    negativeMarks: 1.98,
    rank: 3,
    timeTaken: '39 min',
    submissionDate: '2026-04-25',
    resultStatus: 'Published',
  },
]

function normalizeResultStatus(status) {
  return status === 'Published' ? 'Published' : 'Unpublished'
}

function normalizeRow(row, testTitle) {
  return {
    ...row,
    testTitle,
    attemptStatus: row.attemptStatus === 'Completed' ? 'Completed' : row.attemptStatus,
    resultStatus: normalizeResultStatus(row.resultStatus),
  }
}

/**
 * Frontend-only student results for the CBT topic test results page.
 */
export function getCbtDummyStudentResults(testId, testTitle = 'Test', count = 48) {
  const generated = generateCbtStudentResults(testId, testTitle, count)
    .filter((row) => row.attemptStatus === 'Completed')
    .map((row) =>
      normalizeRow(
        {
          ...row,
          resultStatus: row.resultStatus === 'Published' ? 'Published' : 'Unpublished',
        },
        testTitle,
      ),
    )

  const referenceIds = new Set(REFERENCE_ROWS.map((row) => row.rollNumber))
  const remainder = generated.filter((row) => !referenceIds.has(row.rollNumber))

  const merged = [
    ...REFERENCE_ROWS.map((row) => normalizeRow(row, testTitle)),
    ...remainder,
  ].slice(0, count)

  merged.sort((a, b) => {
    const ar = a.rank === '—' ? 9999 : Number(a.rank)
    const br = b.rank === '—' ? 9999 : Number(b.rank)
    return ar - br
  })

  return merged
}
