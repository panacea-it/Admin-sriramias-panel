import { User } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import FinanceStatusBadge from './FinanceStatusBadge'
import { formatINR } from '../../utils/financeFilters'
import { formatCategoryDateTime } from '../../utils/formatDateTime'

function parseLatestAdminNote(row) {
  const logs = Array.isArray(row?.adminLogs) ? row.adminLogs : []
  if (!logs.length) return { reason: '', comment: '' }

  const latest = logs[logs.length - 1]
  const raw = (latest.comment || '').trim()
  if (!raw) return { reason: '', comment: '' }

  const colonIdx = raw.indexOf(': ')
  if (colonIdx > 0) {
    return {
      reason: raw.slice(0, colonIdx).trim(),
      comment: raw.slice(colonIdx + 2).trim(),
    }
  }

  return { reason: latest.action || '', comment: raw }
}

function DetailRow({ label, value, children }) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-3.5 last:border-0 sm:grid-cols-[minmax(140px,40%)_1fr] sm:items-center sm:gap-4">
      <span className="text-sm font-medium text-[#686868]">{label}</span>
      <div className="text-sm font-semibold text-[#111] sm:text-right">{children ?? value ?? '—'}</div>
    </div>
  )
}

export default function PaymentViewDrawer({ open, onClose, payment, loading = false }) {
  if (!payment) return null

  const adminNote = parseLatestAdminNote(payment)
  const reason = payment.reason || adminNote.reason || payment.editReason || '—'
  const comment = payment.comment || adminNote.comment || payment.editComment || '—'

  return (
    <Modal open={open} onClose={onClose} size="md" title="Payment details" showCloseButton={false}>
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_11px_25px_rgba(15,23,42,0.08)]">
        <ModalPanelHeader
          title={payment.studentName}
          subtitle={`${payment.studentId} · ${payment.centerName || payment.branch || '—'}`}
          onClose={onClose}
          icon={User}
          iconClassName="text-[#246392]"
          closeVariant="icon"
          plainCloseIcon
        />
        <div className="max-h-[70vh] overflow-y-auto px-5 py-2 sm:px-6">
          {loading ? (
            <p className="py-8 text-center text-sm text-[#686868]">Loading payment details…</p>
          ) : (
            <>
              <p className="mb-1 pt-2 text-xs font-bold uppercase tracking-wide text-[#246392]">Student details</p>
              <div className="rounded-lg border border-slate-100 bg-slate-50/40 px-4">
                <DetailRow label="Student name" value={payment.studentName} />
                <DetailRow label="Student ID" value={payment.studentId} />
                <DetailRow label="Course" value={payment.courseName} />
                <DetailRow label="Batch" value={payment.batchName} />
                <DetailRow label="Center" value={payment.centerName} />
                <DetailRow label="Mobile" value={payment.mobile} />
                <DetailRow label="Email" value={payment.email} />
                <DetailRow label="Payment status">
                  <FinanceStatusBadge status={payment.paymentStatus} className="rounded-full px-3 py-1 text-xs" />
                </DetailRow>
                <DetailRow label="Payment mode" value={payment.paymentMode} />
                <DetailRow label="Amount" value={formatINR(payment.amountPaid)} />
                <DetailRow label="Receipt number" value={payment.receiptNumber || 'Not generated'} />
                <DetailRow label="Transaction ID" value={payment.transactionId} />
                <DetailRow
                  label="Payment date"
                  value={payment.paymentDate ? formatCategoryDateTime(payment.paymentDate) : '—'}
                />
                <DetailRow label="Gateway" value={payment.paymentGateway} />
                <DetailRow label="Verification status">
                  <FinanceStatusBadge status={payment.verificationStatus} className="rounded-full px-3 py-1 text-xs" />
                </DetailRow>
                <DetailRow label="Reason" value={reason} />
                <DetailRow label="Comments" value={comment} />
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
