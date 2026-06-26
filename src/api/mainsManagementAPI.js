import {
  buildLatestMainsEvaluationCards,
  buildMainsFacultyRows,
  getMainsFacultyBySubjectId,
  getMainsTestsForTopic,
  getMainsTopic,
  mapMainsFacultySubjectsForTable,
} from '../utils/mainsEvaluationHierarchy'
import {
  generateMainsStudentResults,
  summarizeMainsResults,
} from '../data/mainsStudentResultsSeed'

const DELAY_MS = 120

function delay(ms = DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function mapMainsEvaluationCard(item = {}) {
  return item
}

export async function fetchMainsDashboard({ progressLimit = 3 } = {}, _signal) {
  await delay()
  return buildLatestMainsEvaluationCards(progressLimit)
}

export function mapMainsFacultyRow(item = {}) {
  return item
}

export async function fetchMainsFacultySubjects(_params = {}, _signal) {
  await delay()
  return mapMainsFacultySubjectsForTable()
}

export function mapMainsTopicRow(item = {}) {
  return item
}

export async function fetchMainsFacultyDetails(facultySubjectId, _signal) {
  await delay()
  const faculty = getMainsFacultyBySubjectId(facultySubjectId)
  if (!faculty) {
    return { faculty: null, topics: [] }
  }

  return {
    faculty: {
      subjectId: faculty.subjectId,
      facultySubjectCode: faculty.subjectId,
      subjectName: faculty.subjectName,
      facultyName: faculty.facultyName,
      totalTopics: faculty.totalTopics,
      totalTests: faculty.totalTests,
    },
    topics: (faculty.topics || []).map((topic) => ({
      id: topic.id,
      topicCode: topic.id,
      title: topic.title,
      testCount: topic.testCount,
    })),
  }
}

export function mapMainsTestRow(item = {}) {
  return item
}

export async function fetchMainsTopicTests({ topicId } = {}, _signal) {
  await delay()
  return getMainsTestsForTopic(topicId)
}

export function mapMainsResultRow(item = {}) {
  return item
}

export async function fetchMainsTestResults({ testId } = {}, _signal) {
  await delay()
  const rows = generateMainsStudentResults(testId, 'Mains Test')
  const summary = summarizeMainsResults(rows)

  let testTitle = 'Mains Test'
  for (const faculty of buildMainsFacultyRows()) {
    for (const topic of faculty.topics || []) {
      const match = topic.tests?.find((test) => String(test.id) === String(testId))
      if (match) {
        testTitle = match.title
        break
      }
    }
  }

  return {
    test: { testId, testName: testTitle },
    summary: {
      studentsAssigned: rows.length,
      totalDownloads: summary.totalDownloads,
      totalUploaded: summary.totalUploaded,
      totalEvaluated: summary.totalEvaluated,
      pendingEvaluations: summary.pendingEvaluations,
      evaluationPct: summary.evaluationPct,
      totalStudents: summary.totalStudents,
      passed: summary.totalPassed,
      failed: summary.totalFailed,
      highestMarks: summary.highestMarks,
      lowestMarks: summary.lowestMarks,
      averageMarks: summary.averageMarks,
      topRanker: summary.topRanker,
      passMarks: 50,
      totalMarks: 100,
    },
    rows,
  }
}
