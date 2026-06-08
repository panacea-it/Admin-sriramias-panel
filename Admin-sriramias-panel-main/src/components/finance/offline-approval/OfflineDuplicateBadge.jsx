import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { OFFLINE_DUPLICATE_STATUSES } from '../../../constants/offlinePaymentApproval'
import { cn } from '../../../utils/cn'

const STYLES = {
  Unique: 'text-[#686868]',
  'Possible Duplicate': 'bg-amber-100 text-amber-800 ring-amber-200',
  'Duplicate Confirmed': 'bg-[#df8284]/15 text-[#b94b4b] ring-[#df8284]/30',
  'Override Approved': 'bg-[#69df66]/15 text-[#1a3a5c] ring-[#69df66]/30',
}

export default function OfflineDuplicateBadge({ status, onClick, className }) {
  if (!status || status === OFFLINE_DUPLICATE_STATUSES[0]) {
    return <span className={cn('text-xs text-[#686868]', className)}>—</span>
  }

  const suspicious = status !== 'Override Approved'
  const Icon = suspicious ? AlertTriangle : CheckCircle2

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ring-1 transition hover:opacity-90',
          STYLES[status],
          className,
        )}
      >
        <Icon className="h-3.5 w-3.5" /> {status}
      </button>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ring-1',
        STYLES[status],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {status}
    </span>
  )
}
