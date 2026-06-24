import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { buildMiniCalendarDays, isSameCalendarDay } from '../../utils/dailyCollectionUtils'
import { cn } from '../../utils/cn'

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const FINANCE_COLLECTION_PERIODS = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
]

export function FinancePeriodTabs({ period, onChange, className, periods = FINANCE_COLLECTION_PERIODS }) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {periods.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold transition',
            period === item.id
              ? 'bg-white text-[#1a3a5c]'
              : 'bg-white/15 text-white hover:bg-white/25',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export default function FinanceMiniCalendar({
  month,
  selectedDate,
  onSelectDate,
  onMonthChange,
  variant = 'light',
  disabled = false,
  size = 'default',
  className,
}) {
  const days = useMemo(() => buildMiniCalendarDays(month), [month])
  const monthLabel = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(month)
  const isDark = variant === 'dark'
  const isCompact = size === 'compact'

  return (
    <div
      className={cn(
        'rounded-lg border',
        isCompact ? 'p-1.5' : 'p-2.5',
        isDark ? 'border-white/20 bg-white/10' : 'border-slate-200 bg-slate-50/80',
        className,
      )}
    >
      <div className={cn('flex items-center justify-between', isCompact ? 'mb-1' : 'mb-2')}>
        <button
          type="button"
          onClick={() => onMonthChange(-1)}
          className={cn(
            'rounded-md p-1 transition',
            isDark ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-white hover:text-[#246392]',
          )}
          aria-label="Previous month"
        >
          <ChevronLeft className={cn(isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
        </button>
        <p
          className={cn(
            'font-semibold',
            isCompact ? 'text-[10px]' : 'text-xs',
            isDark ? 'text-white' : 'text-[#1a3a5c]',
          )}
        >
          {monthLabel}
        </p>
        <button
          type="button"
          onClick={() => onMonthChange(1)}
          className={cn(
            'rounded-md p-1 transition',
            isDark ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-white hover:text-[#246392]',
          )}
          aria-label="Next month"
        >
          <ChevronRight className={cn(isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
        </button>
      </div>
      <div
        className={cn(
          'grid grid-cols-7 text-center font-semibold uppercase',
          isCompact ? 'gap-0.5 text-[9px]' : 'gap-1 text-[10px]',
          isDark ? 'text-white/50' : 'text-slate-400',
        )}
      >
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className={cn('grid grid-cols-7', isCompact ? 'mt-0.5 gap-0.5' : 'mt-1 gap-1')}>
        {days.map(({ date, inMonth }) => {
          const isSelected = isSameCalendarDay(date, selectedDate)
          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDate?.(date)}
              className={cn(
                'rounded-md font-medium transition',
                isCompact ? 'h-5 text-[10px]' : 'h-7 text-xs',
                disabled && 'cursor-not-allowed opacity-60',
                !inMonth && (isDark ? 'text-white/25' : 'text-slate-300'),
                inMonth && !isSelected && !disabled && (isDark ? 'text-white/90 hover:bg-white/15' : 'text-slate-700 hover:bg-white'),
                inMonth && !isSelected && disabled && (isDark ? 'text-white/90' : 'text-slate-700'),
                isSelected && !disabled && 'bg-[#246392] text-white hover:bg-[#246392]',
                isSelected && disabled && 'bg-[#246392]/70 text-white',
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
