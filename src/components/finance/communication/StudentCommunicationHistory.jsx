import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import FinanceStatusBadge from '../FinanceStatusBadge'
import CommunicationFollowUpBadge from './CommunicationFollowUpBadge'
import CommunicationTrackingTimeline from './CommunicationTrackingTimeline'
import CommunicationFilters from './CommunicationFilters'
import { filterCommunicationLogs } from '../../../utils/paymentCommunicationAnalytics'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { cn } from '../../../utils/cn'

export default function StudentCommunicationHistory({ logs = [], compact = false }) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [typeFilter, setTypeFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)

  const filtered = useMemo(
    () =>
      filterCommunicationLogs(logs, {
        search: debouncedSearch,
        typeFilter,
        channelFilter,
        statusFilter,
      }),
    [logs, debouncedSearch, typeFilter, channelFilter, statusFilter],
  )

  if (!logs.length) {
    return <p className="text-sm text-[#686868]">No payment-related communications yet.</p>
  }

  return (
    <div className="space-y-3">
      {!compact && (
        <CommunicationFilters
          search={search}
          onSearchChange={setSearch}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          channelFilter={channelFilter}
          onChannelChange={setChannelFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          followUpFilter="all"
          onFollowUpChange={() => {}}
          dateFrom=""
          onDateFromChange={() => {}}
          dateTo=""
          onDateToChange={() => {}}
        />
      )}
      <ul className="space-y-2">
        {filtered.map((c) => {
          const expanded = expandedId === c.id
          return (
            <li key={c.id} className="rounded-lg border border-slate-100 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : c.id)}
                className="flex w-full items-start justify-between gap-2 p-3 text-left text-sm"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{c.type}</span>
                    <FinanceStatusBadge status={c.deliveryStatus || c.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-[#686868]">
                    {c.channel} · {formatCategoryDateTime(c.timestamp)}
                  </p>
                </div>
                {expanded ? <ChevronUp className="h-4 w-4 shrink-0 text-[#686868]" /> : <ChevronDown className="h-4 w-4 shrink-0 text-[#686868]" />}
              </button>
              <div className={cn('border-t border-slate-100 px-3 pb-3', !expanded && 'hidden')}>
                <dl className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                  <div><dt className="text-[#686868]">Reference</dt><dd className="font-mono">{c.paymentReference || '—'}</dd></div>
                  <div><dt className="text-[#686868]">Sent by</dt><dd>{c.sentBy || '—'}</dd></div>
                  <div className="sm:col-span-2"><dt className="text-[#686868]">Tracking</dt><dd className="mt-1"><CommunicationTrackingTimeline row={c} compact /></dd></div>
                  {(c.counselorName || c.followUpNotes) && (
                    <div className="sm:col-span-2">
                      <dt className="text-[#686868]">Counselor</dt>
                      <dd className="mt-1">
                        <p>{c.counselorName}</p>
                        <CommunicationFollowUpBadge priority={c.followUpPriority} tag={c.followUpTag} />
                        {c.followUpNotes && <p className="mt-1 text-[#686868]">{c.followUpNotes}</p>}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
