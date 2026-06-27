import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTopper,
  deleteTopper,
  fetchTopperById,
  fetchToppers,
  toggleTopperDisplay,
  toggleTopperTop10,
  updateTopper,
} from '../api/toppersAPI'
import { parseTopperBoolean } from '../utils/topperApiHelpers'

export const topperKeys = {
  all: ['toppers'],
  list: () => [...topperKeys.all, 'list'],
  detail: (id) => [...topperKeys.all, 'detail', id],
}

export function useToppers(options = {}) {
  return useQuery({
    queryKey: topperKeys.list(),
    queryFn: fetchToppers,
    staleTime: 30 * 1000,
    retry: 1,
    ...options,
  })
}

export function useTopper(id, options = {}) {
  const trimmedId = id?.trim() ?? ''

  return useQuery({
    queryKey: topperKeys.detail(trimmedId),
    queryFn: () => fetchTopperById(trimmedId),
    enabled: Boolean(trimmedId),
    staleTime: 30 * 1000,
    retry: (failureCount, error) => {
      if (error?.response?.status === 404) return false
      return failureCount < 1
    },
    ...options,
  })
}

export function useCreateTopper() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTopper,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: topperKeys.all })
    },
  })
}

export function useUpdateTopper() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, formData }) => updateTopper(id, formData),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: topperKeys.all })
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: topperKeys.detail(variables.id) })
      }
    },
  })
}

export function useDeleteTopper() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTopper,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: topperKeys.list() })

      const previous = queryClient.getQueryData(topperKeys.list())

      queryClient.setQueryData(topperKeys.list(), (current) => {
        if (!Array.isArray(current)) return current
        return current.filter((topper) => topper._id !== id)
      })

      queryClient.removeQueries({ queryKey: topperKeys.detail(id) })

      return { previous, id }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(topperKeys.list(), context.previous)
      }
    },
    onSuccess: (_response, id) => {
      queryClient.setQueryData(topperKeys.list(), (current) => {
        if (!Array.isArray(current)) return current
        return current.filter((topper) => topper._id !== id)
      })
      queryClient.removeQueries({ queryKey: topperKeys.detail(id) })
    },
  })
}

function mergeTopperInList(list, updatedTopper) {
  if (!Array.isArray(list) || !updatedTopper?._id) return list
  return list.map((topper) =>
    topper._id === updatedTopper._id ? { ...topper, ...updatedTopper } : topper,
  )
}

export function useToggleTopperDisplay() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleTopperDisplay,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: topperKeys.list() })

      const previous = queryClient.getQueryData(topperKeys.list())

      queryClient.setQueryData(topperKeys.list(), (current) => {
        if (!Array.isArray(current)) return current
        return current.map((topper) => {
          if (topper._id !== id) return topper
          const isDisplayed = parseTopperBoolean(topper.isDisplayed, true)
          return {
            ...topper,
            isDisplayed: !isDisplayed,
            isTop10: !isDisplayed ? false : topper.isTop10,
          }
        })
      })

      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(topperKeys.list(), context.previous)
      }
    },
    onSuccess: (response, id) => {
      const updatedTopper = response?.data
      if (updatedTopper?._id) {
        queryClient.setQueryData(topperKeys.list(), (current) =>
          mergeTopperInList(current, updatedTopper),
        )
        queryClient.setQueryData(topperKeys.detail(id), updatedTopper)
      } else {
        queryClient.invalidateQueries({ queryKey: topperKeys.all })
      }
    },
  })
}

export function useToggleTopperTop10() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleTopperTop10,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: topperKeys.list() })

      const previous = queryClient.getQueryData(topperKeys.list())

      queryClient.setQueryData(topperKeys.list(), (current) => {
        if (!Array.isArray(current)) return current
        return current.map((topper) => {
          if (topper._id !== id) return topper
          const isTop10 = parseTopperBoolean(topper.isTop10, false)
          return {
            ...topper,
            isTop10: !isTop10,
          }
        })
      })

      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(topperKeys.list(), context.previous)
      }
    },
    onSuccess: (response, id) => {
      const updatedTopper = response?.data
      if (updatedTopper?._id) {
        queryClient.setQueryData(topperKeys.list(), (current) =>
          mergeTopperInList(current, updatedTopper),
        )
        queryClient.setQueryData(topperKeys.detail(id), updatedTopper)
      } else {
        queryClient.invalidateQueries({ queryKey: topperKeys.all })
      }
    },
  })
}
