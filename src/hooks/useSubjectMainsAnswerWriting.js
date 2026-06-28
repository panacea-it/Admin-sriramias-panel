import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mainsAnswerWritingKeys } from './queryKeys'
import {
  createMainsAnswerWriting,
  deleteMainsAnswerWriting,
  getMainsAnswerWritingById,
  getMainsAnswerWritingCreateForm,
  getMainsAnswerWritingDashboardSummary,
  getMainsAnswerWritings,
  getMainsTopicsDropdown,
  updateMainsAnswerWriting,
  updateMainsAnswerWritingPublishStatus,
} from '../services/subjectMainsAnswerWritingService'
import { handleApiError } from '../utils/errorHandler'
import {
  mapMainsAnswerWritingDetailToLocal,
  normalizeMainsAnswerWritingsListResponse,
  normalizeMainsDashboardSummary,
  normalizeMainsTopicsDropdown,
} from '../utils/mainsAnswerWritingApiHelpers'

function mainsQueryRetry(failureCount, error) {
  const status = error?.response?.status
  if ([400, 401, 403, 404, 409].includes(status)) return false
  return failureCount < 2
}

function invalidateMainsCaches(queryClient, id) {
  queryClient.invalidateQueries({ queryKey: mainsAnswerWritingKeys.lists() })
  queryClient.invalidateQueries({ queryKey: mainsAnswerWritingKeys.all })
  if (id) {
    queryClient.invalidateQueries({ queryKey: mainsAnswerWritingKeys.detail(id) })
  }
}

/** @param {import('../types/mainsAnswerWriting.types').MainsAnswerWritingListParams} [params] */
export function useMainsAnswerWritings(params, options = {}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 10

  return useQuery({
    queryKey: mainsAnswerWritingKeys.list(params),
    queryFn: async ({ signal }) => {
      const data = await getMainsAnswerWritings(params, { signal })
      return normalizeMainsAnswerWritingsListResponse(data, { page, limit })
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
    retry: mainsQueryRetry,
    ...options,
  })
}

export function useMainsAnswerWriting(id, options = {}) {
  return useQuery({
    queryKey: mainsAnswerWritingKeys.detail(id ?? ''),
    queryFn: async ({ signal }) => {
      const data = await getMainsAnswerWritingById(id, { signal })
      return mapMainsAnswerWritingDetailToLocal(data)
    },
    enabled: Boolean(id),
    staleTime: 60_000,
    retry: mainsQueryRetry,
    ...options,
  })
}

export function useMainsAnswerWritingCreateForm(params, options = {}) {
  return useQuery({
    queryKey: mainsAnswerWritingKeys.createForm(params?.facultySubjectId),
    queryFn: async ({ signal }) => getMainsAnswerWritingCreateForm(params, { signal }),
    enabled: Boolean(params?.facultySubjectId) && options.enabled !== false,
    staleTime: 5 * 60 * 1000,
    retry: mainsQueryRetry,
    ...options,
  })
}

export function useMainsAnswerWritingDashboard(filters, options = {}) {
  return useQuery({
    queryKey: mainsAnswerWritingKeys.dashboard(filters),
    queryFn: async ({ signal }) => {
      const data = await getMainsAnswerWritingDashboardSummary(filters, { signal })
      return normalizeMainsDashboardSummary(data)
    },
    staleTime: 30_000,
    retry: mainsQueryRetry,
    ...options,
  })
}

export function useMainsTopicsDropdown(facultySubjectId, options = {}) {
  return useQuery({
    queryKey: mainsAnswerWritingKeys.topicsDropdown(facultySubjectId),
    queryFn: async ({ signal }) => {
      const data = await getMainsTopicsDropdown(facultySubjectId, { signal })
      return normalizeMainsTopicsDropdown(data)
    },
    enabled: Boolean(facultySubjectId) && options.enabled !== false,
    staleTime: 5 * 60 * 1000,
    retry: mainsQueryRetry,
    ...options,
  })
}

export function useCreateMainsAnswerWriting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData) => createMainsAnswerWriting(formData),
    onSuccess: () => invalidateMainsCaches(queryClient),
    onError: (error) => handleApiError(error),
  })
}

export function useUpdateMainsAnswerWriting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, formData }) => updateMainsAnswerWriting(id, formData),
    onSuccess: (_data, { id }) => invalidateMainsCaches(queryClient, id),
    onError: (error) => handleApiError(error),
  })
}

export function useUpdateMainsAnswerWritingPublishStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, publishStatus }) =>
      updateMainsAnswerWritingPublishStatus(id, publishStatus),
    onSuccess: (_data, { id }) => invalidateMainsCaches(queryClient, id),
    onError: (error) => handleApiError(error),
  })
}

export function useDeleteMainsAnswerWriting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => deleteMainsAnswerWriting(id),
    onSuccess: () => invalidateMainsCaches(queryClient),
    onError: (error) => handleApiError(error),
  })
}
