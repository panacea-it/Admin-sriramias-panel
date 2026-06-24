import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import { getPaymentAttemptCounselorOptions } from '../../../constants/paymentAttemptConstants'

export default function PaymentAttemptCounselorModal({ open, row, onClose, onAssign }) {
  const counselorOptions = getPaymentAttemptCounselorOptions()
  const [counselorId, setCounselorId] = useState('')

  useEffect(() => {
    if (open) {
      setCounselorId('')
    }
  }, [open, row?.id])

  const selectClass =
    'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20'

  const handleSubmit = (e) => {
    e.preventDefault()
    const counselor = counselorOptions.find((c) => c.value === counselorId)
    if (!counselor || !row) return
    onAssign?.({
      attemptId: row.id,
      counselorId: counselor.value,
      counselorName: counselor.label,
    })
  }

  return (
    <Modal open={open} onClose={onClose} size="md" title="Assign counselor" showCloseButton={false}>
      <div className="overflow-hidden rounded-2xl bg-white">
        <ModalPanelHeader
          title="Assign Counselor"
          subtitle={row ? `${row.student} · ${row.course}` : ''}
          onClose={onClose}
          icon={UserPlus}
          closeVariant="icon"
          plainCloseIcon
        />
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#686868]">Select Counselor</span>
            <select
              value={counselorId}
              onChange={(e) => setCounselorId(e.target.value)}
              className={selectClass}
              required
            >
              <option value="">Select counselor</option>
              {counselorOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
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
              disabled={!counselorId}
              className="rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Assign
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
