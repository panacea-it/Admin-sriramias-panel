import { Eye, ShieldCheck } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import VerificationStatusBadge from '../VerificationStatusBadge'
import { ProofThumbnail } from '../ProofViewerModal'
import { formatINR } from '../../../utils/financeFilters'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'

function DetailRow({ label, value, children }) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-3 last:border-0 sm:grid-cols-[minmax(140px,38%)_1fr] sm:items-start sm:gap-4">
      <span className="text-sm font-medium text-[#686868]">{label}</span>
      <div className="text-sm font-semibold text-[#111] sm:text-right">{children ?? value ?? '—'}</div>
    </div>
  )
}

export default function VerificationPaymentViewModal({
  open,
  row,
  onClose,
  onViewProof,
}) {
  if (!row) return null

  const files = row.proofFiles?.length
    ? row.proofFiles
    : row.paymentProof
      ? [{ name: row.paymentProof }]
      : []

  return (
    <Modal open={open} onClose={onClose} size="md" title="Payment verification details" showCloseButton={false}>
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_11px_25px_rgba(15,23,42,0.08)]">
        <ModalPanelHeader
          title="Payment verification details"
          subtitle={`${row.id} · ${row.student}`}
          onClose={onClose}
          icon={ShieldCheck}
          iconClassName="text-[#246392]"
          closeVariant="icon"
        />
        <div className="max-h-[70vh] overflow-y-auto px-5 py-2 sm:px-6">
          <div className="rounded-lg border border-slate-100 bg-slate-50/40 px-4">
            <DetailRow label="Payment ID" value={row.id} />
            <DetailRow label="Student" value={row.student} />
            <DetailRow label="Student ID" value={row.studentId} />
            <DetailRow label="Course" value={row.course} />
            <DetailRow label="Center" value={row.centerName} />
            <DetailRow label="Payment mode" value={row.paymentMode} />
            <DetailRow label="Amount" value={formatINR(row.amount)} />
            <DetailRow label="UTR / Reference" value={row.utrNumber || row.transactionId} />
            <DetailRow label="Verification status">
              <VerificationStatusBadge status={row.verificationStatus} />
            </DetailRow>
            <DetailRow label="Finance head">
              {row.approvalStatus === 'Approved' ? (
                <span className="font-semibold text-[#69df66]">
                  Approved{row.approvedBy ? ` by ${row.approvedBy}` : ''}
                </span>
              ) : row.approvalStatus === 'Rejected' ? (
                <span className="font-semibold text-[#df8284]">Rejected</span>
              ) : (
                row.currentApprover || '—'
              )}
            </DetailRow>
            <DetailRow label="Verified by" value={row.verifiedBy} />
            <DetailRow
              label="Submitted"
              value={formatCategoryDateTime(row.submittedAt || row.updatedAt)}
            />
            <DetailRow
              label="Updated"
              value={formatCategoryDateTime(row.updatedAt || row.submittedAt)}
            />
            {row.isDuplicate && (
              <DetailRow label="Duplicate">
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                  Possible Duplicate
                </span>
              </DetailRow>
            )}
            {row.rejectionRemarks && (
              <DetailRow label="Rejection remarks">
                <span className="text-left text-[#b94b4b] sm:text-right">{row.rejectionRemarks}</span>
              </DetailRow>
            )}
            {row.remarks && <DetailRow label="Remarks" value={row.remarks} />}
            {files.length > 0 && (
              <DetailRow label="Payment proof">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <ProofThumbnail proof={files[0]} onClick={() => onViewProof?.(row)} />
                  {files.length > 1 && (
                    <span className="text-xs font-semibold text-[#686868]">+{files.length - 1} files</span>
                  )}
                  <button
                    type="button"
                    onClick={() => onViewProof?.(row)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#55ace7]/30 px-2.5 py-1.5 text-xs font-semibold text-[#246392] transition hover:bg-[#eef6fc]"
                  >
                    <Eye className="h-3.5 w-3.5" /> View proof
                  </button>
                </div>
              </DetailRow>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
