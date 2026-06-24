import { FileText } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'

function DetailItem({ label, children, className }) {
  return (
    <div className={className}>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#686868]">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-[#1a3a5c]">{children}</dd>
    </div>
  )
}

function DetailBlock({ label, children }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-[#fafbfc] px-4 py-3 sm:px-5 sm:py-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#686868]">{label}</p>
      <div className="mt-2 text-sm leading-relaxed text-[#1a3a5c]">{children}</div>
    </div>
  )
}

export default function PaymentAttemptViewRemarkModal({ open, remark, onClose }) {
  if (!remark) return null

  return (
    <Modal open={open} onClose={onClose} size="xl" title="Counselor Remark" showCloseButton={false}>
      <div className="overflow-hidden rounded-2xl bg-white">
        <ModalPanelHeader
          title="Counselor Remark"
          subtitle={remark.student || 'Student'}
          onClose={onClose}
          icon={FileText}
          closeVariant="icon"
          plainCloseIcon
        />
        <div className="space-y-5 p-5 sm:p-6">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DetailItem label="Attempt ID">
              <span className="font-mono text-xs">{remark.attemptId}</span>
            </DetailItem>
            <DetailItem label="Center">{remark.center || '—'}</DetailItem>
            <DetailItem label="Student Name">{remark.student || '—'}</DetailItem>
            <DetailItem label="Assigned Counselor">{remark.counselor || '—'}</DetailItem>
          </dl>

          <DetailBlock label="Remark Subject">
            <span className="whitespace-pre-wrap font-semibold">{remark.subject || '—'}</span>
          </DetailBlock>

          <DetailBlock label="Failure Analysis">
            <span className="whitespace-pre-wrap">{remark.failureAnalysis || '—'}</span>
          </DetailBlock>

          <DetailBlock label="Complete Counselor Remark">
            <span className="whitespace-pre-wrap">{remark.remark || '—'}</span>
          </DetailBlock>

          <DetailItem label="Created Date & Time">
            {formatCategoryDateTime(remark.createdAt)}
          </DetailItem>

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
