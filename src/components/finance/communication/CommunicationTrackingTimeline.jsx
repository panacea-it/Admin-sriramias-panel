import FinanceTimeline from '../FinanceTimeline'
import { buildTrackingTimeline } from '../../../utils/paymentCommunicationAnalytics'
import { cn } from '../../../utils/cn'

function TimelineEmptyState() {
  return <p className="text-sm text-[#686868]">No delivery tracking data available yet.</p>
}

export default function CommunicationTrackingTimeline({ row, compact = false, className, onView }) {
  const events = buildTrackingTimeline(row)

  const openView = (e) => {
    e?.stopPropagation?.()
    onView?.(row)
  }

  if (compact) {
    const dots = (
      <div className={cn('flex items-center gap-1', className)} title="Delivery timeline">
        {events.length > 0 ? (
          events.map((ev, i) => (
            <span key={`${ev.step}-${i}`} className="flex items-center gap-1">
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
          ))
        ) : (
          <span className="h-2 w-2 rounded-full bg-slate-200" title="No tracking data" />
        )}
      </div>
    )

    if (!onView) return dots

    return (
      <button
        type="button"
        onClick={openView}
        className="inline-flex items-center gap-2 rounded-md px-1 py-0.5 text-left transition hover:bg-[#eef6fc]"
        aria-label="View delivery timeline"
      >
        {dots}
        <span className="shrink-0 text-xs font-semibold text-[#246392]">View</span>
      </button>
    )
  }

  if (!events.length) {
    return (
      <div className={className}>
        <TimelineEmptyState />
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
