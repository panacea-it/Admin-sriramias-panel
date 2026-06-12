import { Eye } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import FinanceStatusBadge from '../FinanceStatusBadge'
import CommunicationTrackingTimeline from './CommunicationTrackingTimeline'
import CommunicationFollowUpBadge from './CommunicationFollowUpBadge'
import FinanceTimeline from '../FinanceTimeline'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'

export default function CommunicationTimelineDrawer({ row, onClose }) {
  const open = !!row
  const auditEvents = row
    ? (row.auditTrail || []).map((a) => ({
        step: a.action?.replace(/_/g, ' '),
        detail: `By ${a.by}`,
        timestamp: a.at,
        status: 'completed',
      }))
    : []

  return (
    <Modal open={open} onClose={onClose} size="md" title="Communication details" showCloseButton={false} zIndex={120}>
      {row ? (
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_11px_25px_rgba(15,23,42,0.08)]">
        <ModalPanelHeader
          icon={Eye}
          iconClassName="text-[#246392]"
          title={row.id}
          subtitle={`${row.studentName || row.recipient} · ${row.type}`}
          onClose={onClose}
          closeVariant="icon"
          plainCloseIcon
        />
        <div className="max-h-[min(70vh,560px)] overflow-y-auto p-5 sm:p-6">
          <div className="space-y-6">
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#686868]">Details</h3>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div><dt className="text-[#686868]">Student</dt><dd className="font-medium">{row.studentName || '—'}</dd></div>
                <div><dt className="text-[#686868]">Student ID</dt><dd>{row.studentId || '—'}</dd></div>
                <div><dt className="text-[#686868]">Payment ref</dt><dd className="font-mono text-xs">{row.paymentReference || '—'}</dd></div>
                <div><dt className="text-[#686868]">Channel</dt><dd>{row.channel}</dd></div>
                <div><dt className="text-[#686868]">Sent by</dt><dd>{row.sentBy || '—'}</dd></div>
                <div><dt className="text-[#686868]">Sent at</dt><dd>{formatCategoryDateTime(row.timestamp)}</dd></div>
                <div><dt className="text-[#686868]">Delivery</dt><dd><FinanceStatusBadge status={row.deliveryStatus || row.status} /></dd></div>
                <div><dt className="text-[#686868]">Open / Read</dt><dd>{row.openStatus || '—'} / {row.readStatus || '—'}</dd></div>
              </dl>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#686868]">Delivery journey</h3>
              <CommunicationTrackingTimeline row={row} />
            </section>

            {(row.counselorName || row.followUpTag) && (
              <section>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#686868]">Counselor follow-up</h3>
                <dl className="space-y-2 text-sm">
                  <div><dt className="text-[#686868]">Counselor</dt><dd>{row.counselorName || '—'}</dd></div>
                  <div><dt className="text-[#686868]">Priority</dt><dd><CommunicationFollowUpBadge priority={row.followUpPriority} tag={row.followUpTag} /></dd></div>
                  {row.followUpNotes && <div><dt className="text-[#686868]">Notes</dt><dd>{row.followUpNotes}</dd></div>}
                  {row.nextFollowUpDate && <div><dt className="text-[#686868]">Next follow-up</dt><dd>{formatCategoryDateTime(row.nextFollowUpDate)}</dd></div>}
                </dl>
              </section>
            )}

            {auditEvents.length > 0 && (
              <section>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#686868]">Audit trail</h3>
                <FinanceTimeline events={auditEvents} />
              </section>
            )}
          </div>
        </div>
      </div>
      ) : null}
    </Modal>
  )
}
