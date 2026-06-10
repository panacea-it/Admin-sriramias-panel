import { useEffect, useState } from 'react'
import Modal from '../../ui/Modal'
import { OFFLINE_PAYMENT_MODES } from '../../../constants/offlinePaymentEmi'
import { getEmiMonthLabel } from '../../../utils/emiSchedule'

const fieldClass =
  'mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#55ace7]/40'

export default function EmiInstallmentEditDialog({ open, row, onClose, onSave }) {
  const [form, setForm] = useState(null)

  useEffect(() => {
    if (!open || !row) return
    setForm({
      status: row.status,
      paymentMode: row.paymentMode || 'UPI',
      paymentType: row.paymentType || 'Offline',
      paidDate: row.paidDate || '',
      dueDate: row.dueDate || '',
      referenceNumber: row.referenceNumber || row.utrNumber || '',
      receiptNumber: row.receiptNumber || '',
      remarks: row.remarks || '',
      emiAmount: String(row.emiAmount ?? ''),
      lateFee: String(row.lateFee ?? ''),
      discount: String(row.discount ?? ''),
      customCharge: String(row.customCharge ?? ''),
      rebalanceRemaining: true,
    })
  }, [open, row])

  if (!open || !form) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const dueDate = form.dueDate || row.dueDate
    onSave?.({
      ...row,
      ...form,
      emiAmount: Number(form.emiAmount) || row.emiAmount,
      lateFee: Number(form.lateFee) || 0,
      discount: Number(form.discount) || 0,
      customCharge: Number(form.customCharge) || 0,
      emiMonth: getEmiMonthLabel(dueDate),
      dueDate,
      emiDate: dueDate,
      utrNumber: form.referenceNumber,
      rebalanceRemaining: form.rebalanceRemaining,
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} size="md" title="Customize installment" showCloseButton={false}>
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_11px_25px_rgba(15,23,42,0.08)]">
        <ModalPanelHeader
          title="Customize installment"
          subtitle={row ? `Installment #${row.installmentNo}` : undefined}
          onClose={onClose}
          closeVariant="icon"
        />
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
        <p className="rounded-lg bg-[#eef6fc] px-3 py-2 text-xs text-[#246392]">
          Adjust amount, due date, fees, or discounts. Enable rebalance to auto-adjust remaining
          installments to match pending balance.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-[#333]">
            EMI amount (₹)
            <input
              type="number"
              min="0"
              required
              value={form.emiAmount}
              onChange={(e) => setForm((f) => ({ ...f, emiAmount: e.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-semibold text-[#333]">
            Due date
            <input
              type="date"
              required
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-semibold text-[#333]">
            Late fee (₹)
            <input
              type="number"
              min="0"
              value={form.lateFee}
              onChange={(e) => setForm((f) => ({ ...f, lateFee: e.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-semibold text-[#333]">
            Discount (₹)
            <input
              type="number"
              min="0"
              value={form.discount}
              onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-semibold text-[#333] sm:col-span-2">
            Custom charge (₹)
            <input
              type="number"
              min="0"
              value={form.customCharge}
              onChange={(e) => setForm((f) => ({ ...f, customCharge: e.target.value }))}
              className={fieldClass}
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold text-[#333]">
          <input
            type="checkbox"
            checked={form.rebalanceRemaining}
            onChange={(e) => setForm((f) => ({ ...f, rebalanceRemaining: e.target.checked }))}
            className="rounded border-slate-300"
          />
          Auto-rebalance remaining installments
        </label>

        <label className="block text-sm font-semibold text-[#333]">
          Status
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className={fieldClass}
          >
            {['Pending', 'Scheduled', 'Paid', 'Overdue', 'Partial', 'Cancelled'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-[#333]">
          Payment mode
          <select
            value={form.paymentMode}
            onChange={(e) => setForm((f) => ({ ...f, paymentMode: e.target.value }))}
            className={fieldClass}
          >
            {OFFLINE_PAYMENT_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-[#333]">
          Receipt number
          <input
            value={form.receiptNumber}
            onChange={(e) => setForm((f) => ({ ...f, receiptNumber: e.target.value }))}
            className={fieldClass}
          />
        </label>

        <label className="block text-sm font-semibold text-[#333]">
          Reference / UTR
          <input
            value={form.referenceNumber}
            onChange={(e) => setForm((f) => ({ ...f, referenceNumber: e.target.value }))}
            className={fieldClass}
          />
        </label>

        <label className="block text-sm font-semibold text-[#333]">
          Paid date
          <input
            type="date"
            value={form.paidDate}
            onChange={(e) => setForm((f) => ({ ...f, paidDate: e.target.value }))}
            className={fieldClass}
          />
        </label>

        <label className="block text-sm font-semibold text-[#333]">
          Remarks
          <textarea
            value={form.remarks}
            onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
            rows={2}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="h-10 rounded-lg bg-[#246392] px-4 text-sm font-semibold text-white"
          >
            Save installment
          </button>
        </div>
      </form>
      </div>
    </Modal>
  )
}
