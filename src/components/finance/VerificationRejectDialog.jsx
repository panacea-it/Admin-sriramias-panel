import { useEffect, useState } from 'react'
import { XCircle } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import { cn } from '../../utils/cn'
import { REJECTION_REMARK_MIN_LENGTH, validateRejectionRemarks } from '../../utils/financeVerificationWorkflow'

const REJECT_REASONS = [
  'Invalid or unclear payment proof',
  'UTR / reference not found',
  'Amount mismatch',
  'Duplicate payment',
  'Other',
]

export default function VerificationRejectDialog({ open, row, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState(REJECT_REASONS[0])
  const [comment, setComment] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!open) return
    setReason(REJECT_REASONS[0])
    setComment('')
    setTouched(false)
  }, [open, row?.id])

  const validationError = touched ? validateRejectionRemarks(comment) : null
  const charCount = comment.trim().length

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    const err = validateRejectionRemarks(comment)
    if (err) return
    onConfirm?.({ reason, comment: comment.trim(), rejectionRemarks: comment.trim() })
  }

  if (!row) return null

  return (
    <Modal open={open} onClose={onClose} size="md" title="Reject payment">
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl bg-[#f0f4f8] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader
          title="Reject payment verification"
          onBack={onClose}
          icon={XCircle}
          iconClassName="text-[#df8284]"
        />
        <div className="space-y-4 p-5 sm:p-6">
          <p className="text-sm text-[#686868]">
            Rejecting <span className="font-semibold text-[#222]">{row.student}</span> —{' '}
            <span className="font-mono text-xs">{row.id}</span>
          </p>
          <p className="rounded-lg border border-[#df8284]/30 bg-[#df8284]/10 px-3 py-2 text-xs text-[#b94b4b]">
            Rejection remarks are mandatory and will be stored in the audit trail.
          </p>
          <label className="block text-sm font-semibold text-[#333]">
            Rejection reason
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium"
            >
              {REJECT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-[#333]">
            Rejection remarks <span className="text-[#df8284]">*</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onBlur={() => setTouched(true)}
              rows={4}
              required
              placeholder={`Explain why this payment was rejected (min. ${REJECTION_REMARK_MIN_LENGTH} characters)…`}
              className={cn(
                'mt-1.5 w-full rounded-lg border bg-white px-3 py-2 text-sm',
                validationError ? 'border-[#df8284] ring-1 ring-[#df8284]/30' : 'border-slate-200',
              )}
            />
          </label>
          <div className="flex items-center justify-between text-xs">
            <span className={cn('font-medium', validationError ? 'text-[#df8284]' : 'text-[#686868]')}>
              {validationError || `${charCount} / ${REJECTION_REMARK_MIN_LENGTH}+ characters`}
            </span>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-10 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-[#444] hover:bg-white disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || charCount < REJECTION_REMARK_MIN_LENGTH}
              className={cn(
                'h-10 rounded-xl px-5 text-sm font-semibold text-white shadow-sm disabled:opacity-60',
                'bg-gradient-to-r from-[#c96565] to-[#b94b4b]',
              )}
            >
              {loading ? 'Rejecting…' : 'Confirm rejection'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
