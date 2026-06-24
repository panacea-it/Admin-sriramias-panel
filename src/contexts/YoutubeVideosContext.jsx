import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  fetchYoutubeVideos,
  createYoutubeVideo,
  updateYoutubeVideo,
  deleteYoutubeVideo,
  assignYoutubeRank,
  removeYoutubeRank,
  reorderYoutubeRanks,
  reorderYoutubeVideos,
} from '../api/youtubeVideosAPI'
import {
  applyExpiredPriorityCleanup,
  normalizeYoutubeVideo,
  normalizeYoutubeVideos,
  sortYoutubeVideos,
} from '../utils/youtubeVideoPriority'
import { mockAssignRank, mockRemoveRank, mockReorderRanks } from '../utils/youtubeRankMock'
import { toast } from '@/utils/toast'

const YoutubeVideosContext = createContext(null)

function applyLocalVideos(setVideos, updater) {
  setVideos((prev) => {
    const next = typeof updater === 'function' ? updater(prev) : updater
    return sortYoutubeVideos(normalizeYoutubeVideos(next))
  })
}

function applyVideosFromResponse(setVideos, response) {
  if (response?.videos?.length) {
    setVideos(sortYoutubeVideos(normalizeYoutubeVideos(response.videos)))
    return true
  }
  return false
}

export function YoutubeVideosProvider({ children }) {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  const syncFromStore = useCallback(async () => {
    const rows = await fetchYoutubeVideos({ dateBucket: 'all' })
    setVideos(sortYoutubeVideos(normalizeYoutubeVideos(rows)))
    return rows
  }, [])

  const loadVideos = useCallback(async () => {
    setLoading(true)
    try {
      await syncFromStore()
    } catch {
      toast.error('Failed to load videos')
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
      applyLocalVideos(setVideos, (prev) => {
        const result = mockAssignRank(prev, videoId, rank, { allowGaps: false })
        return result?.videos ?? prev
      })
      try {
        const response = await assignYoutubeRank(videoId, rank, { allowGaps: false })
        applyVideosFromResponse(setVideos, response)
      } catch {
        await syncFromStore()
        throw new Error('assign failed')
      }
    },
    [syncFromStore],
  )

  const removeRank = useCallback(
    async (videoId) => {
      applyLocalVideos(setVideos, (prev) => {
        const result = mockRemoveRank(prev, videoId, true)
        return result?.videos ?? prev
      })
      try {
        const response = await removeYoutubeRank(videoId, true)
        applyVideosFromResponse(setVideos, response)
      } catch {
        await syncFromStore()
        toast.error('Failed to remove priority')
        throw new Error('remove failed')
      }
    },
    [syncFromStore],
  )

  const reorderRanks = useCallback(
    async (orderedIds) => {
      applyLocalVideos(setVideos, (prev) => {
        const result = mockReorderRanks(prev, orderedIds)
        return result?.videos ?? prev
      })
      try {
        const response = await reorderYoutubeRanks(orderedIds)
        applyVideosFromResponse(setVideos, response)
      } catch {
        await syncFromStore()
        toast.error('Failed to reorder priorities')
        throw new Error('reorder failed')
      }
    },
    [syncFromStore],
  )

  const reorderVideos = useCallback(
    async (orderedIds) => {
      await reorderYoutubeVideos(orderedIds)
      await syncFromStore()
    },
    [syncFromStore],
  )

  const createVideo = useCallback(
    async (payload) => {
      await createYoutubeVideo(payload)
      await syncFromStore()
    },
    [syncFromStore],
  )

  const updateVideo = useCallback(
    async (id, payload) => {
      await updateYoutubeVideo(id, payload)
      await syncFromStore()
    },
    [syncFromStore],
  )

  const deleteVideo = useCallback(
    async (id) => {
      applyLocalVideos(setVideos, (prev) => {
        const target = prev.find((v) => v.id === id)
        let next = prev.filter((v) => v.id !== id)
        if (target?.priorityOrder) {
          const removed = target.priorityOrder
          next = next.map((v) => {
            if (v.priorityOrder != null && v.priorityOrder > removed) {
              return normalizeYoutubeVideo({
                ...v,
                priorityOrder: v.priorityOrder - 1,
                priorityLevel: v.priorityOrder - 1,
                isPinned: v.priorityOrder - 1 === 1,
              })
            }
            return v
          })
        }
        return next
      })
      try {
        await deleteYoutubeVideo(id)
      } catch {
        await syncFromStore()
        toast.error('Failed to delete video')
        throw new Error('delete failed')
      }
    },
    [syncFromStore],
  )

  const updateStatus = useCallback(
    async (row, newStatus) => {
      if (row.status === newStatus) return
      const hadRank = row.priorityOrder != null

      applyLocalVideos(setVideos, (prev) => {
        let next = prev
        if (newStatus === 'Deactivated' && hadRank) {
          const result = mockRemoveRank(prev, row.id, true)
          next = result?.videos ?? prev
        }
        return next.map((v) =>
          v.id === row.id ? normalizeYoutubeVideo({ ...v, status: newStatus }) : v,
        )
      })

      try {
        if (newStatus === 'Deactivated' && hadRank) {
          await removeYoutubeRank(row.id, true)
        }
        await updateYoutubeVideo(row.id, { status: newStatus })
      } catch {
        await syncFromStore()
        toast.error('Failed to update status')
        throw new Error('status update failed')
      }
    },
    [syncFromStore],
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
      reorderVideos,
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
      reorderVideos,
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
