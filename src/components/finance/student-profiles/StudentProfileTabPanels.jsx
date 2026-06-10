import { useState, useCallback } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  Bell,
  FileText,
  Plus,
  History,
} from 'lucide-react'
import FinanceStatusBadge from '../FinanceStatusBadge'
import FinanceTimeline from '../FinanceTimeline'
import FinanceConfirmDialog from '../FinanceConfirmDialog'
import OfflineProofDropzone from '../OfflineProofDropzone'
import { MonthlyRevenueBarChart } from '../FinanceCharts'
import { formatINR } from '../../../utils/financeFilters'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { ENROLLMENT_SOURCES, FINANCE_DOCUMENT_TYPES } from '../../../constants/studentFinanceProfiles'
import { downloadProfileSummary } from '../../../utils/studentFinanceProfile'
import { cn } from '../../../utils/cn'

function Section({ title, children, className }) {
  return (
    <section className={cn('space-y-3', className)}>
      <h4 className="text-sm font-bold text-[#246392]">{title}</h4>
      {children}
    </section>
  )
}

export function ProfileFeeBreakdownPanel({ profile, onDownload }) {
  const [open, setOpen] = useState(true)
  const fb = profile?.feeBreakdown || {}
  const rows = [
    { label: 'Course fee', value: fb.courseFee },
    { label: 'Admission fee', value: fb.admissionFee },
    { label: 'Material fee', value: fb.materialFee },
    { label: 'GST / Tax', value: fb.gstTax },
    { label: 'Scholarships', value: -(fb.scholarshipAmount || 0), negative: true },
    { label: 'Discounts', value: -(fb.discountAmount || 0), negative: true },
    { label: 'Additional charges', value: fb.additionalCharges },
    { label: 'Refund adjustments', value: -(fb.refundAdjustments || 0), negative: true },
  ]

  return (
    <Section title="Fee breakdown">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-100 bg-[#eef2fc]/50 px-3 py-2 text-sm font-semibold text-[#246392]"
        aria-expanded={open}
      >
        View fee structure
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b border-slate-50 last:border-0">
                  <td className="px-3 py-2 text-[#686868]">{r.label}</td>
                  <td className={cn('px-3 py-2 text-right font-semibold', r.negative && 'text-[#69df66]')}>
                    {r.negative ? '−' : ''}{formatINR(Math.abs(r.value || 0))}
                  </td>
                </tr>
              ))}
              <tr className="bg-[#eef2fc]/60 font-bold">
                <td className="px-3 py-2">Total fees</td>
                <td className="px-3 py-2 text-right text-[#246392]">{formatINR(fb.totalFees || profile.totalFees)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <button
        type="button"
        onClick={() => (onDownload ? onDownload(profile) : downloadProfileSummary(profile))}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#246392] hover:underline"
      >
        <Download className="h-4 w-4" /> Download fee summary
      </button>
      {(fb.revisions || []).length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-[#686868]">Revision history</p>
          <ul className="space-y-2">
            {fb.revisions.map((rev) => (
              <li key={rev.id} className="rounded-lg border border-slate-100 px-3 py-2 text-xs">
                <span className="font-semibold text-[#222]">{rev.label}</span>
                <span className="mx-2 text-[#686868]">· {formatINR(rev.amount)}</span>
                <span className="text-[#9ca0a8]">{formatCategoryDateTime(rev.at)} — {rev.by}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  )
}

export function ProfileEnrollmentPanel({ profile }) {
  const meta = ENROLLMENT_SOURCES.find((s) => s.id === profile.enrollmentSource) || ENROLLMENT_SOURCES[0]
  return (
    <Section title="Enrollment source">
      <span className={cn('inline-flex rounded-md px-2.5 py-1 text-xs font-semibold', meta.color)}>{meta.label}</span>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-[#686868]">Referred by</dt><dd className="font-medium">{profile.referredBy || '—'}</dd></div>
        <div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-[#686868]">Counselor</dt><dd className="font-medium">{profile.counselorName || '—'}</dd></div>
        <div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-[#686868]">Branch</dt><dd className="font-medium">{profile.branchMapped || profile.branch || '—'}</dd></div>
        <div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-[#686868]">Enrollment date</dt><dd className="font-medium">{profile.enrollmentDate ? formatCategoryDateTime(profile.enrollmentDate) : '—'}</dd></div>
        {profile.campaignNotes && (
          <div className="sm:col-span-2 rounded-lg bg-[#fff8eb] p-3"><dt className="text-xs text-[#686868]">Campaign notes</dt><dd className="text-sm">{profile.campaignNotes}</dd></div>
        )}
      </dl>
    </Section>
  )
}

export function ProfileLoanPanel({ profile }) {
  const loan = profile.loan || {}
  return (
    <Section title="Loan status">
      <div className="flex flex-wrap items-center gap-2">
        <FinanceStatusBadge status={loan.loanStatus || profile.loanStatus} />
        {loan.loanProvider && <span className="rounded-md bg-[#eef2fc] px-2 py-0.5 text-xs font-semibold text-[#246392]">{loan.loanProvider}</span>}
      </div>
      <dl className="grid gap-2 sm:grid-cols-2">
        {[
          ['Loan amount', loan.loanAmount],
          ['Approved', loan.approvedAmount],
          ['Disbursed', loan.disbursedAmount],
          ['Outstanding', loan.outstandingAmount],
          ['Provider ref', loan.providerRefId || '—'],
        ].map(([label, val]) => (
          <div key={label} className="rounded-lg border border-slate-100 p-3 text-sm">
            <dt className="text-xs text-[#686868]">{label}</dt>
            <dd className="font-semibold">{typeof val === 'number' ? formatINR(val) : val}</dd>
          </div>
        ))}
      </dl>
      {loan.providerRemarks && <p className="text-xs text-[#686868]">Remarks: {loan.providerRemarks}</p>}
      {(loan.approvalTimeline || []).length > 0 && (
        <FinanceTimeline
          events={(loan.approvalTimeline || []).map((e) => ({
            step: e.step,
            detail: e.detail,
            timestamp: e.timestamp,
            status: e.status || 'completed',
          }))}
        />
      )}
    </Section>
  )
}

export function ProfileWalletPanel({ profile, onWalletCredit, canEdit }) {
  const [amount, setAmount] = useState('')
  const [remarks, setRemarks] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  const handleCredit = useCallback(() => {
    onWalletCredit?.({ amount: Number(amount), remarks })
    setConfirmOpen(false)
    setAmount('')
  }, [amount, remarks, onWalletCredit])

  return (
    <Section title="Wallet">
      <div className="rounded-xl bg-gradient-to-r from-[#55ace7] to-[#246392] p-4 text-white">
        <p className="text-xs font-medium text-white/80">Available balance</p>
        <p className="text-2xl font-bold">{formatINR(profile.walletBalance)}</p>
      </div>
      {canEdit && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="number"
            min="0"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm"
            aria-label="Wallet credit amount"
          />
          <input
            type="text"
            placeholder="Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm"
            aria-label="Wallet remarks"
          />
          <button
            type="button"
            disabled={!amount || Number(amount) <= 0}
            onClick={() => setConfirmOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-[#246392] px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add funds
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setHistoryOpen(true)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#246392] hover:underline"
      >
        <History className="h-4 w-4" /> Wallet transaction history
      </button>
      {historyOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-[#246392]">Wallet ledger</h3>
              <button type="button" onClick={() => setHistoryOpen(false)} className="text-sm text-[#686868]">Close</button>
            </div>
            <ul className="space-y-2">
              {(profile.walletTransactions || []).map((t) => (
                <li key={t.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                  <div className="flex justify-between font-semibold">
                    <span>{t.type}</span>
                    <span className={t.type === 'Debit' ? 'text-red-600' : 'text-[#1a5c3a]'}>
                      {t.type === 'Debit' ? '−' : '+'}{formatINR(t.amount)}
                    </span>
                  </div>
                  <p className="text-xs text-[#686868]">{t.remarks}</p>
                  <p className="text-xs text-[#9ca0a8]">{formatCategoryDateTime(t.at)} · {t.by}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <FinanceConfirmDialog
        open={confirmOpen}
        title="Add wallet funds"
        message={`Credit ${formatINR(Number(amount) || 0)} to ${profile.studentName}'s wallet?`}
        onConfirm={handleCredit}
        onCancel={() => setConfirmOpen(false)}
      />
    </Section>
  )
}

export function ProfileDocumentsPanel({ profile, onUpload, canEdit }) {
  const [uploadType, setUploadType] = useState('aadhaar')
  const [files, setFiles] = useState([])

  const handleUpload = () => {
    if (!files.length) return
    onUpload?.({ type: uploadType, fileName: files[0].name, file: files[0] })
    setFiles([])
  }

  const docs = profile.documents || []
  const docTypes = FINANCE_DOCUMENT_TYPES

  return (
    <Section title="Finance documents">
      <div className="grid gap-3 sm:grid-cols-2">
        {docTypes.map((dt) => {
          const doc = docs.find((d) => d.type === dt.id)
          return (
            <div key={dt.id} className="rounded-xl border border-slate-100 p-3 transition hover:shadow-sm">
              <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 shrink-0 text-[#246392]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{dt.label}</p>
                  {doc ? (
                    <>
                      <p className="truncate text-xs text-[#686868]">{doc.fileName}</p>
                      <p className="text-xs text-[#9ca0a8]">{formatCategoryDateTime(doc.uploadedAt)}</p>
                      <button type="button" className="mt-1 text-xs font-semibold text-[#246392] hover:underline">Preview</button>
                    </>
                  ) : (
                    <p className="text-xs text-amber-700">{dt.required ? 'Required — pending' : 'Optional'}</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {canEdit && (
        <div className="rounded-xl border border-dashed border-[#55ace7]/40 bg-[#eef6fc]/30 p-4">
          <select value={uploadType} onChange={(e) => setUploadType(e.target.value)} className="mb-3 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" aria-label="Document type">
            {docTypes.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
          <OfflineProofDropzone files={files} onChange={setFiles} label="Upload document" multiple={false} />
          <button
            type="button"
            disabled={!files.length}
            onClick={handleUpload}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#246392] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Upload className="h-4 w-4" /> Upload
          </button>
        </div>
      )}
    </Section>
  )
}

export function ProfileAnalyticsPanel({ profile }) {
  const a = profile.analytics || {}
  const behavior = a.behaviorLabel || 'Good'
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-[#eef2fc] p-4"><p className="text-xs text-[#686868]">Risk score</p><p className="text-2xl font-bold">{a.riskScore ?? profile.riskScore}</p></div>
        <div className="rounded-xl bg-[#eef8eb] p-4"><p className="text-xs text-[#686868]">Reliability</p><p className="text-2xl font-bold">{a.reliabilityScore ?? '—'}</p></div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-100"><p className="text-xs text-[#686868]">Behavior</p><p className="text-lg font-bold">{behavior}</p></div>
      </div>
      <ul className="space-y-1">
        {(a.insights || []).map((line) => (
          <li key={line} className="flex items-start gap-2 text-sm text-[#686868]">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#55ace7]" aria-hidden />
            {line}
          </li>
        ))}
      </ul>
      <p className="text-xs text-[#686868]">Preferred mode: <strong>{a.preferredPaymentMode}</strong> · Default probability: {a.defaultProbability}%</p>
      {a.monthlyTrend?.length > 0 && <MonthlyRevenueBarChart data={a.monthlyTrend} />}
      {a.emiCompletion?.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-[#686868]">EMI completion</p>
          <div className="flex h-24 items-end gap-2">
            {a.emiCompletion.map((item) => (
              <div key={item.label} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t bg-gradient-to-t from-[#246392] to-[#55ace7]" style={{ height: `${Math.max(item.value, 8)}%` }} title={item.label} />
                <span className="text-[10px] text-[#686868]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function ProfileTimelinePanel({ profile }) {
  const events = (profile.timeline || []).map((ev) => ({
    step: ev.label,
    detail: [ev.detail, ev.by && `By ${ev.by}`, ev.remarks].filter(Boolean).join(' · '),
    timestamp: ev.at,
    status: ev.actionType?.includes('refund') ? 'failed' : 'completed',
  }))
  return (
    <Section title="Financial activity">
      {events.length === 0 ? <p className="text-sm text-[#686868]">No activity recorded</p> : <FinanceTimeline events={events} />}
    </Section>
  )
}

export function ProfileRefundsPanel({ profile }) {
  const refunds = profile.refunds || []
  if (!refunds.length) return <p className="text-sm text-[#686868]">No refund or adjustment history</p>
  return (
    <ul className="space-y-3">
      {refunds.map((r) => (
        <li key={r.id} className="rounded-lg border border-slate-100 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">{formatINR(r.amount)}</span>
            <FinanceStatusBadge status={r.status} />
          </div>
          <p className="text-sm text-[#686868]">{r.reason}</p>
          <p className="text-xs text-[#9ca0a8]">{r.mode} · {r.processedDate ? formatCategoryDateTime(r.processedDate) : formatCategoryDateTime(r.requestedAt)}</p>
        </li>
      ))}
    </ul>
  )
}

export function ProfileNotificationsPanel({ profile }) {
  const items = profile.notifications || []
  if (!items.length) return <p className="text-sm text-[#686868]">No finance notifications</p>
  return (
    <ul className="space-y-2">
      {items.map((n) => (
        <li key={n.id} className={cn('rounded-lg border p-3 text-sm', n.read ? 'border-slate-100 bg-white' : 'border-[#55ace7]/30 bg-[#eef6fc]/40')}>
          <div className="flex items-start gap-2">
            <Bell className="h-4 w-4 shrink-0 text-[#246392]" />
            <div>
              <p className="font-semibold">{n.title}</p>
              <p className="text-xs text-[#686868]">{n.message}</p>
              <p className="mt-1 text-xs text-[#9ca0a8]">{n.channel} · {formatCategoryDateTime(n.at)}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function ProfileQuickActionsPanel({ actions = [], onAction }) {
  if (!actions.length) return null
  return (
    <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
      {actions.map((a) => {
        const Icon = a.icon
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onAction(a.id)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#55ace7]/30 bg-white px-3 text-xs font-semibold text-[#246392] transition hover:bg-[#eef6fc]"
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {a.label}
          </button>
        )
      })}
    </div>
  )
}
