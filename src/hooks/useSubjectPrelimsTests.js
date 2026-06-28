import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { prelimsTestKeys } from './queryKeys'
import {
  createPrelimsTest,
  deletePrelimsTest,
  duplicatePrelimsTest,
  getPrelimsQuestionSheet,
  getPrelimsQuestions,
  getPrelimsTestById,
  getPrelimsTestCreateForm,
  getPrelimsTestDashboardSummary,
  getPrelimsTests,
  reuploadPrelimsQuestions,
  removePrelimsQuestionSheet,
  updatePrelimsQuestion,
  deletePrelimsQuestion,
  updatePrelimsTest,
  updatePrelimsTestPublishStatus,
  uploadPrelimsQuestions,
} from '../services/subjectPrelimsTestService'
import { handleApiError } from '../utils/errorHandler'
import {
  mapPrelimsTestDetailToLocal,
  normalizePrelimsDashboardSummary,
  normalizePrelimsQuestionsListResponse,
  normalizePrelimsTestsListResponse,
} from '../utils/prelimsTestApiHelpers'

function prelimsQueryRetry(failureCount, error) {
  const status = error?.response?.status
  if ([400, 401, 403, 404, 409].includes(status)) return false
  return failureCount < 2
}

function invalidatePrelimsCaches(queryClient, id) {
  queryClient.invalidateQueries({ queryKey: prelimsTestKeys.lists() })
  queryClient.invalidateQueries({ queryKey: prelimsTestKeys.all })
  if (id) {
    queryClient.invalidateQueries({ queryKey: prelimsTestKeys.detail(id) })
    queryClient.invalidateQueries({ queryKey: prelimsTestKeys.questions(id) })
  }
}

/** @param {import('../types/prelimsTest.types').PrelimsTestListParams} [params] */
export function usePrelimsTests(params, options = {}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 10

  return useQuery({
    queryKey: prelimsTestKeys.list(params),
    queryFn: async ({ signal }) => {
      const data = await getPrelimsTests(params, { signal })
      return normalizePrelimsTestsListResponse(data, { page, limit })
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
    retry: prelimsQueryRetry,
    ...options,
  })
}

export function usePrelimsTest(id, options = {}) {
  return useQuery({
    queryKey: prelimsTestKeys.detail(id ?? ''),
    queryFn: async ({ signal }) => {
      const data = await getPrelimsTestById(id, { signal })
      return mapPrelimsTestDetailToLocal(data)
    },
    enabled: Boolean(id),
    staleTime: 60_000,
    retry: prelimsQueryRetry,
    ...options,
  })
}

export function usePrelimsTestCreateForm(body, options = {}) {
  const facultySubjectId = body?.facultySubjectId ?? ''
  const folderId = body?.folderId ?? ''

  return useQuery({
    queryKey: prelimsTestKeys.createForm(facultySubjectId, folderId),
    queryFn: async ({ signal }) => getPrelimsTestCreateForm(body, { signal }),
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000,
    retry: prelimsQueryRetry,
    ...options,
  })
}

export function usePrelimsTestDashboard(filters, options = {}) {
  return useQuery({
    queryKey: prelimsTestKeys.dashboard(filters),
    queryFn: async ({ signal }) => {
      const data = await getPrelimsTestDashboardSummary(filters, { signal })
      return normalizePrelimsDashboardSummary(data)
    },
    staleTime: 30_000,
    retry: prelimsQueryRetry,
    ...options,
  })
}

export function usePrelimsQuestions(testId, filters, options = {}) {
  const page = filters?.page ?? 1
  const limit = filters?.limit ?? 10

  return useQuery({
    queryKey: prelimsTestKeys.questions(testId, filters),
    queryFn: async ({ signal }) => {
      const data = await getPrelimsQuestions(
        { prelimsTestId: testId, ...filters },
        { signal },
      )
      return normalizePrelimsQuestionsListResponse(data, { page, limit })
    },
    enabled: Boolean(testId) && options.enabled !== false,
    staleTime: 30_000,
    retry: prelimsQueryRetry,
    ...options,
  })
}

export function useCreatePrelimsTest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData) => createPrelimsTest(formData),
    onSuccess: () => invalidatePrelimsCaches(queryClient),
    onError: (error) => handleApiError(error),
  })
}

export function useUpdatePrelimsTest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => updatePrelimsTest(id, payload),
    onSuccess: (_data, { id }) => invalidatePrelimsCaches(queryClient, id),
    onError: (error) => handleApiError(error),
  })
}

export function useUpdatePrelimsTestPublishStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, publishStatus }) => updatePrelimsTestPublishStatus(id, publishStatus),
    onSuccess: (_data, { id }) => invalidatePrelimsCaches(queryClient, id),
    onError: (error) => handleApiError(error),
  })
}

export function useDeletePrelimsTest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => deletePrelimsTest(id),
    onSuccess: () => invalidatePrelimsCaches(queryClient),
    onError: (error) => handleApiError(error),
  })
}

export function useDuplicatePrelimsTest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }) => duplicatePrelimsTest(id, body),
    onSuccess: () => invalidatePrelimsCaches(queryClient),
    onError: (error) => handleApiError(error),
  })
}

export function useUploadPrelimsQuestions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData) => uploadPrelimsQuestions(formData),
    onSuccess: (_data, formData) => {
      const testId = formData?.get?.('prelimsTestId')
      invalidatePrelimsCaches(queryClient, testId ? String(testId) : undefined)
    },
    onError: (error) => handleApiError(error, { silent: true }),
  })
}

export function useReuploadPrelimsQuestions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData) => reuploadPrelimsQuestions(formData),
    onSuccess: (_data, formData) => {
      const testId = formData?.get?.('prelimsTestId')
      invalidatePrelimsCaches(queryClient, testId ? String(testId) : undefined)
    },
    onError: (error) => handleApiError(error, { silent: true }),
  })
}

export function useUpdatePrelimsQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ testId, questionId, payload }) =>
      updatePrelimsQuestion(testId, questionId, payload),
    onSuccess: (_data, { testId }) => invalidatePrelimsCaches(queryClient, testId),
    onError: (error) => handleApiError(error),
  })
}

export function useDeletePrelimsQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ testId, questionId }) => deletePrelimsQuestion(testId, questionId),
    onSuccess: (_data, { testId }) => invalidatePrelimsCaches(queryClient, testId),
    onError: (error) => handleApiError(error),
  })
}

export function usePrelimsQuestionSheet(body, options = {}) {
  return useQuery({
    queryKey: [...prelimsTestKeys.all, 'sheet', body],
    queryFn: async ({ signal }) => getPrelimsQuestionSheet(body, { signal }),
    enabled: Boolean(body?.prelimsTestId && body?.language) && options.enabled !== false,
    staleTime: 30_000,
    retry: prelimsQueryRetry,
    ...options,
  })
}

export function useRemovePrelimsQuestionSheet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body) => removePrelimsQuestionSheet(body),
    onSuccess: (_data, body) =>
      invalidatePrelimsCaches(queryClient, body?.prelimsTestId),
    onError: (error) => handleApiError(error),
  })
}
