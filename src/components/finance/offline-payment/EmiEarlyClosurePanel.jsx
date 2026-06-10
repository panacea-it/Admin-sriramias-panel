import { Lock } from 'lucide-react'
import { formatINR } from '../../../utils/financeFilters'

export default function EmiEarlyClosurePanel({
  remainingBalance,
  planStatus,
  disabled,
  onCloseEmi,
}) {
  if (planStatus === 'Closed Early') {
    return (
      <div className="rounded-xl border border-[#1a4d73]/20 bg-[#eef6fc] px-4 py-3 text-sm font-semibold text-[#246392]">
        EMI plan closed early — all remaining installments are settled.
      </div>
    )
  }

  if (remainingBalance <= 0) return null

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="flex items-center gap-2 text-sm font-bold text-amber-900">
          <Lock className="h-4 w-4" />
          Early EMI closure
        </p>
        <p className="mt-1 text-xs text-amber-800/90">
          Student paying full remaining balance ({formatINR(remainingBalance)}). Future installments
          will be closed automatically.
        </p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onCloseEmi}
        className="h-10 shrink-0 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 px-4 text-sm font-bold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
      >
        Close EMI & collect full balance
      </button>
    </div>
  )
}
