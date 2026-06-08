import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CalendarRange, History, PauseCircle, PlayCircle } from 'lucide-react'
import {
  CourseFormField,
  CourseInput,
  CourseSelect,
  CourseTextarea,
} from '../courses/CourseFormField'
import {
  MONTHLY_MODES,
  REPEAT_TYPES,
  WEEKDAY_OPTIONS,
} from '../../constants/recurrence'
import {
  buildRecurrenceSummary,
  detectRecurrenceConflicts,
  generateOccurrenceDates,
} from '../../utils/recurrenceEngine'
import { cn } from '../../utils/cn'

function WeekdayChip({ day, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'h-9 min-w-[44px] rounded-lg px-2 text-xs font-bold transition',
        selected
          ? 'bg-[#55ace7] text-white shadow-[0_2px_8px_rgba(85,172,231,0.35)]'
          : 'bg-[#eef2fc] text-[#444] hover:bg-[#dbeafe]',
      )}
    >
      {day.short}
    </button>
  )
}

export default function RecurringScheduleSection({
  enabled,
  recurrence,
  onRecurrenceChange,
  anchorDate,
  anchorTime,
  lessons = [],
  excludeLessonIds = [],
  teacher = '',
  subjectId = '',
  actorName = 'Admin',
}) {
  const rule = recurrence
    ? {
        excludedDates: [],
        weekdays: [],
        history: [],
        ...recurrence,
        excludedDates: Array.isArray(recurrence.excludedDates) ? recurrence.excludedDates : [],
      }
    : {}
  const dates = useMemo(
    () => (enabled ? generateOccurrenceDates(rule, anchorDate) : []),
    [enabled, rule, anchorDate],
  )

  const summary = useMemo(
    () => (enabled ? buildRecurrenceSummary(rule, anchorDate) : ''),
    [enabled, rule, anchorDate],
  )

  const conflicts = useMemo(() => {
    if (!enabled || !anchorTime) return []
    return detectRecurrenceConflicts(
      dates,
      lessons,
      { teacher, subjectId, scheduledTime: anchorTime },
      excludeLessonIds,
    )
  }, [enabled, dates, lessons, anchorTime, teacher, subjectId, excludeLessonIds])

  const patch = (updates) => onRecurrenceChange({ ...rule, ...updates })

  const toggleWeekday = (value) => {
    const current = rule.weekdays || []
    const next = current.includes(value)
      ? current.filter((d) => d !== value)
      : [...current, value].sort((a, b) => a - b)
    patch({ weekdays: next })
  }

  const addExcludedDate = (iso) => {
    if (!iso) return
    const list = rule.excludedDates || []
    if (list.includes(iso)) return
    patch({ excludedDates: [...list, iso].sort() })
  }

  const removeExcluded = (iso) => {
    patch({ excludedDates: (rule.excludedDates || []).filter((d) => d !== iso) })
  }

  return (
    <AnimatePresence initial={false}>
      {enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          className="overflow-hidden"
        >
          <div className="mt-4 space-y-5 rounded-2xl border border-[#cfe8f8] bg-gradient-to-br from-[#f8fbff] to-white p-5 shadow-[0_8px_24px_rgba(36,99,146,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#55ace7]/15 text-[#246392]">
                  <CalendarRange className="h-4 w-4" />
                </span>
                <h4 className="text-sm font-bold uppercase tracking-wide text-[#246392]">
                  Recurring schedule
                </h4>
              </div>
              <span className="rounded-full bg-[#246392] px-3 py-1 text-xs font-bold text-white">
                {dates.length} session{dates.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <CourseFormField label="Recurring start date" required>
                <CourseInput
                  type="date"
                  value={rule.startDate || ''}
                  onChange={(e) => patch({ startDate: e.target.value })}
                />
              </CourseFormField>
              <CourseFormField label="Recurring end date" required>
                <CourseInput
                  type="date"
                  value={rule.endDate || ''}
                  onChange={(e) => patch({ endDate: e.target.value })}
                />
              </CourseFormField>
              <CourseFormField label="Repeat every">
                <CourseInput
                  type="number"
                  min={1}
                  max={52}
                  value={rule.repeatEvery ?? 1}
                  onChange={(e) => patch({ repeatEvery: Number(e.target.value) || 1 })}
                />
              </CourseFormField>
              <CourseFormField label="Repeat type">
                <CourseSelect
                  value={rule.repeatType || 'weekly'}
                  onChange={(e) => patch({ repeatType: e.target.value })}
                >
                  {REPEAT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </CourseSelect>
              </CourseFormField>
            </div>

            {rule.repeatType === 'weekly' && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#686868]">
                  Repeat on weekdays
                </p>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAY_OPTIONS.map((day) => (
                    <WeekdayChip
                      key={day.value}
                      day={day}
                      selected={(rule.weekdays || []).includes(day.value)}
                      onToggle={() => toggleWeekday(day.value)}
                    />
                  ))}
                </div>
              </div>
            )}

            {rule.repeatType === 'monthly' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <CourseFormField label="Monthly pattern">
                  <CourseSelect
                    value={rule.monthlyMode || 'same_date'}
                    onChange={(e) => patch({ monthlyMode: e.target.value })}
                  >
                    {MONTHLY_MODES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </CourseSelect>
                </CourseFormField>
                {(rule.monthlyMode === 'first_weekday' ||
                  rule.monthlyMode === 'last_weekday') && (
                  <CourseFormField label="Weekday">
                    <CourseSelect
                      value={rule.monthlyWeekday ?? 1}
                      onChange={(e) => patch({ monthlyWeekday: Number(e.target.value) })}
                    >
                      {WEEKDAY_OPTIONS.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </CourseSelect>
                  </CourseFormField>
                )}
              </div>
            )}

            <div className="rounded-xl bg-[#eef6fc] px-4 py-3 text-sm leading-relaxed text-[#1a3a5c]">
              {summary || 'Configure recurrence to see a schedule preview.'}
            </div>

            {conflicts.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  Scheduling conflicts detected
                </p>
                <ul className="list-inside list-disc space-y-1 text-xs text-amber-900">
                  {conflicts.slice(0, 5).map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                  {conflicts.length > 5 && (
                    <li>+{conflicts.length - 5} more conflicts</li>
                  )}
                </ul>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl bg-white p-4 ring-1 ring-[#e8f4fc]">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#686868]">
                  Exclude dates (holidays / breaks)
                </p>
                <div className="flex flex-wrap gap-2">
                  <CourseInput
                    type="date"
                    className="max-w-[180px]"
                    onChange={(e) => {
                      addExcludedDate(e.target.value)
                      e.target.value = ''
                    }}
                  />
                  <span className="self-center text-xs text-[#686868]">Add date to exclude</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(rule.excludedDates || []).map((iso) => (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => removeExcluded(iso)}
                      className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-[#444] hover:bg-red-50 hover:text-red-600"
                      title="Remove exclusion"
                    >
                      {iso} ×
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-white p-4 ring-1 ring-[#e8f4fc]">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#686868]">
                  Series controls
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      patch({
                        paused: !rule.paused,
                        pausedUntil: rule.paused ? '' : rule.endDate,
                      })
                    }
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition',
                      rule.paused
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-[#eef2fc] text-[#246392] hover:bg-[#dbeafe]',
                    )}
                  >
                    {rule.paused ? (
                      <PlayCircle className="h-4 w-4" />
                    ) : (
                      <PauseCircle className="h-4 w-4" />
                    )}
                    {rule.paused ? 'Resume series' : 'Pause series'}
                  </button>
                </div>
                {rule.paused && (
                  <CourseFormField label="Paused until" className="mt-3">
                    <CourseInput
                      type="date"
                      value={rule.pausedUntil || ''}
                      onChange={(e) => patch({ pausedUntil: e.target.value })}
                    />
                  </CourseFormField>
                )}
              </div>
            </div>

            <CourseFormField label="Recurring session notes">
              <CourseTextarea
                rows={2}
                value={rule.notes || ''}
                onChange={(e) => patch({ notes: e.target.value })}
                placeholder="Optional notes for instructors or calendar exports…"
              />
            </CourseFormField>

            <div className="rounded-xl bg-white p-4 ring-1 ring-[#e8f4fc]">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#686868]">
                <History className="h-3.5 w-3.5" />
                Recurrence history
              </p>
              {(rule.history || []).length === 0 ? (
                <p className="text-xs text-[#9ca0a8]">No changes recorded yet.</p>
              ) : (
                <ul className="max-h-32 space-y-2 overflow-y-auto">
                  {(rule.history || []).slice(0, 8).map((h) => (
                    <li key={h.id} className="text-xs text-[#444]">
                      <span className="font-semibold text-[#246392]">{h.action}</span>
                      {' · '}
                      {h.by || actorName}
                      {' · '}
                      {new Date(h.at).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                      {h.detail ? ` — ${h.detail}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="text-[11px] text-[#9ca0a8]">
              Calendar-ready: recurrence rules export to Google Calendar, Zoom, and Teams when
              integrations are enabled. Timezone: {rule.timezone || 'Asia/Kolkata'} (DST-aware).
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
