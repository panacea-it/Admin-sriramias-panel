import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { classroomService } from '../services/classroomService'
import { classroomKeys } from './queryKeys'
import { handleApiError } from '../utils/errorHandler'
import { normalizeClassroomsListResponse } from '../utils/classroomApiHelpers'

/**
 * @param {import('../types/classroom.types').ClassroomListParams} [params]
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useClassrooms(params, options = {}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 10

  return useQuery({
    queryKey: classroomKeys.list(params),
    queryFn: async () => {
      const data = await classroomService.getClassrooms(params)
      return normalizeClassroomsListResponse(data, { page, limit })
    },
    ...options,
  })
}

/**
 * @param {string | undefined} id
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useClassroom(id, options = {}) {
  return useQuery({
    queryKey: classroomKeys.detail(id ?? ''),
    queryFn: () => classroomService.getClassroomById(id),
    enabled: Boolean(id),
    ...options,
  })
}

/**
 * @param {import('../types/classroom.types').ClassroomDropdownParams} [params]
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useClassroomDropdown(params, options = {}) {
  return useQuery({
    queryKey: classroomKeys.dropdown(params),
    queryFn: () => classroomService.getClassroomDropdown(params),
    enabled: Boolean(params?.centerId),
    staleTime: 5 * 60_000,
    ...options,
  })
}

export function useCreateClassroom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => classroomService.createClassroom(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.all })
    },
    onError: (error) => handleApiError(error),
  })
}

export function useUpdateClassroom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => classroomService.updateClassroom(id, payload),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.all })
      queryClient.invalidateQueries({ queryKey: classroomKeys.detail(variables.id) })
    },
    onError: (error) => handleApiError(error),
  })
}

export function useUpdateClassroomStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }) => classroomService.updateClassroomStatus(id, status),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.all })
      queryClient.invalidateQueries({ queryKey: classroomKeys.detail(variables.id) })
    },
    onError: (error) => handleApiError(error),
  })
}

export function useDeleteClassroom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => classroomService.deleteClassroom(id),
    onSuccess: (_response, id) => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.all })
      queryClient.removeQueries({ queryKey: classroomKeys.detail(id) })
    },
    onError: (error) => handleApiError(error),
  })
}
