import { Clock, X } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import FinanceTimeline from './FinanceTimeline'
import { buildVerificationTimeline } from '../../utils/financeVerificationWorkflow'

export default function VerificationTimelineDrawer({ open, row, onClose }) {
  if (!row) return null
  const events = buildVerificationTimeline(row)

  return (
    <Modal open={open} onClose={onClose} size="md" title="Activity timeline">
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_11px_25px_rgba(15,23,42,0.08)]">
        <ModalPanelHeader
          title="Payment activity timeline"
          subtitle={`${row.id} · ${row.student}`}
          onClose={onClose}
          icon={Clock}
        />
        <div className="max-h-[70vh] overflow-y-auto p-5 sm:p-6">
          {row.rejectionRemarks && (
            <div className="mb-4 rounded-lg border border-[#df8284]/30 bg-[#df8284]/10 p-3 text-sm text-[#b94b4b]">
              <span className="font-semibold">Rejection remarks:</span> {row.rejectionRemarks}
            </div>
          )}
          <FinanceTimeline events={events} />
          {(row.notificationLog || []).length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#686868]">
                Notification history
              </p>
              <ul className="space-y-2">
                {row.notificationLog.map((n) => (
                  <li
                    key={n.id}
                    className="flex items-start justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[#222]">{n.channel}</span>
                      <span className="mx-1 text-[#686868]">·</span>
                      <span className="text-[#686868]">{n.message || n.statusUpdate}</span>
                    </div>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        n.read ? 'bg-slate-200 text-slate-600' : 'bg-[#55ace7]/15 text-[#246392]'
                      }`}
                    >
                      {n.read ? 'Read' : 'Unread'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export function RejectionRemarksPopover({ remarks, onClose }) {
  if (!remarks) return null
  return (
    <div className="rounded-lg border border-[#df8284]/30 bg-[#fff5f5] p-3 text-sm shadow-sm">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="font-semibold text-[#b94b4b]">Rejection remarks</span>
        {onClose && (
          <button type="button" onClick={onClose} className="text-[#686868] hover:text-[#222]" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="text-[#444]">{remarks}</p>
    </div>
  )
}
