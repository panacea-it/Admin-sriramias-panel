import { CheckCircle2, Circle, XCircle, Clock } from 'lucide-react'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { cn } from '../../utils/cn'

const STEP_ICONS = {
  completed: CheckCircle2,
  failed: XCircle,
  blocked: XCircle,
  pending: Clock,
}

const STEP_STYLES = {
  completed: 'border-[#69df66] bg-[#69df66]/10 text-[#1a3a5c]',
  failed: 'border-[#df8284] bg-[#df8284]/10 text-[#df8284]',
  blocked: 'border-[#df8284] bg-[#df8284]/10 text-[#df8284]',
  pending: 'border-[#55ace7] bg-[#55ace7]/10 text-[#246392]',
}

export default function FinanceTimeline({ events = [], className }) {
  if (!events.length) return null

  return (
    <div className={cn('space-y-0', className)}>
      {events.map((ev, i) => {
        const status = ev.status || 'pending'
        const Icon = STEP_ICONS[status] || Circle
        const isLast = i === events.length - 1

        return (
          <div key={`${ev.step}-${i}`} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast && (
              <span
                className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-0.5 bg-slate-200"
                aria-hidden
              />
            )}
            <div
              className={cn(
                'relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                STEP_STYLES[status] || STEP_STYLES.pending,
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-semibold text-[#111111]">{ev.step}</p>
              {ev.detail && <p className="mt-0.5 text-xs text-[#686868]">{ev.detail}</p>}
              {ev.timestamp && (
                <p className="mt-1 text-xs tabular-nums text-[#9ca0a8]">
                  {formatCategoryDateTime(ev.timestamp)}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
