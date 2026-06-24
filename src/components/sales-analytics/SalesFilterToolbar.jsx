import { Search, Download } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function SalesFilterToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  onExport,
  exportLabel = 'Export',
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca0a8]" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-xl border border-[#e5e7eb] bg-[#fafafa] py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#246392] focus:ring-2 focus:ring-[#246392]/20"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <select
            key={f.key}
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2.5 text-sm font-medium text-[#111] outline-none focus:border-[#246392]"
          >
            {f.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-2 rounded-xl bg-[#246392] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a4d6e]"
          >
            <Download className="h-4 w-4" />
            {exportLabel}
          </button>
        )}
      </div>
    </div>
  )
}
