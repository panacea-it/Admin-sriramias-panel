import { YOUTUBE_RANKED_LEVELS } from '../constants/youtubeVideoConstants'
import {
  buildPrioritySlotsMap,
  normalizeYoutubeVideo,
  sortYoutubeVideos,
} from './youtubeVideoPriority'

export function mockAssignPriority(store, videoId, targetLevel, mode = 'replace') {
  const next = store.map((v) => ({ ...v }))
  const target = next.find((v) => v.id === videoId)
  if (!target) return null

  const occupant = next.find((v) => v.priorityLevel === targetLevel && v.id !== videoId)
  const prevLevel = target.priorityLevel

  if (occupant) {
    if (mode === 'swap' && YOUTUBE_RANKED_LEVELS.includes(prevLevel)) {
      occupant.priorityLevel = prevLevel
      occupant.isPinned = prevLevel === 1
    } else {
      occupant.priorityLevel = 0
      occupant.isPinned = false
    }
  }

  target.priorityLevel = targetLevel
  target.isPinned = targetLevel === 1

  const sorted = sortYoutubeVideos(next.map(normalizeYoutubeVideo))
  return {
    videos: sorted,
    slots: buildPrioritySlotsMap(sorted),
    message:
      mode === 'swap' && occupant
        ? 'Priority positions swapped'
        : `Priority ${targetLevel} reassigned successfully`,
  }
}

export function mockRemovePriority(store, videoId, autoShift = false) {
  const next = store.map((v) => ({ ...v }))
  const target = next.find((v) => v.id === videoId)
  if (!target) return null

  const removed = target.priorityLevel
  target.priorityLevel = 0
  target.isPinned = false

  if (autoShift && YOUTUBE_RANKED_LEVELS.includes(removed)) {
    if (removed === 1) {
      const p2 = next.find((v) => v.priorityLevel === 2)
      const p3 = next.find((v) => v.priorityLevel === 3)
      if (p2) {
        p2.priorityLevel = 1
        p2.isPinned = true
      }
      if (p3) {
        p3.priorityLevel = 2
        p3.isPinned = false
      }
    } else if (removed === 2) {
      const p3 = next.find((v) => v.priorityLevel === 3)
      if (p3) {
        p3.priorityLevel = 2
        p3.isPinned = false
      }
    }
  }

  const sorted = sortYoutubeVideos(next.map(normalizeYoutubeVideo))
  return {
    videos: sorted,
    slots: buildPrioritySlotsMap(sorted),
    message: autoShift
      ? 'Priority removed and positions shifted up'
      : 'Priority removed successfully',
  }
}
