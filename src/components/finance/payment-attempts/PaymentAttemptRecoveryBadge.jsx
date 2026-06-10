import { cn } from '../../../utils/cn'
import { RECOVERY_STATUS_STYLES } from '../../../constants/paymentAttemptConstants'

export default function PaymentAttemptRecoveryBadge({ status = 'Not Recovered', className }) {
  const style = RECOVERY_STATUS_STYLES[status] || RECOVERY_STATUS_STYLES['Not Recovered']
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset',
        style,
        className,
      )}
    >
      {status}
    </span>
  )
}
