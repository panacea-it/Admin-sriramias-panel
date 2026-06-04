import Modal from '../ui/Modal'
import { EDIT_STATUS_REASONS } from '../../constants/financePermissions'

const STATUS_OPTIONS = ['Paid', 'Partial', 'Pending', 'Failed', 'Refunded']

export default function PaymentEditModal({ open, payment, form, onChange, onClose, onSave, saving }) {
  return (
    <Modal open={open} onClose={onClose} title="Edit payment" size="md">
      {payment && (
        <div className="space-y-4">
          <p className="text-sm text-[#686868]">
            {payment.studentName} · {payment.id}
          </p>
          <label className="block text-sm font-medium text-[#111]">
            New status
            <select
              value={form.newStatus}
              onChange={(e) => onChange({ ...form, newStatus: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-[#111]">
            Amount adjustment
            <input
              type="number"
              value={form.amountAdjustment}
              onChange={(e) => onChange({ ...form, amountAdjustment: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-[#111]">
            Reason
            <select
              value={form.reason}
              onChange={(e) => onChange({ ...form, reason: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {EDIT_STATUS_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-[#111]">
            Comment
            <textarea
              value={form.comment}
              onChange={(e) => onChange({ ...form, comment: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-[#444]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={onSave}
              className="rounded-lg bg-[#246392] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a4d73] disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
