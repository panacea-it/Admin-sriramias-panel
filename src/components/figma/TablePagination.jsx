import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'
import { getPaginationPages, PAGE_SIZE_OPTIONS } from '../../utils/getPaginationPages'

function PageButton({ children, active, disabled, onClick, ariaLabel, gradientActive = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex h-9 min-w-[36px] items-center justify-center rounded-lg px-2.5 text-sm font-semibold transition-all duration-150',
        active
          ? gradientActive
            ? 'bg-gradient-to-r from-[#55ace7] to-[#246392] text-white shadow-[0_4px_12px_rgba(36,99,146,0.35)]'
            : 'bg-[#246392] text-white shadow-[0_4px_12px_rgba(36,99,146,0.35)]'
          : 'border border-slate-200 bg-white text-[#333] hover:border-[#55ace7] hover:bg-[#eef6fc] hover:text-[#246392]',
        disabled && 'cursor-not-allowed opacity-40 hover:border-slate-200 hover:bg-white hover:text-[#333]',
      )}
    >
      {children}
    </button>
  )
}

export default function TablePagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'records',
  className,
  gradientActivePage = false,
}) {
  const [jumpValue, setJumpValue] = useState('')
  const pages = getPaginationPages(page, totalPages)

  const summary =
    totalItems === 0
      ? `Showing 0 of 0 ${itemLabel}`
      : `Showing ${startIndex + 1}–${endIndex} of ${totalItems} ${itemLabel}`

  const handleJump = (e) => {
    e.preventDefault()
    const target = Number(jumpValue)
    if (!Number.isFinite(target) || target < 1 || target > totalPages) return
    onPageChange(target)
    setJumpValue('')
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-4 border-t border-slate-100 bg-white px-4 py-4 sm:px-6',
        'sm:flex-row sm:flex-wrap sm:items-center sm:justify-between',
        className,
      )}
    >
      <p className="text-sm font-medium text-[#686868]">{summary}</p>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-[#686868]">
          <span className="whitespace-nowrap">Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Rows per page"
            className="h-9 min-w-[72px] appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm font-semibold text-[#333] outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/30"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <nav
          className="flex flex-wrap items-center gap-1.5"
          aria-label="Table pagination"
        >
          <PageButton
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            ariaLabel="Previous page"
            gradientActive={gradientActivePage}
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
          </PageButton>

          {pages.map((p, idx) =>
            p === '…' ? (
              <span
                key={`ellipsis-${idx}`}
                className="inline-flex h-9 min-w-[28px] items-center justify-center px-1 text-sm font-semibold text-[#9ca0a8]"
              >
                …
              </span>
            ) : (
              <PageButton
                key={p}
                active={p === page}
                onClick={() => onPageChange(p)}
                ariaLabel={`Page ${p}`}
                gradientActive={gradientActivePage}
              >
                {p}
              </PageButton>
            ),
          )}

          <PageButton
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            ariaLabel="Next page"
            gradientActive={gradientActivePage}
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </PageButton>
        </nav>

        <form onSubmit={handleJump} className="flex items-center gap-2">
          <label className="sr-only" htmlFor="page-jump">
            Jump to page
          </label>
          <input
            id="page-jump"
            type="number"
            min={1}
            max={totalPages}
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            placeholder="Page"
            className="h-9 w-16 rounded-lg border border-slate-200 bg-white px-2 text-center text-sm font-medium text-[#333] outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/30"
          />
          <button
            type="submit"
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-[#246392] transition hover:bg-[#eef6fc]"
          >
            Go
          </button>
        </form>
      </div>
    </div>
  )
}
