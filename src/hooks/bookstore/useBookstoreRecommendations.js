import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  changeBookstoreRecommendationStatus,
  createBookstoreRecommendation,
  deleteBookstoreRecommendation,
  fetchBookstoreRecommendations,
  updateBookstoreRecommendation,
} from '../../api/bookstoreAPI'

export const bookstoreRecommendationKeys = {
  all: ['bookstore-recommendations'],
  list: (params) => [...bookstoreRecommendationKeys.all, 'list', params],
}

export function useBookstoreRecommendationsList(params, options = {}) {
  return useQuery({
    queryKey: bookstoreRecommendationKeys.list(params),
    queryFn: () => fetchBookstoreRecommendations(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    ...options,
  })
}

export function useCreateBookstoreRecommendation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => createBookstoreRecommendation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookstoreRecommendationKeys.all })
    },
  })
}

export function useUpdateBookstoreRecommendation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => updateBookstoreRecommendation(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookstoreRecommendationKeys.all })
    },
  })
}

export function useChangeBookstoreRecommendationStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }) => changeBookstoreRecommendationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookstoreRecommendationKeys.all })
    },
  })
}

export function useDeleteBookstoreRecommendation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => deleteBookstoreRecommendation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookstoreRecommendationKeys.all })
    },
  })
}
