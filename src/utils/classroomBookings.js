import { loadAcademicsSubjects } from './academicsSubjectsStorage'
import { getLiveClassesStoreSnapshot } from '../api/liveClassesAPI'
import {
  buildDateTime,
  computeEndFromStart,
  durationFromHms,
  hasTimeOverlap,
  timePartsToMinutes,
} from './classroomTime'
import { findClassroomById, loadClassrooms } from './classroomsStorage'

function resolveClassroomId(classroomId, classroomName) {
  if (classroomId) return classroomId
  const list = loadClassrooms()
  const byName = list.find(
    (c) => c.name.toLowerCase() === String(classroomName || '').trim().toLowerCase(),
  )
  return byName?.id || null
}

function bookingFromSubjectLiveClass(lc, subject) {
  const classroomId = resolveClassroomId(lc.classroomId, lc.classroom || lc.classRoom)
  if (!classroomId || !lc.date) return null

  const startTime = lc.startTime || lc.scheduledTime || '09:00'
  const durationMinutes =
    lc.durationMinutes ||
    (lc.durationHrs != null
      ? durationFromHms(lc.durationHrs, lc.durationMin, lc.durationSec)
      : 60)

  const startAt = buildDateTime(lc.date, startTime)
  const endAt = computeEndFromStart(lc.date, startTime, durationMinutes)
  if (!startAt || !endAt) return null

  return {
    id: `subj-${subject.id}-${lc.id}`,
    source: 'subject',
    sourceId: lc.id,
    classroomId,
    classroomName: lc.classroom || findClassroomById(classroomId)?.name,
    title: lc.classTitle || subject.subjectName,
    date: lc.date,
    startTime,
    durationMinutes,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    center: lc.center,
    teacher: subject.teacher,
  }
}

function bookingFromLiveLesson(lesson) {
  const classroomId = lesson.classroomId
  if (!classroomId || !lesson.scheduledDate || lesson.lessonType !== 'Live') return null
  if (lesson.status === 'Disabled') return null

  const startTime = lesson.scheduledTime || '09:00'
  const durationMinutes = Number(lesson.duration) || 60
  const startAt = buildDateTime(lesson.scheduledDate, startTime)
  const endAt = computeEndFromStart(lesson.scheduledDate, startTime, durationMinutes)
  if (!startAt || !endAt) return null

  return {
    id: `lc-${lesson.id}`,
    source: 'live-classes',
    sourceId: lesson.id,
    classroomId,
    classroomName: lesson.classroomName || findClassroomById(classroomId)?.name,
    title: lesson.lessonName,
    date: lesson.scheduledDate,
    startTime,
    durationMinutes,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    center: lesson.location,
    teacher: lesson.teacher,
  }
}

/** All classroom bookings from subjects module + live classes module */
export function getAllClassroomBookings() {
  const bookings = []

  loadAcademicsSubjects().forEach((subject) => {
    ;(subject.liveClasses || []).forEach((lc) => {
      const b = bookingFromSubjectLiveClass(lc, subject)
      if (b) bookings.push(b)
    })
  })

  getLiveClassesStoreSnapshot()
    .filter((l) => l.lessonType === 'Live' && !l.isRecurrenceParent)
    .forEach((lesson) => {
      const b = bookingFromLiveLesson(lesson)
      if (b) bookings.push(b)
    })

  return bookings
}

export function findClassroomConflict({
  classroomId,
  date,
  startTime,
  durationMinutes,
  excludeSourceIds = [],
}) {
  if (!classroomId || !date || !startTime) return null

  const newStart = buildDateTime(date, startTime)
  const newEnd = computeEndFromStart(date, startTime, durationMinutes)
  if (!newStart || !newEnd) return null

  const exclude = new Set(excludeSourceIds.filter(Boolean))

  for (const b of getAllClassroomBookings()) {
    if (b.classroomId !== classroomId) continue
    if (exclude.has(b.sourceId)) continue
    const existStart = new Date(b.startAt)
    const existEnd = new Date(b.endAt)
    if (hasTimeOverlap(newStart, newEnd, existStart, existEnd)) {
      return b
    }
  }
  return null
}

export function getOccupiedClassroomIds({ date, startTime, durationMinutes, excludeSourceIds = [] }) {
  if (!date || !startTime) return new Set()
  const occupied = new Set()
  const newStart = buildDateTime(date, startTime)
  const newEnd = computeEndFromStart(date, startTime, durationMinutes)
  if (!newStart || !newEnd) return occupied

  const exclude = new Set(excludeSourceIds.filter(Boolean))

  getAllClassroomBookings().forEach((b) => {
    if (exclude.has(b.sourceId)) return
    const existStart = new Date(b.startAt)
    const existEnd = new Date(b.endAt)
    if (hasTimeOverlap(newStart, newEnd, existStart, existEnd)) {
      occupied.add(b.classroomId)
    }
  })
  return occupied
}

export function getClassroomUsageStats(classroomId) {
  const all = getAllClassroomBookings().filter((b) => b.classroomId === classroomId)
  const upcoming = all.filter((b) => new Date(b.startAt) >= new Date())
  return {
    totalBookings: all.length,
    upcomingBookings: upcoming.length,
  }
}
