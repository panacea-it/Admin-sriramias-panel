import { Shield, ShieldAlert, ShieldOff, ShieldQuestion } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { FRAUD_RISK_STYLES } from '../../../constants/paymentAttemptConstants'

const ICONS = {
  Safe: Shield,
  Suspicious: ShieldAlert,
  Blocked: ShieldOff,
  'Under Review': ShieldQuestion,
}

export default function PaymentAttemptFraudBadge({ status = 'Safe', riskScore, className, onClick }) {
  const Icon = ICONS[status] || Shield
  const style = FRAUD_RISK_STYLES[status] || FRAUD_RISK_STYLES.Safe
  const Tag = onClick ? 'button' : 'span'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      title={riskScore != null ? `Risk score: ${riskScore}` : status}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset',
        style,
        onClick && 'cursor-pointer transition hover:opacity-80',
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {status}
    </Tag>
  )
}
