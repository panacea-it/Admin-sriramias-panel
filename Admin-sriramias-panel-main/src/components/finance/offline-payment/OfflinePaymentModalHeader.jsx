import { IndianRupee, X } from 'lucide-react'
import FinanceStatusBadge from '../FinanceStatusBadge'

export default function OfflinePaymentModalHeader({
  paymentId,
  statusLabel,
  onClose,
}) {
  return (
    <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-4 rounded-t-2xl bg-gradient-to-r from-[#55ace7] via-[#3d8ec4] to-[#246392] px-5 py-4 shadow-[0_4px_20px_rgba(36,99,146,0.35)] sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
          <IndianRupee className="h-6 w-6 text-white" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-white sm:text-xl">Offline EMI Payment</h2>
          <p className="truncate text-xs text-white/85 sm:text-sm">
            Manage student installments and offline collections
          </p>
          {paymentId && (
            <p className="mt-0.5 font-mono text-[11px] text-white/70">{paymentId}</p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {statusLabel && (
          <FinanceStatusBadge
            status={statusLabel}
            className="hidden rounded-full px-3 py-1 text-xs sm:inline-flex"
          />
        )}
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
