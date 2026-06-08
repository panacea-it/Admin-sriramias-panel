import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import { FINANCE_MOCK_COUNSELORS } from '../../../constants/financeConstants'
import { FOLLOW_UP_PRIORITIES } from '../../../constants/paymentCommunicationConstants'

export default function CommunicationCounselorModal({ open, row, rows = [], onClose, onAssign, saving }) {
  const isBulk = rows.length > 1
  const target = isBulk ? null : row
  const [counselorId, setCounselorId] = useState(target?.counselorId || '')
  const [followUpPriority, setFollowUpPriority] = useState(target?.followUpPriority || 'Medium')
  const [followUpNotes, setFollowUpNotes] = useState(target?.followUpNotes || '')
  const [nextFollowUpDate, setNextFollowUpDate] = useState(target?.nextFollowUpDate?.slice(0, 10) || '')
  const [followUpTag, setFollowUpTag] = useState(target?.followUpTag || 'Follow-up assigned')

  const selectClass =
    'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20'

  const handleSubmit = (e) => {
    e.preventDefault()
    const counselor = FINANCE_MOCK_COUNSELORS.find((c) => c.id === counselorId)
    onAssign?.({
      counselorId,
      counselorName: counselor?.name,
      followUpPriority,
      followUpNotes,
      nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate).toISOString() : null,
      followUpTag,
      ids: isBulk ? rows.map((r) => r.id) : [target?.id],
    })
  }

  return (
    <Modal open={open} onClose={onClose} size="md" title="Counselor follow-up">
      <div className="overflow-hidden rounded-2xl bg-white">
        <ModalPanelHeader
          title={isBulk ? `Assign ${rows.length} communications` : 'Tag counselor'}
          subtitle={isBulk ? 'Bulk assignment' : `${target?.studentName} · ${target?.type}`}
          onClose={onClose}
          icon={UserPlus}
        />
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {!isBulk && target && (
            <div className="rounded-lg border border-slate-100 bg-[#eef6fc]/40 p-3 text-sm">
              <p><span className="text-[#686868]">Channel:</span> {target.channel}</p>
              <p><span className="text-[#686868]">Reference:</span> {target.paymentReference || '—'}</p>
            </div>
          )}
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#686868]">Counselor</span>
            <select value={counselorId} onChange={(e) => setCounselorId(e.target.value)} className={selectClass} required>
              <option value="">Select counselor</option>
              {FINANCE_MOCK_COUNSELORS.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#686868]">Follow-up priority</span>
            <select value={followUpPriority} onChange={(e) => setFollowUpPriority(e.target.value)} className={selectClass}>
              {FOLLOW_UP_PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#686868]">Follow-up tag</span>
            <input value={followUpTag} onChange={(e) => setFollowUpTag(e.target.value)} className={selectClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#686868]">Next follow-up date</span>
            <input type="date" value={nextFollowUpDate} onChange={(e) => setNextFollowUpDate(e.target.value)} className={selectClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#686868]">Notes</span>
            <textarea
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-[#686868] hover:bg-slate-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !counselorId}
              className="rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : isBulk ? 'Bulk assign' : 'Tag counselor'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
