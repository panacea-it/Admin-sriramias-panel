import { cn } from '../../utils/cn'

export default function Badge({ className, variant = 'default', children }) {
  const styles = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
    danger: 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]',
    primary: 'bg-[var(--color-primary-light)] text-[var(--color-primary-text)]',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
