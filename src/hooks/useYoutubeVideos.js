import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  assignYoutubeRank,
  createYoutubeVideo,
  deleteYoutubeVideo,
  fetchYoutubeVideoById,
  fetchYoutubeVideosPage,
  fetchRankedYoutubeVideos,
  searchRankedYoutubeVideos,
  removeYoutubeRank,
  reorderYoutubeRanks,
  updateYoutubeVideo,
  updateYoutubeVideoPriority,
} from '../api/youtubeVideosAPI'
import { isYoutubeMutationSuccess, mapApiVideoToRow } from '../utils/youtubeApiHelpers'
import {
  normalizeYoutubeVideo,
  sortYoutubeVideos,
} from '../utils/youtubeVideoPriority'

export const youtubeVideoKeys = {
  all: ['youtube-videos'],
  list: (params) => [...youtubeVideoKeys.all, 'list', params],
  detail: (id) => [...youtubeVideoKeys.all, 'detail', id],
  ranked: (params) => [...youtubeVideoKeys.all, 'ranked', params],
  rankedSearch: (params) => [...youtubeVideoKeys.all, 'ranked-search', params],
}

export function useYoutubeVideosList(params, options = {}) {
  return useQuery({
    queryKey: youtubeVideoKeys.list(params),
    queryFn: () => fetchYoutubeVideosPage(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    retry: 1,
    ...options,
  })
}

export function useRankedYoutubeVideos(params = {}, options = {}) {
  const { enabled: enabledOption = true, ...queryOptions } = options

  return useQuery({
    queryKey: youtubeVideoKeys.ranked(params),
    queryFn: () => fetchRankedYoutubeVideos(params),
    staleTime: 30 * 1000,
    retry: 1,
    ...queryOptions,
    enabled: Boolean(enabledOption),
  })
}

export function useSearchRankedYoutubeVideos(searchParams, options = {}) {
  const { enabled: enabledOption = true, ...queryOptions } = options

  return useQuery({
    queryKey: youtubeVideoKeys.rankedSearch(searchParams),
    queryFn: () => searchRankedYoutubeVideos(searchParams),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    retry: 1,
    ...queryOptions,
    enabled: Boolean(searchParams) && Boolean(enabledOption),
  })
}

export function useYoutubeVideo(id, options = {}) {
  const trimmedId = id?.trim() ?? ''
  const { enabled: enabledOption = true, ...queryOptions } = options

  return useQuery({
    queryKey: youtubeVideoKeys.detail(trimmedId),
    queryFn: () => fetchYoutubeVideoById(trimmedId),
    staleTime: 30 * 1000,
    retry: (failureCount, error) => {
      const status = error?.cause?.response?.status
      if (status === 404 || status === 400) return false
      return failureCount < 1
    },
    ...queryOptions,
    enabled: Boolean(trimmedId) && Boolean(enabledOption),
  })
}

function invalidateYoutubeLists(queryClient) {
  queryClient.invalidateQueries({ queryKey: youtubeVideoKeys.all })
}

export function useCreateYoutubeVideo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createYoutubeVideo,
    onSuccess: (response) => {
      if (isYoutubeMutationSuccess(response)) {
        invalidateYoutubeLists(queryClient)
      }
    },
  })
}

export function useUpdateYoutubeVideo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, form }) => updateYoutubeVideo(id, form),
    onMutate: async ({ id, form }) => {
      await queryClient.cancelQueries({ queryKey: youtubeVideoKeys.all })

      const previousEntries = queryClient.getQueriesData({ queryKey: youtubeVideoKeys.all })
      const optimisticPatch = {
        name: form.name?.trim(),
        description: form.description?.trim() ?? '',
        url: form.url?.trim(),
        status: form.status,
        priority: Number.parseInt(String(form.priority ?? '').trim(), 10) || 0,
      }

      queryClient.setQueriesData(
        {
          queryKey: youtubeVideoKeys.all,
          predicate: (query) => query.queryKey[1] === 'list',
        },
        (current) => {
          if (!current?.items) return current

          const nextItems = sortYoutubeVideos(
            current.items.map((video) =>
              video.id === id
                ? normalizeYoutubeVideo({ ...video, ...optimisticPatch })
                : video,
            ),
          )

          return { ...current, items: nextItems }
        },
      )

      return { previousEntries, id }
    },
    onError: (_error, _variables, context) => {
      context?.previousEntries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },
    onSuccess: (response, { id }) => {
      if (!isYoutubeMutationSuccess(response)) return

      const updatedRow = response.video ?? mapApiVideoToRow(response.data)
      if (updatedRow) {
        queryClient.setQueriesData(
          {
            queryKey: youtubeVideoKeys.all,
            predicate: (query) => query.queryKey[1] === 'list',
          },
          (current) => {
            if (!current?.items) return current

            const nextItems = sortYoutubeVideos(
              current.items.map((video) =>
                video.id === id
                  ? normalizeYoutubeVideo({ ...video, ...updatedRow })
                  : video,
              ),
            )

            return { ...current, items: nextItems }
          },
        )

        queryClient.setQueryData(youtubeVideoKeys.detail(id), updatedRow)
      }

      invalidateYoutubeLists(queryClient)
    },
  })
}

export function useDeleteYoutubeVideo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteYoutubeVideo,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: youtubeVideoKeys.all })

      const previousEntries = queryClient.getQueriesData({ queryKey: youtubeVideoKeys.all })

      queryClient.setQueriesData(
        {
          queryKey: youtubeVideoKeys.all,
          predicate: (query) => query.queryKey[1] === 'list',
        },
        (current) => {
          if (!current?.items) return current
          const nextItems = current.items.filter((video) => video.id !== id)
          const removedCount = current.items.length - nextItems.length
          if (removedCount === 0) return current

          return {
            ...current,
            items: nextItems,
            count: Math.max(0, (current.count ?? nextItems.length) - removedCount),
            total: Math.max(0, (current.total ?? nextItems.length) - removedCount),
          }
        },
      )

      queryClient.removeQueries({ queryKey: youtubeVideoKeys.detail(id) })

      return { previousEntries, id }
    },
    onError: (_error, _id, context) => {
      context?.previousEntries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },
    onSuccess: (response, id) => {
      if (!isYoutubeMutationSuccess(response)) return

      queryClient.setQueriesData(
        {
          queryKey: youtubeVideoKeys.all,
          predicate: (query) => query.queryKey[1] === 'list',
        },
        (current) => {
          if (!current?.items) return current
          const nextItems = current.items.filter((video) => video.id !== id)
          return {
            ...current,
            items: nextItems,
            count: nextItems.length,
            total: Math.max(0, (current.total ?? nextItems.length)),
          }
        },
      )

      queryClient.removeQueries({ queryKey: youtubeVideoKeys.detail(id) })
      invalidateYoutubeLists(queryClient)
    },
  })
}

export function useUpdateYoutubeStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => updateYoutubeVideo(id, payload),
    onSuccess: (response) => {
      if (isYoutubeMutationSuccess(response)) {
        invalidateYoutubeLists(queryClient)
      }
    },
  })
}

export function useAssignYoutubeRank() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ videoId, rank }) => assignYoutubeRank(videoId, rank),
    onMutate: async ({ videoId, rank }) => {
      await queryClient.cancelQueries({ queryKey: youtubeVideoKeys.all })

      const previousEntries = queryClient.getQueriesData({ queryKey: youtubeVideoKeys.all })

      queryClient.setQueriesData(
        {
          queryKey: youtubeVideoKeys.all,
          predicate: (query) => query.queryKey[1] === 'list',
        },
        (current) => {
          if (!current?.items) return current

          const nextItems = sortYoutubeVideos(
            current.items.map((video) =>
              video.id === videoId
                ? normalizeYoutubeVideo({
                    ...video,
                    rank,
                    priorityOrder: rank,
                  })
                : video,
            ),
          )

          return { ...current, items: nextItems }
        },
      )

      return { previousEntries, videoId }
    },
    onError: (_error, _variables, context) => {
      context?.previousEntries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },
    onSuccess: (response, { videoId }) => {
      if (!isYoutubeMutationSuccess(response)) return

      const updatedRow = response.video ?? mapApiVideoToRow(response.data)
      if (!updatedRow) {
        invalidateYoutubeLists(queryClient)
        return
      }

      queryClient.setQueriesData(
        {
          queryKey: youtubeVideoKeys.all,
          predicate: (query) => query.queryKey[1] === 'list',
        },
        (current) => {
          if (!current?.items) return current

          const nextItems = sortYoutubeVideos(
            current.items.map((video) =>
              video.id === videoId
                ? normalizeYoutubeVideo({ ...video, ...updatedRow })
                : video,
            ),
          )

          return { ...current, items: nextItems }
        },
      )

      queryClient.setQueryData(youtubeVideoKeys.detail(videoId), updatedRow)
      invalidateYoutubeLists(queryClient)
    },
  })
}

export function useUpdateYoutubePriority() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ videoId, priority }) => updateYoutubeVideoPriority(videoId, priority),
    onMutate: async ({ videoId, priority }) => {
      await queryClient.cancelQueries({ queryKey: youtubeVideoKeys.all })

      const previousEntries = queryClient.getQueriesData({ queryKey: youtubeVideoKeys.all })

      queryClient.setQueriesData(
        {
          queryKey: youtubeVideoKeys.all,
          predicate: (query) => query.queryKey[1] === 'list',
        },
        (current) => {
          if (!current?.items) return current

          const nextItems = sortYoutubeVideos(
            current.items.map((video) =>
              video.id === videoId
                ? normalizeYoutubeVideo({
                    ...video,
                    priority: Number(priority),
                  })
                : video,
            ),
          )

          return { ...current, items: nextItems }
        },
      )

      return { previousEntries, videoId }
    },
    onError: (_error, _variables, context) => {
      context?.previousEntries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },
    onSuccess: (response, { videoId }) => {
      if (!isYoutubeMutationSuccess(response)) return

      const updatedRow = response.video ?? mapApiVideoToRow(response.data)
      if (!updatedRow) {
        invalidateYoutubeLists(queryClient)
        return
      }

      queryClient.setQueriesData(
        {
          queryKey: youtubeVideoKeys.all,
          predicate: (query) => query.queryKey[1] === 'list',
        },
        (current) => {
          if (!current?.items) return current

          const nextItems = sortYoutubeVideos(
            current.items.map((video) =>
              video.id === videoId
                ? normalizeYoutubeVideo({ ...video, ...updatedRow })
                : video,
            ),
          )

          return { ...current, items: nextItems }
        },
      )

      queryClient.setQueryData(youtubeVideoKeys.detail(videoId), updatedRow)
      invalidateYoutubeLists(queryClient)
    },
  })
}

export function useRemoveYoutubeRank() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (videoId) => removeYoutubeRank(videoId),
    onSuccess: () => invalidateYoutubeLists(queryClient),
  })
}

export function useReorderYoutubeRanks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderedIds) => reorderYoutubeRanks(orderedIds),
    onSuccess: () => invalidateYoutubeLists(queryClient),
  })
}
