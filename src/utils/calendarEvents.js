/**
 * Calendar View–only event normalization and styling.
 * Maps LiveClassesContext lessons into calendar display events.
 */

export const CALENDAR_SESSION_TYPES = {
  LIVE_SESSION: 'live_session',
  SCHEDULED_CLASS: 'scheduled_class',
  RECORDED_CLASS: 'recorded_class',
}

export const CALENDAR_EVENT_LEGEND = [
  { key: 'scheduled', label: 'Scheduled Class', swatch: 'bg-gradient-to-r from-[#2563eb] to-[#3b82f6]' },
  { key: 'live', label: 'Live Session', swatch: 'bg-gradient-to-r from-[#dc2626] to-[#f87171]' },
  { key: 'recorded', label: 'Recorded Class', swatch: 'bg-gradient-to-r from-[#7c3aed] to-[#a78bfa]' },
  { key: 'completed', label: 'Completed', swatch: 'bg-gradient-to-r from-[#059669] to-[#34d399]' },
  { key: 'cancelled', label: 'Cancelled / Disabled', swatch: 'bg-gradient-to-r from-[#64748b] to-[#94a3b8]' },
  { key: 'recurring', label: 'Recurring Series', swatch: 'bg-gradient-to-r from-[#ea580c] to-[#fb923c]' },
]

const CENTER_KEY_ALIASES = {
  delhi: ['delhi', 'delhi center', 'new delhi'],
  hyderabad: ['hyderabad', 'hyderabad center'],
  bangalore: ['bangalore', 'bengaluru', 'bangalore center', 'bengaluru center'],
  chennai: ['chennai', 'chennai center'],
  vijayawada: ['vijayawada', 'vijayawada center'],
  mumbai: ['mumbai', 'mumbai center'],
  pune: ['pune', 'pune center'],
  online: ['online', 'virtual', 'all centers'],
}

function normalizeKey(value) {
  return (value || '').trim().toLowerCase().replace(/\s+center$/i, '').replace(/\s+/g, ' ')
}

export function resolveCenterKey(value) {
  const key = normalizeKey(value)
  if (!key || key === 'all centers' || key === 'all') return null
  for (const [canonical, aliases] of Object.entries(CENTER_KEY_ALIASES)) {
    if (aliases.some((a) => key === a || key.includes(a))) return canonical
  }
  return key
}

export function getSessionType(lesson) {
  if (lesson.lessonType === 'Recording') return CALENDAR_SESSION_TYPES.RECORDED_CLASS
  if (lesson.status === 'Live') return CALENDAR_SESSION_TYPES.LIVE_SESSION
  return CALENDAR_SESSION_TYPES.SCHEDULED_CLASS
}

export function getSessionTypeLabel(sessionType) {
  switch (sessionType) {
    case CALENDAR_SESSION_TYPES.LIVE_SESSION:
      return 'Live Session'
    case CALENDAR_SESSION_TYPES.RECORDED_CLASS:
      return 'Recorded Class'
    default:
      return 'Scheduled Class'
  }
}

export function getEventVisual(lesson) {
  const isRecurring = Boolean(
    lesson.recurring || lesson.isRecurrenceOccurrence || lesson.isRecurrenceParent,
  )
  const status = lesson.status || 'Scheduled'

  if (status === 'Disabled' || status === 'Draft') {
    return {
      gradient: 'from-[#64748b] to-[#94a3b8]',
      border: 'border-l-slate-500',
      ring: 'ring-slate-200/60',
      legendKey: 'cancelled',
    }
  }
  if (status === 'Completed') {
    return {
      gradient: 'from-[#059669] to-[#34d399]',
      border: 'border-l-emerald-600',
      ring: 'ring-emerald-200/60',
      legendKey: 'completed',
    }
  }
  if (isRecurring && status === 'Scheduled') {
    return {
      gradient: 'from-[#ea580c] to-[#fb923c]',
      border: 'border-l-orange-500',
      ring: 'ring-orange-200/60',
      legendKey: 'recurring',
    }
  }
  const sessionType = getSessionType(lesson)
  if (sessionType === CALENDAR_SESSION_TYPES.LIVE_SESSION) {
    return {
      gradient: 'from-[#dc2626] to-[#f87171]',
      border: 'border-l-red-600',
      ring: 'ring-red-200/60',
      legendKey: 'live',
    }
  }
  if (sessionType === CALENDAR_SESSION_TYPES.RECORDED_CLASS) {
    return {
      gradient: 'from-[#7c3aed] to-[#a78bfa]',
      border: 'border-l-violet-600',
      ring: 'ring-violet-200/60',
      legendKey: 'recorded',
    }
  }
  return {
    gradient: 'from-[#2563eb] to-[#3b82f6]',
    border: 'border-l-blue-600',
    ring: 'ring-blue-200/60',
    legendKey: 'scheduled',
  }
}

export function parseLessonDate(lesson) {
  if (!lesson?.scheduledDate) return null
  const [y, m, d] = lesson.scheduledDate.split('-').map(Number)
  const [hh = 0, mm = 0] = (lesson.scheduledTime || '00:00').split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm)
}

export function formatEventTime(lesson) {
  if (!lesson.scheduledTime) return '—'
  const [hh, mm] = lesson.scheduledTime.split(':').map(Number)
  const end = new Date(2000, 0, 1, hh, mm)
  end.setMinutes(end.getMinutes() + (Number(lesson.duration) || 60))
  const fmt = (d) =>
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${fmt(new Date(2000, 0, 1, hh, mm))} – ${fmt(end)}`
}

export function lessonToCalendarEvent(lesson) {
  const sessionType = getSessionType(lesson)
  const visual = getEventVisual(lesson)
  return {
    id: lesson.id,
    lesson,
    className: lesson.lessonName,
    subject: lesson.subjectName,
    faculty: lesson.teacher,
    center: lesson.location,
    centerKey: resolveCenterKey(lesson.location),
    classroom: lesson.classroomName || lesson.classroom,
    classroomId: lesson.classroomId,
    timing: formatEventTime(lesson),
    sessionType,
    sessionTypeLabel: getSessionTypeLabel(sessionType),
    status: lesson.status || 'Scheduled',
    isRecurring: Boolean(
      lesson.recurring || lesson.isRecurrenceOccurrence || lesson.isRecurrenceParent,
    ),
    visual,
    date: parseLessonDate(lesson),
  }
}

/** Lessons eligible for calendar display (includes all module types). */
export function lessonsToCalendarEvents(lessons) {
  return (lessons || [])
    .filter((l) => l.scheduledDate && !l.isRecurrenceParent)
    .map(lessonToCalendarEvent)
    .filter((e) => e.date)
}

export function matchesHeaderCenter(event, selectedCenter) {
  if (!selectedCenter || selectedCenter === 'All Centers') return true
  const headerKey = resolveCenterKey(selectedCenter)
  const eventKey = event.centerKey ?? resolveCenterKey(event.center)
  if (!headerKey) return true
  return headerKey === eventKey
}

export function matchesExtraCenters(event, extraCenters) {
  if (!extraCenters?.length) return true
  const eventKey = event.centerKey ?? resolveCenterKey(event.center)
  return extraCenters.some((c) => resolveCenterKey(c) === eventKey)
}

export function formatRecurrenceSummary(recurrence) {
  if (!recurrence?.enabled) return 'Does not repeat'
  const type = recurrence.repeatType || 'weekly'
  const every = recurrence.repeatEvery || 1
  if (type === 'daily') return `Every ${every} day(s)`
  if (type === 'weekly') {
    const days = (recurrence.weekdays || [])
      .map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d])
      .filter(Boolean)
      .join(', ')
    return `Weekly${days ? ` on ${days}` : ''}`
  }
  if (type === 'monthly') return `Monthly (${recurrence.monthlyMode || 'same date'})`
  return `Custom — every ${every} day(s)`
}
