function pad2(n) {
  return String(n).padStart(2, '0')
}

export function buildDateTime(dateStr, timeStr = '00:00') {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const [hh = 0, mm = 0] = String(timeStr).split(':').map((x) => parseInt(x, 10) || 0)
  if (!y || !mo || !d) return null
  return new Date(Date.UTC(y, mo - 1, d, hh - 5, mm, 0))
}

export function computeEnd(startAt, durationMinutes) {
  const mins = Math.max(1, Number(durationMinutes) || 60)
  return new Date(startAt.getTime() + mins * 60 * 1000)
}

export function hasOverlap(newStart, newEnd, existingStart, existingEnd) {
  return newStart < existingEnd && newEnd > existingStart
}

export async function findBookingConflict(LiveClassBooking, {
  classroomId,
  date,
  startTime,
  durationMinutes,
  excludeSourceIds = [],
}) {
  const startAt = buildDateTime(date, startTime)
  if (!startAt) return null
  const endAt = computeEnd(startAt, durationMinutes)

  const query = {
    classroomId,
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  }
  if (excludeSourceIds.length) {
    query.sourceId = { $nin: excludeSourceIds }
  }

  return LiveClassBooking.findOne(query).lean()
}

export async function getOccupiedClassroomIds(LiveClassBooking, {
  date,
  startTime,
  durationMinutes,
  excludeSourceIds = [],
}) {
  const startAt = buildDateTime(date, startTime)
  if (!startAt) return []
  const endAt = computeEnd(startAt, durationMinutes)

  const query = {
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  }
  if (excludeSourceIds.length) {
    query.sourceId = { $nin: excludeSourceIds }
  }

  const rows = await LiveClassBooking.find(query).select('classroomId').lean()
  return [...new Set(rows.map((r) => String(r.classroomId)))]
}
