import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  fetchYoutubeVideos,
  createYoutubeVideo,
  updateYoutubeVideo,
  deleteYoutubeVideo,
  assignYoutubeRank,
  removeYoutubeRank,
  reorderYoutubeRanks,
} from '../api/youtubeVideosAPI'
import { youtubeVideoKeys } from '../hooks/useYoutubeVideos'
import {
  applyExpiredPriorityCleanup,
  normalizeYoutubeVideo,
  normalizeYoutubeVideos,
  sortYoutubeVideos,
} from '../utils/youtubeVideoPriority'
import { isYoutubeMutationSuccess, mapUiStatusToApi } from '../utils/youtubeApiHelpers'
import { getApiErrorMessage } from '../utils/apiError'
import { toast } from '@/utils/toast'

const YoutubeVideosContext = createContext(null)

function applyLocalVideos(setVideos, updater) {
  setVideos((prev) => {
    const next = typeof updater === 'function' ? updater(prev) : updater
    return sortYoutubeVideos(normalizeYoutubeVideos(next))
  })
}

export function YoutubeVideosProvider({ children }) {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  const invalidateLists = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: youtubeVideoKeys.all })
  }, [queryClient])

  const syncFromStore = useCallback(async () => {
    const rows = await fetchYoutubeVideos({ sortBy: 'priority', sortOrder: 'asc' })
    setVideos(sortYoutubeVideos(normalizeYoutubeVideos(rows)))
    return rows
  }, [])

  const loadVideos = useCallback(async () => {
    setLoading(true)
    try {
      await syncFromStore()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load videos'))
    } finally {
      setLoading(false)
    }
  }, [syncFromStore])

  useEffect(() => {
    loadVideos()
  }, [loadVideos])

  useEffect(() => {
    const interval = setInterval(() => {
      setVideos((prev) => applyExpiredPriorityCleanup(prev))
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  const patchVideoLocally = useCallback((id, patch) => {
    applyLocalVideos(setVideos, (prev) =>
      prev.map((v) => (v.id === id ? normalizeYoutubeVideo({ ...v, ...patch }) : v)),
    )
  }, [])

  const assignRank = useCallback(
    async (videoId, rank) => {
      const response = await assignYoutubeRank(videoId, rank)
      if (!isYoutubeMutationSuccess(response)) {
        throw new Error(response?.message || 'Unable to assign video rank. Please try again.')
      }
      await syncFromStore()
      invalidateLists()
      return response
    },
    [syncFromStore, invalidateLists],
  )

  const removeRank = useCallback(
    async (videoId) => {
      try {
        await removeYoutubeRank(videoId)
        await syncFromStore()
        invalidateLists()
      } catch (error) {
        await syncFromStore()
        toast.error(getApiErrorMessage(error, 'Failed to remove priority'))
        throw error
      }
    },
    [syncFromStore, invalidateLists],
  )

  const reorderRanks = useCallback(
    async (orderedIds) => {
      try {
        await reorderYoutubeRanks(orderedIds)
        await syncFromStore()
        invalidateLists()
      } catch (error) {
        await syncFromStore()
        toast.error(getApiErrorMessage(error, 'Failed to reorder priorities'))
        throw error
      }
    },
    [syncFromStore, invalidateLists],
  )

  const createVideo = useCallback(
    async (form) => {
      const response = await createYoutubeVideo(form)
      if (!isYoutubeMutationSuccess(response)) {
        throw new Error(response?.message || 'Something went wrong. Please try again.')
      }
      await syncFromStore()
      invalidateLists()
      return response
    },
    [syncFromStore, invalidateLists],
  )

  const updateVideo = useCallback(
    async (id, form) => {
      const response = await updateYoutubeVideo(id, form)
      if (!isYoutubeMutationSuccess(response)) {
        throw new Error(response?.message || 'Unable to update the YouTube video. Please try again.')
      }
      await syncFromStore()
      invalidateLists()
      return response
    },
    [syncFromStore, invalidateLists],
  )

  const deleteVideo = useCallback(
    async (id) => {
      try {
        const response = await deleteYoutubeVideo(id)
        if (!isYoutubeMutationSuccess(response)) {
          throw new Error(response?.message || 'Something went wrong. Please try again.')
        }
        await syncFromStore()
        invalidateLists()
      } catch (error) {
        await syncFromStore()
        toast.error(getApiErrorMessage(error, 'Unable to delete YouTube video. Please try again.'))
        throw error
      }
    },
    [syncFromStore, invalidateLists],
  )

  const updateStatus = useCallback(
    async (row, newStatus) => {
      const uiStatus = newStatus === 'Inactive' ? 'Deactivated' : newStatus
      if (row.status === uiStatus) return

      applyLocalVideos(setVideos, (prev) =>
        prev.map((v) =>
          v.id === row.id ? normalizeYoutubeVideo({ ...v, status: uiStatus }) : v,
        ),
      )

      try {
        const response = await updateYoutubeVideo(row.id, {
          status: mapUiStatusToApi(uiStatus),
        })
        if (!isYoutubeMutationSuccess(response)) {
          throw new Error(response?.message || 'Something went wrong. Please try again.')
        }
        await syncFromStore()
        invalidateLists()
      } catch (error) {
        await syncFromStore()
        toast.error(getApiErrorMessage(error, 'Failed to update status'))
        throw error
      }
    },
    [syncFromStore, invalidateLists],
  )

  const value = useMemo(
    () => ({
      videos,
      loading,
      loadVideos,
      syncFromStore,
      patchVideoLocally,
      assignRank,
      removeRank,
      reorderRanks,
      createVideo,
      updateVideo,
      deleteVideo,
      updateStatus,
    }),
    [
      videos,
      loading,
      loadVideos,
      syncFromStore,
      patchVideoLocally,
      assignRank,
      removeRank,
      reorderRanks,
      createVideo,
      updateVideo,
      deleteVideo,
      updateStatus,
    ],
  )

  return (
    <YoutubeVideosContext.Provider value={value}>
      {children}
    </YoutubeVideosContext.Provider>
  )
}

export function useYoutubeVideos() {
  const ctx = useContext(YoutubeVideosContext)
  if (!ctx) {
    throw new Error('useYoutubeVideos must be used within YoutubeVideosProvider')
  }
  return ctx
}
