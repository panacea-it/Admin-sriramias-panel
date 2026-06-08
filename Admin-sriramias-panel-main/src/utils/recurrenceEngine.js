import {
  MAX_RECURRENCE_OCCURRENCES,
  MONTHLY_MODES,
  WEEKDAY_OPTIONS,
} from '../constants/recurrence'

const weekdayLabel = Object.fromEntries(WEEKDAY_OPTIONS.map((d) => [d.value, d.label]))

export function createDefaultRecurrenceRule(form = {}) {
  const anchor = form.scheduledDate || ''
  const anchorDate = anchor ? parseISODate(anchor) : new Date()
  const dow = anchorDate.getDay()
  return {
    enabled: true,
    startDate: anchor || '',
    endDate: '',
    repeatEvery: 1,
    repeatType: 'weekly',
    weekdays: [dow],
    monthlyMode: 'same_date',
    monthlyWeekday: dow === 0 ? 1 : dow,
    excludedDates: [],
    paused: false,
    pausedUntil: '',
    notes: '',
    timezone: form.timezone || 'Asia/Kolkata',
    history: [],
  }
}

export function parseISODate(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(date, n) {
  const next = new Date(date)
  next.setDate(next.getDate() + n)
  return next
}

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function weeksBetween(start, current) {
  const s = startOfWeek(start).getTime()
  const c = startOfWeek(current).getTime()
  return Math.round((c - s) / (7 * 24 * 60 * 60 * 1000))
}

function monthsBetween(start, current) {
  return (
    (current.getFullYear() - start.getFullYear()) * 12 +
    (current.getMonth() - start.getMonth())
  )
}

function getFirstWeekdayOfMonth(year, month, weekday) {
  const d = new Date(year, month, 1)
  while (d.getMonth() === month) {
    if (d.getDay() === weekday) return new Date(d)
    d.setDate(d.getDate() + 1)
  }
  return null
}

function getLastWeekdayOfMonth(year, month, weekday) {
  const d = new Date(year, month + 1, 0)
  while (d.getMonth() === month) {
    if (d.getDay() === weekday) return new Date(d)
    d.setDate(d.getDate() - 1)
  }
  return null
}

function matchesMonthly(date, rule, anchor) {
  const mode = rule.monthlyMode || 'same_date'
  const weekday = rule.monthlyWeekday ?? anchor.getDay()
  const y = date.getFullYear()
  const m = date.getMonth()

  if (mode === 'same_date') {
    const targetDay = anchor.getDate()
    const lastDay = new Date(y, m + 1, 0).getDate()
    return date.getDate() === Math.min(targetDay, lastDay)
  }
  if (mode === 'first_weekday') {
    const first = getFirstWeekdayOfMonth(y, m, weekday)
    return first && formatISODate(first) === formatISODate(date)
  }
  if (mode === 'last_weekday') {
    const last = getLastWeekdayOfMonth(y, m, weekday)
    return last && formatISODate(last) === formatISODate(date)
  }
  return false
}

function isExcluded(date, rule) {
  if (!rule) return false
  const iso = formatISODate(date)
  return (rule.excludedDates || []).includes(iso)
}

function isPaused(date, rule) {
  if (!rule.paused) return false
  if (!rule.pausedUntil) return true
  const pauseEnd = parseISODate(rule.pausedUntil)
  return pauseEnd && date <= pauseEnd
}

export function generateOccurrenceDates(rule, anchorDateISO) {
  if (!rule?.enabled) return []
  const startISO = rule.startDate || anchorDateISO
  const endISO = rule.endDate
  if (!startISO || !endISO) return []

  const start = parseISODate(startISO)
  const end = parseISODate(endISO)
  const anchor = parseISODate(anchorDateISO || startISO)
  if (!start || !end || !anchor || start > end) return []

  const repeatEvery = Math.max(1, Number(rule.repeatEvery) || 1)
  const type = rule.repeatType || 'weekly'
  const dates = []
  const excluded = new Set(rule.excludedDates || [])

  if (type === 'daily' || type === 'custom') {
    let cursor = new Date(start)
    while (cursor <= end && dates.length < MAX_RECURRENCE_OCCURRENCES) {
      if (!isExcluded(cursor, rule) && !isPaused(cursor, rule)) {
        const iso = formatISODate(cursor)
        if (!excluded.has(iso)) dates.push(iso)
      }
      cursor = addDays(cursor, repeatEvery)
    }
    return dates
  }

  if (type === 'weekly') {
    const weekdays =
      rule.weekdays?.length > 0 ? rule.weekdays : [anchor.getDay()]
    let cursor = new Date(start)
    while (cursor <= end && dates.length < MAX_RECURRENCE_OCCURRENCES) {
      const dow = cursor.getDay()
      if (weekdays.includes(dow)) {
        const weekOffset = weeksBetween(start, cursor)
        if (weekOffset % repeatEvery === 0 && !isExcluded(cursor, rule) && !isPaused(cursor, rule)) {
          dates.push(formatISODate(cursor))
        }
      }
      cursor = addDays(cursor, 1)
    }
    return [...new Set(dates)].sort()
  }

  if (type === 'monthly') {
    let cursor = new Date(start.getFullYear(), start.getMonth(), 1)
    while (cursor <= end && dates.length < MAX_RECURRENCE_OCCURRENCES) {
      const monthIndex = monthsBetween(start, cursor)
      if (monthIndex % repeatEvery === 0) {
        const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
        for (let day = 1; day <= daysInMonth; day += 1) {
          const d = new Date(cursor.getFullYear(), cursor.getMonth(), day)
          if (d < start || d > end) continue
          if (matchesMonthly(d, rule, anchor) && !isExcluded(d, rule) && !isPaused(d, rule)) {
            dates.push(formatISODate(d))
          }
        }
      }
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + repeatEvery, 1)
    }
    return [...new Set(dates)].sort()
  }

  return dates
}

export function buildRecurrenceSummary(rule, anchorDateISO) {
  if (!rule?.enabled) return ''
  const dates = generateOccurrenceDates(rule, anchorDateISO)
  const count = dates.length
  if (!rule.startDate || !rule.endDate) {
    return 'Set start and end dates to preview your recurring schedule.'
  }

  const startFmt = formatDisplayDate(rule.startDate)
  const endFmt = formatDisplayDate(rule.endDate)
  const every = Math.max(1, Number(rule.repeatEvery) || 1)
  const type = rule.repeatType || 'weekly'

  let pattern = ''
  if (type === 'daily' || type === 'custom') {
    pattern =
      every === 1
        ? 'every day'
        : `every ${every} days`
  } else if (type === 'weekly') {
    const days = (rule.weekdays || [])
      .sort((a, b) => a - b)
      .map((d) => weekdayLabel[d])
      .join(', ')
    pattern = days
      ? every === 1
        ? `every ${days}`
        : `every ${every} weeks on ${days}`
      : 'on selected weekdays'
  } else if (type === 'monthly') {
    const mode = MONTHLY_MODES.find((m) => m.value === rule.monthlyMode)?.label
    pattern = every === 1 ? `monthly (${mode})` : `every ${every} months (${mode})`
  }

  const extras = []
  if (rule.paused) extras.push('series paused')
  if (rule.excludedDates?.length) extras.push(`${rule.excludedDates.length} excluded date(s)`)

  return `This class will repeat ${pattern} from ${startFmt} to ${endFmt} — ${count} session${count === 1 ? '' : 's'}${extras.length ? ` (${extras.join(', ')})` : ''}.`
}

function formatDisplayDate(iso) {
  const d = parseISODate(iso)
  if (!d) return iso
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function validateRecurrenceRule(rule, form) {
  const errors = []
  if (!rule?.enabled) return errors

  if (!rule.startDate) errors.push('Recurring start date is required')
  if (!rule.endDate) errors.push('Recurring end date is required')
  if (rule.startDate && rule.endDate && rule.startDate > rule.endDate) {
    errors.push('Recurring end date cannot be before start date')
  }
  if (rule.repeatType === 'weekly' && (!rule.weekdays || rule.weekdays.length === 0)) {
    errors.push('Select at least one weekday for weekly recurrence')
  }
  const repeatEvery = Number(rule.repeatEvery)
  if (!Number.isFinite(repeatEvery) || repeatEvery < 1 || repeatEvery > 52) {
    errors.push('Repeat interval must be between 1 and 52')
  }

  const dates = generateOccurrenceDates(rule, form.scheduledDate)
  if (dates.length === 0 && rule.startDate && rule.endDate) {
    errors.push('No sessions match this recurrence pattern — adjust dates or rules')
  }
  if (dates.length >= MAX_RECURRENCE_OCCURRENCES) {
    errors.push(`Recurrence exceeds maximum of ${MAX_RECURRENCE_OCCURRENCES} sessions`)
  }

  const seen = new Set()
  for (const d of dates) {
    if (seen.has(d)) errors.push('Duplicate session dates detected in recurrence')
    seen.add(d)
  }

  return errors
}

export function detectRecurrenceConflicts(dates, lessons, form, excludeIds = []) {
  const warnings = []
  const exclude = new Set(excludeIds)

  for (const date of dates) {
    const teacherConflict = lessons.find(
      (l) =>
        !exclude.has(l.id) &&
        l.lessonType === 'Live' &&
        l.teacher === form.teacher &&
        l.scheduledDate === date &&
        l.scheduledTime === form.scheduledTime &&
        l.status !== 'Disabled',
    )
    if (teacherConflict) {
      warnings.push(
        `Instructor conflict on ${formatDisplayDate(date)} at ${form.scheduledTime} — ${teacherConflict.lessonName}`,
      )
    }

    const batchConflict = lessons.find(
      (l) =>
        !exclude.has(l.id) &&
        l.lessonType === 'Live' &&
        l.subjectId === form.subjectId &&
        l.scheduledDate === date &&
        l.scheduledTime === form.scheduledTime &&
        l.status !== 'Disabled',
    )
    if (batchConflict && batchConflict.id !== teacherConflict?.id) {
      warnings.push(
        `Subject schedule overlap on ${formatDisplayDate(date)} — ${batchConflict.lessonName}`,
      )
    }
  }

  return [...new Set(warnings)]
}

export function appendRecurrenceHistory(rule, entry) {
  const safeRule = rule || {}
  const history = Array.isArray(safeRule.history) ? [...safeRule.history] : []
  history.unshift({
    id: `hist-${Date.now()}`,
    at: new Date().toISOString(),
    ...entry,
  })
  return { ...safeRule, history: history.slice(0, 20) }
}

/** Calendar integration payload (Google / Zoom / Teams ready) */
export function toCalendarRecurrencePayload(rule, lesson) {
  const dates = generateOccurrenceDates(rule, lesson.scheduledDate)
  return {
    provider: lesson.meetingProvider,
    timezone: rule.timezone || lesson.timezone,
    rrule: {
      freq: rule.repeatType,
      interval: rule.repeatEvery,
      until: rule.endDate,
      byweekday: rule.weekdays,
      monthlyMode: rule.monthlyMode,
    },
    exdates: rule.excludedDates || [],
    occurrences: dates.map((date) => ({
      date,
      time: lesson.scheduledTime,
      durationMinutes: lesson.duration,
      meetingLink: lesson.zoomLink,
    })),
  }
}
