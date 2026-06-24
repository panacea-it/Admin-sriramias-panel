import { RotateCcw } from 'lucide-react'
import ViewButton from '../common/ViewButton'
import IconActionButton from '../common/IconActionButton'
import { TABLE_ACTIONS_WRAP_CENTER } from '../../utils/tableColumnHelpers'

export default function PaymentRowActions({ paymentId, canRefund, onDetails, onRefund }) {
  return (
    <div className={TABLE_ACTIONS_WRAP_CENTER}>
      <ViewButton
        onClick={onDetails}
        label={`View payment details for ${paymentId}`}
      />
      {canRefund ? (
        <IconActionButton
          label={`Refund payment ${paymentId}`}
          onClick={onRefund}
          className="text-[#c96565] hover:border-red-100 hover:bg-red-50 hover:text-[#b94b4b] hover:shadow-sm"
        >
          <RotateCcw className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
        </IconActionButton>
      ) : null}
    </div>
  )
}
