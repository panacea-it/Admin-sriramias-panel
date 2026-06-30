import { Eye } from 'lucide-react'
import { cn } from '../../../../utils/cn'

export default function CbtTableActionButton({
  label = 'View',
  onClick,
  disabled = false,
  className,
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(e)
      }}
      disabled={disabled}
      className={cn(
        'inline-flex h-9 min-w-[88px] items-center justify-center gap-1.5 rounded-lg border border-[#d4e3f3] bg-white px-3 text-xs font-semibold text-[#246392] shadow-[0_2px_6px_rgba(15,23,42,0.06)] transition hover:border-[#55ace7]/40 hover:bg-[#eef6fc] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm',
        className,
      )}
    >
      <Eye className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
      <span>{label}</span>
    </button>
  )
}
