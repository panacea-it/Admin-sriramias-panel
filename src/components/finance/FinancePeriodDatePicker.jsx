import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays } from 'lucide-react'
import { cn } from '../../utils/cn'
import FinanceMiniCalendar from './FinanceMiniCalendar'
import { formatPeriodLabel, startOfDay } from '../../utils/dailyCollectionUtils'

export default function FinancePeriodDatePicker({
  period = 'daily',
  selectedDate,
  onSelectDate,
  label,
  className,
  maxDate,
  id,
  buttonClassName,
}) {
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState(null)
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfDay(selectedDate || new Date()),
  )
  const containerRef = useRef(null)
  const buttonRef = useRef(null)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!selectedDate) return
    setCalendarMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
  }, [selectedDate])

  useEffect(() => {
    if (!open || !buttonRef.current) return undefined

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
  }, [open])

  const handleSelect = (date) => {
    const next = startOfDay(date)
    if (maxDate && next.getTime() > startOfDay(maxDate).getTime()) return
    onSelectDate?.(next)
    setOpen(false)
  }

  const updatePanelPosition = () => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const panelWidth = Math.min(288, window.innerWidth - 16)
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - panelWidth - 8)
    setPanelStyle({
      top: rect.bottom + 6,
      left,
      width: panelWidth,
    })
  }

  const handleToggle = () => {
    setOpen((value) => {
      const next = !value
      if (next) updatePanelPosition()
      return next
    })
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label ? (
        <span className="mb-1.5 block text-xs font-semibold text-[#686868]">{label}</span>
      ) : null}
      <button
        ref={buttonRef}
        type="button"
        id={id}
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left text-sm text-slate-800 outline-none transition hover:border-[#246392]/40 focus:border-[#246392] focus:ring-2 focus:ring-[#246392]/15',
          buttonClassName,
        )}
      >
        <span>{formatPeriodLabel(selectedDate, period)}</span>
        <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      </button>
      {open && panelStyle
        ? createPortal(
            <div
              ref={panelRef}
              className="fixed z-[120] rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
              style={panelStyle}
              role="dialog"
              aria-label={label || 'Choose date'}
            >
              <FinanceMiniCalendar
                size="compact"
                month={calendarMonth}
                selectedDate={selectedDate}
                onSelectDate={handleSelect}
                onMonthChange={(delta) =>
                  setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
                }
              />
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
