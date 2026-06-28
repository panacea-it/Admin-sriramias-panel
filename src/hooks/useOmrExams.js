import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { omrExamKeys } from './queryKeys'
import {
  createOmrExam,
  deleteOmrExam,
  deleteResultSheet,
  downloadResultSheetBlob,
  downloadResultSheetUrl,
  getOmrExamById,
  listOmrExams,
  replaceResultSheet,
  searchOmrExams,
  updateOmrExam,
  uploadResultSheet,
} from '../services/omrExamService'
import { handleApiError } from '../utils/errorHandler'
import { getApiErrorMessage } from '../utils/apiError'
import {
  mapApiOmrExamToLocal,
  normalizeOmrExamsListResponse,
} from '../utils/omrApiHelpers'

function omrExamQueryRetry(failureCount, error) {
  const status = error?.response?.status
  if ([400, 401, 403, 404].includes(status)) return false
  return failureCount < 2
}

function invalidateOmrExamCaches(queryClient, id) {
  queryClient.invalidateQueries({ queryKey: omrExamKeys.lists() })
  queryClient.invalidateQueries({ queryKey: omrExamKeys.searches() })
  if (id) {
    queryClient.invalidateQueries({ queryKey: omrExamKeys.detail(id) })
  }
}

/**
 * POST /api/omr-exams/list
 * @param {import('../types/omrExam.types').ListOmrExamsParams} [params]
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useOmrExams(params, options = {}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 10

  return useQuery({
    queryKey: omrExamKeys.list(params),
    queryFn: async () => {
      const data = await listOmrExams(params)
      return normalizeOmrExamsListResponse(data, { page, limit })
    },
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
    retry: omrExamQueryRetry,
    ...options,
  })
}

/**
 * POST /api/omr-exams/search
 * @param {import('../types/omrExam.types').SearchOmrExamsParams | null} params
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useOmrExamSearch(params, options = {}) {
  const search = String(params?.search || '').trim()
  const page = params?.page ?? 1
  const limit = params?.limit ?? 10

  return useQuery({
    queryKey: omrExamKeys.search(params),
    queryFn: async () => {
      const data = await searchOmrExams(params)
      return normalizeOmrExamsListResponse(data, { page, limit })
    },
    enabled: search.length >= 1,
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
    retry: omrExamQueryRetry,
    ...options,
  })
}

/**
 * POST /api/omr-exams/:id
 * @param {string | undefined | null} id
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useOmrExamDetail(id, options = {}) {
  return useQuery({
    queryKey: omrExamKeys.detail(id ?? ''),
    queryFn: async () => {
      const data = await getOmrExamById(id)
      return mapApiOmrExamToLocal(data)
    },
    enabled: Boolean(id),
    staleTime: 60_000,
    retry: omrExamQueryRetry,
    ...options,
  })
}

/** POST /api/omr-exams */
export function useCreateOmrExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => createOmrExam(payload),
    onSuccess: () => invalidateOmrExamCaches(queryClient),
    onError: (error) => {
      if (error?.response?.status !== 403) handleApiError(error)
    },
    retry: false,
  })
}

/** PUT /api/omr-exams/:id */
export function useUpdateOmrExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => updateOmrExam(id, payload),
    onSuccess: (_data, variables) => invalidateOmrExamCaches(queryClient, variables.id),
    onError: (error) => {
      if (error?.response?.status !== 403) handleApiError(error)
    },
    retry: false,
  })
}

/** DELETE /api/omr-exams/:id */
export function useDeleteOmrExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => deleteOmrExam(id),
    onSuccess: (_data, id) => {
      invalidateOmrExamCaches(queryClient)
      queryClient.removeQueries({ queryKey: omrExamKeys.detail(id) })
    },
    onError: (error) => handleApiError(error),
    retry: false,
  })
}

/** POST /api/omr-exams/:id/result-sheet */
export function useUploadResultSheet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, file }) => uploadResultSheet(id, file),
    onSuccess: (_data, variables) => invalidateOmrExamCaches(queryClient, variables.id),
    onError: (error) => {
      if (error?.response?.status !== 403) handleApiError(error)
    },
    retry: false,
  })
}

/** PUT /api/omr-exams/:id/result-sheet */
export function useReplaceResultSheet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, file }) => replaceResultSheet(id, file),
    onSuccess: (_data, variables) => invalidateOmrExamCaches(queryClient, variables.id),
    onError: (error) => handleApiError(error),
    retry: false,
  })
}

/** DELETE /api/omr-exams/:id/result-sheet */
export function useDeleteResultSheet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => deleteResultSheet(id),
    onSuccess: (_data, id) => invalidateOmrExamCaches(queryClient, id),
    onError: (error) => handleApiError(error),
    retry: false,
  })
}

export function useDownloadResultSheetUrl() {
  return useMutation({
    mutationFn: (id) => downloadResultSheetUrl(id),
    onError: (error) => handleApiError(error),
    retry: false,
  })
}

export function useDownloadResultSheetBlob() {
  return useMutation({
    mutationFn: (id) => downloadResultSheetBlob(id),
    onError: (error) => handleApiError(error),
    retry: false,
  })
}

export function getOmrMutationErrorMessage(error, fallback) {
  return getApiErrorMessage(error, fallback)
}

export default useOmrExams
