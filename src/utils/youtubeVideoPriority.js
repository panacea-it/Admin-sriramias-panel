import { YOUTUBE_RANK_VISUAL } from '../constants/youtubeVideoConstants'

export function normalizeRankInput(value) {
  if (value == null || value === '' || value === 0 || value === '0') return null
  const n = Math.round(Number(value))
  if (!Number.isFinite(n) || n < 1) return null
  return n
}

export function resolvePriorityOrder(row) {
  if (!row) return null
  if (row.priorityOrder != null && row.priorityOrder >= 1) return row.priorityOrder
  if (row.priorityLevel > 0) return row.priorityLevel
  return null
}

export function extractYoutubeVideoId(url = '') {
  const raw = String(url).trim()
  if (!raw) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/i,
    /youtube\.com\/shorts\/([\w-]{11})/i,
  ]
  for (const pattern of patterns) {
    const match = raw.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

export function youtubeThumbnailUrl(url) {
  const id = extractYoutubeVideoId(url)
  if (id) return `https://img.youtube.com/vi/${id}/mqdefault.jpg`
  return null
}

export function isPriorityExpired(priorityExpiryDate) {
  if (!priorityExpiryDate) return false
  const expiry = new Date(priorityExpiryDate)
  if (Number.isNaN(expiry.getTime())) return false
  return expiry < new Date()
}

export function normalizeYoutubeVideo(row) {
  if (!row) return null
  let priorityOrder = resolvePriorityOrder(row)
  if (isPriorityExpired(row.priorityExpiryDate)) {
    priorityOrder = null
  }
  const createdAt =
    row.createdAt ||
    (row.date ? new Date(`${row.date} ${row.time || '10:00'}`).toISOString() : new Date().toISOString())

  return {
    ...row,
    priorityOrder,
    priorityLevel: priorityOrder ?? 0,
    customOrder: Number(row.customOrder) || 0,
    priorityExpiryDate: row.priorityExpiryDate || null,
    createdAt,
  }
}

export function normalizeYoutubeVideos(videos) {
  return (videos || []).map(normalizeYoutubeVideo).filter(Boolean)
}

export function applyExpiredPriorityCleanup(videos) {
  return normalizeYoutubeVideos(videos).map((v) =>
    isPriorityExpired(v.priorityExpiryDate)
      ? { ...v, priorityOrder: null, priorityLevel: 0, isPinned: false }
      : v,
  )
}

export function sortYoutubeVideos(videos) {
  return [...videos].sort((a, b) => {
    const pa = a.priorityOrder ?? 999999
    const pb = b.priorityOrder ?? 999999
    if (pa !== pb) return pa - pb
    if (a.customOrder !== b.customOrder) return a.customOrder - b.customOrder
    return new Date(b.createdAt) - new Date(a.createdAt)
  })
}

export function getRankedVideos(videos) {
  return (videos || [])
    .filter((v) => v.priorityOrder != null && v.status !== 'Deactivated')
    .sort((a, b) => a.priorityOrder - b.priorityOrder)
}

export function findRankOccupant(videos, rank, excludeId = null) {
  const r = normalizeRankInput(rank)
  if (!r) return null
  return (videos || []).find((v) => v.priorityOrder === r && v.id !== excludeId) ?? null
}

export function getRankLabel(order) {
  const r = normalizeRankInput(order)
  if (!r) return 'Unranked'
  return `#${r}`
}

export function isRanked(video) {
  return video?.priorityOrder != null && video.priorityOrder >= 1
}

export function getRankBadgeClass(order) {
  const r = normalizeRankInput(order)
  if (!r) return 'bg-[#f3f4f6] text-[#6b7280] ring-1 ring-[#e5e7eb]'
  if (r <= YOUTUBE_RANK_VISUAL.goldMax) {
    return 'bg-gradient-to-br from-amber-50 to-yellow-100 text-amber-900 ring-1 ring-amber-300/80 shadow-[0_0_12px_rgba(251,191,36,0.25)]'
  }
  if (r <= YOUTUBE_RANK_VISUAL.silverMax) {
    return 'bg-gradient-to-br from-slate-50 to-slate-200 text-slate-700 ring-1 ring-slate-300/80 shadow-[0_0_10px_rgba(148,163,184,0.2)]'
  }
  return 'bg-[#eff6ff] text-[#2563eb] ring-1 ring-[#bfdbfe]'
}

export function getRankRowClassName(priorityOrder) {
  const base =
    'transition-all duration-300 ease-out hover:scale-[1.006] hover:shadow-md hover:z-[1] relative'
  const r = normalizeRankInput(priorityOrder)
  if (!r) return base
  if (r <= YOUTUBE_RANK_VISUAL.goldMax) {
    return `${base} border-l-4 border-l-amber-500 shadow-[0_4px_20px_rgba(245,158,11,0.22)]`
  }
  if (r <= YOUTUBE_RANK_VISUAL.silverMax) {
    return `${base} border-l-4 border-l-slate-400 shadow-[0_4px_16px_rgba(148,163,184,0.2)]`
  }
  return `${base} border-l-4 border-l-[#3b82f6] shadow-[0_4px_12px_rgba(59,130,246,0.15)]`
}

export function filterVideosByPriority(videos, filter, range = {}) {
  let rows = videos || []
  if (filter === 'none') return rows.filter((v) => !v.priorityOrder)
  if (filter === 'ranked') return rows.filter((v) => v.priorityOrder != null)
  if (filter === 'top') return rows.filter((v) => v.priorityOrder != null && v.priorityOrder <= 10)
  if (filter && filter !== 'all') {
    const n = Number(filter)
    if (n >= 1) return rows.filter((v) => v.priorityOrder === n)
  }
  if (range.min != null && range.min !== '') {
    const min = Number(range.min)
    rows = rows.filter((v) => v.priorityOrder == null || v.priorityOrder >= min)
  }
  if (range.max != null && range.max !== '') {
    const max = Number(range.max)
    rows = rows.filter((v) => v.priorityOrder == null || v.priorityOrder <= max)
  }
  return rows
}

/** @deprecated */
export const priorityLevelFromType = (v) => normalizeRankInput(v) ?? 0
export const isRankedPriority = isRanked
export const getPriorityLabel = getRankLabel
export const getPriorityBadgeClass = getRankBadgeClass
export const getPriorityRowClassName = getRankRowClassName
export const buildPrioritySlotsMap = () => ({})
export const findSlotOccupant = findRankOccupant
