import { AlertTriangle } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import FinanceStatusBadge from './FinanceStatusBadge'
import { formatINR } from '../../utils/financeFilters'
import { formatCategoryDateTime } from '../../utils/formatDateTime'

export default function VerificationDuplicateDialog({ open, row, onClose, onMarkValid, loading, canMarkValid }) {
  if (!row) return null
  const matches = row.duplicateMatches || []

  return (
    <Modal open={open} onClose={onClose} size="md" title="Possible duplicate payment" showCloseButton={false}>
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_11px_25px_rgba(15,23,42,0.08)]">
        <ModalPanelHeader
          title="Duplicate payment detected"
          onClose={onClose}
          icon={AlertTriangle}
          iconClassName="text-amber-600"
          closeVariant="icon"
        />
        <div className="space-y-4 p-5 sm:p-6">
          <p className="text-sm text-[#686868]">
            This payment matches an existing record on student ID, transaction ID, amount, payment date, or
            reference number. Approval is blocked until manually reviewed.
          </p>

          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Current payment</p>
            <p className="mt-1 font-mono text-sm font-semibold text-[#222]">{row.id}</p>
            <p className="text-sm text-[#444]">{row.student} · {formatINR(row.amount)}</p>
            <p className="font-mono text-xs text-[#246392]">{row.utrNumber}</p>
          </div>

          {matches.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-[#686868]">Matching payments</p>
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold">{m.id}</span>
                    <FinanceStatusBadge status={m.status || m.approvalStatus || m.verificationStatus} />
                  </div>
                  <p className="mt-1 text-[#444]">{m.student}</p>
                  <p className="tabular-nums text-[#686868]">{formatINR(m.amount)}</p>
                  <p className="font-mono text-xs text-[#246392]">{m.utrNumber}</p>
                  {m.paymentDate && (
                    <p className="mt-1 text-xs text-[#9ca0a8]">
                      {formatCategoryDateTime(m.paymentDate)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-[#444] hover:bg-slate-50"
            >
              Close
            </button>
            {canMarkValid && (
              <button
                type="button"
                onClick={() => onMarkValid?.(row)}
                disabled={loading || row.duplicateOverride}
                className="h-10 rounded-xl bg-gradient-to-r from-[#246392] to-[#1a4d73] px-5 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
              >
                {row.duplicateOverride ? 'Already marked valid' : loading ? 'Saving…' : 'Mark as valid'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
