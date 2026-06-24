import { ShieldAlert } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import OfflineBranchBadge from './OfflineBranchBadge'
import { OFFLINE_BRANCH_ACCESS } from '../../../constants/offlinePaymentApproval'

export default function OfflineBranchAccessDialog({ open, row, access, onClose, onOverride }) {
  if (!row || !access) return null
  const isRestricted = access.status === OFFLINE_BRANCH_ACCESS.RESTRICTED

  return (
    <Modal open={open} onClose={onClose} size="sm" title="Branch access restriction">
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_11px_25px_rgba(15,23,42,0.08)]">
        <ModalPanelHeader
          title="Cross-branch approval restricted"
          onClose={onClose}
          icon={ShieldAlert}
          iconClassName="text-[#df8284]"
        />
        <div className="space-y-4 p-5 sm:p-6">
          <p className="text-sm text-[#686868]">
            {access.message ||
              'You can only approve offline payments belonging to your assigned branch. This action has been blocked for security.'}
          </p>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-semibold text-[#686868]">Payment branch</span>
            <OfflineBranchBadge branchCode={access.branchCode} accessStatus={access.status} showAccess />
            <span className="w-full text-xs text-[#686868]">
              {row.studentName} · {row.id}
            </span>
          </div>
          {isRestricted && (
            <p className="rounded-lg bg-[#df8284]/10 p-3 text-xs text-[#b94b4b]">
              Unauthorized approval attempts are logged for audit. Contact Finance Head for cross-branch override.
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-[#444] hover:bg-slate-50"
            >
              Close
            </button>
            {onOverride && access.status === OFFLINE_BRANCH_ACCESS.OVERRIDE && (
              <button
                type="button"
                onClick={() => onOverride(row)}
                className="h-10 rounded-xl bg-gradient-to-r from-[#246392] to-[#1a4d73] px-5 text-sm font-semibold text-white shadow-sm"
              >
                Proceed with override
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
