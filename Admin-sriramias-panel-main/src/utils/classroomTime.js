/** Classroom scheduling — overlap detection & IST-safe datetime helpers */

const TZ = 'Asia/Kolkata'

export function pad2(n) {
  return String(Math.max(0, n)).padStart(2, '0')
}

/** Build minutes from midnight from HH:MM or HMS form parts */
export function timePartsToMinutes(hrs = 0, min = 0, sec = 0) {
  const h = parseInt(String(hrs || 0), 10) || 0
  const m = parseInt(String(min || 0), 10) || 0
  const s = parseInt(String(sec || 0), 10) || 0
  return h * 60 + m + Math.floor(s / 60)
}

export function minutesToTimeString(totalMinutes) {
  const mins = Math.max(0, Math.min(24 * 60 - 1, totalMinutes))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${pad2(h)}:${pad2(m)}`
}

/**
 * Create UTC Date representing local IST wall-clock on dateStr (YYYY-MM-DD).
 */
export function buildDateTime(dateStr, timeStr = '00:00') {
  if (!dateStr) return null
  const [y, mo, d] = dateStr.split('-').map(Number)
  const [hh = 0, mm = 0] = String(timeStr).split(':').map((x) => parseInt(x, 10) || 0)
  if (!y || !mo || !d) return null
  const utc = new Date(Date.UTC(y, mo - 1, d, hh - 5, mm, 0))
  return utc
}

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

export function hasTimeOverlap(newStart, newEnd, existingStart, existingEnd) {
  if (!newStart || !newEnd || !existingStart || !existingEnd) return false
  return newStart < existingEnd && newEnd > existingStart
}

export function computeEndFromStart(dateStr, startTime, durationMinutes) {
  const start = buildDateTime(dateStr, startTime)
  if (!start) return null
  const mins = Math.max(1, Number(durationMinutes) || 60)
  return addMinutes(start, mins)
}

export function formatTimeRange12(startTime, durationMinutes) {
  const [hh, mm] = String(startTime || '00:00').split(':').map(Number)
  const start = new Date(2000, 0, 1, hh, mm)
  const end = new Date(start)
  end.setMinutes(end.getMinutes() + (Number(durationMinutes) || 60))
  const fmt = (d) =>
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: TZ })
  return `${fmt(start)} – ${fmt(end)}`
}

export function durationFromHms(hrs, min, sec) {
  return Math.max(1, timePartsToMinutes(hrs, min, sec) || 60)
}
