import { Eye } from 'lucide-react'
import FinanceStatusBadge from '../FinanceStatusBadge'
import FinanceActionMenu from '../FinanceActionMenu'
import OfflineBranchBadge from './OfflineBranchBadge'
import OfflineDuplicateBadge from './OfflineDuplicateBadge'
import { OfflineReconciliationBadge } from './OfflineReconciliationCards'
import { OfflineWorkflowChip } from './OfflineWorkflowTracker'
import { ProofThumbnail } from '../ProofViewerModal'
import { formatINR } from '../../../utils/financeFilters'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { cn } from '../../../utils/cn'

export default function OfflineApprovalMobileCard({
  row,
  access,
  actions,
  onProofClick,
  onDuplicateClick,
  suspicious,
}) {
  return (
    <article
      className={cn(
        'rounded-xl border bg-white p-4 shadow-sm',
        suspicious ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-[#686868]">{row.id}</p>
          <p className="font-semibold text-[#222]">{row.studentName}</p>
          <p className="text-xs text-[#686868]">{row.course}</p>
        </div>
        <OfflineBranchBadge branchCode={row.branchCode} accessStatus={access?.status} showAccess />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-[#686868]">Amount</p>
          <p className="font-semibold">{formatINR(row.amount)}</p>
        </div>
        <div>
          <p className="text-xs text-[#686868]">Mode</p>
          <p>{row.paymentMode}</p>
        </div>
        <div>
          <p className="text-xs text-[#686868]">Receipt</p>
          <p className="font-mono text-xs">{row.receiptNumber || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-[#686868]">Updated</p>
          <p className="text-xs">{formatCategoryDateTime(row.updatedAt || row.requestedDate)}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <OfflineWorkflowChip status={row.workflowStatus || row.status} />
        <OfflineReconciliationBadge status={row.reconciliationStatus} />
        <OfflineDuplicateBadge status={row.duplicateStatus} onClick={onDuplicateClick} />
        <FinanceStatusBadge status={row.status} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2">
          {row.proofFiles?.[0] ? (
            <ProofThumbnail proof={row.proofFiles[0]} onClick={() => onProofClick?.(row)} />
          ) : (
            <button
              type="button"
              onClick={() => onProofClick?.(row)}
              className="text-xs font-semibold text-[#246392]"
            >
              <Eye className="mr-1 inline h-3.5 w-3.5" /> View proof
            </button>
          )}
        </div>
        <FinanceActionMenu actions={actions} />
      </div>
    </article>
  )
}
