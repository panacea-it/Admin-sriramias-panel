import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import { fetchPaymentAttemptAvailableCounselors } from '../../../api/paymentAttemptLogsAPI'
import { toast } from '../../../utils/toast'

export default function PaymentAttemptCounselorModal({ open, row, onClose, onAssign }) {
  const [counselorId, setCounselorId] = useState('')
  const [counselorOptions, setCounselorOptions] = useState([])
  const [loadingCounselors, setLoadingCounselors] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !row) {
      setCounselorId('')
      setCounselorOptions([])
      return
    }

    const centerId = row.centerId
    if (!centerId) {
      toast.error('Center information is missing for this attempt')
      return
    }

    let cancelled = false
    setLoadingCounselors(true)
    setCounselorId('')

    fetchPaymentAttemptAvailableCounselors(centerId)
      .then((counselors) => {
        if (!cancelled) setCounselorOptions(counselors)
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(error.message || 'Failed to load counselors')
          setCounselorOptions([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCounselors(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, row?.attemptId, row?.id, row?.centerId])

  const selectClass =
    'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!counselorId || !row || submitting) return
    setSubmitting(true)
    try {
      await onAssign?.({
        attemptId: row.attemptId || row.id,
        counselorId,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const studentLabel = row?.student || row?.studentName

  return (
    <Modal open={open} onClose={onClose} size="md" title="Assign counselor" showCloseButton={false}>
      <div className="overflow-hidden rounded-2xl bg-white">
        <ModalPanelHeader
          title="Assign Counselor"
          subtitle={row ? `${studentLabel} · ${row.course || row.courseName}` : ''}
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
              disabled={loadingCounselors || submitting}
            >
              <option value="">
                {loadingCounselors ? 'Loading counselors…' : 'Select counselor'}
              </option>
              {counselorOptions.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-[#686868] hover:bg-slate-100"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!counselorId || loadingCounselors || submitting}
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
