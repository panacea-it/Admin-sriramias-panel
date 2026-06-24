import { useFinanceCenterFilter } from '../../contexts/FinanceCenterFilterContext'
import { useCenters } from '../../contexts/CentersContext'
import { filterFinanceOperationCenters, financeCenterCityLabel } from '../../utils/financeCenterAggregation'
import { cn } from '../../utils/cn'

const CHIP_BASE =
  'rounded-full px-4 py-2 text-sm font-semibold transition sm:px-5 sm:py-2.5 sm:text-base'

/**
 * Centre / city filter chips — top of finance operations pages.
 * Selecting a city filters page data via FinanceCenterFilterContext.
 */
export default function FinanceCenterFilterBar({ className, sticky = true }) {
  const centerFilter = useFinanceCenterFilter()
  const { activeCenters } = useCenters()
  const financeCenters = filterFinanceOperationCenters(activeCenters)

  return (
    <div
      className={cn(
        sticky && 'sticky top-0 z-20',
        'overflow-hidden rounded-xl border border-[#55ace7]/35 shadow-[0_4px_16px_rgba(36,99,146,0.12)]',
        className,
      )}
    >
      <div className="bg-gradient-to-r from-[#55ace7] via-[#3d8fc9] to-[#246392] px-4 py-2.5 text-center sm:px-6 sm:py-3">
        <p className="text-sm font-bold uppercase tracking-wider text-white sm:text-base">Centre</p>
      </div>

      <div className="bg-white px-4 py-3.5 sm:px-6 sm:py-4">
        <div className="flex w-full flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          {centerFilter.canSelectCenters ? (
            <>
              <button
                type="button"
                onClick={centerFilter.selectAll}
                className={cn(
                  CHIP_BASE,
                  'transition-colors duration-200',
                  centerFilter.isOverallView
                    ? 'bg-white font-bold text-[#246392] shadow-sm ring-2 ring-[#246392]'
                    : 'bg-white text-[#686868] ring-1 ring-slate-200 hover:text-[#246392]',
                )}
              >
                All Centres
              </button>
              {financeCenters.map((center) => {
                const selected =
                  !centerFilter.isOverallView && centerFilter.selectedIds.includes(center.centerId)
                return (
                  <button
                    key={center.centerId}
                    type="button"
                    onClick={() => centerFilter.selectSingle(center.centerId)}
                    className={cn(
                      CHIP_BASE,
                      'transition-colors duration-200',
                      selected
                        ? 'bg-[#1a3a5c] text-white shadow-md ring-2 ring-[#246392]/40'
                        : 'bg-[#c5e0f7] text-[#246392] ring-1 ring-[#55ace7]/35 hover:bg-[#b8d9f5]',
                    )}
                  >
                    {financeCenterCityLabel(center)}
                  </button>
                )
              })}
            </>
          ) : (
            <span className={cn(CHIP_BASE, 'bg-[#246392] text-white shadow-md')}>
              {centerFilter.headerLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
