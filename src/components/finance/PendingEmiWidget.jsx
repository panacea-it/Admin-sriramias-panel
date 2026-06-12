import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarDays, Clock } from 'lucide-react'
import { formatINR } from '../../utils/financeFilters'
import { cn } from '../../utils/cn'
import FinanceStatCard from './FinanceStatCard'
import { FinancePeriodTabs } from './FinanceMiniCalendar'
import FinancePeriodDatePicker from './FinancePeriodDatePicker'
import { financeCardShell, financeCardSubtitle, financeCardTitle, financeChartCardHeader } from './financeCardStyles'
import { formatPeriodLabel, startOfDay } from '../../utils/dailyCollectionUtils'
import { computePendingEmiStats } from '../../utils/pendingEmiUtils'

export default function PendingEmiWidget({
  payments = [],
  emiPlans = [],
  stats = {},
  loading,
  className,
}) {
  const [period, setPeriod] = useState('daily')
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))

  const periodHint =
    period === 'daily'
      ? 'Select a date to view pending EMI for that day'
      : period === 'weekly'
        ? 'View pending EMI for the selected week'
        : 'View pending EMI for the selected month'

  const metrics = useMemo(
    () =>
      computePendingEmiStats(
        payments,
        emiPlans,
        { period, selectedDate },
        {
          pendingRevenue: stats.pendingRevenue,
          emiAmount: stats.totalDue,
          overdueAmount: stats.overdueAmount,
          failedPayments: stats.failedPayments,
        },
      ),
    [payments, emiPlans, period, selectedDate, stats],
  )

  const periodLabel = formatPeriodLabel(selectedDate, period)

  const handlePeriodChange = (nextPeriod) => {
    setPeriod(nextPeriod)
  }

  const handleSelectDate = (date) => {
    setSelectedDate(startOfDay(date))
  }

  return (
    <div className={cn(financeCardShell, className)}>
      <div className={financeChartCardHeader}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className={financeCardTitle}>Pending EMI</h3>
            <p className={financeCardSubtitle}>{periodHint}</p>
          </div>
          <CalendarDays className="h-5 w-5 shrink-0 text-white/80" aria-hidden="true" />
        </div>
        <FinancePeriodTabs period={period} onChange={handlePeriodChange} className="mt-3" />
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        {loading ? (
          <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
        ) : (
          <>
            <FinancePeriodDatePicker
              label="Select period"
              period={period}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />

            <p className="border-t border-slate-100 pt-3 text-xs font-semibold uppercase tracking-wide text-[#686868]">
              Showing: <span className="text-[#246392]">{periodLabel}</span>
            </p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FinanceStatCard
                label="Pending revenue"
                value={formatINR(metrics.pendingRevenue)}
                icon={Clock}
                className="bg-white/90"
              />
              <FinanceStatCard
                label="EMI amount"
                value={formatINR(metrics.emiAmount)}
                icon={Clock}
                className="bg-white/90"
              />
              <FinanceStatCard
                label="Overdue amount"
                value={formatINR(metrics.overdueAmount)}
                icon={AlertTriangle}
                accent="from-[#df8284] to-[#b8887a]"
                className="bg-white/90"
              />
              <FinanceStatCard
                label="Failed payments"
                value={metrics.failedPayments}
                icon={AlertTriangle}
                accent="from-[#df8284] to-[#b8887a]"
                className="bg-white/90"
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
