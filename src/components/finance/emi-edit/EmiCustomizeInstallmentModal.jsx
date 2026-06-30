import { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import { getEmiMonthLabel } from '../../../utils/emiSchedule'
import { cn } from '../../../utils/cn'

const FIELD_CLASS =
  'mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-[#222] shadow-sm outline-none transition placeholder:text-[#9ca0a8] focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20 [color-scheme:light]'

function FieldLabel({ children }) {
  return <span className="block text-sm font-semibold text-[#222]">{children}</span>
}

export default function EmiCustomizeInstallmentModal({ open, row, locked, onClose, onSave }) {
  const [form, setForm] = useState(null)

  useEffect(() => {
    if (!open || !row) return
    setForm({
      emiAmount: String(row.emiAmount ?? ''),
      dueDate: row.dueDate || '',
      lateFee: String(row.lateFee ?? ''),
      discount: String(row.discount ?? ''),
      customCharge: String(row.customCharge ?? ''),
      rebalanceRemaining: true,
    })
  }, [open, row])

  if (!open || !form || !row) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const dueDate = form.dueDate || row.dueDate
    onSave?.({
      ...row,
      emiAmount: form.emiAmount === '' ? 0 : Number(form.emiAmount),
      dueDate,
      emiDate: dueDate,
      emiMonth: getEmiMonthLabel(dueDate),
      lateFee: Number(form.lateFee) || 0,
      discount: Number(form.discount) || 0,
      customCharge: Number(form.customCharge) || 0,
      rebalanceRemaining: form.rebalanceRemaining,
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} size="md" title="Customize installment" showCloseButton={false}>
      <div className="flex max-h-[92vh] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_11px_25px_rgba(15,23,42,0.08)]">
        <ModalPanelHeader
          title="Customize Installment"
          subtitle={`Installment #${row.installmentNo} · ${row.emiMonth}`}
          onClose={onClose}
          icon={Pencil}
          iconClassName="text-[#246392]"
          closeVariant="icon"
          plainCloseIcon
        />

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
            <p className="rounded-xl border border-[#55ace7]/20 bg-[#eef6fc] px-4 py-3 text-sm leading-relaxed text-[#246392]">
              Adjust installment amount, due date, and fee adjustments. Enable auto-rebalance to
              redistribute remaining installments against the pending balance.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <FieldLabel>EMI Amount (₹)</FieldLabel>
                <input
                  type="number"
                  min="0"
                  required
                  disabled={locked}
                  value={form.emiAmount}
                  onChange={(e) => setForm((f) => ({ ...f, emiAmount: e.target.value }))}
                  className={cn(FIELD_CLASS, 'text-right tabular-nums')}
                />
              </label>

              <label className="block">
                <FieldLabel>Due Date</FieldLabel>
                <input
                  type="date"
                  required
                  disabled={locked}
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className={FIELD_CLASS}
                />
              </label>

              <label className="block">
                <FieldLabel>Late Fee (₹)</FieldLabel>
                <input
                  type="number"
                  min="0"
                  disabled={locked}
                  value={form.lateFee}
                  onChange={(e) => setForm((f) => ({ ...f, lateFee: e.target.value }))}
                  className={cn(FIELD_CLASS, 'text-right tabular-nums')}
                />
              </label>

              <label className="block">
                <FieldLabel>Discount (₹)</FieldLabel>
                <input
                  type="number"
                  min="0"
                  disabled={locked}
                  value={form.discount}
                  onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
                  className={cn(FIELD_CLASS, 'text-right tabular-nums')}
                />
              </label>

              <label className="block sm:col-span-2">
                <FieldLabel>Custom Charge (₹)</FieldLabel>
                <input
                  type="number"
                  min="0"
                  disabled={locked}
                  value={form.customCharge}
                  onChange={(e) => setForm((f) => ({ ...f, customCharge: e.target.value }))}
                  className={cn(FIELD_CLASS, 'text-right tabular-nums')}
                />
              </label>
            </div>

            <label className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm font-semibold text-[#333]">
              <input
                type="checkbox"
                disabled={locked}
                checked={form.rebalanceRemaining}
                onChange={(e) => setForm((f) => ({ ...f, rebalanceRemaining: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-[#246392] focus:ring-[#55ace7]/30"
              />
              Auto-rebalance remaining installments
            </label>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="min-w-[108px] rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#444] shadow-sm transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={locked}
              className="min-w-[148px] rounded-lg bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save Installment
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
