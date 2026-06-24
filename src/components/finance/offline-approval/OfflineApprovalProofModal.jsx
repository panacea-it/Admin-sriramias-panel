import { Check, Eye, X } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import OfflineProofDropzone from '../OfflineProofDropzone'
import OfflineWorkflowTracker from './OfflineWorkflowTracker'
import OfflineDuplicateBadge from './OfflineDuplicateBadge'
import { OfflineReconciliationBadge } from './OfflineReconciliationCards'
import OfflineBranchBadge from './OfflineBranchBadge'
import VerificationDuplicateDialog from '../VerificationDuplicateDialog'
import { formatINR } from '../../../utils/financeFilters'
import { hasRequiredProof } from '../../../utils/offlinePaymentApproval'

export default function OfflineApprovalProofModal({
  open,
  row,
  access,
  canApprove,
  canFinanceHeadApprove,
  actionLoading,
  onClose,
  onApprove,
  onReject,
  onProofChange,
  onDuplicateOverride,
  duplicateOpen,
  setDuplicateOpen,
}) {
  if (!row) return null

  const proofOk = hasRequiredProof(row)
  const showDuplicate = row.isDuplicate && !row.duplicateOverride

  return (
    <>
      <Modal open={open} onClose={onClose} size="lg" title="Receipt verification" showCloseButton={false}>
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_11px_25px_rgba(15,23,42,0.08)]">
          <ModalPanelHeader
            title="Receipt preview & verification"
            subtitle={`${row.id} · ${row.studentName}`}
            onClose={onClose}
            closeVariant="icon"
            icon={Eye}
          />
          <div className="max-h-[85vh] space-y-5 overflow-y-auto p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <OfflineBranchBadge branchCode={row.branchCode} accessStatus={access?.status} showAccess />
              <OfflineWorkflowTracker row={row} compact />
              <OfflineReconciliationBadge status={row.reconciliationStatus} />
              <OfflineDuplicateBadge
                status={row.duplicateStatus}
                onClick={showDuplicate ? () => setDuplicateOpen?.(true) : undefined}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#686868]">Proof preview</p>
                  {row.proofFiles?.length ? (
                    <div className="space-y-2">
                      {row.proofFiles.map((f) => (
                        <div key={f.id} className="rounded-lg border border-slate-200 bg-white p-2">
                          {f.url && !f.name?.endsWith('.pdf') ? (
                            <img src={f.url} alt={f.name} className="max-h-48 w-full rounded object-contain" />
                          ) : (
                            <p className="text-sm font-medium text-[#444]">{f.name}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#686868]">No proof uploaded</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-[#686868]">Amount</dt>
                    <dd className="font-semibold">{formatINR(row.amount)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#686868]">Mode</dt>
                    <dd>{row.paymentMode}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#686868]">Receipt #</dt>
                    <dd className="font-mono text-xs">{row.receiptNumber || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#686868]">Branch</dt>
                    <dd>{row.branchCode}</dd>
                  </div>
                </dl>

                {!proofOk && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-900">Receipt upload required</p>
                    <p className="mt-1 text-xs text-amber-800">
                      Upload cash receipt, bank slip, UPI screenshot, cheque image, or PDF before approval.
                    </p>
                    <div className="mt-3">
                      <OfflineProofDropzone
                        files={row.proofFiles || []}
                        onChange={(files) => onProofChange?.(row, files)}
                        label="Upload receipt (required)"
                      />
                    </div>
                  </div>
                )}

                <OfflineWorkflowTracker row={row} />

                {showDuplicate && row.duplicateMatches?.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm">
                    <p className="font-semibold text-amber-900">Duplicate comparison</p>
                    {row.duplicateMatches.map((m) => (
                      <div key={m.id} className="mt-2 rounded-lg border border-amber-100 bg-white p-2 text-xs">
                        <p className="font-mono font-semibold">{m.id}</p>
                        <p>{m.student} · {formatINR(m.amount)}</p>
                        <p className="text-[#686868]">{m.utrNumber}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-white pt-4">
              {canApprove && (
                <>
                  <button
                    type="button"
                    onClick={() => onReject?.(row)}
                    disabled={actionLoading}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#df8284]/40 px-5 text-sm font-semibold text-[#b94b4b] hover:bg-[#df8284]/10 disabled:opacity-60"
                  >
                    <X className="h-4 w-4" /> Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => onApprove?.(row)}
                    disabled={actionLoading || !proofOk || (showDuplicate && !canFinanceHeadApprove)}
                    title={
                      !proofOk
                        ? 'Upload receipt before approval'
                        : showDuplicate && !canFinanceHeadApprove
                          ? 'Finance Head override required for duplicates'
                          : undefined
                    }
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#246392] to-[#1a4d73] px-5 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" /> {actionLoading ? 'Processing…' : 'Approve'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <VerificationDuplicateDialog
        open={duplicateOpen}
        row={
          row
            ? {
                ...row,
                student: row.studentName,
                utrNumber: row.utrNumber || row.receiptNumber,
              }
            : null
        }
        onClose={() => setDuplicateOpen?.(false)}
        onMarkValid={canFinanceHeadApprove ? onDuplicateOverride : undefined}
        canMarkValid={canFinanceHeadApprove}
        loading={actionLoading}
      />
    </>
  )
}
