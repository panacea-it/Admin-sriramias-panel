import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  changeToppersListStatus,
  createToppersList,
  deleteToppersList,
  fetchAllToppersLists,
  updateToppersList,
} from '../api/toppersListAPI'

export const toppersListKeys = {
  all: ['toppers-list'],
  list: () => [...toppersListKeys.all, 'list'],
}

export function useToppersLists(options = {}) {
  return useQuery({
    queryKey: toppersListKeys.list(),
    queryFn: fetchAllToppersLists,
    staleTime: 30 * 1000,
    retry: (failureCount, error) => {
      if (error?.cause?.response?.status === 401) return false
      if (error?.cause?.response?.status === 403) return false
      return failureCount < 2
    },
    ...options,
  })
}

export function useCreateToppersList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createToppersList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: toppersListKeys.all })
    },
  })
}

export function useUpdateToppersList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, formData }) => updateToppersList(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: toppersListKeys.all })
    },
  })
}

export function useChangeToppersListStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }) => changeToppersListStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: toppersListKeys.all })
    },
  })
}

export function useDeleteToppersList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteToppersList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: toppersListKeys.all })
    },
  })
}
