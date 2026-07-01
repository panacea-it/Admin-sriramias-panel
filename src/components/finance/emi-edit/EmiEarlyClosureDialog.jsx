import { useEffect, useState } from 'react'
import { Calendar, Lock, Receipt, Upload } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import { formatINR } from '../../../utils/financeFilters'
import { resolvePaymentModeId } from '../../../utils/emiManagementHelpers'
import { cn } from '../../../utils/cn'

const FIELD_CLASS =
  'mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-[#222] shadow-sm outline-none transition placeholder:text-[#9ca0a8] focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20 [color-scheme:light]'

const TEXTAREA_CLASS =
  'mt-1.5 min-h-[88px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#222] shadow-sm outline-none transition placeholder:text-[#9ca0a8] focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20 [color-scheme:light]'

function FieldLabel({ children }) {
  return <span className="block text-sm font-semibold text-[#222]">{children}</span>
}

export default function EmiEarlyClosureDialog({
  open,
  onClose,
  pendingBalance,
  paymentModes = [],
  onSave,
  saving = false,
}) {
  const [form, setForm] = useState({
    amount: '',
    paymentMode: '',
    paymentDate: '',
    receiptNumber: '',
    referenceNumber: '',
    remarks: '',
  })
  const [proofName, setProofName] = useState('')
  const [proofFile, setProofFile] = useState(null)
  const [proofError, setProofError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const modeOptions = paymentModes.length
    ? paymentModes.map((m) => ({ value: m.paymentModeId, label: m.paymentModeName }))
    : []

  useEffect(() => {
    if (!open) return
    const defaultMode = paymentModes[0]?.paymentModeId || ''
    setForm({
      amount: String(pendingBalance || ''),
      paymentMode: defaultMode,
      paymentDate: new Date().toISOString().slice(0, 10),
      receiptNumber: '',
      referenceNumber: '',
      remarks: '',
    })
    setProofName('')
    setProofFile(null)
    setProofError('')
    setSubmitting(false)
  }, [open, pendingBalance, paymentModes])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting || saving) return
    if (!proofFile) {
      setProofError('Payment proof is required.')
      return
    }
    setProofError('')
    setSubmitting(true)
    try {
      await onSave?.(
        {
          ...form,
          paymentModeId: resolvePaymentModeId(paymentModes, form.paymentMode),
        },
        proofFile,
      )
    } finally {
      setSubmitting(false)
    }
  }

  const isSaving = submitting || saving

  return (
    <Modal open={open} onClose={onClose} size="md" title="Close EMI early" showCloseButton={false}>
      <div className="flex max-h-[92vh] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_11px_25px_rgba(15,23,42,0.08)]">
        <ModalPanelHeader
          title="Close EMI Early"
          subtitle="Collect full remaining balance and settle the plan"
          onClose={onClose}
          icon={Lock}
          iconClassName="text-amber-700"
          closeVariant="icon"
          plainCloseIcon
        />

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
            <div className="rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-white px-4 py-3.5 text-sm text-amber-900">
              <p className="font-bold">Early closure</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-800/90">
                Collect the full remaining balance of{' '}
                <span className="font-bold tabular-nums">{formatINR(pendingBalance)}</span>.
                Future installments will be marked closed.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <FieldLabel>Amount Collecting Now (₹)</FieldLabel>
                <input
                  type="number"
                  min="0"
                  required
                  readOnly
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className={cn(FIELD_CLASS, 'text-right tabular-nums bg-slate-50')}
                />
              </label>

              <label className="block">
                <FieldLabel>Payment Mode</FieldLabel>
                <select
                  value={form.paymentMode}
                  onChange={(e) => setForm((f) => ({ ...f, paymentMode: e.target.value }))}
                  className={cn(FIELD_CLASS, 'cursor-pointer')}
                >
                  {modeOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <FieldLabel>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#246392]" aria-hidden />
                    Payment Date
                  </span>
                </FieldLabel>
                <input
                  type="date"
                  required
                  value={form.paymentDate}
                  onChange={(e) => setForm((f) => ({ ...f, paymentDate: e.target.value }))}
                  className={FIELD_CLASS}
                />
              </label>

              <label className="block">
                <FieldLabel>
                  <span className="inline-flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5 text-[#246392]" aria-hidden />
                    Receipt Number
                  </span>
                </FieldLabel>
                <input
                  value={form.receiptNumber}
                  onChange={(e) => setForm((f) => ({ ...f, receiptNumber: e.target.value }))}
                  placeholder="RCP-…"
                  className={FIELD_CLASS}
                />
              </label>

              <label className="block">
                <FieldLabel>Reference / UTR</FieldLabel>
                <input
                  value={form.referenceNumber}
                  onChange={(e) => setForm((f) => ({ ...f, referenceNumber: e.target.value }))}
                  placeholder="UPI ref, cheque no."
                  className={FIELD_CLASS}
                />
              </label>

              <label className="block sm:col-span-2">
                <FieldLabel>Remarks</FieldLabel>
                <textarea
                  value={form.remarks}
                  onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                  rows={3}
                  placeholder="Student paid remaining balance at counter…"
                  className={TEXTAREA_CLASS}
                />
              </label>

              <div className="sm:col-span-2">
                <FieldLabel>Upload Payment Proof</FieldLabel>
                <label
                  className={cn(
                    'mt-1.5 flex cursor-pointer items-center gap-2.5 rounded-xl border border-dashed px-4 py-3.5 text-sm font-semibold text-[#246392] transition hover:bg-[#eef6fc]',
                    proofError
                      ? 'border-[#df8284] bg-red-50/40'
                      : 'border-[#55ace7]/40 bg-[#f8fbff]',
                  )}
                >
                  <Upload className="h-4 w-4 shrink-0" aria-hidden />
                  <span>{proofName ? 'Replace proof file' : 'Choose proof file'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf,.pdf"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setProofFile(file)
                      setProofName(file.name)
                      setProofError('')
                    }}
                  />
                  {proofName ? (
                    <span className="ml-auto truncate text-xs font-normal text-[#686868]">{proofName}</span>
                  ) : null}
                </label>
                {proofError ? (
                  <p className="mt-1.5 text-xs font-medium text-[#df8284]">{proofError}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="min-w-[108px] rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#444] shadow-sm transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="min-w-[132px] rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-95 disabled:opacity-50"
            >
              {isSaving ? 'Processing…' : 'Mark as Paid'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
