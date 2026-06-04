import { useEffect, useState } from 'react'
import { MessageCircleQuestion } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import { cn } from '../../utils/cn'

export default function VerificationClarificationDialog({ open, row, onClose, onConfirm, loading }) {
  const [remark, setRemark] = useState('')

  useEffect(() => {
    if (!open) return
    setRemark('')
  }, [open, row?.id])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!remark.trim()) return
    onConfirm?.({ remark: remark.trim(), comment: remark.trim() })
  }

  if (!row) return null

  return (
    <Modal open={open} onClose={onClose} size="md" title="Request clarification">
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl bg-[#f0f4f8] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader
          title="Request clarification"
          onBack={onClose}
          icon={MessageCircleQuestion}
          iconClassName="text-[#246392]"
        />
        <div className="space-y-4 p-5 sm:p-6">
          <p className="text-sm text-[#686868]">
            Return <span className="font-semibold text-[#222]">{row.student}</span> to the verification officer
            with clarification notes.
          </p>
          <label className="block text-sm font-semibold text-[#333]">
            Clarification note <span className="text-[#246392]">*</span>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={4}
              required
              placeholder="What additional information or proof is required?"
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
                'bg-gradient-to-r from-[#246392] to-[#1a4d73]',
              )}
            >
              {loading ? 'Sending…' : 'Request clarification'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
