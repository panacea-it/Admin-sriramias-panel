import { pad2 } from './classroomTime'
import { isMongoObjectId } from './facultySubjectHelpers'

const UI_TO_API_WEEKDAY = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const API_TO_UI_WEEKDAY = Object.fromEntries(UI_TO_API_WEEKDAY.map((d, i) => [d, i]))

const UI_TO_API_REPEAT = {
  daily: 'DAILY',
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
  custom: 'CUSTOM',
}

const API_TO_UI_REPEAT = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom',
}

const UI_TO_API_MONTHLY = {
  same_date: 'SAME_DATE',
  first_weekday: 'FIRST_WEEKDAY',
  last_weekday: 'LAST_WEEKDAY',
}

const API_TO_UI_MONTHLY = {
  SAME_DATE: 'same_date',
  FIRST_WEEKDAY: 'first_weekday',
  LAST_WEEKDAY: 'last_weekday',
}

function parseTimeParts(timeStr) {
  if (!timeStr) return { hrs: '00', min: '00', sec: '00' }
  const parts = String(timeStr).split(':').map((x) => parseInt(x, 10) || 0)
  return {
    hrs: pad2(parts[0] ?? 0),
    min: pad2(parts[1] ?? 0),
    sec: pad2(parts[2] ?? 0),
  }
}

export function unwrapLiveClassPayload(data) {
  if (data?.data != null && typeof data.data === 'object' && !Array.isArray(data.data)) {
    return data.data
  }
  return data
}

export function normalizeBatchesDropdownResponse(data) {
  const payload =
    data?.success != null && Array.isArray(data?.data)
      ? data.data
      : data

  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : payload?.items ?? []

  return (Array.isArray(list) ? list : [])
    .map((row) => {
      const statusRaw = String(row.status || 'ACTIVE').toUpperCase()
      const status =
        statusRaw === 'ACTIVE'
          ? 'Active'
          : statusRaw === 'UPCOMING'
            ? 'Upcoming'
            : statusRaw === 'INACTIVE'
              ? 'In Active'
              : row.status || 'Active'
      return {
        id: String(row._id ?? row.id ?? ''),
        batchId: String(row.batchId ?? row._id ?? row.id ?? ''),
        batchName: String(row.batchName ?? row.name ?? 'Untitled batch'),
        courseName: String(row.course?.courseName ?? row.courseName ?? ''),
        status,
        selectable: !['ARCHIVED', 'COMPLETED', 'CANCELLED'].includes(statusRaw),
      }
    })
    .filter((o) => o.id)
}

/** Prefer route/API Mongo id over legacy local seed ids (e.g. "001"). */
export function resolveFacultySubjectApiId(subject, routeSubjectId) {
  if (isMongoObjectId(routeSubjectId)) return String(routeSubjectId)
  if (isMongoObjectId(subject?.id)) return String(subject.id)
  if (isMongoObjectId(subject?.apiId)) return String(subject.apiId)
  return ''
}

export function normalizeCentersDropdownResponse(data) {
  const list = Array.isArray(data?.data) ? data.data : data?.items ?? []
  return (Array.isArray(list) ? list : [])
    .map((row) => ({
      value: String(row._id ?? row.id ?? row.centerId ?? ''),
      label: String(row.centerName ?? row.name ?? row.label ?? ''),
    }))
    .filter((o) => o.value && o.label)
}

export function normalizeClassroomsDropdownResponse(data) {
  const list = Array.isArray(data?.data) ? data.data : data?.items ?? []
  return (Array.isArray(list) ? list : [])
    .map((row) => ({
      value: String(row._id ?? row.id ?? ''),
      label: String(row.classroomName ?? row.name ?? row.label ?? ''),
      code: String(row.classroomCode ?? row.code ?? ''),
    }))
    .filter((o) => o.value)
}

export function mapRecurrenceFormToApi(recurrence, scheduledDate = '') {
  if (!recurrence?.enabled) return null

  const repeatType = UI_TO_API_REPEAT[String(recurrence.repeatType || 'weekly').toLowerCase()] || 'WEEKLY'
  const payload = {
    enabled: true,
    repeatType,
    repeatEvery: Math.max(1, parseInt(recurrence.repeatEvery, 10) || 1),
    startDate: recurrence.startDate || scheduledDate || '',
    endDate: recurrence.endDate || '',
    excludedDates: Array.isArray(recurrence.excludedDates) ? recurrence.excludedDates : [],
    paused: Boolean(recurrence.paused),
    pausedUntil: recurrence.pausedUntil || null,
    notes: recurrence.notes || '',
  }

  if (repeatType === 'WEEKLY') {
    payload.weekdays = (recurrence.weekdays || [])
      .map((d) => UI_TO_API_WEEKDAY[Number(d)])
      .filter(Boolean)
  }

  if (repeatType === 'MONTHLY') {
    payload.monthlyPattern =
      UI_TO_API_MONTHLY[recurrence.monthlyMode || 'same_date'] || 'SAME_DATE'
  }

  if (repeatType === 'CUSTOM' && Array.isArray(recurrence.weekdays)) {
    payload.weekdays = recurrence.weekdays
      .map((d) => UI_TO_API_WEEKDAY[Number(d)])
      .filter(Boolean)
  }

  return payload
}

export function mapRecurrenceApiToForm(recurrence, scheduledDate = '') {
  if (!recurrence || recurrence.enabled === false) {
    return { enabled: false, recurring: false, recurrence: null }
  }

  const repeatType = API_TO_UI_REPEAT[String(recurrence.repeatType || 'WEEKLY').toUpperCase()] || 'weekly'
  const formRecurrence = {
    enabled: true,
    repeatType,
    repeatEvery: recurrence.repeatEvery ?? 1,
    startDate: recurrence.startDate || scheduledDate || '',
    endDate: recurrence.endDate || '',
    excludedDates: Array.isArray(recurrence.excludedDates) ? recurrence.excludedDates : [],
    paused: Boolean(recurrence.paused),
    pausedUntil: recurrence.pausedUntil || '',
    notes: recurrence.notes || '',
    timezone: recurrence.timezone || 'Asia/Kolkata',
    history: recurrence.history || [],
  }

  if (repeatType === 'weekly' && Array.isArray(recurrence.weekdays)) {
    formRecurrence.weekdays = recurrence.weekdays
      .map((d) => API_TO_UI_WEEKDAY[String(d).toUpperCase()])
      .filter((n) => n != null)
  } else {
    formRecurrence.weekdays = recurrence.weekdays || []
  }

  if (repeatType === 'monthly') {
    formRecurrence.monthlyMode =
      API_TO_UI_MONTHLY[recurrence.monthlyPattern] || 'same_date'
    formRecurrence.monthlyWeekday = recurrence.monthlyWeekday ?? 1
  }

  return { enabled: true, recurring: true, recurrence: formRecurrence }
}

export function buildLiveClassApiPayload(form, meta = {}) {
  const startTime = `${pad2(parseInt(form.timeHrs, 10) || 0)}:${pad2(parseInt(form.timeMin, 10) || 0)}:${pad2(parseInt(form.timeSec, 10) || 0)}`

  const payload = {
    facultySubjectId: String(meta.facultySubjectId || '').trim(),
    folderId: String(meta.folderId || '').trim(),
    batchId: String(form.batchId || '').trim(),
    centerId: String(form.centerId || '').trim(),
    classroomId: String(form.classroomId || '').trim(),
    classTitle: String(form.classTitle || '').trim(),
    scheduledDate: form.date || '',
    startTime,
    durationHours: parseInt(form.durationHrs, 10) || 0,
    durationMinutes: parseInt(form.durationMin, 10) || 0,
    durationSeconds: parseInt(form.durationSec, 10) || 0,
    timezone: meta.timezone || form.timezone || 'Asia/Kolkata',
    attendanceEnabled: form.attendanceEnabled !== false,
    publishStatus: meta.publish ? 'PUBLISHED' : 'DRAFT',
  }

  const includeRecurrence = Boolean(meta.recurring && meta.recurrence?.enabled)
  if (includeRecurrence) {
    const recurrencePayload = mapRecurrenceFormToApi(meta.recurrence, form.date)
    if (recurrencePayload) payload.recurrence = recurrencePayload
  }

  return payload
}

export function validateLiveClassApiPayload(payload) {
  const errors = []
  if (!payload.facultySubjectId) errors.push('Faculty subject is missing')
  else if (!isMongoObjectId(payload.facultySubjectId)) {
    errors.push('Faculty subject id is invalid')
  }
  if (!payload.folderId) errors.push('Folder is missing')
  if (!payload.batchId) errors.push('Batch is required')
  if (!payload.centerId) errors.push('Center is required')
  if (!payload.classroomId) errors.push('Classroom is required')
  if (!payload.classTitle) errors.push('Class title is required')
  if (!payload.scheduledDate) errors.push('Date is required')
  return errors
}

export function mapApiLiveClassToLocalRow(data) {
  const row = unwrapLiveClassPayload(data)
  if (!row || typeof row !== 'object') return null

  const id = String(row._id ?? row.id ?? '')
  if (!id) return null

  const time = parseTimeParts(row.startTime || row.scheduledTime)
  const recurrenceState = mapRecurrenceApiToForm(row.recurrence, row.scheduledDate)

  const centerLabel =
    typeof row.center === 'object'
      ? row.center.centerName || row.center.name
      : row.centerName || row.center || ''

  const classroomLabel =
    typeof row.classroom === 'object'
      ? row.classroom.classroomName || row.classroom.name
      : row.classroomName || ''

  return {
    id,
    apiId: id,
    classTitle: String(row.classTitle || '').trim(),
    batchId: String(row.batchId || row.batch?._id || row.batch?.id || ''),
    centerId: String(row.centerId || row.center?._id || row.center?.id || ''),
    center: centerLabel,
    classroomId: String(row.classroomId || row.classroom?._id || row.classroom?.id || ''),
    classRoom: classroomLabel,
    classroom: classroomLabel,
    date: row.scheduledDate || row.date || '',
    scheduledDate: row.scheduledDate || row.date || '',
    startTime: row.startTime || '',
    scheduledTime: row.startTime || '',
    timeHrs: time.hrs,
    timeMin: time.min,
    timeSec: time.sec,
    durationHrs: pad2(row.durationHours ?? 0),
    durationMin: pad2(row.durationMinutes ?? 0),
    durationSec: pad2(row.durationSeconds ?? 0),
    durationMinutes:
      (parseInt(row.durationHours, 10) || 0) * 60 +
      (parseInt(row.durationMinutes, 10) || 0),
    timezone: row.timezone || 'Asia/Kolkata',
    recurring: recurrenceState.recurring,
    recurrence: recurrenceState.recurrence,
    publishStatus: row.publishStatus || 'DRAFT',
    status: row.publishStatus === 'PUBLISHED' ? 'Active' : 'Draft',
    folderId: row.folderId || '',
    facultySubjectId: row.facultySubjectId || '',
    attendanceEnabled: row.attendanceEnabled !== false,
    createdAt: row.createdAt || null,
    modifiedAt: row.updatedAt || row.modifiedAt || null,
  }
}

export function mapApiLiveClassToFormValues(data, subject = null) {
  const local = mapApiLiveClassToLocalRow(data)
  if (!local) return null

  return {
    batchId: local.batchId,
    centerId: local.centerId,
    center: local.center,
    classroomId: local.classroomId,
    classRoom: local.classRoom,
    classTitle: local.classTitle,
    date: local.date,
    timeHrs: local.timeHrs,
    timeMin: local.timeMin,
    timeSec: local.timeSec,
    durationHrs: local.durationHrs,
    durationMin: local.durationMin,
    durationSec: local.durationSec,
    teacher: subject?.teacher || '',
    contentType: 'live',
    recurring: local.recurring,
    recurrence: local.recurrence,
    timezone: local.timezone,
  }
}

export function resolveLiveClassApiId(row) {
  const id = String(row?.apiId || row?.id || row?.linkedExistingFormId || '')
  return isMongoObjectId(id) ? id : ''
}
