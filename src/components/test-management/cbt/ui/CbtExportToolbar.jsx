import { Download, FileText, Search } from 'lucide-react'
import { cn } from '../../../../utils/cn'
import { ADMIN_PRIMARY_BTN } from '../../../../utils/adminUiStandards'

export default function CbtExportToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search name or roll number…',
  filterValue,
  onFilterChange,
  filterOptions = [],
  onExportCsv,
  onExportPdf,
  exporting = false,
  disabled = false,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:flex-row sm:flex-nowrap sm:items-center sm:justify-between sm:gap-4 sm:p-5',
        className,
      )}
    >
      <div className="relative min-w-[200px] flex-1 sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          disabled={disabled}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-[#222] outline-none placeholder:text-slate-400 focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20 disabled:opacity-60"
        />
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
        {filterOptions.length > 0 ? (
          <select
            value={filterValue}
            onChange={onFilterChange}
            disabled={disabled}
            className="h-10 min-h-[38px] min-w-[100px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-[#222] outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20 disabled:opacity-60"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : null}

        <button
          type="button"
          disabled={exporting || disabled}
          onClick={onExportCsv}
          className={cn(ADMIN_PRIMARY_BTN, 'h-10 min-h-[38px]')}
        >
          <Download className="h-4 w-4" />
          CSV
        </button>
        <button
          type="button"
          disabled={exporting || disabled}
          onClick={onExportPdf}
          className={cn(ADMIN_PRIMARY_BTN, 'h-10 min-h-[38px]')}
        >
          <FileText className="h-4 w-4" />
          PDF
        </button>
      </div>
    </div>
  )
}
