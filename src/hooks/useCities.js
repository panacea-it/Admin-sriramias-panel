import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cityService } from '../services/cityService'
import { cityKeys } from './queryKeys'
import { handleApiError } from '../utils/errorHandler'
import { normalizeCitiesListResponse } from '../utils/cityApiHelpers'

/**
 * @param {import('../types/city.types').CityListParams} [params]
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useCities(params, options = {}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 10

  return useQuery({
    queryKey: cityKeys.list(params),
    queryFn: async () => {
      const data = await cityService.getCities(params)
      return normalizeCitiesListResponse(data, { page, limit })
    },
    ...options,
  })
}

/**
 * @param {string | undefined} id
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useCity(id, options = {}) {
  return useQuery({
    queryKey: cityKeys.detail(id ?? ''),
    queryFn: () => cityService.getCityById(id),
    enabled: Boolean(id),
    ...options,
  })
}

/**
 * Dependent dropdown — GET /api/cities/by-center/:centerId
 * @param {string | undefined} centerId
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useCitiesByCenter(centerId, options = {}) {
  return useQuery({
    queryKey: cityKeys.byCenter(centerId ?? ''),
    queryFn: () => cityService.getCitiesByCenter(centerId),
    enabled: Boolean(centerId),
    staleTime: 60_000,
    ...options,
  })
}

/** Alias for downstream modules (Classroom, etc.) */
export const useCityDropdown = useCitiesByCenter

export function useCreateCity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => cityService.createCity(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cityKeys.all })
    },
    onError: (error) => handleApiError(error),
  })
}

export function useUpdateCity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => cityService.updateCity(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: cityKeys.all })
      queryClient.invalidateQueries({ queryKey: cityKeys.detail(variables.id) })
    },
    onError: (error) => handleApiError(error),
  })
}

export function useUpdateCityStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }) => cityService.updateCityStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: cityKeys.detail(id) })
      const previous = queryClient.getQueryData(cityKeys.detail(id))
      if (previous?.data) {
        queryClient.setQueryData(cityKeys.detail(id), {
          ...previous,
          data: { ...previous.data, status },
        })
      }
      return { previous }
    },
    onError: (error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cityKeys.detail(variables.id), context.previous)
      }
      handleApiError(error)
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: cityKeys.all })
      queryClient.invalidateQueries({ queryKey: cityKeys.detail(variables.id) })
    },
  })
}

export function useDeleteCity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => cityService.deleteCity(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: cityKeys.all })
      queryClient.removeQueries({ queryKey: cityKeys.detail(id) })
    },
    onError: (error) => handleApiError(error),
  })
}
