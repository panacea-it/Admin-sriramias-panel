import { Filter, RotateCcw, Search } from 'lucide-react'
import { cn } from '../../../utils/cn'

export default function CalendarFilterToolbar({
  filters,
  setFilter,
  toggleExtraCenter,
  resetFilters,
  hasActiveFilters,
  facultyOptions,
  subjectOptions,
  statusOptions,
  sessionTypeOptions,
  classroomOptions = [],
  centerOptions = [],
  headerCenter,
}) {
  const selectClass =
    'h-9 min-w-0 rounded-lg border border-[#e8f4fc] bg-white px-2.5 text-xs font-medium text-[#1a3a5c] shadow-sm transition focus:border-[#55ace7] focus:outline-none focus:ring-2 focus:ring-[#55ace7]/20 sm:text-sm'

  return (
    <div className="space-y-3 border-b border-[#f0ebfa] bg-gradient-to-b from-[#fafbff] to-white px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#246392]">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </span>
        {headerCenter && headerCenter !== 'All Centers' && (
          <span className="rounded-full bg-[#eef6fc] px-2.5 py-0.5 text-[10px] font-semibold text-[#246392]">
            Navbar: {headerCenter}
          </span>
        )}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-[#246392] transition hover:bg-[#eef2fc]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Filters
          </button>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca0a8]" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            placeholder="Search classes…"
            className={cn(selectClass, 'w-full pl-8')}
          />
        </div>
        <select
          value={filters.faculty}
          onChange={(e) => setFilter('faculty', e.target.value)}
          className={selectClass}
          aria-label="Filter by faculty"
        >
          <option value="all">All faculty</option>
          {facultyOptions
            .filter((f) => f !== 'all')
            .map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
        </select>
        <select
          value={filters.subject}
          onChange={(e) => setFilter('subject', e.target.value)}
          className={selectClass}
          aria-label="Filter by subject"
        >
          <option value="all">All subjects</option>
          {subjectOptions
            .filter((s) => s !== 'all')
            .map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value)}
          className={selectClass}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {statusOptions
            .filter((s) => s !== 'all')
            .map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
        </select>
        <select
          value={filters.sessionType}
          onChange={(e) => setFilter('sessionType', e.target.value)}
          className={selectClass}
          aria-label="Filter by session type"
        >
          {sessionTypeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={filters.classroom}
          onChange={(e) => setFilter('classroom', e.target.value)}
          className={selectClass}
          aria-label="Filter by classroom"
        >
          <option value="all">All classrooms</option>
          {classroomOptions
            .filter((c) => c !== 'all')
            .map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
        </select>
      </div>

      {centerOptions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#9ca0a8]">
            Also filter centers
          </span>
          {centerOptions.map((center) => {
            const active = filters.extraCenters.includes(center)
            return (
              <button
                key={center}
                type="button"
                onClick={() => toggleExtraCenter(center)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-[11px] font-semibold transition',
                  active
                    ? 'border-[#55ace7] bg-[#55ace7] text-white shadow-sm'
                    : 'border-[#e8f4fc] bg-white text-[#246392] hover:border-[#55ace7]/50',
                )}
              >
                {center}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
