import { normalizeYoutubeVideo, sortYoutubeVideos } from './youtubeVideoPriority'

export function normalizeRankInput(value) {
  if (value == null || value === '' || value === 0 || value === '0') return null
  const n = Math.round(Number(value))
  if (!Number.isFinite(n) || n < 1) return null
  return n
}

function clearVideoRankInStore(store, videoId) {
  const next = store.map((v) => ({ ...v }))
  const video = next.find((v) => v.id === videoId)
  if (!video?.priorityOrder) return next
  const oldRank = video.priorityOrder
  video.priorityOrder = null
  video.priorityLevel = 0
  video.isPinned = false
  for (const v of next) {
    if (v.priorityOrder != null && v.priorityOrder > oldRank) {
      v.priorityOrder -= 1
      v.priorityLevel = v.priorityOrder
      v.isPinned = v.priorityOrder === 1
    }
  }
  return next
}

export function mockAssignRank(store, videoId, targetRank, options = {}) {
  const rank = normalizeRankInput(targetRank)
  if (!rank) return null
  const { allowGaps = false } = options
  let next = store.map((v) => ({ ...v }))
  const video = next.find((v) => v.id === videoId)
  if (!video) return null

  if (allowGaps) {
    const occupant = next.find((v) => v.id !== videoId && v.priorityOrder === rank)
    const oldRank = video.priorityOrder ?? null
    if (occupant) {
      occupant.priorityOrder = oldRank
      occupant.priorityLevel = oldRank ?? 0
      occupant.isPinned = oldRank === 1
    }
    video.priorityOrder = rank
    video.priorityLevel = rank
    video.isPinned = rank === 1
  } else {
    next = clearVideoRankInStore(next, videoId)
    next = next.map((v) => {
      if (v.id === videoId) return v
      if (v.priorityOrder != null && v.priorityOrder >= rank) {
        return {
          ...v,
          priorityOrder: v.priorityOrder + 1,
          priorityLevel: v.priorityOrder + 1,
          isPinned: v.priorityOrder + 1 === 1,
        }
      }
      return v
    })
    const target = next.find((v) => v.id === videoId)
    if (target) {
      target.priorityOrder = rank
      target.priorityLevel = rank
      target.isPinned = rank === 1
    }
  }
  const sorted = sortYoutubeVideos(next.map(normalizeYoutubeVideo))
  return {
    videos: sorted,
    message: 'Priority rank updated successfully',
  }
}

export function mockRemoveRank(store, videoId, autoCompact = true) {
  let next = store.map((v) => ({ ...v }))
  const video = next.find((v) => v.id === videoId)
  if (!video?.priorityOrder) {
    return { videos: sortYoutubeVideos(next.map(normalizeYoutubeVideo)), message: 'Priority removed successfully' }
  }
  const removed = video.priorityOrder
  video.priorityOrder = null
  video.priorityLevel = 0
  video.isPinned = false
  if (autoCompact) {
    for (const v of next) {
      if (v.priorityOrder != null && v.priorityOrder > removed) {
        v.priorityOrder -= 1
        v.priorityLevel = v.priorityOrder
        v.isPinned = v.priorityOrder === 1
      }
    }
  }
  return {
    videos: sortYoutubeVideos(next.map(normalizeYoutubeVideo)),
    message: 'Priority removed successfully',
  }
}

export function mockReorderRanks(store, orderedIds) {
  let next = store.map((v) => ({ ...v }))
  orderedIds.forEach((id, index) => {
    const v = next.find((x) => x.id === String(id))
    if (v) {
      v.priorityOrder = index + 1
      v.priorityLevel = index + 1
      v.isPinned = index === 0
    }
  })
  return {
    videos: sortYoutubeVideos(next.map(normalizeYoutubeVideo)),
    message: 'Priority list reordered',
  }
}

export function mockRecalculateRanks(store) {
  const ranked = store
    .filter((v) => v.priorityOrder != null)
    .sort((a, b) => a.priorityOrder - b.priorityOrder)
  const next = store.map((v) => ({ ...v }))
  ranked.forEach((v, i) => {
    const row = next.find((x) => x.id === v.id)
    if (row) {
      row.priorityOrder = i + 1
      row.priorityLevel = i + 1
      row.isPinned = i === 0
    }
  })
  return {
    videos: sortYoutubeVideos(next.map(normalizeYoutubeVideo)),
    message: 'Ranks recalculated successfully',
  }
}
