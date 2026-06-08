import mongoose from 'mongoose'
import YoutubeVideo from '../models/YoutubeVideo.js'

const RANKED = [1, 2, 3]

function syncPinned(level) {
  return level === 1
}

function toRow(doc) {
  if (!doc) return null
  const o = doc.toObject ? doc.toObject() : doc
  return {
    id: o.videoId,
    name: o.name,
    url: o.url,
    status: o.status,
    priorityLevel: o.priorityLevel ?? 0,
    isPinned: syncPinned(o.priorityLevel ?? 0),
  }
}

async function runWithOptionalTransaction(fn) {
  const session = await mongoose.startSession()
  try {
    let result
    await session.withTransaction(async () => {
      result = await fn(session)
    })
    return result
  } catch (err) {
    if (err?.message?.includes('Transaction') || err?.code === 20) {
      return fn(null)
    }
    throw err
  } finally {
    session.endSession()
  }
}

export async function fetchPrioritySlots() {
  const docs = await YoutubeVideo.find({ priorityLevel: { $in: RANKED } }).lean()
  const slots = { 1: null, 2: null, 3: null }
  for (const d of docs) {
    if (RANKED.includes(d.priorityLevel)) {
      slots[d.priorityLevel] = toRow(d)
    }
  }
  return slots
}

/**
 * @param {'replace'|'swap'} mode
 */
export async function assignPriority(videoId, targetLevel, options = {}) {
  const { mode = 'replace' } = options
  if (!RANKED.includes(targetLevel)) {
    throw Object.assign(new Error('Invalid priority slot'), { statusCode: 400 })
  }

  const apply = async (session) => {
    const q = (filter) =>
      session
        ? YoutubeVideo.findOne(filter).session(session)
        : YoutubeVideo.findOne(filter)

    const target = await q({ videoId: String(videoId) })
    if (!target) {
      throw Object.assign(new Error('Video not found'), { statusCode: 404 })
    }

    const occupant = await q({
      priorityLevel: targetLevel,
      videoId: { $ne: String(videoId) },
    })

    const prevLevel = target.priorityLevel
    const updates = []

    if (occupant) {
      if (mode === 'swap' && RANKED.includes(prevLevel)) {
        occupant.priorityLevel = prevLevel
        occupant.isPinned = syncPinned(prevLevel)
      } else {
        occupant.priorityLevel = 0
        occupant.isPinned = false
      }
      await (session ? occupant.save({ session }) : occupant.save())
      updates.push(toRow(occupant))
    }

    target.priorityLevel = targetLevel
    target.isPinned = syncPinned(targetLevel)
    await (session ? target.save({ session }) : target.save())
    updates.push(toRow(target))

    const slots = await fetchPrioritySlots()
    return {
      slots,
      videos: updates,
      message:
        mode === 'swap' && occupant
          ? 'Priority positions swapped'
          : `Priority ${targetLevel} reassigned successfully`,
    }
  }

  return runWithOptionalTransaction(apply)
}

export async function swapPriorities(videoIdA, videoIdB) {
  const apply = async (session) => {
    const q = (filter) =>
      session
        ? YoutubeVideo.findOne(filter).session(session)
        : YoutubeVideo.findOne(filter)

    const a = await q({ videoId: String(videoIdA) })
    const b = await q({ videoId: String(videoIdB) })
    if (!a || !b) {
      throw Object.assign(new Error('Video not found'), { statusCode: 404 })
    }

    const levelA = a.priorityLevel
    const levelB = b.priorityLevel

    a.priorityLevel = levelB
    a.isPinned = syncPinned(levelB)
    b.priorityLevel = levelA
    b.isPinned = syncPinned(levelA)

    await (session ? a.save({ session }) : a.save())
    await (session ? b.save({ session }) : b.save())

    return {
      slots: await fetchPrioritySlots(),
      message: 'Priority positions swapped',
    }
  }

  return runWithOptionalTransaction(apply)
}

export async function removePriority(videoId, options = {}) {
  const { autoShift = false } = options

  const apply = async (session) => {
    const q = (filter) =>
      session
        ? YoutubeVideo.findOne(filter).session(session)
        : YoutubeVideo.findOne(filter)

    const video = await q({ videoId: String(videoId) })
    if (!video) {
      throw Object.assign(new Error('Video not found'), { statusCode: 404 })
    }

    const removed = video.priorityLevel
    if (!RANKED.includes(removed)) {
      return { slots: await fetchPrioritySlots(), message: 'Priority removed successfully' }
    }

    video.priorityLevel = 0
    video.isPinned = false
    await (session ? video.save({ session }) : video.save())

    if (autoShift) {
      if (removed === 1) {
        const p2 = await q({ priorityLevel: 2 })
        const p3 = await q({ priorityLevel: 3 })
        if (p2) {
          p2.priorityLevel = 1
          p2.isPinned = true
          await (session ? p2.save({ session }) : p2.save())
        }
        if (p3) {
          p3.priorityLevel = 2
          p3.isPinned = false
          await (session ? p3.save({ session }) : p3.save())
        }
      } else if (removed === 2) {
        const p3 = await q({ priorityLevel: 3 })
        if (p3) {
          p3.priorityLevel = 2
          await (session ? p3.save({ session }) : p3.save())
        }
      }
    }

    return {
      slots: await fetchPrioritySlots(),
      message: autoShift
        ? 'Priority removed and positions shifted up'
        : 'Priority removed successfully',
    }
  }

  return runWithOptionalTransaction(apply)
}

export async function getOccupant(level, excludeVideoId = null) {
  const filter = { priorityLevel: level }
  if (excludeVideoId) filter.videoId = { $ne: String(excludeVideoId) }
  const doc = await YoutubeVideo.findOne(filter).lean()
  return doc ? toRow(doc) : null
}
