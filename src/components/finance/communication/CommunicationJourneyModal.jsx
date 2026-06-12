import { Clock } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import CommunicationTrackingTimeline from './CommunicationTrackingTimeline'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'

export default function CommunicationJourneyModal({ row, onClose }) {
  const open = !!row

  return (
    <Modal open={open} onClose={onClose} size="md" title="Delivery timeline" showCloseButton={false} zIndex={120}>
      {row ? (
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_11px_25px_rgba(15,23,42,0.08)]">
          <ModalPanelHeader
            icon={Clock}
            iconClassName="text-[#246392]"
            title="Delivery timeline"
            subtitle={`${row.studentName || row.recipient} · ${row.channel}`}
            onClose={onClose}
            closeVariant="icon"
            plainCloseIcon
          />
          <div className="space-y-4 p-5 sm:p-6">
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-[#686868]">Communication ID</dt><dd className="font-mono text-xs">{row.id}</dd></div>
              <div><dt className="text-[#686868]">Sent at</dt><dd>{formatCategoryDateTime(row.timestamp)}</dd></div>
              <div><dt className="text-[#686868]">Type</dt><dd>{row.type}</dd></div>
              <div><dt className="text-[#686868]">Channel</dt><dd>{row.channel}</dd></div>
            </dl>
            <CommunicationTrackingTimeline row={row} />
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
