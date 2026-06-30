import { useEffect, useState } from 'react'
import { IndianRupee, Upload } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import { OFFLINE_PAYMENT_MODES } from '../../../constants/offlinePaymentEmi'
import { readProofFile } from '../../../utils/emiEditModel'
import { toast } from '../../../utils/toast'
import { cn } from '../../../utils/cn'

const FIELD_CLASS =
  'mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-[#222] shadow-sm outline-none transition placeholder:text-[#9ca0a8] focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20 [color-scheme:light]'

const TEXTAREA_CLASS =
  'mt-1.5 min-h-[88px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#222] shadow-sm outline-none transition placeholder:text-[#9ca0a8] focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20 [color-scheme:light]'

const STATUS_OPTIONS = ['Pending', 'Scheduled', 'Due', 'Paid', 'Overdue', 'Partial', 'Cancelled', 'Closed']

function FieldLabel({ children }) {
  return <span className="block text-sm font-semibold text-[#222]">{children}</span>
}

export default function EmiPayInstallmentModal({ open, row, locked, onClose, onSave }) {
  const [form, setForm] = useState(null)
  const [proofName, setProofName] = useState('')
  const [proofFile, setProofFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !row) return
    setForm({
      status: row.status || 'Due',
      paymentMode: row.paymentMode || '',
      receiptNumber: row.receiptNumber || '',
      referenceNumber: row.referenceNumber || row.utrNumber || '',
      paidDate: row.paidDate || '',
      remarks: row.remarks || '',
    })
    setProofName(row.proofFileName || '')
    setProofFile(null)
    setSubmitting(false)
  }, [open, row])

  if (!open || !form || !row) return null

  const handleProofChange = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setProofFile(file)
    setProofName(file.name)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)

    try {
      let proofData = {}
      if (proofFile) {
        proofData = await readProofFile(proofFile)
      } else if (row.proofFileName) {
        proofData = {
          proofFileName: row.proofFileName,
          proofUrl: row.proofUrl,
          proofDataUrl: row.proofDataUrl,
        }
      }

      onSave?.({
        ...row,
        status: form.status,
        paymentMode: form.paymentMode,
        receiptNumber: form.receiptNumber,
        referenceNumber: form.referenceNumber,
        utrNumber: form.referenceNumber,
        paidDate: form.paidDate,
        remarks: form.remarks,
        ...proofData,
      })
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to upload proof')
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="md" title="Pay installment" showCloseButton={false}>
      <div className="flex max-h-[92vh] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_11px_25px_rgba(15,23,42,0.08)]">
        <ModalPanelHeader
          title="Pay Installment"
          subtitle={`Installment #${row.installmentNo} · ${row.emiMonth}`}
          onClose={onClose}
          icon={IndianRupee}
          iconClassName="text-[#246392]"
          closeVariant="icon"
          plainCloseIcon
        />

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
            <p className="rounded-xl border border-[#55ace7]/20 bg-[#eef6fc] px-4 py-3 text-sm leading-relaxed text-[#246392]">
              Record payment details for this installment including mode, receipt, reference, and
              proof of payment.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <FieldLabel>Status</FieldLabel>
                <select
                  disabled={locked}
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
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
                <FieldLabel>Payment Mode</FieldLabel>
                <select
                  disabled={locked}
                  value={form.paymentMode}
                  onChange={(e) => setForm((f) => ({ ...f, paymentMode: e.target.value }))}
                  className={cn(FIELD_CLASS, 'cursor-pointer')}
                >
                  <option value="">—</option>
                  {OFFLINE_PAYMENT_MODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <FieldLabel>Receipt Number</FieldLabel>
                <input
                  disabled={locked}
                  value={form.receiptNumber}
                  onChange={(e) => setForm((f) => ({ ...f, receiptNumber: e.target.value }))}
                  placeholder="RCP-…"
                  className={FIELD_CLASS}
                />
              </label>

              <label className="block">
                <FieldLabel>Reference / UTR</FieldLabel>
                <input
                  disabled={locked}
                  value={form.referenceNumber}
                  onChange={(e) => setForm((f) => ({ ...f, referenceNumber: e.target.value }))}
                  placeholder="UPI ref, cheque no."
                  className={FIELD_CLASS}
                />
              </label>

              <label className="block sm:col-span-2">
                <FieldLabel>Paid Date</FieldLabel>
                <input
                  type="date"
                  disabled={locked}
                  value={form.paidDate}
                  onChange={(e) => setForm((f) => ({ ...f, paidDate: e.target.value }))}
                  className={FIELD_CLASS}
                />
              </label>

              <label className="block sm:col-span-2">
                <FieldLabel>Remarks</FieldLabel>
                <textarea
                  disabled={locked}
                  value={form.remarks}
                  onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                  rows={3}
                  placeholder="Optional notes for this payment"
                  className={TEXTAREA_CLASS}
                />
              </label>

              <div className="sm:col-span-2">
                <FieldLabel>Upload Payment Proof</FieldLabel>
                <label
                  className={cn(
                    'mt-1.5 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#55ace7]/50 bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-[#246392] transition hover:bg-[#eef6fc]',
                    locked && 'cursor-not-allowed opacity-50',
                  )}
                >
                  <Upload className="h-4 w-4 shrink-0" aria-hidden />
                  <span>{proofName ? 'Replace proof file' : 'Choose proof file'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf,.pdf"
                    disabled={locked}
                    className="sr-only"
                    onChange={handleProofChange}
                  />
                  {proofName && (
                    <span className="ml-auto truncate text-xs font-normal text-[#686868]">{proofName}</span>
                  )}
                </label>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="min-w-[108px] rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#444] shadow-sm transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={locked || submitting}
              className="min-w-[148px] rounded-lg bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save Payment'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
