import {
  buildLatestCbtEvaluationCards,
  getCbtTestsForTopic,
  mapCbtFacultySubjectsForTable,
} from '../utils/cbtTestSeriesHierarchy'
import {
  generateCbtStudentResults,
  summarizeCbtResults,
} from '../data/cbtStudentResultsSeed'
import { getCbtFacultyBySubjectId, getCbtTopics } from '../utils/cbtTestSeriesHierarchy'

const DELAY_MS = 120

function delay(ms = DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function mapCbtEvaluationCard(item = {}) {
  return item
}

export async function fetchCbtDashboard({ progressLimit = 3 } = {}, _signal) {
  await delay()
  return buildLatestCbtEvaluationCards(progressLimit)
}

export function mapCbtMappingRow(item = {}) {
  return item
}

export async function fetchCbtFacultySubjects(_params = {}, _signal) {
  await delay()
  return mapCbtFacultySubjectsForTable()
}

export function mapCbtTopicRow(item = {}) {
  return item
}

export async function fetchCbtTopics({ facultySubjectId } = {}, _signal) {
  await delay()
  const faculty = getCbtFacultyBySubjectId(facultySubjectId)
  if (!faculty) return []
  return getCbtTopics(faculty).map((topic) => ({
    id: topic.id,
    folderId: topic.id,
    title: topic.title,
    testCount: topic.testCount,
    updatedAt: topic.updatedAt,
  }))
}

export function mapCbtTestRow(item = {}) {
  return item
}

export async function fetchCbtTests({ topicId } = {}, _signal) {
  await delay()
  return getCbtTestsForTopic(topicId)
}

export function mapCbtResultRow(item = {}) {
  return item
}

export async function fetchCbtResults({ testId } = {}, _signal) {
  await delay()
  const rows = generateCbtStudentResults(testId, 'CBT Test')
  const summary = summarizeCbtResults(rows)
  return {
    rows,
    test: { testId, testName: 'CBT Test' },
    totalStudents: summary.totalStudents,
    attempted: summary.attempted,
  }
}

export async function fetchCbtAnalytics({ testId } = {}, _signal) {
  await delay()
  const rows = generateCbtStudentResults(testId, 'CBT Test')
  const summary = summarizeCbtResults(rows)
  return {
    avgScore: summary.avgScore,
    avgAccuracy: summary.avgAccuracy,
    topScore: summary.topScore,
    attempted: summary.attempted,
    totalStudents: summary.totalStudents,
  }
}

export async function exportCbtResultsCsv() {
  await delay()
  return new Blob(['Student,Score\n'], { type: 'text/csv' })
}

export async function exportCbtResultsPdf() {
  await delay()
  return new Blob(['CBT Results Export'], { type: 'application/pdf' })
}
