import { Fragment, useCallback, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'
import CalendarFilterToolbar from './calendar/CalendarFilterToolbar'
import CalendarEventChip from './calendar/CalendarEventChip'
import CalendarLegend from './calendar/CalendarLegend'
import CalendarEmptyState from './calendar/CalendarEmptyState'
import { useCalendarFilters } from '../../hooks/useCalendarFilters'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7)

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function startOfWeek(date) {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function eventsForDay(events, day) {
  return events.filter((e) => e.date && sameDay(e.date, day))
}

export default function LiveClassesCalendar({
  lessons,
  headerCenter = 'All Centers',
  centerOptions = [],
  onReschedule,
  onEventClick,
}) {
  const [view, setView] = useState('month')
  const [cursor, setCursor] = useState(() => new Date())
  const [dragLesson, setDragLesson] = useState(null)
  const [jumpDate, setJumpDate] = useState('')

  const {
    filters,
    setFilter,
    toggleExtraCenter,
    resetFilters,
    hasActiveFilters,
    filteredEvents,
    facultyOptions,
    subjectOptions,
    statusOptions,
    sessionTypeOptions,
    classroomOptions,
  } = useCalendarFilters(lessons, headerCenter)

  const monthGrid = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const first = new Date(year, month, 1)
    const start = new Date(first)
    start.setDate(start.getDate() - start.getDay())
    const cells = []
    for (let i = 0; i < 42; i++) {
      const day = addDays(start, i)
      cells.push({
        date: day,
        inMonth: day.getMonth() === month,
        events: eventsForDay(filteredEvents, day),
      })
    }
    return cells
  }, [cursor, filteredEvents])

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor)
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(start, i)
      return { date: day, events: eventsForDay(filteredEvents, day) }
    })
  }, [cursor, filteredEvents])

  const dayEvents = useMemo(
    () =>
      eventsForDay(filteredEvents, cursor).sort((a, b) =>
        (a.lesson.scheduledTime || '').localeCompare(b.lesson.scheduledTime || ''),
      ),
    [cursor, filteredEvents],
  )

  const navLabel = () => {
    if (view === 'month') {
      return cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    }
    if (view === 'week') {
      const s = startOfWeek(cursor)
      const e = addDays(s, 6)
      return `${s.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${e.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
    }
    return cursor.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const shift = useCallback(
    (dir) => {
      const d = new Date(cursor)
      if (view === 'month') d.setMonth(d.getMonth() + dir)
      else if (view === 'week') d.setDate(d.getDate() + dir * 7)
      else d.setDate(d.getDate() + dir)
      setCursor(d)
    },
    [cursor, view],
  )

  const goToToday = useCallback(() => setCursor(new Date()), [])

  const goToJumpDate = useCallback(() => {
    if (!jumpDate) return
    const [y, m, d] = jumpDate.split('-').map(Number)
    if (y && m && d) setCursor(new Date(y, m - 1, d))
  }, [jumpDate])

  const onDropDay = useCallback(
    (targetDate, e) => {
      e.preventDefault()
      const id = e.dataTransfer.getData('lessonId') || dragLesson?.id
      if (!id) return
      const y = targetDate.getFullYear()
      const m = String(targetDate.getMonth() + 1).padStart(2, '0')
      const day = String(targetDate.getDate()).padStart(2, '0')
      onReschedule?.(id, {
        scheduledDate: `${y}-${m}-${day}`,
        scheduledTime: dragLesson?.scheduledTime || '10:00',
      })
      setDragLesson(null)
    },
    [dragLesson, onReschedule],
  )

  const viewTransition = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
    transition: { duration: 0.22, ease: 'easeOut' },
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_11px_25px_rgba(15,23,42,0.06)] ring-1 ring-[#e8f4fc]">
      <CalendarFilterToolbar
        filters={filters}
        setFilter={setFilter}
        toggleExtraCenter={toggleExtraCenter}
        resetFilters={resetFilters}
        hasActiveFilters={hasActiveFilters}
        facultyOptions={facultyOptions}
        subjectOptions={subjectOptions}
        statusOptions={statusOptions}
        sessionTypeOptions={sessionTypeOptions}
        classroomOptions={classroomOptions}
        centerOptions={centerOptions}
        headerCenter={headerCenter}
      />

      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[#f0ebfa] bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => shift(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef2fc] text-[#246392] transition hover:bg-[#e8f4fc] hover:shadow-sm"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef2fc] text-[#246392] transition hover:bg-[#e8f4fc] hover:shadow-sm"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <h2 className="text-base font-bold tracking-tight text-[#1a3a5c] sm:text-lg">
            {navLabel()}
          </h2>
          <button
            type="button"
            onClick={goToToday}
            className="rounded-lg bg-[#eef6fc] px-3 py-1.5 text-xs font-bold text-[#246392] transition hover:bg-[#55ace7] hover:text-white"
          >
            Today
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-[#9ca0a8]" aria-hidden />
            <input
              type="date"
              value={jumpDate}
              onChange={(e) => setJumpDate(e.target.value)}
              className="h-9 rounded-lg border border-[#e8f4fc] px-2 text-xs font-medium text-[#1a3a5c]"
              aria-label="Jump to date"
            />
            <button
              type="button"
              onClick={goToJumpDate}
              disabled={!jumpDate}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#246392] transition hover:bg-[#eef2fc] disabled:opacity-40"
            >
              Go
            </button>
          </div>
          <div className="flex rounded-lg bg-[#eef2fc] p-1">
            {['month', 'week', 'day'].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition sm:text-sm',
                  view === v
                    ? 'bg-[#55ace7] text-white shadow'
                    : 'text-[#246392] hover:bg-white/60',
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredEvents.length === 0 && (
        <div className="px-4 pt-4 sm:px-6">
          <CalendarEmptyState hasFilters={hasActiveFilters} onReset={resetFilters} />
        </div>
      )}

      <AnimatePresence mode="wait">
          {view === 'month' && (
            <motion.div key="month" {...viewTransition} className="p-3 sm:p-5">
              <div className="mb-2 grid grid-cols-7 gap-1.5 sm:gap-2">
                {WEEKDAYS.map((d) => (
                  <div
                    key={d}
                    className="py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-[#9ca0a8] sm:text-xs"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {monthGrid.map(({ date, inMonth, events }) => (
                  <div
                    key={date.toISOString()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDropDay(date, e)}
                    className={cn(
                      'min-h-[92px] rounded-xl border p-1.5 transition-all duration-200 sm:min-h-[110px]',
                      inMonth ? 'border-[#e8f4fc] bg-white' : 'border-transparent bg-[#fafafa] opacity-50',
                      sameDay(date, new Date()) && 'ring-2 ring-[#55ace7]/50 shadow-sm',
                    )}
                  >
                    <span
                      className={cn(
                        'mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                        sameDay(date, new Date())
                          ? 'bg-[#55ace7] text-white shadow'
                          : 'text-[#686868]',
                      )}
                    >
                      {date.getDate()}
                    </span>
                    <div className="space-y-0.5">
                      {events.slice(0, 3).map((ev) => (
                        <CalendarEventChip
                          key={ev.id}
                          event={ev}
                          compact
                          onClick={onEventClick}
                          onDragStart={setDragLesson}
                        />
                      ))}
                      {events.length > 3 && (
                        <button
                          type="button"
                          onClick={() => {
                            setCursor(new Date(date))
                            setView('day')
                          }}
                          className="w-full text-left text-[10px] font-semibold text-[#55ace7] hover:underline"
                        >
                          +{events.length - 3} more
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'week' && (
            <motion.div
              key="week"
              {...viewTransition}
              className="overflow-x-auto p-3 sm:p-5"
            >
              <div className="grid min-w-[680px] grid-cols-8 gap-1.5">
                <div />
                {weekDays.map(({ date }) => (
                  <div
                    key={date.toISOString()}
                    className={cn(
                      'rounded-lg py-2 text-center text-xs font-bold',
                      sameDay(date, new Date())
                        ? 'bg-[#55ace7]/10 text-[#55ace7]'
                        : 'text-[#686868]',
                    )}
                  >
                    {WEEKDAYS[date.getDay()]} {date.getDate()}
                  </div>
                ))}
                {HOURS.map((hour) => (
                  <Fragment key={hour}>
                    <div className="py-2 pr-2 text-right text-[11px] font-medium text-[#9ca0a8]">
                      {hour}:00
                    </div>
                    {weekDays.map(({ date, events }) => {
                      const slot = events.filter((ev) => {
                        const h = parseInt(ev.lesson.scheduledTime?.split(':')[0] || '0', 10)
                        return h === hour
                      })
                      return (
                        <div
                          key={`${date}-${hour}`}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => onDropDay(date, e)}
                          className="min-h-[52px] rounded-lg border border-[#f0ebfa] bg-[#fafbff]/80 p-0.5 transition hover:bg-white"
                        >
                          {slot.map((ev) => (
                            <CalendarEventChip
                              key={ev.id}
                              event={ev}
                              onClick={onEventClick}
                              onDragStart={setDragLesson}
                            />
                          ))}
                        </div>
                      )
                    })}
                  </Fragment>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'day' && (
            <motion.div key="day" {...viewTransition} className="space-y-3 p-3 sm:p-5">
              {dayEvents.length === 0 ? (
                <p className="py-12 text-center text-sm text-[#9ca0a8]">
                  No events scheduled for this day
                </p>
              ) : (
                dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex flex-wrap items-center gap-4 rounded-xl border border-[#e8f4fc] bg-gradient-to-r from-[#fafbff] to-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="text-sm font-mono font-bold text-[#55ace7]">
                      {ev.lesson.scheduledTime}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#222]">{ev.className}</p>
                      <p className="text-xs text-[#686868]">
                        {ev.faculty} · {ev.subject} · {ev.center} · {ev.sessionTypeLabel}
                      </p>
                    </div>
                    <div className="w-full sm:w-auto sm:min-w-[200px]">
                      <CalendarEventChip
                        event={ev}
                        onClick={onEventClick}
                        onDragStart={setDragLesson}
                      />
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
      </AnimatePresence>

      <CalendarLegend />
    </div>
  )
}
