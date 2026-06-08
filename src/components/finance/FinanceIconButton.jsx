import { cn } from '../../utils/cn'

const VARIANTS = {
  default: 'text-[#246392] bg-[#eef6fc]/80 ring-[#55ace7]/20 hover:bg-[#eef6fc] hover:ring-[#55ace7]/35',
  danger: 'text-[#df8284] bg-rose-50/80 ring-rose-200/60 hover:bg-rose-50 hover:ring-rose-300/60',
  muted: 'text-[#686868] bg-slate-100/80 ring-slate-200 hover:bg-slate-100',
}

export default function FinanceIconButton({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
  disabled = false,
  className,
  type = 'button',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7] focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant] || VARIANTS.default,
        className,
      )}
    >
      {Icon ? <Icon className="h-4 w-4" strokeWidth={2} aria-hidden /> : null}
    </button>
  )
}
