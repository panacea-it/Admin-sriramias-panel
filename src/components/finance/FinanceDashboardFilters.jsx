import { cn } from '../../utils/cn'

/**
 * Centre filter bar for Payment Dashboard.
 */
export default function FinanceDashboardFilters({ centerFilter, className }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md sm:px-5',
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
          {(centerFilter.financeCenters || centerFilter.selectedCenters).map((c) => (
            <button
              key={c.centerId}
              type="button"
              onClick={() => centerFilter.selectSingle(c.centerId)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold transition',
                !centerFilter.isOverallView && centerFilter.selectedIds.includes(c.centerId)
                  ? 'bg-[#246392] text-white'
                  : 'bg-[#246392]/10 text-[#246392] hover:bg-[#246392]/20',
              )}
            >
              {c.city || c.centerName?.replace(/\s+Center$/i, '') || c.centerName}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
