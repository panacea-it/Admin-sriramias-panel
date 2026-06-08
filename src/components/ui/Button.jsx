import { cn } from '../../utils/cn'

const variants = {
  primary:
    'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-sm',
  secondary:
    'bg-white text-[var(--color-text-main)] border border-[var(--color-border)] hover:bg-slate-50',
  ghost: 'bg-transparent text-[var(--color-text-sub)] hover:bg-slate-100',
  danger: 'bg-[var(--color-danger)] text-white hover:opacity-90',
}

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
}

export default function Button({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
