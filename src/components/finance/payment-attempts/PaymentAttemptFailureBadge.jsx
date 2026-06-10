import { cn } from '../../../utils/cn'
import { PAYMENT_FAILURE_CATEGORY_STYLES } from '../../../constants/paymentAttemptConstants'

export default function PaymentAttemptFailureBadge({ category, rawMessage, className, onClick }) {
  if (!category) return <span className="text-xs text-[#686868]">—</span>
  const style = PAYMENT_FAILURE_CATEGORY_STYLES[category] || PAYMENT_FAILURE_CATEGORY_STYLES['Unknown Error']
  const Tag = onClick ? 'button' : 'span'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      title={rawMessage || category}
      className={cn(
        'inline-flex max-w-[160px] items-center truncate rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset',
        style,
        onClick && 'cursor-pointer transition hover:opacity-80',
        className,
      )}
    >
      {category}
    </Tag>
  )
}
