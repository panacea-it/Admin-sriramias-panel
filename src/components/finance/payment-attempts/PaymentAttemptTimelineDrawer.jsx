import { Clock } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import FinanceTimeline from '../FinanceTimeline'

export default function PaymentAttemptTimelineDrawer({ open, row, onClose }) {
  if (!row) return null
  const events = row.timeline || []

  return (
    <Modal open={open} onClose={onClose} size="md" title="Activity timeline">
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_11px_25px_rgba(15,23,42,0.08)]">
        <ModalPanelHeader
          title="Payment attempt timeline"
          subtitle={`${row.attemptId || row.id} · ${row.student}`}
          onClose={onClose}
          icon={Clock}
        />
        <div className="max-h-[70vh] overflow-y-auto p-5 sm:p-6">
          <FinanceTimeline events={events} />
          {(row.communications || []).length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#686868]">Communication history</p>
              <ul className="space-y-2">
                {row.communications.map((c) => (
                  <li key={c.id} className="flex items-start justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs">
                    <div>
                      <span className="font-semibold text-[#222]">{c.channel}</span>
                      <span className="mx-1 text-[#686868]">·</span>
                      <span className="text-[#686868]">{c.type}</span>
                      {c.message && <p className="mt-0.5 text-[#444]">{c.message}</p>}
                    </div>
                    <span className={cnDelivery(c.status)}>{c.status}</span>
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

function cnDelivery(status) {
  const base = 'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase'
  if (status === 'Delivered') return `${base} bg-[#69df66]/15 text-[#1a5c2e]`
  if (status === 'Failed') return `${base} bg-red-100 text-red-800`
  return `${base} bg-[#efb36d]/20 text-[#8a5a20]`
}
