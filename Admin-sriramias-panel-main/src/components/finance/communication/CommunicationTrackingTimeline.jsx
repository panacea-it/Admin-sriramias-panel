import FinanceTimeline from '../FinanceTimeline'
import { buildTrackingTimeline } from '../../../utils/paymentCommunicationAnalytics'
import { cn } from '../../../utils/cn'

export default function CommunicationTrackingTimeline({ row, compact = false, className }) {
  const events = buildTrackingTimeline(row)
  if (!events.length) return null

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1', className)} title="Delivery journey">
        {events.map((ev, i) => (
          <span key={ev.step} className="flex items-center gap-1">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                ev.status === 'completed' && 'bg-[#69df66]',
                ev.status === 'failed' && 'bg-[#df8284]',
                ev.status === 'pending' && 'bg-slate-300',
              )}
              title={`${ev.step}${ev.timestamp ? ` — ${ev.timestamp}` : ''}`}
            />
            {i < events.length - 1 && <span className="h-px w-2 bg-slate-200" />}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className={className}>
      <FinanceTimeline events={events} />
      {row.tracking?.retryCount > 0 && (
        <p className="mt-2 text-xs text-[#686868]">Retry count: {row.tracking.retryCount}</p>
      )}
      {row.tracking?.failedReason && (
        <p className="mt-1 text-xs text-[#df8284]">Failed: {row.tracking.failedReason}</p>
      )}
    </div>
  )
}
