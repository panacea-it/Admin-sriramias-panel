import { useState } from 'react'
import { Clock, Building2, FileText, AlertOctagon, Phone, Scale, Ban } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import FinanceTimeline from '../FinanceTimeline'
import FinanceStatusBadge from '../FinanceStatusBadge'
import OfflineProofDropzone from '../OfflineProofDropzone'
import ProofViewerModal from '../ProofViewerModal'
import EmiOverdueSeverityBadge from './EmiOverdueSeverityBadge'
import { buildEmiActivityTimeline } from '../../../utils/emiManagement'
import {
  EMI_LOAN_PROVIDER_STATUSES,
  EMI_CALL_STATUSES,
  EMI_AGREEMENT_DOC_TYPES,
} from '../../../constants/emiManagement'
import { FINANCE_MOCK_COUNSELORS } from '../../../constants/financeConstants'
import {
  scheduleEmiCall,
  assignEmiCounselor,
  applyEmiSuspension,
  submitEmiSettlement,
  uploadEmiAgreement,
  sendEmiReminder,
} from '../../../api/financeAPI'
import { formatINR } from '../../../utils/financeFilters'
import { toast } from '../../../utils/toast'
import { cn } from '../../../utils/cn'

const DRAWER_TABS = [
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'provider', label: 'Loan provider', icon: Building2 },
  { id: 'documents', label: 'Agreements', icon: FileText },
  { id: 'bounce', label: 'Bounce logs', icon: AlertOctagon },
  { id: 'calls', label: 'Calls', icon: Phone },
  { id: 'closure', label: 'Settlement', icon: Scale },
]

export default function EmiPlanDetailDrawer({
  open,
  plan,
  onClose,
  onRefresh,
  canManage,
}) {
  const [tab, setTab] = useState('timeline')
  const [proofView, setProofView] = useState(null)
  const [callForm, setCallForm] = useState({ scheduledAt: '', status: 'Pending', remarks: '' })
  const [settlementForm, setSettlementForm] = useState({ type: 'settlement', amount: '', remarks: '' })
  const [counselorId, setCounselorId] = useState(plan?.counselorId || '')

  if (!plan) return null

  const events = buildEmiActivityTimeline(plan)
  const pendingEmis = (plan.installments || []).filter((i) => !['Paid', 'Closed'].includes(i.status))

  const handleCall = async () => {
    try {
      await scheduleEmiCall(plan.id, { ...callForm, counselorId: counselorId || plan.counselorId })
      toast.success('Call logged')
      onRefresh?.()
      setCallForm({ scheduledAt: '', status: 'Pending', remarks: '' })
    } catch {
      toast.error('Failed to schedule call')
    }
  }

  const handleAssign = async () => {
    const c = FINANCE_MOCK_COUNSELORS.find((x) => x.id === counselorId)
    if (!c) return toast.error('Select a counselor')
    try {
      await assignEmiCounselor(plan.id, { counselorId: c.id, counselorName: c.name })
      toast.success('Counselor assigned')
      onRefresh?.()
    } catch {
      toast.error('Assignment failed')
    }
  }

  const handleSuspend = async () => {
    try {
      await applyEmiSuspension(plan.id, {
        status: plan.suspensionStatus === 'Suspended' ? 'Reactivated' : 'Suspended',
        reason: 'Manual action from EMI management',
      })
      toast.success('Suspension status updated')
      onRefresh?.()
    } catch {
      toast.error('Action failed')
    }
  }

  const handleSettlement = async () => {
    try {
      await submitEmiSettlement(plan.id, settlementForm)
      toast.success('Settlement submitted')
      onRefresh?.()
    } catch {
      toast.error('Settlement failed')
    }
  }

  const handleDocUpload = async (files, docType) => {
    const entry = files[0]
    const file = entry?.file || entry
    if (!file) return
    const meta = EMI_AGREEMENT_DOC_TYPES.find((d) => d.id === docType)
    try {
      await uploadEmiAgreement(plan.id, {
        type: docType,
        label: meta?.label || docType,
        fileName: file.name,
      })
      toast.success('Document uploaded')
      onRefresh?.()
    } catch {
      toast.error('Upload failed')
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" title="EMI account">
      <ModalPanelHeader
        icon={Clock}
        title={plan.studentName}
        subtitle={`${plan.studentId} · ${plan.courseName}`}
        onClose={onClose}
      />
      {plan.suspensionStatus === 'Warning Issued' && (
        <div className="mx-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Warning: Course access may be suspended if payment is not received.
        </div>
      )}
      {plan.suspensionStatus === 'Suspended' && (
        <div className="mx-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
          Course access suspended — {plan.suspensionReason || 'Overdue EMI'}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 border-b border-slate-100 px-4 py-3 sm:grid-cols-4">
        <div>
          <p className="text-[10px] uppercase text-[#686868]">Pending</p>
          <p className="font-bold text-[#246392]">{formatINR(plan.pendingAmount)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-[#686868]">Next due</p>
          <p className="font-semibold text-sm">{plan.nextDueDate || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-[#686868]">Overdue</p>
          <EmiOverdueSeverityBadge severityId={plan.overdueSeverity} overdueDays={plan.overdueDays} />
        </div>
        <div>
          <p className="text-[10px] uppercase text-[#686868]">Counselor</p>
          <p className="text-sm font-semibold">{plan.counselorName}</p>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-4">
        {DRAWER_TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'flex shrink-0 items-center gap-1 rounded-t-md px-3 py-2 text-xs font-semibold',
                tab === t.id ? 'border-b-2 border-[#246392] text-[#246392]' : 'text-[#686868]',
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          )
        })}
      </div>

      <div className="max-h-[min(55vh,480px)] overflow-y-auto p-4">
        {tab === 'timeline' && <FinanceTimeline events={events} />}

        {tab === 'provider' && (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-[#686868]">Provider</dt><dd className="font-semibold">{plan.loanProvider}</dd></div>
            <div><dt className="text-[#686868]">Status</dt><dd><FinanceStatusBadge status={plan.providerStatus || 'EMI Active'} /></dd></div>
            <div><dt className="text-[#686868]">Reference ID</dt><dd className="font-mono text-xs">{plan.providerRefId || '—'}</dd></div>
            <div><dt className="text-[#686868]">Loan amount</dt><dd>{formatINR(plan.loanAmount || plan.pendingAmount)}</dd></div>
            <div className="sm:col-span-2"><dt className="text-[#686868]">Remarks</dt><dd>{plan.providerRemarks || '—'}</dd></div>
            <div className="sm:col-span-2">
              <p className="mb-2 text-xs font-bold uppercase text-[#686868]">Progress</p>
              <div className="flex flex-wrap gap-1">
                {EMI_LOAN_PROVIDER_STATUSES.map((s) => (
                  <span
                    key={s}
                    className={cn(
                      'rounded px-2 py-0.5 text-[10px] font-semibold',
                      plan.providerStatus === s ? 'bg-[#246392] text-white' : 'bg-slate-100 text-[#686868]',
                    )}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </dl>
        )}

        {tab === 'documents' && (
          <div className="space-y-4">
            {(plan.agreements || []).map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div>
                  <p className="font-semibold text-sm">{doc.label}</p>
                  <p className="text-xs text-[#686868]">{doc.fileName} · v{doc.version}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setProofView({ name: doc.fileName, url: '#' })}
                  className="text-xs font-semibold text-[#246392]"
                >
                  Preview
                </button>
              </div>
            ))}
            {canManage &&
              EMI_AGREEMENT_DOC_TYPES.map((docType) => (
                <div key={docType.id}>
                  <p className="mb-1 text-xs font-semibold text-[#686868]">{docType.label}</p>
                  <OfflineProofDropzone
                    multiple={false}
                    label={`Upload ${docType.label}`}
                    onChange={(files) => handleDocUpload(files, docType.id)}
                  />
                </div>
              ))}
          </div>
        )}

        {tab === 'bounce' && (
          <div className="space-y-3">
            {(plan.bounceLogs || []).length === 0 ? (
              <p className="text-sm text-[#686868]">No bounce records.</p>
            ) : (
              plan.bounceLogs.map((b) => (
                <div key={b.id} className="rounded-lg border border-red-200 bg-red-50/40 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-bold text-red-800">{b.provider}</span>
                    <FinanceStatusBadge status={b.status || 'Failed'} />
                  </div>
                  <p className="mt-1 text-[#686868]">{b.reason} · {b.bounceDate?.slice(0, 10)}</p>
                  <p className="text-xs">Retries: {b.retryAttempts} · Penalty: {formatINR(b.penaltyCharges)}</p>
                  <p className="text-xs text-[#686868]">{b.bankRemarks}</p>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'calls' && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <p><strong>Mobile:</strong> {plan.mobile}</p>
              <p><strong>Email:</strong> {plan.email}</p>
              <p><strong>Pending EMIs:</strong> {pendingEmis.length} · {formatINR(plan.pendingAmount)}</p>
              <p><strong>Last payment:</strong>{' '}
                {(plan.installments || []).filter((i) => i.paidDate).sort((a, b) => b.paidDate.localeCompare(a.paidDate))[0]?.paidDate?.slice(0, 10) || '—'}
              </p>
              <p><strong>Follow-up:</strong> {plan.followUpStatus || '—'}</p>
            </div>
            {(plan.callLogs || []).map((c) => (
              <div key={c.id} className="rounded-lg border border-slate-200 p-2 text-sm">
                <FinanceStatusBadge status={c.status} /> — {c.remarks}
                <p className="text-xs text-[#686868]">{c.scheduledAt?.slice(0, 16)}</p>
              </div>
            ))}
            {canManage && (
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <p className="text-sm font-bold">Arrange call</p>
                <input type="datetime-local" value={callForm.scheduledAt} onChange={(e) => setCallForm((f) => ({ ...f, scheduledAt: e.target.value }))} className="h-10 w-full rounded-lg border px-3 text-sm" />
                <select value={callForm.status} onChange={(e) => setCallForm((f) => ({ ...f, status: e.target.value }))} className="h-10 w-full rounded-lg border px-3 text-sm">
                  {EMI_CALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <textarea value={callForm.remarks} onChange={(e) => setCallForm((f) => ({ ...f, remarks: e.target.value }))} rows={2} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Follow-up notes" />
                <button type="button" onClick={handleCall} className="rounded-lg bg-[#246392] px-4 py-2 text-sm font-semibold text-white">Save call</button>
              </div>
            )}
          </div>
        )}

        {tab === 'closure' && (
          <div className="space-y-4">
            <p className="text-sm">Outstanding: <strong>{formatINR(plan.pendingAmount)}</strong></p>
            {canManage && (
              <>
                <label className="block text-sm">
                  Settlement amount (₹)
                  <input type="number" value={settlementForm.amount} onChange={(e) => setSettlementForm((f) => ({ ...f, amount: Number(e.target.value) }))} className="mt-1 h-10 w-full rounded-lg border px-3" />
                </label>
                <textarea value={settlementForm.remarks} onChange={(e) => setSettlementForm((f) => ({ ...f, remarks: e.target.value }))} rows={2} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Remarks" />
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => { setSettlementForm((f) => ({ ...f, type: 'settlement' })); handleSettlement() }} className="rounded-lg bg-[#246392] px-4 py-2 text-sm font-semibold text-white">Submit settlement</button>
                  <button type="button" onClick={() => { setSettlementForm((f) => ({ ...f, type: 'foreclosure', amount: plan.pendingAmount })); handleSettlement() }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-[#246392]">Foreclose</button>
                </div>
              </>
            )}
            {plan.settlementStatus && <FinanceStatusBadge status={plan.settlementStatus} />}
          </div>
        )}
      </div>

      {canManage && (
        <div className="flex flex-wrap gap-2 border-t border-slate-100 p-4">
          <select value={counselorId} onChange={(e) => setCounselorId(e.target.value)} className="h-9 rounded-lg border px-2 text-sm">
            <option value="">Assign counselor…</option>
            {FINANCE_MOCK_COUNSELORS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="button" onClick={handleAssign} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-[#246392]">Assign</button>
          <button type="button" onClick={() => sendEmiReminder({ planId: plan.id, mobile: plan.mobile, channel: 'WhatsApp', trigger: 'after_overdue', studentName: plan.studentName }).then(() => { toast.success('Reminder sent'); onRefresh?.() })} className="rounded-lg border px-3 py-1.5 text-sm font-semibold text-[#246392]">Send reminder</button>
          <button type="button" onClick={handleSuspend} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700">
            <Ban className="h-4 w-4" /> {plan.suspensionStatus === 'Suspended' ? 'Reactivate' : 'Suspend'}
          </button>
        </div>
      )}

      <ProofViewerModal open={!!proofView} proofName={proofView?.name} onClose={() => setProofView(null)} />
    </Modal>
  )
}
