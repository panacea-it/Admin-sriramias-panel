import { Bell, CheckCircle2, AlertTriangle } from 'lucide-react'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { cn } from '../../../utils/cn'

const SEVERITY_STYLES = {
  high: 'border-red-200 bg-red-50/50',
  medium: 'border-amber-200 bg-amber-50/50',
  low: 'border-[#69df66]/30 bg-[#69df66]/5',
}

export default function PaymentAttemptAlertsPanel({ alerts = [], onMarkRead, onSelectAlert }) {
  if (!alerts.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
        <Bell className="mx-auto h-8 w-8 text-[#686868]" />
        <p className="mt-2 font-semibold text-[#222]">No alerts</p>
        <p className="text-sm text-[#686868]">Payment attempt alerts will appear here.</p>
      </div>
    )
  }

  const unread = alerts.filter((a) => !a.read).length

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#686868]">
        {unread} unread · {alerts.length} total notifications
      </p>
      <ul className="space-y-2">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className={cn(
              'flex items-start gap-3 rounded-xl border p-4 transition hover:shadow-sm',
              SEVERITY_STYLES[alert.severity] || 'border-slate-200 bg-white',
              !alert.read && 'ring-1 ring-[#55ace7]/20',
            )}
          >
            <AlertTriangle className={cn('mt-0.5 h-5 w-5 shrink-0', alert.severity === 'high' ? 'text-red-600' : 'text-amber-600')} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-[#222]">{alert.title}</p>
                {!alert.read && (
                  <span className="rounded bg-[#55ace7]/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#246392]">New</span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-[#686868]">{alert.message}</p>
              <p className="mt-1 text-xs text-[#9ca0a8]">{formatCategoryDateTime(alert.timestamp)}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {alert.rowId && (
                  <button
                    type="button"
                    onClick={() => onSelectAlert?.(alert)}
                    className="text-xs font-semibold text-[#246392] hover:underline"
                  >
                    View record
                  </button>
                )}
                {!alert.read && (
                  <button
                    type="button"
                    onClick={() => onMarkRead?.(alert.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#686868] hover:text-[#222]"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark read
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
