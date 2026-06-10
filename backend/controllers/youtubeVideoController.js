import YoutubeVideo from '../models/YoutubeVideo.js'
import {
  assignRank,
  removeRank,
  reorderRanks,
  recalculateRanks,
  shiftRanks,
  fetchRankedVideos,
  getOccupantAtRank,
  normalizeRankInput,
} from '../services/youtubeRankService.js'

function resolvePriorityOrder(doc) {
  const o = doc.toObject ? doc.toObject() : doc
  if (o.priorityOrder != null && o.priorityOrder >= 1) return o.priorityOrder
  if (o.priorityLevel > 0) return o.priorityLevel
  return null
}

function readRankFromBody(body) {
  if (body?.priorityOrder != null) return normalizeRankInput(body.priorityOrder)
  if (body?.priorityLevel > 0) return normalizeRankInput(body.priorityLevel)
  if (body?.priorityLevel === 0 || body?.priorityOrder === 0) return null
  return undefined
}

async function listAllSorted() {
  await clearExpiredPriorities()
  const docs = await YoutubeVideo.find().lean()
  return docs.map((d) => toClientRow(d)).sort(compareVideos)
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function formatDisplayDate(value) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function formatDisplayTime(value) {
  if (!value) return '10 AM'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '10 AM'
  let hours = d.getHours()
  const minutes = d.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  const minPart = minutes ? `:${String(minutes).padStart(2, '0')}` : ''
  return `${hours}${minPart} ${ampm}`
}

function applyExpiry(doc) {
  const o = doc.toObject ? doc.toObject() : { ...doc }
  if (o.priorityExpiryDate && new Date(o.priorityExpiryDate) < new Date()) {
    o.priorityOrder = null
    o.priorityLevel = 0
    o.isPinned = false
  }
  return o
}

function toClientRow(doc) {
  if (!doc) return null
  const o = applyExpiry(doc)
  const createdAt = o.createdAt || new Date()
  const priorityOrder = resolvePriorityOrder(o)
  return {
    id: o.videoId,
    name: o.name,
    url: o.url,
    status: o.status,
    priorityOrder,
    priorityLevel: priorityOrder ?? 0,
    isFeatured: Boolean(o.isFeatured),
    isPinned: priorityOrder === 1,
    customOrder: o.customOrder ?? 0,
    priorityExpiryDate: o.priorityExpiryDate
      ? new Date(o.priorityExpiryDate).toISOString().slice(0, 10)
      : null,
    analyticsLabels: o.analyticsLabels || [],
    time: o.displayTime || formatDisplayTime(createdAt),
    date: o.displayDate || formatDisplayDate(createdAt),
    dateBucket: o.dateBucket || 'Today',
    createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
  }
}

function buildFilter(query) {
  const filter = {}
  const and = []

  if (query.status && query.status !== 'all') {
    filter.status = query.status
  }
  if (query.dateBucket && query.dateBucket !== 'all') {
    filter.dateBucket = query.dateBucket
  }
  if (query.priority && query.priority !== 'all') {
    if (query.priority === 'none') {
      and.push({ $or: [{ priorityOrder: null }, { priorityOrder: { $exists: false } }] })
    } else if (query.priority === 'ranked') {
      filter.priorityOrder = { $ne: null, $gte: 1 }
    } else if (query.priority === 'top') {
      const topN = Math.max(1, Number(query.topN) || 10)
      filter.priorityOrder = { $gte: 1, $lte: topN }
    } else {
      const level = Number(query.priority)
      if (level >= 1) filter.priorityOrder = level
    }
  }
  if (query.priorityMin || query.priorityMax) {
    const range = {}
    if (query.priorityMin) range.$gte = Math.max(1, Number(query.priorityMin))
    if (query.priorityMax) range.$lte = Math.max(1, Number(query.priorityMax))
    const existing = filter.priorityOrder
    if (existing == null) {
      filter.priorityOrder = range
    } else if (typeof existing === 'number') {
      filter.priorityOrder = { $eq: existing, ...range }
    } else if (typeof existing === 'object' && !Array.isArray(existing)) {
      filter.priorityOrder = { ...existing, ...range }
    }
  }
  if (query.search?.trim()) {
    const q = escapeRegex(query.search.trim())
    const regex = new RegExp(q, 'i')
    and.push({ $or: [{ name: regex }, { url: regex }, { videoId: regex }] })
  }
  if (and.length) {
    filter.$and = [...(filter.$and || []), ...and]
  }
  return filter
}

function compareVideos(a, b) {
  const pa = a.priorityOrder ?? 999999
  const pb = b.priorityOrder ?? 999999
  if (pa !== pb) return pa - pb
  if (a.customOrder !== b.customOrder) return a.customOrder - b.customOrder
  return new Date(b.createdAt) - new Date(a.createdAt)
}

async function clearExpiredPriorities() {
  const now = new Date()
  const expired = await YoutubeVideo.find({
    priorityOrder: { $ne: null },
    priorityExpiryDate: { $ne: null, $lt: now },
  }).lean()
  for (const doc of expired) {
    await removeRank(doc.videoId, { autoCompact: true })
  }
}

function nextVideoId() {
  return String(56565 + Math.floor(Math.random() * 90000))
}

export async function listVideos(req, res, next) {
  try {
    await clearExpiredPriorities()
    const docs = await YoutubeVideo.find(buildFilter(req.query)).lean()
    const rows = docs.map((d) => toClientRow(d)).sort(compareVideos)
    res.json({ success: true, data: rows, total: rows.length })
  } catch (err) {
    next(err)
  }
}

export async function getPinnedVideos(req, res, next) {
  try {
    await clearExpiredPriorities()
    const docs = await YoutubeVideo.find({ priorityOrder: 1 }).lean()
    const rows = docs.map((d) => toClientRow(d)).sort(compareVideos)
    res.json({ success: true, data: rows })
  } catch (err) {
    next(err)
  }
}

export async function createVideo(req, res, next) {
  try {
    const body = req.body || {}
    const targetRank = readRankFromBody(body)
    const videoId = body.id?.trim() || nextVideoId()
    await YoutubeVideo.create({
      videoId,
      name: body.name?.trim(),
      url: body.url?.trim(),
      status: body.status || 'Active',
      priorityOrder: null,
      priorityLevel: 0,
      isFeatured: Boolean(body.isFeatured),
      isPinned: false,
      customOrder: Number(body.customOrder) || 0,
      priorityExpiryDate: body.priorityExpiryDate
        ? new Date(body.priorityExpiryDate)
        : null,
      analyticsLabels: body.analyticsLabels || [],
      dateBucket: body.dateBucket || 'Today',
      displayTime: body.time,
      displayDate: body.date,
    })
    if (targetRank) {
      await assignRank(videoId, targetRank, { allowGaps: body.allowGaps === true })
    }
    const fresh = await YoutubeVideo.findOne({ videoId }).lean()
    res.status(201).json({ success: true, data: toClientRow(fresh) })
  } catch (err) {
    next(err)
  }
}

export async function updateVideo(req, res, next) {
  try {
    const body = req.body || {}
    const updates = {}
    if (body.name !== undefined) updates.name = body.name?.trim()
    if (body.url !== undefined) updates.url = body.url?.trim()
    if (body.status !== undefined) updates.status = body.status
    if (body.dateBucket !== undefined) updates.dateBucket = body.dateBucket
    if (body.time !== undefined) updates.displayTime = body.time
    if (body.date !== undefined) updates.displayDate = body.date
    if (body.isFeatured !== undefined) updates.isFeatured = Boolean(body.isFeatured)
    if (body.analyticsLabels !== undefined) updates.analyticsLabels = body.analyticsLabels
    if (body.customOrder !== undefined) updates.customOrder = Number(body.customOrder) || 0
    if (body.priorityExpiryDate !== undefined) {
      updates.priorityExpiryDate = body.priorityExpiryDate
        ? new Date(body.priorityExpiryDate)
        : null
    }
    const doc = await YoutubeVideo.findOne({ videoId: req.params.id })
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Video not found' })
    }

    const targetRank = readRankFromBody(body)
    if (targetRank !== undefined) {
      if (targetRank) {
        await assignRank(req.params.id, targetRank, { allowGaps: body.allowGaps === true })
      }
      else await removeRank(req.params.id, { autoCompact: body.autoCompact !== false })
    }

    if (Object.keys(updates).length > 0) {
      await YoutubeVideo.updateOne({ videoId: req.params.id }, { $set: updates })
    }

    const fresh = await YoutubeVideo.findOne({ videoId: req.params.id }).lean()
    res.json({ success: true, data: toClientRow(fresh) })
  } catch (err) {
    next(err)
  }
}

export async function deleteVideo(req, res, next) {
  try {
    const doc = await YoutubeVideo.findOneAndDelete({ videoId: req.params.id })
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Video not found' })
    }
    res.json({ success: true, message: 'Video deleted' })
  } catch (err) {
    next(err)
  }
}

export async function getRankedVideos(req, res, next) {
  try {
    await clearExpiredPriorities()
    const docs = await fetchRankedVideos()
    const rows = docs.map((d) => toClientRow(d))
    res.json({ success: true, data: rows, total: rows.length })
  } catch (err) {
    next(err)
  }
}

export async function getPrioritySlots(req, res, next) {
  return getRankedVideos(req, res, next)
}

export async function checkPriorityConflict(req, res, next) {
  try {
    const rank =
      normalizeRankInput(req.query?.priorityOrder) ??
      normalizeRankInput(req.query?.priorityLevel)
    const videoId = req.query?.videoId
    if (!rank) {
      return res.json({ success: true, data: { conflict: false, occupant: null } })
    }
    const occupant = await getOccupantAtRank(rank, videoId)
    res.json({
      success: true,
      data: {
        conflict: Boolean(occupant),
        occupant: occupant ? toClientRow(occupant) : null,
        priorityOrder: rank,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function assignRankHandler(req, res, next) {
  try {
    const { videoId, priorityOrder, priorityLevel } = req.body || {}
    const rank = normalizeRankInput(priorityOrder ?? priorityLevel)
    if (!rank) {
      return res.status(400).json({ success: false, message: 'Invalid priority rank' })
    }
    const result = await assignRank(videoId, rank, {
      allowGaps: req.body?.allowGaps === true,
    })
    const videos = await listAllSorted()
    res.json({ success: true, data: { ...result, videos } })
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, message: err.message })
    }
    next(err)
  }
}

export const assignPriorityHandler = assignRankHandler
export const replacePriorityHandler = assignRankHandler

export async function shiftRanksHandler(req, res, next) {
  try {
    const { fromRank, delta } = req.body || {}
    const result = await shiftRanks(fromRank, delta)
    const videos = await listAllSorted()
    res.json({ success: true, data: { ...result, videos } })
  } catch (err) {
    next(err)
  }
}

export async function recalculateRanksHandler(req, res, next) {
  try {
    const result = await recalculateRanks()
    const videos = await listAllSorted()
    res.json({ success: true, data: { ...result, videos } })
  } catch (err) {
    next(err)
  }
}

export async function reorderPrioritiesHandler(req, res, next) {
  try {
    const orderedIds = req.body?.orderedIds
    const result = await reorderRanks(orderedIds)
    const videos = await listAllSorted()
    res.json({ success: true, data: { ...result, videos } })
  } catch (err) {
    next(err)
  }
}

export const swapPrioritiesHandler = reorderPrioritiesHandler

export async function removeRankHandler(req, res, next) {
  try {
    const videoId = req.body?.videoId || req.params.id
    const result = await removeRank(videoId, {
      autoCompact: req.body?.autoCompact !== false,
    })
    const videos = await listAllSorted()
    res.json({ success: true, data: { ...result, videos } })
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, message: err.message })
    }
    next(err)
  }
}

export const removePriorityHandler = removeRankHandler

export async function updateVideoPriority(req, res, next) {
  try {
    const rank = readRankFromBody(req.body)
    if (rank === undefined && req.body?.priorityLevel == null && req.body?.priorityOrder == null) {
      return res.status(400).json({ success: false, message: 'Invalid priority rank' })
    }
    let result
    if (rank) {
      result = await assignRank(req.params.id, rank, { allowGaps: req.body?.allowGaps === true })
    } else {
      result = await removeRank(req.params.id, { autoCompact: req.body?.autoCompact !== false })
    }

    const doc = await YoutubeVideo.findOne({ videoId: req.params.id }).lean()
    const videos = await listAllSorted()
    res.json({
      success: true,
      data: toClientRow(doc),
      message: result.message,
      videos,
    })
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, message: err.message })
    }
    next(err)
  }
}

export async function reorderVideos(req, res, next) {
  try {
    const orderedIds = Array.isArray(req.body?.orderedIds) ? req.body.orderedIds : []
    if (!orderedIds.length) {
      return res.status(400).json({ success: false, message: 'orderedIds is required' })
    }
    await Promise.all(
      orderedIds.map((id, index) =>
        YoutubeVideo.updateOne({ videoId: String(id) }, { $set: { customOrder: index } }),
      ),
    )
    const docs = await YoutubeVideo.find({ videoId: { $in: orderedIds.map(String) } }).lean()
    const rows = docs.map((d) => toClientRow(d)).sort(compareVideos)
    res.json({ success: true, data: rows })
  } catch (err) {
    next(err)
  }
}

export async function seedVideosIfEmpty(req, res, next) {
  try {
    const count = await YoutubeVideo.countDocuments()
    if (count > 0) {
      return res.json({ success: true, message: 'Already seeded', count })
    }
    const seed = Array.from({ length: 18 }, (_, i) => ({
      videoId: String(56565 + i),
      name: 'UPSC Preparation Youtube',
      url: 'www.upscpreaparationvideo.com',
      status: i % 3 === 0 ? 'Inactive' : 'Active',
      priorityOrder: i < 6 ? i + 1 : null,
      priorityLevel: 0,
      isFeatured: i < 2,
      isPinned: i === 0,
      customOrder: i,
      dateBucket: i < 6 ? 'Today' : i < 12 ? 'This Week' : 'This Month',
      displayTime: '10 AM',
      displayDate: '14 May 2026',
      analyticsLabels:
        i === 0 ? ['Featured', 'Trending'] : i === 1 ? ['Most Watched'] : [],
    }))
    await YoutubeVideo.insertMany(seed)
    res.status(201).json({ success: true, count: seed.length })
  } catch (err) {
    next(err)
  }
}
