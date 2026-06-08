import { SlidersHorizontal, X } from 'lucide-react'
import FinanceSlideDrawer from './FinanceSlideDrawer'
import { cn } from '../../utils/cn'

export default function FinanceMobileFilters({
  open,
  onOpen,
  onClose,
  onReset,
  activeCount = 0,
  children,
  className,
}) {
  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          'inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-[#246392] lg:hidden',
          className,
        )}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeCount > 0 && (
          <span className="rounded-full bg-[#246392] px-2 py-0.5 text-xs font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      <FinanceSlideDrawer
        open={open}
        onClose={onClose}
        title="Report filters"
        subtitle={activeCount > 0 ? `${activeCount} active filter${activeCount > 1 ? 's' : ''}` : 'Refine payment reports'}
        width="max-w-md"
        footer={
          onReset ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onReset}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-[#246392] hover:bg-slate-50"
              >
                Reset all
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg bg-[#246392] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a3a5c]"
              >
                Apply
              </button>
            </div>
          ) : null
        }
      >
        <div className="space-y-4">{children}</div>
      </FinanceSlideDrawer>
    </>
  )
}

export function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#eef6fc] px-3 py-1 text-xs font-semibold text-[#246392]">
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label} filter`}
          className="rounded-full p-0.5 hover:bg-[#55ace7]/20"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}

export function FilterField({ label, children, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-xs font-semibold uppercase tracking-wide text-[#686868]">{label}</label>
      {children}
    </div>
  )
}

const FIELD_CLASS =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20'

export function FilterSelect({ value, onChange, options, ariaLabel }) {
  return (
    <select value={value} onChange={onChange} aria-label={ariaLabel} className={FIELD_CLASS}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

export function FilterInput({ value, onChange, placeholder, type = 'text', ariaLabel }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      aria-label={ariaLabel || placeholder}
      className={FIELD_CLASS}
    />
  )
}

export { FIELD_CLASS as FILTER_FIELD_CLASS }
