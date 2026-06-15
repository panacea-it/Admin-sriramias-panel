import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import {
  buildMiniCalendarDays,
  isSameCalendarDay,
  startOfDay,
} from '../../utils/dailyCollectionUtils'
import { cn } from '../../utils/cn'

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function formatCrmFilterDate(date) {
  if (!date) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

function buildYearRange(anchorYear) {
  const start = anchorYear - 10
  const end = anchorYear + 10
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

function CrmFilterCalendar({ viewMonth, selectedDate, onSelectDate, onViewMonthChange, open }) {
  const [panelView, setPanelView] = useState('days')
  const [pickerYear, setPickerYear] = useState(viewMonth.getFullYear())
  const yearListRef = useRef(null)

  useEffect(() => {
    if (open) setPanelView('days')
  }, [open])

  useEffect(() => {
    setPickerYear(viewMonth.getFullYear())
  }, [viewMonth])

  useEffect(() => {
    if (panelView !== 'years' || !yearListRef.current) return
    const active = yearListRef.current.querySelector('[data-active="true"]')
    active?.scrollIntoView({ block: 'center' })
  }, [panelView, pickerYear])

  const days = useMemo(() => buildMiniCalendarDays(viewMonth), [viewMonth])
  const monthTitle = new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(viewMonth)
  const years = useMemo(() => buildYearRange(viewMonth.getFullYear()), [viewMonth])

  const handlePreviousMonth = () => {
    onViewMonthChange(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    onViewMonthChange(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
  }

  const handleYearSelect = (year) => {
    setPickerYear(year)
    setPanelView('months')
  }

  const handleMonthSelect = (monthIndex) => {
    onViewMonthChange(new Date(pickerYear, monthIndex, 1))
    setPanelView('days')
  }

  if (panelView === 'years') {
    return (
      <div className="p-3">
        <p className="mb-2 text-center text-sm font-semibold text-[#1a3a5c]">Select Year</p>
        <div
          ref={yearListRef}
          className="custom-scrollbar max-h-[240px] overflow-y-auto rounded-lg border border-slate-100"
        >
          {years.map((year) => {
            const isActive = year === pickerYear
            return (
              <button
                key={year}
                type="button"
                data-active={isActive ? 'true' : 'false'}
                onClick={() => handleYearSelect(year)}
                className={cn(
                  'flex w-full items-center justify-center px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-[#55ace7] text-white'
                    : 'text-[#333] hover:bg-[#eef6fc] hover:text-[#246392]',
                )}
              >
                {year}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (panelView === 'months') {
    return (
      <div className="p-3">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPanelView('years')}
            className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-[#246392]"
            aria-label="Back to year selection"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold text-[#1a3a5c]">{pickerYear}</p>
          <span className="w-6" aria-hidden />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MONTH_LABELS.map((label, index) => {
            const isActive =
              selectedDate &&
              selectedDate.getFullYear() === pickerYear &&
              selectedDate.getMonth() === index
            return (
              <button
                key={label}
                type="button"
                onClick={() => handleMonthSelect(index)}
                className={cn(
                  'rounded-lg px-2 py-2.5 text-sm font-semibold transition',
                  isActive
                    ? 'bg-[#55ace7] text-white shadow-sm'
                    : 'text-[#333] hover:bg-[#eef6fc] hover:text-[#246392]',
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="p-3">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePreviousMonth}
          className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#246392]"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setPickerYear(viewMonth.getFullYear())
            setPanelView('years')
          }}
          className="rounded-md px-2 py-1 text-sm font-semibold text-[#1a3a5c] transition hover:bg-[#eef6fc] hover:text-[#246392]"
        >
          {monthTitle}
        </button>
        <button
          type="button"
          onClick={handleNextMonth}
          className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#246392]"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-wide text-[#9ca0a8]">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="py-1">
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map(({ date, inMonth }) => {
          const isSelected = isSameCalendarDay(date, selectedDate)
          const isToday = isSameCalendarDay(date, new Date())
          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onSelectDate?.(date)}
              className={cn(
                'flex h-9 w-full items-center justify-center rounded-lg text-sm font-medium transition',
                !inMonth && 'text-slate-300',
                inMonth &&
                  !isSelected &&
                  'text-[#333] hover:bg-[#eef6fc] hover:text-[#246392]',
                inMonth && isToday && !isSelected && 'font-semibold text-[#55ace7]',
                isSelected && 'bg-[#55ace7] text-white shadow-sm hover:bg-[#4a9fd8]',
              )}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function CrmDateFilterPicker({ value, onChange, className, tone = 'gradient' }) {
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState(null)
  const [viewMonth, setViewMonth] = useState(() =>
    startOfDay(value || new Date()),
  )
  const containerRef = useRef(null)
  const buttonRef = useRef(null)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!value) return
    setViewMonth(new Date(value.getFullYear(), value.getMonth(), 1))
  }, [value])

  const updatePanelPosition = useCallback(() => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const panelWidth = Math.min(320, window.innerWidth - 16)
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - panelWidth - 8)
    const estimatedHeight = 340
    const spaceBelow = window.innerHeight - rect.bottom
    const openAbove = spaceBelow < estimatedHeight && rect.top > estimatedHeight
    setPanelStyle({
      top: openAbove ? rect.top - estimatedHeight - 6 : rect.bottom + 6,
      left,
      width: panelWidth,
    })
  }, [])

  useEffect(() => {
    if (!open) return undefined

    updatePanelPosition()
    window.addEventListener('resize', updatePanelPosition)
    window.addEventListener('scroll', updatePanelPosition, true)

    const onPointerDown = (event) => {
      const target = event.target
      if (
        containerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('resize', updatePanelPosition)
      window.removeEventListener('scroll', updatePanelPosition, true)
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, updatePanelPosition])

  const handleToggle = () => {
    setOpen((prev) => {
      const next = !prev
      if (next) {
        const anchor = value ? startOfDay(value) : startOfDay(new Date())
        setViewMonth(new Date(anchor.getFullYear(), anchor.getMonth(), 1))
        updatePanelPosition()
      }
      return next
    })
  }

  const handleDateSelect = (date) => {
    onChange?.(startOfDay(date))
    setOpen(false)
  }

  const handleClear = (event) => {
    event?.stopPropagation?.()
    onChange?.(null)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={cn('relative w-full sm:w-auto sm:min-w-[148px]', className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Select date"
        className={cn(
          'relative flex h-10 w-full min-h-[40px] cursor-pointer items-center gap-2 rounded-lg border-0 pl-3.5 pr-9 text-sm font-semibold text-white shadow-sm outline-none transition-all duration-200',
          tone === 'solid'
            ? 'bg-[#55ace7] hover:bg-[#4a9fd8] focus:ring-2 focus:ring-[#246392]/50'
            : 'bg-gradient-to-b from-[#55ace7] to-[#3d8fd4] hover:from-[#4a9fd8] hover:to-[#3589c8] focus:ring-2 focus:ring-[#246392]/40',
          open && (tone === 'solid' ? 'ring-2 ring-[#246392]/50' : 'ring-2 ring-[#246392]/40'),
        )}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-white/90" aria-hidden />
        <span className="truncate">{value ? formatCrmFilterDate(value) : 'Select Date'}</span>
        <ChevronDown
          className={cn(
            'pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear date filter"
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#246392] shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          <X className="h-3 w-3" strokeWidth={2.5} />
        </button>
      )}

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && panelStyle && (
              <motion.div
                ref={panelRef}
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.21, 1.02, 0.48, 1] }}
                className="fixed z-[120] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.15)]"
                style={panelStyle}
                role="dialog"
                aria-label="Choose date"
              >
                <CrmFilterCalendar
                  viewMonth={viewMonth}
                  selectedDate={value}
                  onSelectDate={handleDateSelect}
                  onViewMonthChange={setViewMonth}
                  open={open}
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  )
}
