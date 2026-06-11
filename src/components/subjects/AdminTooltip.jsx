import { cn } from '../../utils/cn'

export default function AdminTooltip({ label, children, className, placement = 'top' }) {
  return (
    <span className={cn('group/tip relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-[#1a3a5c] px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-[0_4px_14px_rgba(15,23,42,0.2)]',
          'scale-95 opacity-0 transition-all duration-200 ease-out',
          'group-hover/tip:scale-100 group-hover/tip:opacity-100',
          placement === 'top' && 'bottom-full left-1/2 mb-2 -translate-x-1/2',
          placement === 'bottom' && 'top-full left-1/2 mt-2 -translate-x-1/2',
        )}
      >
        {label}
      </span>
    </span>
  )
}
