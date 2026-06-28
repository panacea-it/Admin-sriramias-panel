import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cbtTestKeys } from './cbtTestKeys'
import { examPatternKeys } from './queryKeys'
import {
  createExamPattern,
  deleteExamPattern,
  getExamPatternById,
  getExamPatternDropdown,
  getExamPatterns,
  updateExamPattern,
  updateExamPatternStatus,
} from '../services/examPatternService'
import { handleApiError } from '../utils/errorHandler'
import {
  mapApiExamPatternToLocal,
  normalizeExamPatternDropdownResponse,
  normalizeExamPatternsListResponse,
} from '../utils/examPatternApiHelpers'

function examPatternQueryRetry(failureCount, error) {
  const status = error?.response?.status
  if ([400, 401, 403, 404].includes(status)) return false
  return failureCount < 2
}

function invalidateExamPatternCaches(queryClient, id) {
  queryClient.invalidateQueries({ queryKey: examPatternKeys.lists() })
  queryClient.invalidateQueries({ queryKey: examPatternKeys.dropdown() })
  queryClient.invalidateQueries({ queryKey: cbtTestKeys.dropdowns.examPatterns() })
  if (id) {
    queryClient.invalidateQueries({ queryKey: examPatternKeys.detail(id) })
  }
}

/**
 * GET /api/test-configuration/exam-patterns
 * @param {import('../types/examPattern.types').ExamPatternListParams} [params]
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useExamPatterns(params, options = {}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 10

  return useQuery({
    queryKey: examPatternKeys.list(params),
    queryFn: async () => {
      const data = await getExamPatterns(params)
      return normalizeExamPatternsListResponse(data, { page, limit })
    },
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
    retry: examPatternQueryRetry,
    ...options,
  })
}

/**
 * GET /api/test-configuration/exam-patterns/:id
 * @param {string | undefined | null} id
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useExamPattern(id, options = {}) {
  return useQuery({
    queryKey: examPatternKeys.detail(id ?? ''),
    queryFn: async () => {
      const data = await getExamPatternById(id)
      return mapApiExamPatternToLocal(data)
    },
    enabled: Boolean(id),
    retry: examPatternQueryRetry,
    ...options,
  })
}

/**
 * GET /api/test-configuration/exam-patterns/dropdown
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useExamPatternsDropdown(options = {}) {
  return useQuery({
    queryKey: examPatternKeys.dropdown(),
    queryFn: async () => {
      const data = await getExamPatternDropdown()
      return normalizeExamPatternDropdownResponse(data)
    },
    staleTime: 5 * 60 * 1000,
    retry: examPatternQueryRetry,
    ...options,
  })
}

/** POST /api/test-configuration/exam-patterns */
export function useCreateExamPattern() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => createExamPattern(payload),
    onSuccess: () => invalidateExamPatternCaches(queryClient),
    onError: (error) => handleApiError(error),
    retry: false,
  })
}

/** PUT /api/test-configuration/exam-patterns/:id */
export function useUpdateExamPattern() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => updateExamPattern(id, payload),
    onSuccess: (_data, variables) => invalidateExamPatternCaches(queryClient, variables.id),
    onError: (error) => handleApiError(error),
    retry: false,
  })
}

/** PATCH /api/test-configuration/exam-patterns/status/:id */
export function useUpdateExamPatternStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }) => updateExamPatternStatus(id, status),
    onSuccess: (_data, variables) => invalidateExamPatternCaches(queryClient, variables.id),
    onError: (error) => handleApiError(error),
    retry: false,
  })
}

/** DELETE /api/test-configuration/exam-patterns/:id */
export function useDeleteExamPattern() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => deleteExamPattern(id),
    onSuccess: (_data, id) => {
      invalidateExamPatternCaches(queryClient)
      queryClient.removeQueries({ queryKey: examPatternKeys.detail(id) })
    },
    onError: (error) => handleApiError(error),
    retry: false,
  })
}

export default useExamPatterns
