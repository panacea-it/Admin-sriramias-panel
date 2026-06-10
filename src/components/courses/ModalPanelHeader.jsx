import { BookMarked, X } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function ModalPanelHeader({
  title,
  subtitle,
  onBack,
  onClose,
  icon: Icon = BookMarked,
  iconClassName = 'text-[#dc2626]',
  /** `back` = legacy underlined Go Back link; `icon` = top-right close (batch modals) */
  closeVariant = 'back',
  /** When true with `icon`, renders X only (no circular background behind it). */
  plainCloseIcon = false,
}) {
  const handleClose = onClose ?? onBack

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-xl bg-gradient-to-r from-[#55ace7] via-[#5a7ba8] to-[#1a3a5c] px-5 py-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
          <Icon className={cn('h-6 w-6', iconClassName)} strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-white sm:text-xl">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-sm font-medium text-white/85">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {handleClose && closeVariant === 'icon' ? (
        <button
          type="button"
          onClick={handleClose}
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center text-white transition',
            plainCloseIcon ? 'hover:text-white/85' : 'rounded-full bg-white/20 hover:bg-white/30',
          )}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      ) : handleClose ? (
        <button
          type="button"
          onClick={handleClose}
          className="text-sm font-semibold text-white underline underline-offset-4 transition hover:text-white/90"
        >
          Go Back
        </button>
      ) : null}
    </div>
  )
}
