import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import { FINANCE_MOCK_COUNSELORS } from '../../../constants/financeConstants'
import { COUNSELOR_LEAD_STATUSES } from '../../../constants/paymentAttemptConstants'
import FinanceStatusBadge from '../FinanceStatusBadge'
import { formatINR } from '../../../utils/financeFilters'

export default function PaymentAttemptCounselorModal({ open, row, rows = [], onClose, onAssign, saving }) {
  const isBulk = rows.length > 1
  const target = isBulk ? null : row
  const [counselorId, setCounselorId] = useState(target?.counselorId || '')
  const [leadStatus, setLeadStatus] = useState(target?.leadStatus || 'Assigned')
  const [priority, setPriority] = useState('normal')

  const selectClass =
    'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20'

  const handleSubmit = (e) => {
    e.preventDefault()
    const counselor = FINANCE_MOCK_COUNSELORS.find((c) => c.id === counselorId)
    onAssign?.({
      counselorId,
      counselorName: counselor?.name,
      leadStatus,
      priority,
      ids: isBulk ? rows.map((r) => r.id) : [target?.id],
    })
  }

  return (
    <Modal open={open} onClose={onClose} size="md" title="Counselor assignment">
      <div className="overflow-hidden rounded-2xl bg-white">
        <ModalPanelHeader
          title={isBulk ? `Assign ${rows.length} leads` : 'Assign counselor'}
          subtitle={isBulk ? 'Bulk assignment' : `${target?.student} · ${target?.course}`}
          onClose={onClose}
          icon={UserPlus}
        />
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {!isBulk && target && (
            <div className="rounded-lg border border-slate-100 bg-[#eef6fc]/40 p-3 text-sm">
              <dl className="grid gap-2 sm:grid-cols-2">
                <div><dt className="text-xs text-[#686868]">Contact</dt><dd>{target.mobile} · {target.email}</dd></div>
                <div><dt className="text-xs text-[#686868]">Failed amount</dt><dd className="font-semibold">{formatINR(target.amount)}</dd></div>
                <div><dt className="text-xs text-[#686868]">Failure reason</dt><dd>{target.failureCategory || '—'}</dd></div>
                <div><dt className="text-xs text-[#686868]">Recovery probability</dt><dd>{target.recoveryProbability ?? '—'}%</dd></div>
              </dl>
              {target.retryCount > 0 && (
                <p className="mt-2 text-xs text-[#686868]">Retry history: {target.retryCount} prior attempt(s)</p>
              )}
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
            <span className="mb-1 block text-xs font-semibold text-[#686868]">Lead status</span>
            <select value={leadStatus} onChange={(e) => setLeadStatus(e.target.value)} className={selectClass}>
              {COUNSELOR_LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#686868]">Priority</span>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectClass}>
              <option value="normal">Normal</option>
              <option value="high">High — failed high-value</option>
              <option value="urgent">Urgent — multiple failures</option>
            </select>
          </label>
          {!isBulk && target?.leadStatus && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#686868]">Current:</span>
              <FinanceStatusBadge status={target.leadStatus} />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-[#686868] hover:bg-slate-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !counselorId}
              className="rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Assigning…' : isBulk ? 'Bulk assign' : 'Assign counselor'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
