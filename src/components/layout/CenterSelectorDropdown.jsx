import { useEffect, useMemo, useState } from 'react'
import {
  MapPin,
  ChevronDown,
  Search,
  Star,
  Check,
  Building2,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { useFinanceCenterFilter } from '../../contexts/FinanceCenterFilterContext'
import { useCenters } from '../../contexts/CentersContext'
import { fetchCenterPerformance } from '../../api/financeAPI'
import { formatINR } from '../../utils/financeFilters'
import { filterFinanceOperationCenters } from '../../utils/financeCenterAggregation'

export default function CenterSelectorDropdown({ open, onToggle, onClose }) {
  const {
    mode,
    selectedIds,
    favorites,
    recentIds,
    canSelectCenters,
    selectAll,
    selectSingle,
    toggleFavorite,
    headerLabel,
  } = useFinanceCenterFilter()
  const { activeCenters } = useCenters()
  const financeCenters = useMemo(() => filterFinanceOperationCenters(activeCenters), [activeCenters])
  const [search, setSearch] = useState('')
  const [summaries, setSummaries] = useState([])

  useEffect(() => {
    if (!open) return
    fetchCenterPerformance()
      .then((res) => setSummaries(res.summaries || []))
      .catch(() => setSummaries([]))
  }, [open])

  const summaryByName = useMemo(
    () => new Map(summaries.map((s) => [s.centerName, s])),
    [summaries],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return financeCenters
    return financeCenters.filter(
      (c) =>
        c.centerName.toLowerCase().includes(q) ||
        c.centerCode.toLowerCase().includes(q),
    )
  }, [financeCenters, search])

  const isSelected = (id) => mode !== 'all' && selectedIds.includes(id)

  return (
    <div className="relative hidden sm:block">
      <button
        type="button"
        onClick={onToggle}
        className="flex h-9 max-w-[min(48vw,240px)] items-center gap-2 rounded-lg border border-[#03045e]/10 bg-[#f4f6fb] px-3 text-[12px] font-semibold text-[#03045e] transition hover:border-[#03045e]/18 hover:bg-[#e8ecf7] sm:max-w-[260px] sm:text-[13px]"
      >
        <MapPin className="h-3.5 w-3.5 shrink-0 text-[#b91c1c]" strokeWidth={2.5} />
        <span className="truncate text-slate-800">{headerLabel}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(100vw-2rem,340px)] overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_16px_40px_rgba(3,4,94,0.14)]">
          <div className="border-b border-slate-100 p-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search centers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            {canSelectCenters && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => { selectAll(); onClose?.() }}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                    mode === 'all' ? 'bg-[#246392] text-white' : 'bg-slate-100 text-slate-600',
                  )}
                >
                  All Centers
                </button>
              </div>
            )}
          </div>

          <ul className="max-h-[320px] overflow-y-auto py-1">
            {filtered.map((center) => {
              const meta = summaryByName.get(center.centerName)
              const selected = isSelected(center.centerId)
              const fav = favorites.includes(center.centerId)
              return (
                <li key={center.centerId}>
                  <div
                    className={cn(
                      'flex w-full items-start gap-2 px-3 py-2.5 transition hover:bg-[#f4f6fb]',
                      selected && 'bg-[#eef4fa]',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (!canSelectCenters) return
                        selectSingle(center.centerId)
                        onClose?.()
                      }}
                      className="flex min-w-0 flex-1 items-start gap-2 text-left"
                    >
                      <span
                        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: meta?.color || '#246392' }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <span className="truncate text-[13px] font-semibold text-slate-900">
                            {center.centerName}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">{center.centerCode}</span>
                        </div>
                        {meta && (
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {formatINR(meta.totalRevenue)} · {meta.activeStudents} students · {meta.conversionPct}% conv.
                          </p>
                        )}
                      </div>
                      {selected && <Check className="h-4 w-4 shrink-0 text-[#246392]" />}
                    </button>
                    {canSelectCenters && (
                      <button
                        type="button"
                        onClick={() => toggleFavorite(center.centerId)}
                        className="shrink-0 rounded p-1 hover:bg-slate-100"
                        aria-label="Favorite"
                      >
                        <Star className={cn('h-4 w-4', fav ? 'fill-amber-400 text-amber-400' : 'text-slate-300')} />
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>

          {favorites.length > 0 && (
            <div className="border-t border-slate-100 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase text-slate-400">Favorites</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
