import { cn } from '../../utils/cn'

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--card-shadow)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3 sm:px-5 sm:py-4',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardTitle({ className, children }) {
  return (
    <h3
      className={cn(
        'text-base font-bold text-[var(--color-text-main)] sm:text-lg',
        className,
      )}
    >
      {children}
    </h3>
  )
}

export function CardBody({ className, children }) {
  return <div className={cn('p-4 sm:p-5', className)}>{children}</div>
}
