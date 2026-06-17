import { Eye, RotateCcw } from 'lucide-react'
import { cn } from '../../utils/cn'

const actionButtonClass =
  'inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition sm:min-w-0 sm:px-2.5'

export default function PaymentRowActions({ paymentId, canRefund, onDetails, onRefund }) {
  return (
    <div className="flex flex-nowrap items-center justify-center gap-1 sm:gap-1.5">
      <button
        type="button"
        onClick={onDetails}
        title="Details"
        aria-label={`View payment details for ${paymentId}`}
        className={cn(
          actionButtonClass,
          'text-slate-500 hover:bg-slate-100 hover:text-[#246392]',
        )}
      >
        <Eye className="h-3.5 w-3.5 shrink-0" />
        <span>Details</span>
      </button>
      {canRefund && (
        <button
          type="button"
          onClick={onRefund}
          title="Refund"
          aria-label={`Refund payment ${paymentId}`}
          className={cn(
            actionButtonClass,
            'text-[#c96565] hover:bg-red-50 hover:text-[#b94b4b]',
          )}
        >
          <RotateCcw className="h-3.5 w-3.5 shrink-0" />
          <span>Refund</span>
        </button>
      )}
    </div>
  )
}
