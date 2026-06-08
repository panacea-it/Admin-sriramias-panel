import { useState, useEffect } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import { EDIT_STATUS_REASONS } from '../../constants/financePermissions'
import { formatINR } from '../../utils/financeFilters'
import { cn } from '../../utils/cn'

export default function OfflineApprovalModal({ open, onClose, request, onSubmit }) {
  const [decision, setDecision] = useState('Approved')
  const [reason, setReason] = useState(EDIT_STATUS_REASONS[0])
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (!open) return
    setDecision('Approved')
    setReason(EDIT_STATUS_REASONS[0])
    setComment('')
  }, [open, request?.id])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    onSubmit?.({
      newStatus: decision,
      reason,
      comment: comment.trim(),
    })
  }

  if (!request) return null

  return (
    <Modal open={open} onClose={onClose} size="md" title="Offline Payment Approval">
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl bg-[#f0f4f8] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader
          title="Offline Payment Approval"
          onBack={onClose}
          icon={CheckCircle}
          iconClassName="text-[#246392]"
        />

        <div className="space-y-4 p-5 sm:p-6">
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <p className="font-bold text-[#222]">{request.studentName}</p>
            <p className="mt-1 text-[#686868]">{request.course}</p>
            <p className="mt-2 text-lg font-bold text-[#1a3a5c]">{formatINR(request.amount)}</p>
            <p className="mt-1 text-xs text-[#9ca0a8]">Mode: {request.paymentMode}</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDecision('Approved')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition',
                decision === 'Approved'
                  ? 'bg-[#69df66] text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-[#686868]',
              )}
            >
              <CheckCircle className="h-4 w-4" />
              Approve
            </button>
            <button
              type="button"
              onClick={() => setDecision('Rejected')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition',
                decision === 'Rejected'
                  ? 'bg-[#df8284] text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-[#686868]',
              )}
            >
              <XCircle className="h-4 w-4" />
              Reject
            </button>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#222]">Reason *</span>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#55ace7]"
            >
              {EDIT_STATUS_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#222]">Comment *</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              rows={3}
              placeholder="Mandatory notes for audit trail…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#55ace7]"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-full bg-gradient-to-r from-[#0d3b66] to-[#05192d] py-3 text-base font-bold text-white shadow-[0_6px_18px_rgba(5,25,45,0.4)] transition hover:brightness-110"
          >
            Confirm {decision === 'Approved' ? 'Approval' : 'Rejection'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
