import { cn } from '../../utils/cn'

export default function Input({ className, icon: Icon, ...props }) {
  return (
    <div className="relative w-full">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
      )}
      <input
        className={cn(
          'w-full rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] py-2.5 text-sm text-[var(--color-text-main)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-input-focus)] focus:ring-2 focus:ring-[var(--color-primary)]/20',
          Icon ? 'pl-10 pr-3' : 'px-3',
          className,
        )}
        {...props}
      />
    </div>
  )
}
