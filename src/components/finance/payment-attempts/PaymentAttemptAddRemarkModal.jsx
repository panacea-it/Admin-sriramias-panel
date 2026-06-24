import { useEffect, useState } from 'react'
import { MessageSquarePlus } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'

const inputClass =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-[#222] outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20'

const textareaClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#222] outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20'

export default function PaymentAttemptAddRemarkModal({ open, row, onClose, onSave }) {
  const [subject, setSubject] = useState('')
  const [failureAnalysis, setFailureAnalysis] = useState('')
  const [remark, setRemark] = useState('')

  useEffect(() => {
    if (open) {
      setSubject('')
      setFailureAnalysis('')
      setRemark('')
    }
  }, [open, row?.id])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!row || !subject.trim() || !failureAnalysis.trim() || !remark.trim()) return
    onSave?.({
      subject: subject.trim(),
      failureAnalysis: failureAnalysis.trim(),
      remark: remark.trim(),
    })
  }

  return (
    <Modal open={open} onClose={onClose} size="md" title="Add Counselor Remark" showCloseButton={false}>
      <div className="overflow-hidden rounded-2xl bg-white">
        <ModalPanelHeader
          title="Add Counselor Remark"
          subtitle={row ? `${row.student} · ${row.attemptId || row.id}` : ''}
          onClose={onClose}
          icon={MessageSquarePlus}
          closeVariant="icon"
          plainCloseIcon
        />
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#686868]">Remark Subject</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Payment Follow-up"
              className={inputClass}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#686868]">Failure Analysis</span>
            <textarea
              value={failureAnalysis}
              onChange={(e) => setFailureAnalysis(e.target.value)}
              placeholder="Gateway timeout during transaction."
              rows={3}
              className={textareaClass}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#686868]">Counselor Remark</span>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Enter detailed counselor remarks…"
              rows={5}
              className={textareaClass}
              required
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-[#686868] hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!subject.trim() || !failureAnalysis.trim() || !remark.trim()}
              className="rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Save Remark
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
