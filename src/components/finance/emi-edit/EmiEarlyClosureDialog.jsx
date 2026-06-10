import { useEffect, useState } from 'react'
import { Lock, Upload, X } from 'lucide-react'
import { formatINR } from '../../../utils/financeFilters'
import { readProofFile } from '../../../utils/emiEditModel'

const fieldClass =
  'mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-[#55ace7]/40'

export default function EmiEarlyClosureDialog({ open, onClose, pendingBalance, onConfirm }) {
  const [amount, setAmount] = useState('')
  const [remarks, setRemarks] = useState('')
  const [proof, setProof] = useState(null)
  const [proofName, setProofName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setAmount('')
    setRemarks('')
    setProof(null)
    setProofName('')
    setSubmitting(false)
  }, [open, pendingBalance])

  if (!open) return null

  const displayAmount = amount || String(pendingBalance || 0)

  const handleProof = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = await readProofFile(file)
      setProof(data)
      setProofName(data.proofFileName)
    } catch {
      setProof(null)
      setProofName('')
    }
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    if (submitting) return
    setSubmitting(true)
    try {
      await onConfirm?.({
        amount: Number(displayAmount) || pendingBalance,
        remarks,
        proofFileName: proofName,
        proofUrl: proof?.proofUrl,
        proofDataUrl: proof?.proofDataUrl,
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white/90 text-slate-600 shadow-sm transition hover:bg-white"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="space-y-4 p-5">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 pr-12 text-sm text-amber-900">
          <p className="flex items-center gap-2 font-bold">
            <Lock className="h-4 w-4" />
            Early closure
          </p>
          <p className="mt-1 text-xs">
            Collect the full remaining balance. Future installments will be marked closed and
            disabled.
          </p>
        </div>

        <label className="block text-sm font-semibold text-[#333]">
          Final collection amount (₹)
          <input
            type="number"
            min="0"
            required
            value={displayAmount}
            onChange={(e) => setAmount(e.target.value)}
            className={fieldClass}
          />
          <span className="mt-1 block text-xs text-[#686868]">
            Pending balance: {formatINR(pendingBalance)}
          </span>
        </label>

        <label className="block text-sm font-semibold text-[#333]">
          Closure remarks
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Student paid remaining balance at counter…"
          />
        </label>

        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#55ace7]/50 bg-[#f8fbff] px-3 py-3 text-sm font-semibold text-[#246392]">
          <Upload className="h-4 w-4" />
          Upload final payment proof
          <input type="file" accept="image/*,.pdf" className="sr-only" onChange={handleProof} />
          {proofName && (
            <span className="ml-auto truncate text-xs font-normal text-[#686868]">{proofName}</span>
          )}
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
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="h-10 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 px-4 text-sm font-bold text-white disabled:opacity-50"
          >
            Close EMI & generate receipt
          </button>
        </div>
      </div>
    </div>
  )
}
