import {
  getMainsDashboard,
  getMainsFacultySubjectDetails,
  getMainsFacultySubjects,
  getMainsTestResults,
  getMainsTopicTests,
} from '../services/mainsManagementService'
import {
  mapDashboardResponse,
  mapFacultySubjectDetails,
  normalizeFacultySubjectsResponse,
  normalizeTestResultsResponse,
  normalizeTopicTestsResponse,
} from '../utils/mainsManagementApiHelpers'

export function mapMainsEvaluationCard(item = {}) {
  return item
}

export async function fetchMainsDashboard({ progressLimit = 5 } = {}, signal) {
  const data = await getMainsDashboard(progressLimit, { signal })
  return mapDashboardResponse(data)
}

export function mapMainsFacultyRow(item = {}) {
  return item
}

export async function fetchMainsFacultySubjects(params = {}, signal) {
  const data = await getMainsFacultySubjects(params, { signal })
  const normalized = normalizeFacultySubjectsResponse(data, {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
  })
  return normalized.items
}

export function mapMainsTopicRow(item = {}) {
  return item
}

export async function fetchMainsFacultyDetails(facultySubjectId, signal) {
  const response = await getMainsFacultySubjectDetails(facultySubjectId, { signal })
  const payload = response?.data ?? response
  return mapFacultySubjectDetails(payload)
}

export function mapMainsTestRow(item = {}) {
  return item
}

export async function fetchMainsTopicTests({ topicId, ...params } = {}, signal) {
  const data = await getMainsTopicTests(topicId, params, { signal })
  const normalized = normalizeTopicTestsResponse(data, topicId, {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
  })
  return {
    tests: normalized.items,
    topic: normalized.topic,
  }
}

export function mapMainsResultRow(item = {}) {
  return item
}

export async function fetchMainsTestResults({ testId, ...params } = {}, signal) {
  const data = await getMainsTestResults(testId, params, { signal })
  const normalized = normalizeTestResultsResponse(data, {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  })
  return {
    test: normalized.test,
    summary: normalized.summary,
    rows: normalized.rows,
  }
}
