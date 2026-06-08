import FinanceSearchInput from './FinanceSearchInput'
import { FINANCE_PAYMENT_MODE_CATEGORIES } from '../../constants/financeConstants'
import { cn } from '../../utils/cn'

const SELECT_CLASS =
  'h-9 min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-[#222] focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20 sm:text-sm'

export default function FinanceModeFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  className,
  compact = false,
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 border-b border-slate-100 bg-slate-50/50 px-4 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:px-5',
        className,
      )}
    >
      <FinanceSearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search payment modes…"
        className={cn('min-w-0', compact ? 'w-full' : 'sm:max-w-xs')}
        inputClassName="h-9 text-sm"
      />
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <select
          value={category}
          onChange={onCategoryChange}
          aria-label="Filter by category"
          className={SELECT_CLASS}
        >
          <option value="all">All categories</option>
          {FINANCE_PAYMENT_MODE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={onStatusChange}
          aria-label="Filter by status"
          className={SELECT_CLASS}
        >
          <option value="all">All status</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
        <select
          value={sort}
          onChange={onSortChange}
          aria-label="Sort payment modes"
          className={SELECT_CLASS}
        >
          <option value="name">Sort: A–Z</option>
          <option value="updated">Sort: Recently updated</option>
        </select>
      </div>
    </div>
  )
}
