import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { classSectionService } from '../services/classSectionService'
import { classSectionKeys } from './queryKeys'
import { handleApiError } from '../utils/errorHandler'
import { normalizeClassSectionsListResponse } from '../pages/academics/categories/classes/classApiHelpers'

/**
 * POST /api/academics/classes/list
 * @param {import('../types/classSection.types').ClassSectionListParams} [params]
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useClassSections(params, options = {}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 10

  return useQuery({
    queryKey: classSectionKeys.list(params),
    queryFn: async () => {
      const data = await classSectionService.getClassSections(params)
      return normalizeClassSectionsListResponse(data, { page, limit })
    },
    placeholderData: (previousData) => previousData,
    ...options,
  })
}

/**
 * POST /api/academics/classes/details
 * @param {string | undefined | null} id
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useClassSection(id, options = {}) {
  return useQuery({
    queryKey: classSectionKeys.detail(id ?? ''),
    queryFn: () => classSectionService.getClassSectionById(id),
    enabled: Boolean(id),
    ...options,
  })
}

/**
 * POST /api/academics/classes/dropdown
 * @param {string | undefined | null} subjectId
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useClassSectionsDropdown(subjectId, options = {}) {
  return useQuery({
    queryKey: classSectionKeys.dropdown(subjectId ?? ''),
    queryFn: () => classSectionService.getClassSectionsDropdown(subjectId),
    enabled: Boolean(subjectId),
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/** POST /api/academics/classes */
export function useCreateClassSection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => classSectionService.createClassSection(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: classSectionKeys.lists() })
      const subjectId = response?.data?.subjectId ?? response?.data?.subject?._id
      if (subjectId) {
        queryClient.invalidateQueries({ queryKey: classSectionKeys.dropdown(String(subjectId)) })
      }
    },
    onError: (error) => handleApiError(error),
    retry: false,
  })
}

/** PUT /api/academics/classes/:id */
export function useUpdateClassSection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => classSectionService.updateClassSection(id, payload),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: classSectionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: classSectionKeys.detail(variables.id) })
      const subjectId = response?.data?.subjectId ?? response?.data?.subject?._id
      if (subjectId) {
        queryClient.invalidateQueries({ queryKey: classSectionKeys.dropdown(String(subjectId)) })
      }
      if (variables.payload?.subjectId) {
        queryClient.invalidateQueries({
          queryKey: classSectionKeys.dropdown(variables.payload.subjectId),
        })
      }
    },
    onError: (error) => handleApiError(error),
    retry: false,
  })
}

/** PATCH /api/academics/classes/:id/status */
export function useUpdateClassSectionStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }) => classSectionService.updateClassSectionStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: classSectionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: classSectionKeys.detail(variables.id) })
    },
    onError: (error) => handleApiError(error),
    retry: false,
  })
}

/** DELETE /api/academics/classes/delete */
export function useDeleteClassSection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => classSectionService.deleteClassSection(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: classSectionKeys.lists() })
      queryClient.removeQueries({ queryKey: classSectionKeys.detail(id) })
    },
    onError: (error) => handleApiError(error),
    retry: false,
  })
}

export default useClassSections
