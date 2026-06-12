import { Send } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import { FINANCE_COMMUNICATION_CHANNELS } from '../../../constants/financeConstants'
import { RECOVERY_MESSAGE_TEMPLATES } from '../../../constants/paymentAttemptConstants'

export default function PaymentAttemptRecoveryMessageModal({ open, row, onClose, onSend, saving }) {
  if (!row) return null

  const selectClass =
    'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20'

  const handleSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    onSend?.({
      attemptId: row.id,
      channel: fd.get('channel'),
      template: fd.get('template'),
      includeRetryLink: fd.get('includeRetryLink') === 'on',
      scheduleFollowUp: fd.get('scheduleFollowUp') === 'on',
    })
  }

  return (
    <Modal open={open} onClose={onClose} size="md" title="Send recovery message" showCloseButton={false}>
      <div className="overflow-hidden rounded-2xl bg-white">
        <ModalPanelHeader
          title="Payment recovery workflow"
          subtitle={`${row.student} · ${row.mobile || row.email}`}
          onClose={onClose}
          icon={Send}
          closeVariant="icon"
          plainCloseIcon
        />
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#686868]">Channel</span>
            <select name="channel" defaultValue="WhatsApp" className={selectClass}>
              {FINANCE_COMMUNICATION_CHANNELS.map((c) => (
                <option key={c} value={c}>{c} (placeholder)</option>
              ))}
              <option value="In-app">In-app notification</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#686868]">Template</span>
            <select name="template" defaultValue="failed_payment" className={selectClass}>
              {RECOVERY_MESSAGE_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="includeRetryLink" defaultChecked className="rounded border-slate-300" />
            Include retry payment link
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="scheduleFollowUp" defaultChecked className="rounded border-slate-300" />
            Schedule auto follow-up (24h)
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-[#686868] hover:bg-slate-100">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? 'Sending…' : 'Send message'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
