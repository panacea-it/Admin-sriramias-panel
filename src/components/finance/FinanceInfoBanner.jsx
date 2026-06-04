import { Info, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../utils/cn'

export default function FinanceInfoBanner({
  title,
  message,
  actionLabel,
  onAction,
  dismissible = true,
  variant = 'info',
  className,
}) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const styles = {
    info: 'border-[#55ace7]/30 bg-[#eef6fc] text-[#1a3a5c]',
    warning: 'border-[#efb36d]/40 bg-amber-50 text-[#111]',
  }

  return (
    <div
      role="status"
      className={cn(
        'flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        styles[variant] || styles.info,
        className,
      )}
    >
      <div className="flex min-w-0 gap-3">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#246392]" aria-hidden />
        <div className="min-w-0">
          {title && <p className="text-sm font-bold">{title}</p>}
          <p className="text-sm font-medium opacity-90">{message}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="rounded-lg bg-[#246392] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1a3a5c]"
          >
            {actionLabel}
          </button>
        )}
        {dismissible && (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="rounded-lg p-1.5 hover:bg-white/60"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
