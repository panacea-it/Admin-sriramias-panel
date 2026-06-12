import { useMemo, useState } from 'react'
import { CalendarDays, TrendingDown, TrendingUp } from 'lucide-react'
import { formatINR } from '../../utils/financeFilters'
import { cn } from '../../utils/cn'
import { FinancePeriodTabs } from './FinanceMiniCalendar'
import FinancePeriodDatePicker from './FinancePeriodDatePicker'
import { financeCardShell, financeCardSubtitle, financeCardTitle, financeChartCardHeader } from './financeCardStyles'
import {
  computeCollectionComparison,
  defaultCompareDate,
  startOfDay,
} from '../../utils/dailyCollectionUtils'

export default function DailyCollectionWidget({ payments = [], loading, className }) {
  const [period, setPeriod] = useState('daily')
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))
  const [compareDate, setCompareDate] = useState(() => defaultCompareDate(new Date(), 'daily'))

  const summary = useMemo(
    () =>
      computeCollectionComparison(payments, {
        period,
        selectedDate,
        compareDate,
      }),
    [payments, period, selectedDate, compareDate],
  )

  const trend = summary.trendPct ?? 0
  const TrendIcon = trend >= 0 ? TrendingUp : TrendingDown
  const periodHint =
    period === 'daily'
      ? 'Select a date and compare with any previous day'
      : period === 'weekly'
        ? 'View weekly totals and compare with another week'
        : 'View monthly totals and compare with another month'

  const handlePeriodChange = (nextPeriod) => {
    setPeriod(nextPeriod)
    setCompareDate(defaultCompareDate(selectedDate, nextPeriod))
  }

  const handleSelectDate = (date) => {
    const next = startOfDay(date)
    setSelectedDate(next)
    setCompareDate(defaultCompareDate(next, period))
  }

  const handleSelectCompareDate = (date) => {
    const next = startOfDay(date)
    const max = startOfDay(selectedDate)
    setCompareDate(next.getTime() > max.getTime() ? max : next)
  }

  return (
    <div className={cn(financeCardShell, 'flex h-full min-h-0 flex-col', className)}>
      <div className={financeChartCardHeader}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className={financeCardTitle}>Daily Collection</h3>
            <p className={financeCardSubtitle}>{periodHint}</p>
          </div>
          <CalendarDays className="h-5 w-5 shrink-0 text-white/80" aria-hidden="true" />
        </div>
        <FinancePeriodTabs period={period} onChange={handlePeriodChange} className="mt-3" />
      </div>

      <div className="flex flex-1 flex-col space-y-3 p-4 pb-5 sm:p-5 sm:pb-6">
        {loading ? (
          <div className="min-h-[120px] flex-1 animate-pulse rounded-lg bg-slate-100" />
        ) : (
          <>
            <FinancePeriodDatePicker
              label="Select period"
              period={period}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />

            <div className="flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#686868]">
                  Showing: <span className="text-[#246392]">{summary.primaryLabel}</span>
                </p>
                <p className="text-2xl font-bold text-[#1a3a5c] sm:text-3xl">
                  {formatINR(summary.primaryAmount ?? 0)}
                </p>
                <p className="mt-1 text-xs text-[#686868]">{summary.primaryCount ?? 0} transactions</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#686868]">Compare: {summary.compareLabel}</p>
                <p className="text-sm font-semibold text-[#222]">{formatINR(summary.compareAmount ?? 0)}</p>
                <p
                  className={cn(
                    'mt-1 inline-flex items-center gap-1 text-sm font-bold',
                    trend >= 0 ? 'text-[#69df66]' : 'text-[#df8284]',
                  )}
                  title="Change vs comparison period"
                >
                  <TrendIcon className="h-4 w-4" />
                  {trend >= 0 ? '+' : ''}
                  {trend}%
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
              <FinancePeriodDatePicker
                label="Compare with"
                period={period}
                selectedDate={compareDate}
                onSelectDate={handleSelectCompareDate}
                maxDate={selectedDate}
                id="collection-compare-date"
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
