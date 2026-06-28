import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { subjectPdfKeys } from './queryKeys'
import {
  createSubjectPdf,
  deleteSubjectPdf,
  downloadSubjectPdf,
  getSubjectPdfById,
  getSubjectPdfCreateForm,
  getSubjectPdfDashboardSummary,
  getSubjectPdfs,
  updateSubjectPdf,
  updateSubjectPdfVisibility,
} from '../services/subjectPdfService'
import { handleApiError } from '../utils/errorHandler'
import {
  mapSubjectPdfDetailToLocal,
  normalizeSubjectPdfDashboardSummary,
  normalizeSubjectPdfsListResponse,
} from '../utils/subjectPdfApiHelpers'

function subjectPdfQueryRetry(failureCount, error) {
  const status = error?.response?.status
  if ([400, 401, 403, 404, 409].includes(status)) return false
  return failureCount < 2
}

function invalidateSubjectPdfCaches(queryClient, id) {
  queryClient.invalidateQueries({ queryKey: subjectPdfKeys.lists() })
  queryClient.invalidateQueries({ queryKey: subjectPdfKeys.all })
  if (id) {
    queryClient.invalidateQueries({ queryKey: subjectPdfKeys.detail(id) })
  }
}

/** @param {import('../types/subjectPdf.types').SubjectPdfListParams} [params] */
export function useSubjectPdfs(params, options = {}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 10

  return useQuery({
    queryKey: subjectPdfKeys.list(params),
    queryFn: async ({ signal }) => {
      const data = await getSubjectPdfs(params, { signal })
      return normalizeSubjectPdfsListResponse(data, { page, limit })
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
    retry: subjectPdfQueryRetry,
    ...options,
  })
}

export function useSubjectPdf(id, options = {}) {
  return useQuery({
    queryKey: subjectPdfKeys.detail(id ?? ''),
    queryFn: async ({ signal }) => {
      const data = await getSubjectPdfById(id, { signal })
      return mapSubjectPdfDetailToLocal(data)
    },
    enabled: Boolean(id),
    staleTime: 60_000,
    retry: subjectPdfQueryRetry,
    ...options,
  })
}

export function useSubjectPdfCreateForm(params, options = {}) {
  return useQuery({
    queryKey: subjectPdfKeys.createForm(params?.facultySubjectId),
    queryFn: async ({ signal }) => getSubjectPdfCreateForm(params, { signal }),
    enabled: Boolean(params?.facultySubjectId) && options.enabled !== false,
    staleTime: 5 * 60 * 1000,
    retry: subjectPdfQueryRetry,
    ...options,
  })
}

export function useSubjectPdfDashboard(filters, options = {}) {
  return useQuery({
    queryKey: subjectPdfKeys.dashboard(filters),
    queryFn: async ({ signal }) => {
      const data = await getSubjectPdfDashboardSummary(filters, { signal })
      return normalizeSubjectPdfDashboardSummary(data)
    },
    staleTime: 30_000,
    retry: subjectPdfQueryRetry,
    ...options,
  })
}

export function useCreateSubjectPdf() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData) => createSubjectPdf(formData),
    onSuccess: () => invalidateSubjectPdfCaches(queryClient),
    onError: (error) => handleApiError(error),
  })
}

export function useUpdateSubjectPdf() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, formData }) => updateSubjectPdf(id, formData),
    onSuccess: (_data, { id }) => invalidateSubjectPdfCaches(queryClient, id),
    onError: (error) => handleApiError(error),
  })
}

export function useUpdateSubjectPdfVisibility() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, visibility }) => updateSubjectPdfVisibility(id, visibility),
    onSuccess: (_data, { id }) => invalidateSubjectPdfCaches(queryClient, id),
    onError: (error) => handleApiError(error),
  })
}

export function useDownloadSubjectPdf() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => downloadSubjectPdf(id),
    onSuccess: (_data, id) => invalidateSubjectPdfCaches(queryClient, id),
    onError: (error) => handleApiError(error),
  })
}

export function useDeleteSubjectPdf() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => deleteSubjectPdf(id),
    onSuccess: () => invalidateSubjectPdfCaches(queryClient),
    onError: (error) => handleApiError(error),
  })
}
