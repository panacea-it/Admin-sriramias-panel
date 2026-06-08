import { cn } from '../../../utils/cn'
import { FOLLOW_UP_PRIORITY_STYLES } from '../../../constants/paymentCommunicationConstants'

export default function CommunicationFollowUpBadge({ priority, tag, className }) {
  if (!priority && !tag) return <span className="text-xs text-[#686868]">—</span>

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {priority && (
        <span
          className={cn(
            'inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1',
            FOLLOW_UP_PRIORITY_STYLES[priority] || 'bg-slate-100 text-slate-600 ring-slate-200',
          )}
        >
          {priority}
        </span>
      )}
      {tag && <span className="text-xs text-[#686868]">{tag}</span>}
    </div>
  )
}
