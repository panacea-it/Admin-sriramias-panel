import { useMemo } from 'react'
import { History } from 'lucide-react'
import { getBatchAuditEntries } from '../../utils/batchAuditStorage'
function formatAuditTime(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function BatchAuditHistoryPanel({ batchId, refreshKey = 0 }) {
  const entries = useMemo(
    () => getBatchAuditEntries(batchId),
    [batchId, refreshKey],
  )

  if (!batchId) return null

  return (
    <section className="rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#55ace7]/15 text-[#246392]">
          <History className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-base font-bold text-[#111]">Audit & History</h3>
          <p className="text-sm text-[#686868]">Batch activity log with admin and timestamps</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-xl bg-slate-50 py-8 text-center text-sm text-[#686868]">
          No activity recorded yet for this batch.
        </p>
      ) : (
        <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border border-slate-100 bg-[#f8fbff] px-4 py-3 transition hover:border-[#55ace7]/25"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-bold text-[#1a3a5c]">{entry.type}</p>
                <time className="text-xs font-medium text-[#686868]">
                  {formatAuditTime(entry.timestamp)}
                </time>
              </div>
              {entry.message && (
                <p className="mt-1 text-sm text-[#444]">{entry.message}</p>
              )}
              <p className="mt-2 text-xs font-semibold text-[#246392]">
                By {entry.adminName || 'Admin'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
