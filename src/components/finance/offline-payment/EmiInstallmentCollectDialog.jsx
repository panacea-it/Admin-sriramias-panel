import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, Receipt, Upload, X } from 'lucide-react'
import { OFFLINE_PAYMENT_MODES } from '../../../constants/offlinePaymentEmi'
import { formatINR } from '../../../utils/financeFilters'
import { formatDisplayDate, installmentRemaining } from '../../../utils/emiSchedule'

const fieldClass =
  'mt-1 h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-sm text-[#222] outline-none focus:border-[#55ace7] focus:bg-white focus:ring-2 focus:ring-[#55ace7]/20'

export default function EmiInstallmentCollectDialog({
  open,
  row,
  title = 'Collect installment',
  defaultAmount,
  onClose,
  onCollect,
}) {
  const [form, setForm] = useState(null)
  const [proofName, setProofName] = useState('')

  useEffect(() => {
    if (!open || !row) return
    const pending = installmentRemaining(row)
    setForm({
      paymentMode: 'Cash',
      paidDate: new Date().toISOString().slice(0, 10),
      receiptNumber: `RCP-${Date.now().toString().slice(-6)}`,
      referenceNumber: '',
      remarks: '',
      amountCollected: String(defaultAmount ?? pending ?? row.emiAmount ?? ''),
    })
    setProofName('')
  }, [open, row, defaultAmount])

  if (!open || !form || !row) return null

  const pending = installmentRemaining(row)

  const handleSubmit = (e) => {
    e.preventDefault()
    const collected = Number(form.amountCollected) || 0
    const newPaid = (Number(row.paidAmount) || 0) + collected
    const due = (Number(row.emiAmount) || 0) + (Number(row.lateFee) || 0) + (Number(row.customCharge) || 0) - (Number(row.discount) || 0)
    let status = 'Partial'
    if (newPaid >= due - 0.5) status = 'Paid'
    else if (newPaid <= 0) status = row.status

    onCollect?.({
      ...row,
      paidAmount: newPaid,
      status,
      paymentMode: form.paymentMode,
      paymentType: 'Offline',
      paidDate: form.paidDate,
      receiptNumber: form.receiptNumber,
      referenceNumber: form.referenceNumber,
      utrNumber: form.referenceNumber,
      remarks: form.remarks,
      proofFileName: proofName || row.proofFileName,
      paymentHistory: [
        ...(row.paymentHistory || []),
        {
          action: `Collected ${formatINR(collected)} via ${form.paymentMode}`,
          at: new Date().toISOString(),
          by: 'Finance Admin',
        },
      ],
    })
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.2)]"
          >
            <div className="border-b border-slate-100 bg-gradient-to-r from-[#f8fbff] to-white px-5 py-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#111]">{title}</h3>
                  <p className="mt-0.5 text-sm text-[#686868]">
                    Installment #{row.installmentNo} · {row.emiMonth}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-[#eef6fc] p-2.5 text-center text-xs">
                <div>
                  <p className="text-[#686868]">Due</p>
                  <p className="font-bold tabular-nums text-[#111]">{formatINR(pending)}</p>
                </div>
                <div>
                  <p className="text-[#686868]">Due date</p>
                  <p className="font-semibold tabular-nums text-[#246392]">
                    {formatDisplayDate(row.dueDate)}
                  </p>
                </div>
                <div>
                  <p className="text-[#686868]">EMI total</p>
                  <p className="font-bold tabular-nums">{formatINR(row.emiAmount)}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
              <div className="space-y-3 overflow-y-auto px-5 py-4">
                <label className="block text-xs font-semibold text-[#555]">
                  Amount collecting now (₹) *
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={form.amountCollected}
                    onChange={(e) => setForm((f) => ({ ...f, amountCollected: e.target.value }))}
                    className={fieldClass}
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-semibold text-[#555]">
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
                  <label className="block text-xs font-semibold text-[#555]">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Payment date
                    </span>
                    <input
                      type="date"
                      required
                      value={form.paidDate}
                      onChange={(e) => setForm((f) => ({ ...f, paidDate: e.target.value }))}
                      className={fieldClass}
                    />
                  </label>
                </div>
                <label className="block text-xs font-semibold text-[#555]">
                  <span className="flex items-center gap-1">
                    <Receipt className="h-3 w-3" />
                    Receipt number
                  </span>
                  <input
                    value={form.receiptNumber}
                    onChange={(e) => setForm((f) => ({ ...f, receiptNumber: e.target.value }))}
                    className={fieldClass}
                  />
                </label>
                <label className="block text-xs font-semibold text-[#555]">
                  UTR / reference
                  <input
                    value={form.referenceNumber}
                    onChange={(e) => setForm((f) => ({ ...f, referenceNumber: e.target.value }))}
                    className={fieldClass}
                    placeholder="UPI ref, cheque no."
                  />
                </label>
                <label className="block text-xs font-semibold text-[#555]">
                  Remarks
                  <textarea
                    value={form.remarks}
                    onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm outline-none focus:border-[#55ace7] focus:bg-white"
                  />
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#55ace7]/40 bg-[#f8fbff] px-3 py-2.5 text-xs font-semibold text-[#246392] hover:bg-[#eef6fc]">
                  <Upload className="h-4 w-4" />
                  Upload payment proof
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="sr-only"
                    onChange={(e) => setProofName(e.target.files?.[0]?.name || '')}
                  />
                  {proofName && <span className="ml-auto truncate text-[#686868]">{proofName}</span>}
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-[#444]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 rounded-lg bg-[#246392] px-5 text-sm font-bold text-white shadow-sm"
                >
                  Mark as paid
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
