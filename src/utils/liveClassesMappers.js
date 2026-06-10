import { createDefaultRecurrenceRule } from './recurrenceEngine'
import { findClassroomById } from './classroomsStorage'

export function createEmptyLessonForm(lessonType = 'Live') {
  return {
    lessonName: '',
    topic: '',
    teacher: '',
    location: 'Delhi',
    classroomId: '',
    classroomName: '',
    lessonType: lessonType === 'Recording' ? 'Recording' : 'Live',
    subjectId: '',
    subjectName: '',
    mainCategoryName: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 60,
    timezone: 'Asia/Kolkata',
    recurring: false,
    recurrence: null,
    recurrenceEditScope: 'series',
    status: 'Scheduled',
    meetingProvider: 'zoom',
    zoomMeetingId: '',
    zoomAccountEmail: '',
    zoomLink: '',
    passcode: '',
    hostName: '',
    description: '',
    downloadable: false,
    visibility: 'Published',
    videoFileName: '',
    videoDuration: '',
    thumbnailUrl: '',
    notesFileName: '',
    videoObjectUrl: '',
  }
}

function normalizeRecurrenceRule(recurrence, row) {
  const base = recurrence
    ? { ...createDefaultRecurrenceRule(row), ...recurrence, enabled: true }
    : createDefaultRecurrenceRule(row)
  return {
    ...base,
    excludedDates: Array.isArray(base.excludedDates) ? [...base.excludedDates] : [],
    weekdays: Array.isArray(base.weekdays) ? [...base.weekdays] : base.weekdays,
    history: Array.isArray(base.history) ? [...base.history] : [],
  }
}

export function lessonRowToForm(row) {
  if (!row) return createEmptyLessonForm()
  const recurring = Boolean(row.recurring)
  return {
    ...createEmptyLessonForm(),
    ...row,
    lessonName: row.lessonName ?? row.name ?? '',
    recurring,
    recurrence: row.recurrence
      ? normalizeRecurrenceRule(row.recurrence, row)
      : recurring
        ? normalizeRecurrenceRule(null, row)
        : null,
    recurrenceEditScope: row.recurrenceEditScope || 'series',
  }
}

export function lessonFormToRow(form, existing) {
  const now = new Date().toISOString()
  const recurring = Boolean(form.recurring)
  const recurrence =
    recurring && form.recurrence
      ? { ...form.recurrence, enabled: true }
      : null
  const classroomId = form.classroomId || existing?.classroomId || ''
  const classroom = classroomId ? findClassroomById(classroomId) : null

  return {
    ...existing,
    lessonName: form.lessonName?.trim() || existing?.lessonName,
    topic: form.topic?.trim() ?? '',
    teacher: form.teacher?.trim() ?? '',
    location: form.location || 'Delhi',
    classroomId,
    classroomName: classroom?.name || form.classroomName || existing?.classroomName || '',
    lessonType: form.lessonType || 'Live',
    subjectId: form.subjectId,
    subjectName: form.subjectName,
    mainCategoryName: form.mainCategoryName,
    scheduledDate: form.scheduledDate,
    scheduledTime: form.scheduledTime,
    duration: Number(form.duration) || 60,
    timezone: form.timezone || 'Asia/Kolkata',
    recurring,
    recurrence,
    recurrenceSeriesId: existing?.recurrenceSeriesId ?? null,
    recurrenceParentId: existing?.recurrenceParentId ?? null,
    isRecurrenceParent: existing?.isRecurrenceParent ?? false,
    isRecurrenceOccurrence: existing?.isRecurrenceOccurrence ?? false,
    occurrenceIndex: existing?.occurrenceIndex ?? null,
    calendarPayload: recurrence ? form.calendarPayload : null,
    status: form.status || 'Scheduled',
    meetingProvider: form.meetingProvider || 'zoom',
    zoomMeetingId: form.zoomMeetingId ?? '',
    zoomAccountEmail: form.zoomAccountEmail ?? '',
    zoomLink: form.zoomLink ?? '',
    passcode: form.passcode ?? '',
    hostName: form.hostName ?? '',
    description: form.description ?? '',
    downloadable: Boolean(form.downloadable),
    visibility: form.visibility || 'Published',
    videoFileName: form.videoFileName ?? '',
    videoDuration: form.videoDuration ?? '',
    thumbnailUrl: form.thumbnailUrl ?? '',
    notesFileName: form.notesFileName ?? '',
    modifiedAt: now,
    createdAt: existing?.createdAt ?? now,
    id: existing?.id,
  }
}

export function duplicateLessonRow(row) {
  const copy = lessonRowToForm(row)
  copy.lessonName = `${copy.lessonName} (Copy)`
  delete copy.id
  copy.recurrenceSeriesId = null
  copy.recurrenceParentId = null
  copy.isRecurrenceParent = false
  copy.isRecurrenceOccurrence = false
  return copy
}
