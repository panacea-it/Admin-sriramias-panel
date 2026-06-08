import FinanceStatusBadge from '../FinanceStatusBadge'
import CommunicationFollowUpBadge from './CommunicationFollowUpBadge'
import CommunicationTrackingTimeline from './CommunicationTrackingTimeline'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'

export default function CommunicationMobileCard({ row, actions }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-[#246392]">{row.id}</p>
          <p className="font-semibold text-[#222]">{row.studentName || row.recipient}</p>
          <p className="text-xs text-[#686868]">{row.studentId} · {row.paymentReference || '—'}</p>
        </div>
        <FinanceStatusBadge status={row.deliveryStatus || row.status} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div><dt className="text-[#686868]">Type</dt><dd>{row.type}</dd></div>
        <div><dt className="text-[#686868]">Channel</dt><dd>{row.channel}</dd></div>
        <div><dt className="text-[#686868]">Sent by</dt><dd>{row.sentBy || '—'}</dd></div>
        <div><dt className="text-[#686868]">Sent</dt><dd>{formatCategoryDateTime(row.timestamp)}</dd></div>
        <div className="col-span-2"><dt className="text-[#686868]">Follow-up</dt><dd><CommunicationFollowUpBadge priority={row.followUpPriority} tag={row.followUpTag} /></dd></div>
        <div className="col-span-2"><dt className="text-[#686868] mb-1">Tracking</dt><dd><CommunicationTrackingTimeline row={row} compact /></dd></div>
      </dl>
      <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">{actions}</div>
    </article>
  )
}
