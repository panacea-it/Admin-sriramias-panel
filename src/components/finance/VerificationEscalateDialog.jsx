import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import { cn } from '../../utils/cn'

export default function VerificationEscalateDialog({ open, row, onClose, onConfirm, loading }) {
  const [remark, setRemark] = useState('')

  useEffect(() => {
    if (!open) return
    setRemark('')
  }, [open, row?.id])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!remark.trim()) return
    onConfirm?.({ remark: remark.trim() })
  }

  if (!row) return null

  return (
    <Modal open={open} onClose={onClose} size="md" title="Escalate verification">
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl bg-[#f0f4f8] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader
          title="Escalate to senior finance"
          onBack={onClose}
          icon={AlertTriangle}
          iconClassName="text-amber-600"
        />
        <div className="space-y-4 p-5 sm:p-6">
          <p className="text-sm text-[#686868]">
            Escalate <span className="font-semibold text-[#222]">{row.student}</span> for manual review by
            senior finance or admin.
          </p>
          <label className="block text-sm font-semibold text-[#333]">
            Escalation remark <span className="text-amber-600">*</span>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={3}
              required
              placeholder="Why is this case escalated? (amount, cheque, mismatch, etc.)"
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>
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
              disabled={loading || !remark.trim()}
              className={cn(
                'h-10 rounded-xl px-5 text-sm font-semibold text-white shadow-sm disabled:opacity-60',
                'bg-gradient-to-r from-amber-500 to-amber-600',
              )}
            >
              {loading ? 'Escalating…' : 'Escalate'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
