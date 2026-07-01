import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  changeToppersListStatus,
  createToppersList,
  deleteToppersList,
  fetchToppersLists,
  updateToppersList,
} from '../api/toppersListAPI'

export const toppersListKeys = {
  all: ['toppers-list'],
  list: () => [...toppersListKeys.all, 'list'],
}

export function useToppersLists(options = {}) {
  return useQuery({
    queryKey: toppersListKeys.list(),
    queryFn: async () => {
      const result = await fetchToppersLists()
      return result.toppersLists ?? []
    },
    staleTime: 30 * 1000,
    retry: 1,
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
