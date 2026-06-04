import mongoose from 'mongoose'
import YoutubeVideo from '../models/YoutubeVideo.js'

export function normalizeRankInput(value) {
  if (value == null || value === '' || value === 0 || value === '0') return null
  const n = Math.round(Number(value))
  if (!Number.isFinite(n) || n < 1) return null
  return n
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

function q(session) {
  return (filter) =>
    session ? YoutubeVideo.find(filter).session(session) : YoutubeVideo.find(filter)
}

function qOne(session) {
  return (filter) =>
    session ? YoutubeVideo.findOne(filter).session(session) : YoutubeVideo.findOne(filter)
}

function bulk(session) {
  return (ops) =>
    session ? YoutubeVideo.bulkWrite(ops, { session }) : YoutubeVideo.bulkWrite(ops)
}

export async function fetchRankedVideos() {
  const docs = await YoutubeVideo.find({ priorityOrder: { $ne: null } })
    .sort({ priorityOrder: 1 })
    .lean()
  return docs
}

export async function getMaxRank() {
  const doc = await YoutubeVideo.findOne({ priorityOrder: { $ne: null } })
    .sort({ priorityOrder: -1 })
    .select('priorityOrder')
    .lean()
  return doc?.priorityOrder ?? 0
}

/**
 * Remove video from its current rank and shift higher ranks down by 1.
 */
async function clearVideoRank(videoId, session) {
  const video = await qOne(session)({ videoId: String(videoId) })
  if (!video?.priorityOrder) return null
  const oldRank = video.priorityOrder
  await bulk(session)([
    {
      updateOne: {
        filter: { videoId: String(videoId) },
        update: { $set: { priorityOrder: null, isPinned: false } },
      },
    },
    {
      updateMany: {
        filter: { priorityOrder: { $gt: oldRank } },
        update: { $inc: { priorityOrder: -1 } },
      },
    },
  ])
  return oldRank
}

function rankSetFields(rank) {
  return {
    priorityOrder: rank,
    isPinned: rank === 1,
    priorityLevel: rank,
  }
}

/**
 * Insert video at targetRank.
 * Default: shift ranks at target and above down (+1).
 * allowGaps: set/swap without compressing other ranks (gaps allowed).
 */
export async function assignRank(videoId, targetRank, options = {}) {
  const rank = normalizeRankInput(targetRank)
  if (!rank) {
    throw Object.assign(new Error('Invalid priority rank'), { statusCode: 400 })
  }
  const { allowGaps = false } = options

  const apply = async (session) => {
    const video = await qOne(session)({ videoId: String(videoId) })
    if (!video) {
      throw Object.assign(new Error('Video not found'), { statusCode: 404 })
    }

    if (allowGaps) {
      const occupant = await qOne(session)({
        priorityOrder: rank,
        videoId: { $ne: String(videoId) },
      })
      const oldRank = video.priorityOrder ?? null

      if (occupant) {
        const swapRank = oldRank
        const ops = [
          {
            updateOne: {
              filter: { videoId: String(videoId) },
              update: {
                $set: rankSetFields(rank),
              },
            },
          },
          {
            updateOne: {
              filter: { videoId: occupant.videoId },
              update: {
                $set: swapRank
                  ? rankSetFields(swapRank)
                  : { priorityOrder: null, isPinned: false, priorityLevel: 0 },
              },
            },
          },
        ]
        await bulk(session)(ops)
      } else {
        await bulk(session)([
          {
            updateOne: {
              filter: { videoId: String(videoId) },
              update: { $set: rankSetFields(rank) },
            },
          },
        ])
      }

      return {
        message: 'Priority rank updated successfully',
        priorityOrder: rank,
      }
    }

    await clearVideoRank(videoId, session)

    await bulk(session)([
      {
        updateMany: {
          filter: { priorityOrder: { $gte: rank }, videoId: { $ne: String(videoId) } },
          update: { $inc: { priorityOrder: 1 } },
        },
      },
      {
        updateOne: {
          filter: { videoId: String(videoId) },
          update: { $set: rankSetFields(rank) },
        },
      },
    ])

    return {
      message: 'Priority rank updated successfully',
      priorityOrder: rank,
    }
  }

  return runWithOptionalTransaction(apply)
}

export async function removeRank(videoId, options = {}) {
  const { autoCompact = true } = options

  const apply = async (session) => {
    const video = await qOne(session)({ videoId: String(videoId) })
    if (!video) {
      throw Object.assign(new Error('Video not found'), { statusCode: 404 })
    }
    const removed = video.priorityOrder
    if (!removed) {
      return { message: 'Priority removed successfully' }
    }

    await qOne(session)({ videoId: String(videoId) })
    await bulk(session)([
      {
        updateOne: {
          filter: { videoId: String(videoId) },
          update: { $set: { priorityOrder: null, isPinned: false, priorityLevel: 0 } },
        },
      },
    ])

    if (autoCompact) {
      await bulk(session)([
        {
          updateMany: {
            filter: { priorityOrder: { $gt: removed } },
            update: { $inc: { priorityOrder: -1 } },
          },
        },
      ])
    }

    return {
      message: autoCompact
        ? 'Priority removed successfully'
        : 'Priority rank cleared',
    }
  }

  return runWithOptionalTransaction(apply)
}

/**
 * Reorder ranked videos — orderedIds is ranked subset in desired order (rank 1..n).
 */
export async function reorderRanks(orderedIds) {
  const ids = Array.isArray(orderedIds) ? orderedIds.map(String) : []
  if (!ids.length) {
    throw Object.assign(new Error('orderedIds is required'), { statusCode: 400 })
  }

  const apply = async (session) => {
    const ops = ids.map((id, index) => ({
      updateOne: {
        filter: { videoId: id },
        update: {
          $set: rankSetFields(index + 1),
        },
      },
    }))
    await bulk(session)(ops)
    return { message: 'Priority list reordered' }
  }

  return runWithOptionalTransaction(apply)
}

/**
 * Compact ranks to 1..n with no gaps.
 */
export async function recalculateRanks() {
  const apply = async (session) => {
    const ranked = await q(session)({ priorityOrder: { $ne: null } })
      .sort({ priorityOrder: 1 })
      .lean()
    const ops = ranked.map((doc, index) => ({
      updateOne: {
        filter: { videoId: doc.videoId },
        update: {
          $set: rankSetFields(index + 1),
        },
      },
    }))
    if (ops.length) await bulk(session)(ops)
    return { message: 'Ranks recalculated successfully', count: ops.length }
  }

  return runWithOptionalTransaction(apply)
}

export async function shiftRanks(fromRank, delta) {
  const from = normalizeRankInput(fromRank)
  const d = Math.round(Number(delta))
  if (!from || !Number.isFinite(d) || d === 0) {
    throw Object.assign(new Error('Invalid shift parameters'), { statusCode: 400 })
  }

  const apply = async (session) => {
    const filter =
      d > 0
        ? { priorityOrder: { $gte: from } }
        : { priorityOrder: { $gte: from + d, $lte: from } }
    await bulk(session)([
      {
        updateMany: {
          filter,
          update: { $inc: { priorityOrder: d } },
        },
      },
    ])
    return { message: 'Ranks shifted successfully' }
  }

  return runWithOptionalTransaction(apply)
}

export async function getOccupantAtRank(rank, excludeVideoId = null) {
  const r = normalizeRankInput(rank)
  if (!r) return null
  const filter = { priorityOrder: r }
  if (excludeVideoId) filter.videoId = { $ne: String(excludeVideoId) }
  return YoutubeVideo.findOne(filter).lean()
}
