import { isFrontendOnly } from '../config/appMode'
import api from './axiosInstance'
import { INITIAL_YOUTUBE_VIDEOS } from '../data/websiteData'
import {
  applyExpiredPriorityCleanup,
  normalizeYoutubeVideo,
  sortYoutubeVideos,
} from '../utils/youtubeVideoPriority'
import {
  mockAssignRank,
  mockRemoveRank,
  mockReorderRanks,
  mockRecalculateRanks,
} from '../utils/youtubeRankMock'

const USE_MOCK = isFrontendOnly || import.meta.env.VITE_YOUTUBE_USE_MOCK !== 'false'

let mockStore = applyExpiredPriorityCleanup(
  INITIAL_YOUTUBE_VIDEOS.map((row, i) =>
    normalizeYoutubeVideo({
      ...row,
      priorityOrder: i < 8 ? i + 1 : null,
      customOrder: i,
      createdAt: row.createdAt || new Date(Date.now() - i * 86400000).toISOString(),
    }),
  ),
)

function syncMockStore(next) {
  mockStore = sortYoutubeVideos(applyExpiredPriorityCleanup(next))
  return mockStore
}

function mockPayload(extra = {}) {
  return { videos: mockStore, ...extra }
}

async function tryApi(fn, fallback) {
  if (USE_MOCK) return fallback()
  try {
    const res = await fn()
    return res.data?.data ?? res.data
  } catch {
    return fallback()
  }
}

export async function fetchYoutubeVideos(params = {}) {
  return tryApi(
    () => api.get('/youtube-videos', { params }),
    () => {
      let rows = [...mockStore]
      const q = params.search?.trim().toLowerCase()
      if (q) {
        rows = rows.filter(
          (r) =>
            r.id.includes(q) ||
            r.name.toLowerCase().includes(q) ||
            r.url.toLowerCase().includes(q),
        )
      }
      if (params.status && params.status !== 'all') {
        rows = rows.filter((r) => r.status === params.status)
      }
      if (params.dateBucket && params.dateBucket !== 'all') {
        rows = rows.filter((r) => r.dateBucket === params.dateBucket)
      }
      if (params.priority === 'none') rows = rows.filter((r) => !r.priorityOrder)
      else if (params.priority === 'ranked') rows = rows.filter((r) => r.priorityOrder)
      else if (params.priority === 'top') {
        const topN = Math.max(1, Number(params.topN) || 10)
        rows = rows.filter((r) => r.priorityOrder && r.priorityOrder <= topN)
      }
      if (params.priorityMin) {
        const min = Number(params.priorityMin)
        rows = rows.filter((v) => v.priorityOrder && v.priorityOrder >= min)
      }
      if (params.priorityMax) {
        const max = Number(params.priorityMax)
        rows = rows.filter((v) => v.priorityOrder && v.priorityOrder <= max)
      }
      return sortYoutubeVideos(rows)
    },
  )
}

export async function fetchRankedYoutubeVideos() {
  return tryApi(
    () => api.get('/youtube-videos/rank/ranked'),
    () => mockStore.filter((v) => v.priorityOrder).sort((a, b) => a.priorityOrder - b.priorityOrder),
  )
}

export async function assignYoutubeRank(videoId, priorityOrder, options = {}) {
  const { allowGaps = false } = options
  return tryApi(
    () => api.post('/youtube-videos/rank/assign', { videoId, priorityOrder, allowGaps }),
    () => {
      const result = mockAssignRank(mockStore, videoId, priorityOrder, { allowGaps })
      if (!result) return null
      syncMockStore(result.videos)
      return mockPayload({ message: result.message })
    },
  )
}

export async function removeYoutubeRank(videoId, autoCompact = true) {
  return tryApi(
    () => api.post('/youtube-videos/rank/remove', { videoId, autoCompact }),
    () => {
      const result = mockRemoveRank(mockStore, videoId, autoCompact)
      syncMockStore(result.videos)
      return mockPayload({ message: result.message })
    },
  )
}

export async function reorderYoutubeRanks(orderedIds) {
  return tryApi(
    () => api.post('/youtube-videos/rank/reorder', { orderedIds }),
    () => {
      const result = mockReorderRanks(mockStore, orderedIds)
      syncMockStore(result.videos)
      return mockPayload({ message: result.message })
    },
  )
}

export async function recalculateYoutubeRanks() {
  return tryApi(
    () => api.post('/youtube-videos/rank/recalculate'),
    () => {
      const result = mockRecalculateRanks(mockStore)
      syncMockStore(result.videos)
      return mockPayload({ message: result.message })
    },
  )
}

export const assignYoutubePriority = assignYoutubeRank
export const removeYoutubePriority = removeYoutubeRank
export const swapYoutubePriority = assignYoutubeRank

export async function createYoutubeVideo(payload) {
  return tryApi(
    () => api.post('/youtube-videos', payload),
    () => {
      const rank = payload.priorityOrder ?? (payload.priorityLevel > 0 ? payload.priorityLevel : null)
      const row = normalizeYoutubeVideo({
        ...payload,
        priorityOrder: null,
        priorityLevel: 0,
        createdAt: new Date().toISOString(),
      })
      syncMockStore([row, ...mockStore])
      if (rank) return assignYoutubeRank(row.id, rank)
      return { ...row, videos: mockStore }
    },
  )
}

export async function updateYoutubeVideo(id, payload) {
  return tryApi(
    () => api.put(`/youtube-videos/${id}`, payload),
    () => {
      const rank =
        payload.priorityOrder !== undefined
          ? payload.priorityOrder || null
          : payload.priorityLevel > 0
            ? payload.priorityLevel
            : payload.priorityLevel === 0
              ? null
              : undefined
      if (rank !== undefined) {
        if (rank) return assignYoutubeRank(id, rank)
        return removeYoutubeRank(id, payload.autoCompact !== false)
      }
      const idx = mockStore.findIndex((v) => v.id === id)
      if (idx < 0) return null
      const updated = normalizeYoutubeVideo({ ...mockStore[idx], ...payload })
      const next = [...mockStore]
      next[idx] = updated
      syncMockStore(next)
      return updated
    },
  )
}

export async function deleteYoutubeVideo(id) {
  return tryApi(
    () => api.delete(`/youtube-videos/${id}`),
    () => {
      const target = mockStore.find((v) => v.id === id)
      let next = mockStore.filter((v) => v.id !== id)
      if (target?.priorityOrder) {
        const removed = target.priorityOrder
        next = next.map((v) => {
          if (v.priorityOrder != null && v.priorityOrder > removed) {
            return {
              ...v,
              priorityOrder: v.priorityOrder - 1,
              priorityLevel: v.priorityOrder - 1,
              isPinned: v.priorityOrder - 1 === 1,
            }
          }
          return v
        })
      }
      syncMockStore(next)
      return { success: true }
    },
  )
}

export async function updateYoutubeVideoPriority(id, payload) {
  const rank = payload?.priorityOrder ?? payload?.priorityLevel
  if (rank > 0) return assignYoutubeRank(id, rank)
  return removeYoutubeRank(id, payload?.autoCompact !== false)
}

export async function reorderYoutubeVideos(orderedIds) {
  return tryApi(
    () => api.post('/youtube-videos/reorder', { orderedIds }),
    () => {
      const orderMap = new Map(orderedIds.map((id, i) => [id, i]))
      const next = mockStore.map((v) => ({
        ...v,
        customOrder: orderMap.has(v.id) ? orderMap.get(v.id) : v.customOrder,
      }))
      syncMockStore(next)
      return mockStore
    },
  )
}

export async function fetchPinnedYoutubeVideos() {
  return mockStore.filter((v) => v.priorityOrder === 1)
}
