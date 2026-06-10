import { INITIAL_LIVE_CLASSES } from '../data/liveClassesData'
import { findClassroomConflict } from '../utils/classroomBookings'
import { findClassroomById } from '../utils/classroomsStorage'
import {
  appendRecurrenceHistory,
  generateOccurrenceDates,
  toCalendarRecurrencePayload,
} from '../utils/recurrenceEngine'

const SIMULATED_DELAY_MS = 200

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let store = [...INITIAL_LIVE_CLASSES]

function seriesRows(seriesId) {
  return store.filter((r) => r.recurrenceSeriesId === seriesId)
}

function removeSeriesRows(seriesId, { fromDate, scope }) {
  if (scope === 'series') {
    store = store.filter((r) => r.recurrenceSeriesId !== seriesId)
    return
  }
  if (scope === 'this') return
  if (scope === 'future' && fromDate) {
    store = store.filter(
      (r) =>
        r.recurrenceSeriesId !== seriesId ||
        !r.scheduledDate ||
        r.scheduledDate < fromDate,
    )
  }
}

function buildOccurrenceRows(base, dates, seriesId, parentId, actor) {
  const rule = base.recurrence || {}
  const history = appendRecurrenceHistory(rule, {
    action: 'Series generated',
    by: actor,
    detail: `${dates.length} sessions`,
  })

  const parent = {
    ...base,
    id: parentId,
    recurrenceSeriesId: seriesId,
    isRecurrenceParent: true,
    isRecurrenceOccurrence: false,
    occurrenceIndex: 0,
    scheduledDate: dates[0] || base.scheduledDate,
    recurrence: history,
    calendarPayload: toCalendarRecurrencePayload(history, base),
    occurrenceCount: dates.length,
  }

  const children = dates.map((date, index) => ({
    ...base,
    id: `${parentId}-occ-${index + 1}`,
    recurrenceSeriesId: seriesId,
    recurrenceParentId: parentId,
    isRecurrenceParent: false,
    isRecurrenceOccurrence: true,
    occurrenceIndex: index + 1,
    scheduledDate: date,
    recurrence: history,
    calendarPayload: toCalendarRecurrencePayload(history, { ...base, scheduledDate: date }),
  }))

  return [parent, ...children]
}

function saveRecurringLesson(lesson, { isEdit, id, scope = 'series', actor = 'Admin' }) {
  assertClassroomAvailable(lesson, { isEdit, id })
  const now = new Date().toISOString()
  const dates = generateOccurrenceDates(lesson.recurrence, lesson.scheduledDate)
  if (dates.length === 0) throw new Error('No occurrences generated for recurrence rule')

  if (isEdit && id) {
    const existing = store.find((r) => r.id === id)
    const seriesId = existing?.recurrenceSeriesId
    if (!seriesId) return saveSingleLesson(lesson, { isEdit, id })

    if (scope === 'this') {
      store = store.map((row) =>
        row.id === id
          ? {
              ...row,
              ...lesson,
              modifiedAt: now,
              recurrence: appendRecurrenceHistory(row.recurrence || lesson.recurrence, {
                action: 'Occurrence updated',
                by: actor,
                detail: 'This occurrence only',
              }),
            }
          : row,
      )
      return store.find((r) => r.id === id)
    }

    const fromDate = scope === 'future' ? existing.scheduledDate : null
    removeSeriesRows(seriesId, { fromDate, scope: scope === 'future' ? 'future' : 'series' })
    const seriesIdKeep = seriesId
    const parentRow =
      store.find((r) => r.recurrenceSeriesId === seriesId && r.isRecurrenceParent) || existing
    const parentId = parentRow.recurrenceParentId || parentRow.id
    const base = { ...lesson, recurrenceSeriesId: seriesIdKeep }
    const filteredDates =
      scope === 'future' && fromDate
        ? dates.filter((d) => d >= fromDate)
        : dates
    const rows = buildOccurrenceRows(base, filteredDates, seriesIdKeep, parentId, actor)
    store = [...rows, ...store]
    return rows[0]
  }

  const seriesId = `series-${Date.now()}`
  const parentId = `lc-${Date.now()}`
  const base = {
    ...lesson,
    recurrenceSeriesId: seriesId,
    createdAt: now,
    modifiedAt: now,
    recurrence: appendRecurrenceHistory(lesson.recurrence, {
      action: 'Series created',
      by: actor,
      detail: `${dates.length} sessions`,
    }),
  }
  const rows = buildOccurrenceRows(base, dates, seriesId, parentId, actor)
  store = [...rows, ...store]
  return rows[0]
}

function assertClassroomAvailable(lesson, { isEdit, id } = {}) {
  if (lesson.lessonType !== 'Live' || !lesson.classroomId) return
  const excludeSourceIds = isEdit && id ? [id] : []
  const conflict = findClassroomConflict({
    classroomId: lesson.classroomId,
    date: lesson.scheduledDate,
    startTime: lesson.scheduledTime,
    durationMinutes: Number(lesson.duration) || 60,
    excludeSourceIds,
  })
  if (conflict) {
    const room = findClassroomById(lesson.classroomId)
    throw new Error(
      `This classroom is already occupied during the selected time (${room?.name || 'room'}).`,
    )
  }
}

function saveSingleLesson(lesson, { isEdit, id } = {}) {
  assertClassroomAvailable(lesson, { isEdit, id })
  const now = new Date().toISOString()
  if (isEdit && id) {
    store = store.map((row) =>
      row.id === id ? { ...row, ...lesson, modifiedAt: now } : row,
    )
    return store.find((r) => r.id === id)
  }
  const newRow = {
    ...lesson,
    id: lesson.id ?? `lc-${Date.now()}`,
    createdAt: now,
    modifiedAt: now,
  }
  store = [newRow, ...store]
  return newRow
}

export async function fetchLiveClasses({ signal } = {}) {
  await delay(SIMULATED_DELAY_MS)
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  return [...store]
}

export async function fetchLiveClassById(id, { signal } = {}) {
  const list = await fetchLiveClasses({ signal })
  return list.find((r) => r.id === id) ?? null
}

export async function saveLiveClass(lesson, { isEdit, id, scope, actor } = {}) {
  await delay(SIMULATED_DELAY_MS)
  if (lesson.recurring && lesson.recurrence?.enabled) {
    return saveRecurringLesson(lesson, { isEdit, id, scope, actor })
  }
  return saveSingleLesson(lesson, { isEdit, id })
}

export async function deleteLiveClass(id, { scope = 'this' } = {}) {
  await delay(SIMULATED_DELAY_MS)
  const row = store.find((r) => r.id === id)
  if (!row?.recurrenceSeriesId) {
    store = store.filter((r) => r.id !== id)
    return
  }

  if (scope === 'series') {
    store = store.filter((r) => r.recurrenceSeriesId !== row.recurrenceSeriesId)
    return
  }

  if (scope === 'future') {
    const fromDate = row.scheduledDate
    store = store.filter(
      (r) =>
        r.recurrenceSeriesId !== row.recurrenceSeriesId ||
        (r.scheduledDate && r.scheduledDate < fromDate),
    )
    return
  }

  store = store.filter((r) => r.id !== id)
}

export function resetLiveClassesStore(seed = INITIAL_LIVE_CLASSES) {
  store = [...seed]
}

export function getLiveClassesStoreSnapshot() {
  return [...store]
}
