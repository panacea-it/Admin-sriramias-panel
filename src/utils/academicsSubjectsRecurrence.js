import {
  appendRecurrenceHistory,
  createDefaultRecurrenceRule,
  detectRecurrenceConflicts,
  generateOccurrenceDates,
  toCalendarRecurrencePayload,
  validateRecurrenceRule,
} from './recurrenceEngine'
import { buildLiveClassFromForm } from '../components/subjects/subjectFormUtils'
import { findClassroomConflict } from './classroomBookings'
import { durationFromHms, minutesToTimeString, timePartsToMinutes } from './classroomTime'
import {
  isLiveClassCategory,
  normalizeCategories,
} from './subjectCategoryHelpers'

export { isLiveClassCategory, isRecordedClassCategory } from './subjectCategoryHelpers'

export function formAnchorTime(form) {
  return minutesToTimeString(timePartsToMinutes(form.timeHrs, form.timeMin, form.timeSec))
}

export function flattenSubjectsLiveClassesForConflicts(subjects) {
  return subjects.flatMap((s) =>
    (s.liveClasses || []).map((lc) => ({
      id: `${s.id}-${lc.id}`,
      lessonType: 'Live',
      teacher: s.teacher || '',
      subjectId: s.id,
      scheduledDate: lc.date,
      scheduledTime: lc.startTime || lc.scheduledTime,
      lessonName: lc.classTitle,
      status: lc.status === 'In Active' ? 'Disabled' : 'Scheduled',
    })),
  )
}

export function getExcludeLessonIds(subject, liveClass, allSubjects) {
  const seriesId = liveClass?.recurrenceSeriesId
  if (!seriesId || !subject) return liveClass?.id ? [`${subject.id}-${liveClass.id}`] : []
  const ids = []
  for (const s of allSubjects) {
    for (const lc of s.liveClasses || []) {
      if (lc.recurrenceSeriesId === seriesId) ids.push(`${s.id}-${lc.id}`)
    }
  }
  return ids
}

/**
 * Build one or many live class rows from faculty subject form (with optional recurrence).
 */
export function buildLiveClassesFromRecurrence(
  form,
  subject,
  existingLiveClass = null,
  actorName = 'Admin',
  { scope = 'series' } = {},
) {
  if (!form.recurring || !form.recurrence?.enabled) {
    return [buildLiveClassFromForm(form, existingLiveClass, subject)]
  }

  if (existingLiveClass && scope === 'this') {
    const row = buildLiveClassFromForm(form, existingLiveClass, subject)
    return [
      {
        ...row,
        recurring: true,
        recurrence: form.recurrence,
        recurrenceSeriesId: existingLiveClass.recurrenceSeriesId,
        recurrenceParentId: existingLiveClass.recurrenceParentId || null,
        isRecurrenceParent: false,
        isRecurrenceOccurrence: true,
        occurrenceIndex: existingLiveClass.occurrenceIndex ?? 1,
        occurrenceCount: existingLiveClass.occurrenceCount,
      },
    ]
  }

  const dates = generateOccurrenceDates(form.recurrence, form.date)
  if (dates.length === 0) {
    return [buildLiveClassFromForm(form, existingLiveClass, subject)]
  }

  const seriesId = existingLiveClass?.recurrenceSeriesId || `sub-series-${Date.now()}`
  const rule = appendRecurrenceHistory(
    { ...form.recurrence, enabled: true },
    {
      action: existingLiveClass ? 'Series updated' : 'Series created',
      by: actorName,
      detail: `${dates.length} sessions`,
    },
  )

  let filteredDates = dates
  if (existingLiveClass && scope === 'future') {
    filteredDates = dates.filter((d) => d >= (existingLiveClass.date || dates[0]))
  }

  const idStamp = Date.now()
  const rows = filteredDates.map((date, index) => {
    const row = buildLiveClassFromForm({ ...form, date }, null, subject)
    const keepId =
      existingLiveClass &&
      existingLiveClass.date === date &&
      (scope === 'series' || (scope === 'future' && date >= existingLiveClass.date))
        ? existingLiveClass.id
        : null

    return {
      ...row,
      id: keepId || `lc-${seriesId}-${idStamp}-${index}`,
      date,
      recurring: true,
      recurrence: rule,
      recurrenceSeriesId: seriesId,
      recurrenceParentId: null,
      isRecurrenceParent: false,
      isRecurrenceOccurrence: true,
      occurrenceIndex: index + 1,
      occurrenceCount: filteredDates.length,
      calendarPayload: toCalendarRecurrencePayload(rule, { scheduledDate: date }),
    }
  })

  return rows
}

export function validateSubjectRecurrence(form, { allSubjects = [], subjectId = '', excludeIds = [] }) {
  const errors = {}
  const categories = normalizeCategories(form.categories ?? form.category)
  if (!isLiveClassCategory(categories) && categories.length) return errors
  if (!form.recurring || !form.recurrence?.enabled) return errors

  const anchor = { scheduledDate: form.date }
  const recurrenceErrors = validateRecurrenceRule(form.recurrence, anchor)
  if (recurrenceErrors.length) {
    errors.recurrence = recurrenceErrors[0]
    return errors
  }

  const startTime = formAnchorTime(form)
  const durationMinutes = durationFromHms(form.durationHrs, form.durationMin, form.durationSec)
  const dates = generateOccurrenceDates(form.recurrence, form.date)

  for (const date of dates) {
    if (form.classroomId && startTime) {
      const conflict = findClassroomConflict({
        classroomId: form.classroomId,
        date,
        startTime,
        durationMinutes,
        excludeSourceIds: form._excludeSourceIds || [],
      })
      if (conflict) {
        errors.classRoom = `Classroom conflict on ${date} — already booked`
        break
      }
    }
  }

  const lessons = flattenSubjectsLiveClassesForConflicts(allSubjects)
  const conflictForm = {
    teacher: form.teacher,
    subjectId: subjectId || '',
    scheduledTime: startTime,
  }
  const warnings = detectRecurrenceConflicts(dates, lessons, conflictForm, excludeIds)
  if (warnings.length) {
    errors.recurrence = warnings[0]
  }

  return errors
}

export function createRecurrenceFromSubjectForm(form) {
  return createDefaultRecurrenceRule({
    scheduledDate: form.date,
    timezone: form.timezone || 'Asia/Kolkata',
  })
}
