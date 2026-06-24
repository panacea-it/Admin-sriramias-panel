import { useMemo, useState } from 'react'
import { CalendarDays, Trophy, Users } from 'lucide-react'
import { formatINR } from '../../utils/financeFilters'
import { cn } from '../../utils/cn'
import FinanceSearchInput from './FinanceSearchInput'
import FinanceSectionHeader from './FinanceSectionHeader'
import { FinancePeriodTabs, FINANCE_COLLECTION_PERIODS } from './FinanceMiniCalendar'
import FinancePeriodDatePicker from './FinancePeriodDatePicker'
import {
  financeCardShell,
  financeCardSubtitle,
  financeCardTitle,
  financeChartCardHeader,
  financeChartTablePanel,
  financeTableHeadCell,
} from './financeCardStyles'
import { buildTopPerformingCourses } from '../../utils/financeCenterAggregation'
import { filterPaymentsByPeriod, formatPeriodLabel, startOfDay } from '../../utils/dailyCollectionUtils'

const COURSE_TABLE_COLUMNS = [
  { key: 'courseName', label: 'Course Name' },
  { key: 'revenue', label: 'Course Revenue', format: (row) => formatINR(row.revenue), className: 'text-[#246392]' },
  { key: 'collection', label: 'Course Collection', format: (row) => formatINR(row.collection) },
  { key: 'enrolledStudents', label: 'Enrolled Students' },
]

function normalizeCourseRow(row) {
  if (!row) return null
  return {
    courseName: row.courseName || row.course || '—',
    revenue: row.revenue ?? 0,
    collection: row.collection ?? 0,
    enrolledStudents: row.enrolledStudents ?? row.studentCount ?? 0,
  }
}

export function TopPerformingCourseCard({ payments = [], loading, className }) {
  const [period, setPeriod] = useState('monthly')
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))

  const periodLabel = useMemo(
    () => formatPeriodLabel(selectedDate, period),
    [selectedDate, period],
  )

  const rows = useMemo(() => {
    const filtered = filterPaymentsByPeriod(payments, { period, selectedDate })
    const { topCourses } = buildTopPerformingCourses(filtered)
    return topCourses.map(normalizeCourseRow).filter(Boolean)
  }, [payments, period, selectedDate])

  const periodHint =
    period === 'daily'
      ? 'Select a date to view top courses for that day'
      : period === 'weekly'
        ? 'View top courses for the selected week'
        : 'View top courses for the selected month'

  const handlePeriodChange = (nextPeriod) => {
    setPeriod(nextPeriod)
  }

  const handleSelectDate = (date) => {
    setSelectedDate(startOfDay(date))
  }

  if (loading) {
    return (
      <div className={cn(financeCardShell, className)}>
        <div className={financeChartCardHeader}>
          <div className="h-5 w-40 animate-pulse rounded bg-white/20" />
        </div>
        <div className="p-3 sm:p-4">
          <div className="h-40 w-full animate-pulse rounded-lg bg-slate-100" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn(financeCardShell, 'flex h-full min-h-0 flex-col', className)}>
      <div className={financeChartCardHeader}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-white" />
              <h3 className={financeCardTitle}>Top Performing Course</h3>
            </div>
            <p className={cn(financeCardSubtitle, 'text-[10px] leading-snug sm:text-[11px]')}>{periodHint}</p>
          </div>
          <CalendarDays className="h-5 w-5 shrink-0 text-white/80" aria-hidden="true" />
        </div>
        <FinancePeriodTabs
          period={period}
          onChange={handlePeriodChange}
          periods={FINANCE_COLLECTION_PERIODS}
          className="mt-2"
        />
      </div>

      <div className="flex flex-1 flex-col space-y-2 p-3 sm:p-4">
        <FinancePeriodDatePicker
          label="Select period"
          period={period}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
        />

        <div className="border-t border-slate-100 pt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#686868]">
            Showing: <span className="text-[#246392]">{periodLabel}</span>
          </p>
        </div>

        <div className={cn(financeChartTablePanel, 'flex flex-1 flex-col')}>
          <div className="min-h-0 min-w-0 flex-1 overflow-x-auto">
            {!rows.length ? (
              <p className="py-4 text-center text-xs text-[#686868]">
                No course performance data for this period. Try another date or time range.
              </p>
            ) : (
              <table className="min-w-full border-collapse text-xs">
                <thead>
                  <tr>
                    {COURSE_TABLE_COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        className={cn(
                          financeTableHeadCell,
                          'px-2 py-1.5 text-[9px] sm:text-[10px]',
                        )}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`${row.courseName}-${index}`}>
                      {COURSE_TABLE_COLUMNS.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            'border border-slate-200/80 bg-white px-2 py-1.5 text-xs font-medium text-[#1a3a5c]',
                            col.className,
                            col.key === 'courseName' && 'font-semibold',
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
      </div>
    </div>
  )
}

export function CounselorRevenuePanel({ counselors = [], loading, className }) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return counselors
    return counselors.filter((c) => c.counselorName?.toLowerCase().includes(q))
  }, [counselors, search])

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl bg-white/90 shadow-[0_8px_24px_rgba(15,23,42,0.08)] sm:p-1',
        className,
      )}
    >
      <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
        <FinanceSectionHeader
          title="Counselor-wise Revenue"
          subtitle="Revenue, students & conversion"
          className="mb-3"
        />
        <FinanceSearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search counselor…"
          aria-label="Search counselors"
        />
      </div>
      {loading ? (
        <div className="space-y-2 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : !filtered.length ? (
        <div className="p-4">
          <p className="py-6 text-center text-sm text-[#686868]">No revenue data for current filters.</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-slate-50/80 text-xs font-semibold uppercase text-[#686868]">
                  <th className="px-4 py-2">Counselor</th>
                  <th className="px-4 py-2">Revenue</th>
                  <th className="px-4 py-2">Students</th>
                  <th className="px-4 py-2">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.counselorId} className="border-b border-slate-50">
                    <td className="px-4 py-3 font-medium">{c.counselorName}</td>
                    <td className="px-4 py-3 font-semibold text-[#246392]">{formatINR(c.revenue)}</td>
                    <td className="px-4 py-3">{c.studentCount}</td>
                    <td className="px-4 py-3">{c.conversionPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-slate-100 md:hidden">
            {filtered.map((c) => (
              <li key={c.counselorId} className="flex flex-col gap-2 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#222]">{c.counselorName}</span>
                  <span className="font-bold text-[#246392]">{formatINR(c.revenue)}</span>
                </div>
                <div className="flex gap-4 text-xs text-[#686868]">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {c.studentCount} students
                  </span>
                  <span>{c.conversionPct}% conversion</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
