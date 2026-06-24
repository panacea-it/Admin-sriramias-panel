import { Loader2, Pencil } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import { EDIT_STATUS_REASONS } from '../../constants/financePermissions'
import { cn } from '../../utils/cn'

const STATUS_OPTIONS = ['Paid', 'Partial', 'Pending', 'Failed', 'Refunded']

const FIELD_CLASS =
  'mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-[#222] shadow-sm outline-none transition placeholder:text-[#9ca0a8] focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20 [color-scheme:light]'

const TEXTAREA_CLASS =
  'mt-1.5 min-h-[96px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#222] shadow-sm outline-none transition placeholder:text-[#9ca0a8] focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20 [color-scheme:light]'

function FieldLabel({ children, htmlFor }) {
  return (
    <span className="block text-sm font-semibold text-[#222]" id={htmlFor}>
      {children}
    </span>
  )
}

export default function PaymentEditModal({ open, payment, form, onChange, onClose, onSave, saving }) {
  if (!payment) return null

  return (
    <Modal open={open} onClose={onClose} size="md" title="Edit payment" showCloseButton={false}>
      <div className="flex max-h-[92vh] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_11px_25px_rgba(15,23,42,0.08)]">
        <ModalPanelHeader
          title={payment.studentName}
          subtitle={`${payment.id} · Edit payment details`}
          onClose={onClose}
          icon={Pencil}
          iconClassName="text-[#246392]"
          closeVariant="icon"
          plainCloseIcon
        />

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <div className="space-y-4">
            <label className="block">
              <FieldLabel>New status</FieldLabel>
              <select
                value={form.newStatus}
                onChange={(e) => onChange({ ...form, newStatus: e.target.value })}
                className={cn(FIELD_CLASS, 'cursor-pointer')}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <FieldLabel>Amount adjustment</FieldLabel>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amountAdjustment}
                onChange={(e) => onChange({ ...form, amountAdjustment: e.target.value })}
                className={FIELD_CLASS}
                inputMode="decimal"
              />
            </label>

            <label className="block">
              <FieldLabel>Reason</FieldLabel>
              <select
                value={form.reason}
                onChange={(e) => onChange({ ...form, reason: e.target.value })}
                className={cn(FIELD_CLASS, 'cursor-pointer')}
              >
                {EDIT_STATUS_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <FieldLabel>Comment</FieldLabel>
              <textarea
                value={form.comment}
                onChange={(e) => onChange({ ...form, comment: e.target.value })}
                rows={3}
                placeholder="Optional notes for the audit trail"
                className={TEXTAREA_CLASS}
              />
            </label>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="min-w-[108px] rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#444] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="inline-flex min-w-[132px] items-center justify-center gap-2 rounded-lg bg-[#246392] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1a4d73] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              'Save changes'
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
