import { useQuery } from '@tanstack/react-query'
import { mainsManagementKeys } from './queryKeys'
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
import { getApiErrorMessage } from '../utils/apiError'

function mainsQueryRetry(failureCount, error) {
  const status = error?.response?.status
  if ([400, 401, 403, 404].includes(status)) return false
  return failureCount < 2
}

/**
 * GET /api/mains-management/dashboard
 * @param {number} [progressLimit]
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useMainsDashboard(progressLimit = 5, options = {}) {
  return useQuery({
    queryKey: mainsManagementKeys.dashboard(progressLimit),
    queryFn: async () => {
      const data = await getMainsDashboard(progressLimit)
      return mapDashboardResponse(data)
    },
    staleTime: 60_000,
    retry: mainsQueryRetry,
    ...options,
  })
}

/**
 * GET /api/mains-management/faculty-subjects
 * @param {import('../types/mainsManagement.types').MainsFacultySubjectsParams} [params]
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useMainsFacultySubjects(params = {}, options = {}) {
  const page = params.page ?? 1
  const limit = params.limit ?? 10

  return useQuery({
    queryKey: mainsManagementKeys.facultySubjects(params),
    queryFn: async () => {
      const data = await getMainsFacultySubjects(params)
      return normalizeFacultySubjectsResponse(data, { page, limit })
    },
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
    retry: mainsQueryRetry,
    ...options,
  })
}

/**
 * GET /api/mains-management/faculty-subjects/:facultySubjectId
 * @param {string | null | undefined} facultySubjectId
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useMainsFacultySubject(facultySubjectId, options = {}) {
  return useQuery({
    queryKey: mainsManagementKeys.facultySubject(facultySubjectId),
    queryFn: async () => {
      const response = await getMainsFacultySubjectDetails(facultySubjectId)
      const payload = response?.data ?? response
      return mapFacultySubjectDetails(payload)
    },
    enabled: Boolean(facultySubjectId),
    staleTime: 60_000,
    retry: mainsQueryRetry,
    ...options,
  })
}

/**
 * GET /api/mains-management/topics/:topicId/tests
 * @param {string | null | undefined} topicId
 * @param {import('../types/mainsManagement.types').MainsTopicTestsParams} [params]
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useMainsTopicTestsQuery(topicId, params = {}, options = {}) {
  const page = params.page ?? 1
  const limit = params.limit ?? 10

  return useQuery({
    queryKey: mainsManagementKeys.topicTests(topicId, params),
    queryFn: async () => {
      const data = await getMainsTopicTests(topicId, params)
      return normalizeTopicTestsResponse(data, topicId, { page, limit })
    },
    enabled: Boolean(topicId),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
    retry: mainsQueryRetry,
    ...options,
  })
}

/**
 * GET /api/mains-management/tests/:testId/results
 * @param {string | null | undefined} testId
 * @param {import('../types/mainsManagement.types').MainsTestResultsParams} [params]
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useMainsTestResultsQuery(testId, params = {}, options = {}) {
  const page = params.page ?? 1
  const limit = params.limit ?? 20

  return useQuery({
    queryKey: mainsManagementKeys.testResults(testId, params),
    queryFn: async () => {
      const data = await getMainsTestResults(testId, params)
      return normalizeTestResultsResponse(data, { page, limit })
    },
    enabled: Boolean(testId),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
    retry: mainsQueryRetry,
    ...options,
  })
}

export function getMainsQueryErrorMessage(error, fallback) {
  return getApiErrorMessage(error, fallback)
}
