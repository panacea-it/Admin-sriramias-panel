import { Eye } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import { formatINR } from '../../../utils/financeFilters'

function DetailItem({ label, children }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#686868]">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-[#1a3a5c]">{children}</dd>
    </div>
  )
}

export default function PaymentAttemptViewModal({ open, row, loading = false, onClose }) {
  if (!row) return null

  const attemptLabel = row.attemptId || row.id
  const studentName = row.student || row.studentName

  return (
    <Modal open={open} onClose={onClose} size="md" title="Payment attempt details" showCloseButton={false}>
      <div className="overflow-hidden rounded-2xl bg-white">
        <ModalPanelHeader
          title="Payment attempt details"
          subtitle={studentName || 'Student'}
          onClose={onClose}
          icon={Eye}
          closeVariant="icon"
          plainCloseIcon
        />
        <div className="p-5">
          {loading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 animate-pulse rounded bg-slate-100" />
              ))}
            </div>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Attempt ID">
                <span className="font-mono text-xs">{attemptLabel}</span>
              </DetailItem>
              <DetailItem label="Student Name">{studentName || '—'}</DetailItem>
              <DetailItem label="Mobile Number">{row.mobile || row.mobileNumber || '—'}</DetailItem>
              <DetailItem label="Email Address">{row.email || '—'}</DetailItem>
              <DetailItem label="Course">{row.course || row.courseName || '—'}</DetailItem>
              <DetailItem label="Amount">{formatINR(row.amount ?? 0)}</DetailItem>
              <DetailItem label="Retries">{row.retryCount ?? 0}</DetailItem>
            </dl>
          )}
          <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 py-2 text-sm font-semibold text-white"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
