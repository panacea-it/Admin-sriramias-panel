import { cn } from '../../utils/cn'
import {
  FINANCE_COURSE_TYPE_OPTIONS,
  FINANCE_PAYMENT_TYPE_OPTIONS,
  FINANCE_STUDENT_TYPE_OPTIONS,
} from '../../constants/financeConstants'
import { FINANCE_COURSES } from '../../data/financeMockData'
import { FINANCE_BATCHES } from '../../constants/financeConstants'

function FilterSelect({ label, value, onChange, options, className }) {
  return (
    <select
      value={value}
      onChange={onChange}
      aria-label={label}
      className={cn(
        'min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#222] outline-none transition focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20 sm:min-w-[140px] sm:flex-none',
        className,
      )}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

/**
 * Sticky, responsive filter bar for Payment Dashboard.
 */
export default function FinanceDashboardFilters({
  centerFilter,
  courseFilter,
  onCourseFilterChange,
  monthFilter,
  onMonthFilterChange,
  monthOptions = [],
  batchFilter,
  onBatchFilterChange,
  courseTypeFilter,
  onCourseTypeFilterChange,
  paymentTypeFilter,
  onPaymentTypeFilterChange,
  studentTypeFilter,
  onStudentTypeFilterChange,
  refreshing,
  lastUpdatedLabel,
  className,
}) {
  const courseOptions = [
    { value: 'all', label: 'All courses' },
    ...FINANCE_COURSES.map((c) => ({ value: c.id, label: c.name })),
  ]
  const monthOpts = [{ value: 'all', label: 'All months' }, ...monthOptions.map((m) => ({ value: m.month || m, label: m.month || m }))]
  const batchOptions = [
    { value: 'all', label: 'All batches' },
    ...FINANCE_BATCHES.map((b) => ({ value: b.id, label: b.name })),
  ]

  return (
    <div
      className={cn(
        'sticky top-0 z-20 flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white/95 px-3 py-3 shadow-sm backdrop-blur-md sm:px-4',
        className,
      )}
    >
      {centerFilter && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Center:</span>
          <button
            type="button"
            onClick={centerFilter.selectAll}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold transition',
              centerFilter.isOverallView ? 'bg-[#246392] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            All Centers
          </button>
          {centerFilter.selectedCenters.map((c) => (
            <button
              key={c.centerId}
              type="button"
              onClick={() => centerFilter.selectSingle(c.centerId)}
              className="rounded-full bg-[#246392]/10 px-3 py-1 text-xs font-semibold text-[#246392]"
            >
              {c.centerName}
            </button>
          ))}
          {refreshing && (
            <span className="ml-auto text-xs font-medium text-slate-400">Updating…</span>
          )}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <FilterSelect label="Course type" value={courseTypeFilter} onChange={onCourseTypeFilterChange} options={FINANCE_COURSE_TYPE_OPTIONS} />
        <FilterSelect label="Payment type" value={paymentTypeFilter} onChange={onPaymentTypeFilterChange} options={FINANCE_PAYMENT_TYPE_OPTIONS} />
        <FilterSelect label="Student type" value={studentTypeFilter} onChange={onStudentTypeFilterChange} options={FINANCE_STUDENT_TYPE_OPTIONS} />
        <FilterSelect label="Course" value={courseFilter} onChange={onCourseFilterChange} options={courseOptions} />
        <FilterSelect label="Month" value={monthFilter} onChange={onMonthFilterChange} options={monthOpts} />
        <FilterSelect label="Batch" value={batchFilter} onChange={onBatchFilterChange} options={batchOptions} />
      </div>

      {lastUpdatedLabel && (
        <p className="text-xs text-[#686868]">Last updated {lastUpdatedLabel}</p>
      )}
    </div>
  )
}
