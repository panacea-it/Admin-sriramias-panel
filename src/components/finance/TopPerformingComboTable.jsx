import { useMemo, useState } from 'react'
import { CalendarDays, Layers } from 'lucide-react'

import { formatINR } from '../../utils/financeFilters'
import { buildTopPerformingCombos } from '../../utils/financeComboAggregation'
import { cn } from '../../utils/cn'
import { FinancePeriodTabs, FINANCE_COLLECTION_PERIODS } from './FinanceMiniCalendar'
import FinancePeriodDatePicker from './FinancePeriodDatePicker'
import {
  financeCardSubtitle,
  financeCardTitle,
  financeChartCardHeader,
  financeChartTablePanel,
  financeTableHeadCell,
} from './financeCardStyles'
import { filterPaymentsByPeriod, formatPeriodLabel, startOfDay } from '../../utils/dailyCollectionUtils'

const COMBO_COLUMNS = [
  { key: 'comboName', label: 'Combo Name' },
  {
    key: 'comboRevenue',
    label: 'Combo Revenue',
    format: (row) => formatINR(row.comboRevenue),
    className: 'font-semibold text-[#246392]',
  },
  {
    key: 'comboCollection',
    label: 'Combo Collection',
    format: (row) => formatINR(row.comboCollection),
    className: 'font-semibold text-[#1a3a5c]',
  },
  { key: 'enrolledStudents', label: 'Enrolled Students', className: 'font-semibold text-[#1a3a5c]' },
]

export default function TopPerformingComboTable({ payments = [], loading, className }) {
  const [period, setPeriod] = useState('daily')
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))

  const periodLabel = useMemo(
    () => formatPeriodLabel(selectedDate, period),
    [selectedDate, period],
  )

  const rows = useMemo(() => {
    const filtered = filterPaymentsByPeriod(payments, { period, selectedDate })
    return buildTopPerformingCombos(filtered)
  }, [payments, period, selectedDate])

  const periodHint =
    period === 'daily'
      ? 'Select a date to view top combos for that day'
      : period === 'weekly'
        ? 'View top combos for the selected week'
        : 'View top combos for the selected month'

  const handlePeriodChange = (nextPeriod) => {
    setPeriod(nextPeriod)
  }

  const handleSelectDate = (date) => {
    setSelectedDate(startOfDay(date))
  }

  return (
    <section className={cn('mt-6 border-t border-slate-200 pt-6', className)}>
      <div className={cn(financeChartCardHeader, 'rounded-lg')}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-white" aria-hidden="true" />
              <h4 className={financeCardTitle}>Top Performing Course — Combination (Combo)</h4>
            </div>
            <p className={financeCardSubtitle}>{periodHint}</p>
          </div>
          <CalendarDays className="h-5 w-5 shrink-0 text-white/80" aria-hidden="true" />
        </div>
        <FinancePeriodTabs
          period={period}
          onChange={handlePeriodChange}
          periods={FINANCE_COLLECTION_PERIODS}
          className="mt-3"
        />
      </div>

      <div className="mt-3 space-y-3">
        {loading ? (
          <div className="h-32 animate-pulse rounded-lg bg-slate-100" />
        ) : (
          <>
            <FinancePeriodDatePicker
              label="Select period"
              period={period}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />

            <p className="text-xs font-semibold uppercase tracking-wide text-[#686868]">
              Showing: <span className="text-[#246392]">{periodLabel}</span>
            </p>

            <div className={financeChartTablePanel}>
              <div className="overflow-x-auto">
                {!rows.length ? (
                  <p className="py-6 text-center text-sm text-[#686868]">
                    No combo performance data for this period.
                  </p>
                ) : (
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        {COMBO_COLUMNS.map((col) => (
                          <th key={col.key} className={financeTableHeadCell}>
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.comboName}>
                          {COMBO_COLUMNS.map((col) => (
                            <td
                              key={`${row.comboName}-${col.key}`}
                              className={cn(
                                'border border-slate-200/80 bg-white px-3 py-2.5 text-sm',
                                col.key === 'comboName' && 'font-semibold text-[#1a3a5c]',
                                col.className,
                              )}
                            >
                              {col.format ? col.format(row) : row[col.key]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
