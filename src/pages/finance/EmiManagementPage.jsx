import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarClock,
  Pencil,
  Eye,
  UserPlus,
  Wallet,
  Users,
  AlertTriangle,
  TrendingUp,
  IndianRupee,
  RefreshCw,
  Download,
  Bell,
  Banknote,
} from 'lucide-react'
import FinanceBreadcrumbs from '../../components/finance/FinanceBreadcrumbs'
import FinanceStatCard from '../../components/finance/FinanceStatCard'
import FinanceStatusBadge from '../../components/finance/FinanceStatusBadge'
import FinanceSectionHeader from '../../components/finance/FinanceSectionHeader'
import FinanceTableSkeleton from '../../components/finance/FinanceTableSkeleton'
import FinanceEmptyState from '../../components/finance/FinanceEmptyState'
import FinanceSearchInput from '../../components/finance/FinanceSearchInput'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import Modal from '../../components/ui/Modal'
import ModalPanelHeader from '../../components/courses/ModalPanelHeader'
import {
  fetchEmiPlans,
  updateEmiPlan,
  assignEmiCounselor,
  sendEmiReminder,
} from '../../api/financeAPI'
import { FINANCE_COURSES } from '../../data/financeMockData'
import { formatINR } from '../../utils/financeFilters'
import { exportFinanceCsv } from '../../utils/financeExport'
import {
  enrichEmiPlans,
  filterEmiPlans,
  getNextDueInstallment,
} from '../../utils/emiManagement'
import { generateEmiSchedule, formatDisplayDate, getEmiMonthLabel } from '../../utils/emiSchedule'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useFinancePermissions } from '../../hooks/useFinancePermissions'
import { FINANCE_MOCK_COUNSELORS, FINANCE_EMI_STATUSES } from '../../constants/financeConstants'
import { EMI_SCHEDULE_FREQUENCIES } from '../../constants/emiManagement'
import { OFFLINE_PAYMENT_MODES } from '../../constants/offlinePaymentEmi'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

const EMI_EXPORT_COLUMNS = [
  { key: 'studentName', label: 'Student Name' },
  { key: 'studentId', label: 'Student ID' },
  { key: 'centerName', label: 'Center' },
  { key: 'courseName', label: 'Course' },
  { key: 'emiPlanLabel', label: 'EMI Plan' },
  { key: 'emiAmount', label: 'EMI Amount', export: (r) => formatINR(r.emiAmount) },
  { key: 'installmentsPaid', label: 'Installments Paid' },
  { key: 'remainingInstallments', label: 'Remaining Installments' },
  { key: 'nextDueDate', label: 'Next Due Date' },
  { key: 'pendingAmount', label: 'Pending Amount', export: (r) => formatINR(r.pendingAmount) },
  { key: 'emiStatus', label: 'EMI Status' },
  { key: 'counselorName', label: 'Assigned Counselor' },
]

const ASSIGN_PRIORITIES = ['High', 'Medium', 'Low']
const REMINDER_WINDOW_DAYS = 30

const selectClass =
  'h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-[#222] outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20 min-w-[140px]'

const fieldClass =
  'mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-sm text-[#222] outline-none focus:border-[#55ace7] focus:bg-white focus:ring-2 focus:ring-[#55ace7]/20'

function resolvePlanCenter(plan) {
  return plan.centerName || plan.branch || '—'
}

function countPaidInstallments(plan) {
  return (plan.installments || []).filter((i) => i.status === 'Paid' || i.status === 'Closed').length
}

function countRemainingInstallments(plan) {
  return (plan.installments || []).filter((i) => !['Paid', 'Closed', 'Cancelled'].includes(i.status)).length
}

function getEmiPlanLabel(plan) {
  const total = (plan.installments || []).length
  const freq = plan.frequency || plan.emiFrequency || 'monthly'
  const freqLabel = EMI_SCHEDULE_FREQUENCIES.find((f) => f.id === freq)?.label || 'Monthly EMI'
  return total ? `${total} × ${formatINR(plan.emiAmount || 0)} · ${freqLabel}` : freqLabel
}

function enrichPlanRow(plan) {
  return {
    ...plan,
    centerName: resolvePlanCenter(plan),
    installmentsPaid: countPaidInstallments(plan),
    remainingInstallments: countRemainingInstallments(plan),
    emiPlanLabel: getEmiPlanLabel(plan),
  }
}

function computeOverviewMetrics(plans = []) {
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10)

  let activePlans = 0
  let pendingCollection = 0
  let overdueCount = 0
  let collectedThisMonth = 0
  let totalRevenue = 0

  for (const plan of plans) {
    if ((plan.pendingAmount || 0) > 0 && plan.status !== 'EMI Completed') activePlans += 1
    pendingCollection += plan.pendingAmount || 0
    if (plan.overdueDays > 0) overdueCount += 1
    totalRevenue += plan.totalPaid || 0

    for (const inst of plan.installments || []) {
      const paidDate = inst.paidDate?.slice(0, 10)
      if (inst.status === 'Paid' && paidDate && paidDate >= monthStart && paidDate <= monthEnd) {
        collectedThisMonth += Number(inst.paidAmount) || Number(inst.emiAmount) || 0
      }
    }
  }

  return {
    totalStudents: plans.length,
    activePlans,
    pendingCollection,
    overdueCount,
    collectedThisMonth,
    totalRevenue,
  }
}

function daysUntil(dueDate) {
  if (!dueDate) return null
  const today = new Date().toISOString().slice(0, 10)
  const start = new Date(today)
  const end = new Date(dueDate)
  return Math.ceil((end - start) / 86400000)
}

function buildUpcomingReminders(plans = []) {
  const rows = []
  for (const plan of plans) {
    const next = getNextDueInstallment(plan)
    if (!next?.dueDate) continue
    const days = daysUntil(next.dueDate)
    if (days == null || days < 0 || days > REMINDER_WINDOW_DAYS) continue
    const lastLog = (plan.reminderLogs || [])[0]
    rows.push({
      id: `${plan.id}-${next.emiNo || next.installmentNo}`,
      planId: plan.id,
      studentName: plan.studentName,
      dueDate: next.dueDate,
      emiAmount: next.emiAmount || plan.emiAmount,
      daysRemaining: days,
      reminderStatus: lastLog?.deliveryStatus || lastLog?.status || 'Not sent',
      mobile: plan.mobile,
      email: plan.email,
      courseName: plan.courseName,
      pendingAmount: plan.pendingAmount,
      overdueDays: plan.overdueDays,
    })
  }
  return rows.sort((a, b) => a.daysRemaining - b.daysRemaining)
}

function filterEmiStudentPlans(plans, filters) {
  const base = filterEmiPlans(plans, {
    search: filters.search,
    statusFilter: filters.statusFilter,
    counselorFilter: filters.counselorFilter,
    dateFrom: '',
    dateTo: '',
  })

  return base.filter((plan) => {
    if (filters.centerFilter !== 'all' && resolvePlanCenter(plan) !== filters.centerFilter) return false
    if (filters.courseFilter !== 'all' && plan.courseName !== filters.courseFilter) return false
    if (filters.monthFilter !== 'all') {
      const due = plan.nextDueDate?.slice(0, 7)
      if (due !== filters.monthFilter) return false
    }
    return true
  })
}

function ActionIconButton({ icon: Icon, label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#246392] transition hover:border-[#55ace7] hover:bg-[#eef6fc] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon className="h-4 w-4" strokeWidth={2} />
    </button>
  )
}

function OverviewSection({ metrics, loading }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    )
  }

  const m = metrics || {}
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <FinanceStatCard icon={Users} label="Total EMI Students" value={m.totalStudents ?? 0} />
      <FinanceStatCard icon={CalendarClock} label="Active EMI Plans" value={m.activePlans ?? 0} accent="from-[#55ace7] to-[#246392]" />
      <FinanceStatCard icon={Wallet} label="Pending EMI Collection" value={formatINR(m.pendingCollection ?? 0)} accent="from-[#efb36d] to-[#b8887a]" />
      <FinanceStatCard icon={AlertTriangle} label="Overdue EMI" value={m.overdueCount ?? 0} accent="from-[#df8284] to-[#b8887a]" />
      <FinanceStatCard icon={Banknote} label="EMI Collected This Month" value={formatINR(m.collectedThisMonth ?? 0)} accent="from-[#69df66] to-[#246392]" />
      <FinanceStatCard icon={TrendingUp} label="Total EMI Revenue" value={formatINR(m.totalRevenue ?? 0)} accent="from-[#55ace7] to-[#1a4d73]" />
    </section>
  )
}

function AutomationReminderSection({ rows, onSendReminder, sendingId }) {
  const columns = [
    { key: 'studentName', label: 'Student Name', render: (r) => <span className="font-medium text-[#222]">{r.studentName}</span> },
    { key: 'dueDate', label: 'Due Date', render: (r) => formatDisplayDate(r.dueDate) },
    { key: 'emiAmount', label: 'EMI Amount', render: (r) => formatINR(r.emiAmount) },
    {
      key: 'daysRemaining',
      label: 'Days Remaining',
      render: (r) => (
        <span className={cn('font-semibold', r.daysRemaining <= 3 && 'text-amber-700')}>
          {r.daysRemaining} {r.daysRemaining === 1 ? 'day' : 'days'}
        </span>
      ),
    },
    {
      key: 'reminderStatus',
      label: 'Reminder Status',
      render: (r) => <FinanceStatusBadge status={r.reminderStatus} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <button
          type="button"
          disabled={sendingId === r.id}
          onClick={() => onSendReminder(r)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#246392] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1a4d73] disabled:opacity-60"
        >
          <Bell className="h-3.5 w-3.5" />
          {sendingId === r.id ? 'Sending…' : 'Send Reminder'}
        </button>
      ),
    },
  ]

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <FinanceSectionHeader title="Automation Reminder" subtitle="Upcoming EMI reminders for the next 30 days" />
      <div className="mt-4">
        {rows.length === 0 ? (
          <FinanceEmptyState title="No upcoming reminders" description="Students with due dates in the next 30 days will appear here." />
        ) : (
          <PaginatedFigmaTable
            columns={columns}
            data={rows}
            itemLabel="reminders"
            initialPageSize={5}
            zebraStriping
            tableClassName="overflow-x-auto"
          />
        )}
      </div>
    </section>
  )
}

function EmiViewModal({ open, plan, onClose }) {
  if (!plan) return null

  const paidInstallments = (plan.installments || []).filter((i) => i.status === 'Paid')
  const paidTotal = paidInstallments.reduce(
    (s, i) => s + (Number(i.paidAmount) || Number(i.emiAmount) || 0),
    0,
  )

  return (
    <Modal open={open} onClose={onClose} size="lg" title="EMI details">
      <ModalPanelHeader
        icon={Eye}
        title={plan.studentName}
        subtitle={`${plan.studentId} · ${plan.courseName}`}
        onClose={onClose}
      />
      <div className="max-h-[min(70vh,560px)] space-y-5 overflow-y-auto p-4 sm:p-5">
        <div className="rounded-xl border border-slate-100 bg-[#eef6fc]/40 p-4">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#686868]">Student Information</h4>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-[#686868]">Student ID</dt><dd className="font-mono font-semibold">{plan.studentId}</dd></div>
            <div><dt className="text-[#686868]">Mobile</dt><dd>{plan.mobile || '—'}</dd></div>
            <div><dt className="text-[#686868]">Email</dt><dd className="truncate">{plan.email || '—'}</dd></div>
            <div><dt className="text-[#686868]">Center</dt><dd>{resolvePlanCenter(plan)}</dd></div>
          </dl>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 p-4">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#686868]">Course</h4>
            <p className="font-semibold text-[#222]">{plan.courseName}</p>
            <p className="mt-1 text-sm text-[#686868]">Total fees: {formatINR(plan.totalFees || 0)}</p>
          </div>
          <div className="rounded-xl border border-slate-100 p-4">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#686868]">EMI Plan</h4>
            <p className="font-semibold text-[#222]">{getEmiPlanLabel(plan)}</p>
            <p className="mt-1 text-sm text-[#686868]">Status: <FinanceStatusBadge status={plan.emiStatus} /></p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-100 bg-white p-3">
            <p className="text-xs text-[#686868]">Amount Paid</p>
            <p className="text-lg font-bold text-[#246392]">{formatINR(paidTotal)}</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-white p-3">
            <p className="text-xs text-[#686868]">Pending Amount</p>
            <p className="text-lg font-bold text-[#df8284]">{formatINR(plan.pendingAmount || 0)}</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-white p-3">
            <p className="text-xs text-[#686868]">Next Due Date</p>
            <p className="text-lg font-bold text-[#222]">{formatDisplayDate(plan.nextDueDate)}</p>
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#686868]">Assigned Counselor</h4>
          <p className="text-sm font-semibold text-[#222]">{plan.counselorName || '—'}</p>
        </div>

        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#686868]">Installment Schedule</h4>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs uppercase text-[#686868]">
                  <th className="px-3 py-2.5">#</th>
                  <th className="px-3 py-2.5">Due Date</th>
                  <th className="px-3 py-2.5">Amount</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {(plan.installments || []).map((inst, idx) => (
                  <tr key={inst.emiNo || inst.installmentNo || idx} className={cn('border-b border-slate-50', idx % 2 === 1 && 'bg-slate-50/40')}>
                    <td className="px-3 py-2.5 font-medium">{inst.emiNo || inst.installmentNo}</td>
                    <td className="px-3 py-2.5">{formatDisplayDate(inst.dueDate || inst.emiDate)}</td>
                    <td className="px-3 py-2.5">{formatINR(inst.emiAmount)}</td>
                    <td className="px-3 py-2.5"><FinanceStatusBadge status={inst.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#686868]">Payment History Summary</h4>
          {paidInstallments.length === 0 ? (
            <p className="text-sm text-[#686868]">No payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs uppercase text-[#686868]">
                    <th className="px-3 py-2.5">EMI #</th>
                    <th className="px-3 py-2.5">Paid Date</th>
                    <th className="px-3 py-2.5">Amount</th>
                    <th className="px-3 py-2.5">Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {paidInstallments.map((inst) => (
                    <tr key={inst.emiNo || inst.installmentNo} className="border-b border-slate-50">
                      <td className="px-3 py-2.5">{inst.emiNo || inst.installmentNo}</td>
                      <td className="px-3 py-2.5">{formatDisplayDate(inst.paidDate)}</td>
                      <td className="px-3 py-2.5 font-medium">{formatINR(inst.paidAmount || inst.emiAmount)}</td>
                      <td className="px-3 py-2.5">{inst.paymentMode || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

function EmiEditDialog({ open, plan, onClose, onSave, saving }) {
  const [form, setForm] = useState(null)

  useEffect(() => {
    if (!open || !plan) return
    const paid = (plan.installments || []).filter((i) => i.status === 'Paid' || i.status === 'Closed')
    const nextOpen = getNextDueInstallment(plan)
    setForm({
      emiAmount: plan.emiAmount || nextOpen?.emiAmount || '',
      installmentCount: countRemainingInstallments(plan) || (plan.installments || []).length,
      startDate: nextOpen?.dueDate || plan.emiStartDate || plan.nextDueDate || new Date().toISOString().slice(0, 10),
      frequency: plan.frequency || plan.emiFrequency || 'monthly',
      counselorId: plan.counselorId || '',
      paidCount: paid.length,
    })
  }, [open, plan])

  if (!open || !plan || !form) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave?.(form)
  }

  return (
    <Modal open={open} onClose={onClose} size="md" title="Edit EMI">
      <ModalPanelHeader icon={Pencil} title="Edit EMI" subtitle={plan.studentName} onClose={onClose} />
      <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-5">
        <label className="block text-sm">
          <span className="font-medium text-[#686868]">EMI Amount (₹)</span>
          <input
            type="number"
            min={0}
            required
            value={form.emiAmount}
            onChange={(e) => setForm((f) => ({ ...f, emiAmount: e.target.value }))}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-[#686868]">Installment Count (remaining)</span>
          <input
            type="number"
            min={1}
            max={24}
            required
            value={form.installmentCount}
            onChange={(e) => setForm((f) => ({ ...f, installmentCount: e.target.value }))}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-[#686868]">First Due Date</span>
          <input
            type="date"
            required
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-[#686868]">EMI Frequency</span>
          <select
            value={form.frequency}
            onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
            className={fieldClass}
          >
            {EMI_SCHEDULE_FREQUENCIES.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-[#686868]">Counselor Assignment</span>
          <select
            value={form.counselorId}
            onChange={(e) => setForm((f) => ({ ...f, counselorId: e.target.value }))}
            className={fieldClass}
          >
            <option value="">Select counselor</option>
            {FINANCE_MOCK_COUNSELORS.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        {form.paidCount > 0 && (
          <p className="text-xs text-[#686868]">{form.paidCount} paid installment(s) will be preserved.</p>
        )}
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-[#444] hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#246392] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a4d73] disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function EmiSettleDialog({ open, plan, onClose, onSave, saving }) {
  const [form, setForm] = useState(null)

  useEffect(() => {
    if (!open || !plan) return
    const next = getNextDueInstallment(plan)
    setForm({
      amountPaid: next?.emiAmount || plan.emiAmount || '',
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMode: 'UPI',
      referenceNumber: '',
      notes: '',
      pendingAmount: plan.pendingAmount || 0,
    })
  }, [open, plan])

  if (!open || !plan || !form) return null

  const amount = Number(form.amountPaid) || 0
  const newPending = Math.max(0, (form.pendingAmount || 0) - amount)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave?.({ ...form, newPending })
  }

  return (
    <Modal open={open} onClose={onClose} size="md" title="Settle EMI">
      <ModalPanelHeader icon={IndianRupee} title="Settle EMI" subtitle={plan.studentName} onClose={onClose} />
      <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-5">
        <div className="rounded-lg bg-[#eef6fc]/60 px-3 py-2.5 text-sm">
          <span className="text-[#686868]">Current pending: </span>
          <span className="font-bold text-[#246392]">{formatINR(form.pendingAmount)}</span>
          <span className="mx-2 text-[#686868]">→</span>
          <span className="text-[#686868]">After payment: </span>
          <span className="font-bold text-[#222]">{formatINR(newPending)}</span>
        </div>
        <label className="block text-sm">
          <span className="font-medium text-[#686868]">Amount Paid (₹)</span>
          <input
            type="number"
            min={1}
            required
            value={form.amountPaid}
            onChange={(e) => setForm((f) => ({ ...f, amountPaid: e.target.value }))}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-[#686868]">Payment Date</span>
          <input
            type="date"
            required
            value={form.paymentDate}
            onChange={(e) => setForm((f) => ({ ...f, paymentDate: e.target.value }))}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-[#686868]">Payment Mode</span>
          <select
            value={form.paymentMode}
            onChange={(e) => setForm((f) => ({ ...f, paymentMode: e.target.value }))}
            className={fieldClass}
          >
            {OFFLINE_PAYMENT_MODES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-[#686868]">Reference Number</span>
          <input
            type="text"
            value={form.referenceNumber}
            onChange={(e) => setForm((f) => ({ ...f, referenceNumber: e.target.value }))}
            className={fieldClass}
            placeholder="UTR / receipt reference"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-[#686868]">Notes</span>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className={cn(fieldClass, 'h-auto py-2')}
            placeholder="Optional remarks"
          />
        </label>
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-[#444] hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#246392] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a4d73] disabled:opacity-60"
          >
            {saving ? 'Processing…' : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function EmiAssignCounselorDialog({ open, plan, onClose, onSave, saving }) {
  const [form, setForm] = useState({ counselorId: '', priority: 'Medium', remarks: '' })

  useEffect(() => {
    if (!open || !plan) return
    setForm({
      counselorId: plan.counselorId || '',
      priority: plan.assignmentPriority || 'Medium',
      remarks: '',
    })
  }, [open, plan])

  if (!open || !plan) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave?.(form)
  }

  return (
    <Modal open={open} onClose={onClose} size="md" title="Assign counselor">
      <ModalPanelHeader icon={UserPlus} title="Assign Unpaid Student to Counselor" subtitle={plan.studentName} onClose={onClose} />
      <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-5">
        <label className="block text-sm">
          <span className="font-medium text-[#686868]">Student</span>
          <input type="text" readOnly value={`${plan.studentName} (${plan.studentId})`} className={cn(fieldClass, 'bg-slate-100')} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-[#686868]">Counselor</span>
          <select
            required
            value={form.counselorId}
            onChange={(e) => setForm((f) => ({ ...f, counselorId: e.target.value }))}
            className={fieldClass}
          >
            <option value="">Select counselor</option>
            {FINANCE_MOCK_COUNSELORS.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-[#686868]">Priority</span>
          <select
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            className={fieldClass}
          >
            {ASSIGN_PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-[#686868]">Remarks</span>
          <textarea
            rows={2}
            value={form.remarks}
            onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
            className={cn(fieldClass, 'h-auto py-2')}
            placeholder="Follow-up notes for counselor"
          />
        </label>
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-[#444] hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#246392] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a4d73] disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Assignment'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function EmiMobileCard({ row, actions }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs font-semibold text-[#246392]">{row.studentId}</p>
          <p className="font-semibold text-[#222]">{row.studentName}</p>
          <p className="text-xs text-[#686868]">{row.courseName}</p>
        </div>
        <FinanceStatusBadge status={row.emiStatus} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div><dt className="text-[#686868]">Center</dt><dd className="font-medium">{row.centerName}</dd></div>
        <div><dt className="text-[#686868]">Pending</dt><dd className="font-semibold text-[#246392]">{formatINR(row.pendingAmount)}</dd></div>
        <div><dt className="text-[#686868]">Next due</dt><dd>{formatDisplayDate(row.nextDueDate)}</dd></div>
        <div><dt className="text-[#686868]">Counselor</dt><dd>{row.counselorName}</dd></div>
      </dl>
      <div className="mt-3 flex justify-end gap-1.5">{actions}</div>
    </article>
  )
}

export default function EmiManagementPage() {
  const { canManageEmi, canExport } = useFinancePermissions()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [centerFilter, setCenterFilter] = useState('all')
  const [courseFilter, setCourseFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [counselorFilter, setCounselorFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [viewPlan, setViewPlan] = useState(null)
  const [editPlan, setEditPlan] = useState(null)
  const [settlePlan, setSettlePlan] = useState(null)
  const [assignPlan, setAssignPlan] = useState(null)
  const [saving, setSaving] = useState(false)
  const [sendingReminderId, setSendingReminderId] = useState(null)

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    try {
      const raw = await fetchEmiPlans()
      setPlans(enrichEmiPlans(raw).map(enrichPlanRow))
    } catch {
      toast.error('Failed to load EMI plans')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const overviewMetrics = useMemo(() => computeOverviewMetrics(plans), [plans])
  const reminderRows = useMemo(() => buildUpcomingReminders(plans), [plans])

  const centerOptions = useMemo(() => {
    const set = new Set(plans.map((p) => resolvePlanCenter(p)).filter((c) => c && c !== '—'))
    return [...set].sort()
  }, [plans])

  const courseOptions = useMemo(() => {
    const fromPlans = new Set(plans.map((p) => p.courseName).filter(Boolean))
    FINANCE_COURSES.forEach((c) => fromPlans.add(c.name))
    return [...fromPlans].sort()
  }, [plans])

  const monthOptions = useMemo(() => {
    const set = new Set(
      plans.map((p) => p.nextDueDate?.slice(0, 7)).filter(Boolean),
    )
    return [...set].sort().reverse()
  }, [plans])

  const filteredPlans = useMemo(
    () =>
      filterEmiStudentPlans(plans, {
        search: debouncedSearch,
        statusFilter,
        counselorFilter,
        centerFilter,
        courseFilter,
        monthFilter,
      }),
    [plans, debouncedSearch, statusFilter, counselorFilter, centerFilter, courseFilter, monthFilter],
  )

  const handleExport = () => {
    if (!canExport) return toast.error('Export not permitted')
    if (!filteredPlans.length) return toast.error('No records to export')
    exportFinanceCsv(filteredPlans, `emi-students-${Date.now()}.csv`, EMI_EXPORT_COLUMNS)
    toast.success('Export ready')
  }

  const handleSendReminder = async (row) => {
    setSendingReminderId(row.id)
    try {
      await sendEmiReminder({
        planId: row.planId,
        studentName: row.studentName,
        mobile: row.mobile,
        email: row.email,
        channel: 'WhatsApp',
        trigger: row.daysRemaining <= 0 ? 'after_overdue' : 'before_due',
        message: `Dear ${row.studentName}, your EMI of ${formatINR(row.emiAmount)} is due on ${formatDisplayDate(row.dueDate)}.`,
      })
      toast.success('Reminder sent')
      load(true)
    } catch {
      toast.error('Failed to send reminder')
    } finally {
      setSendingReminderId(null)
    }
  }

  const handleEditSave = async (form) => {
    if (!editPlan) return
    setSaving(true)
    try {
      const paidRows = (editPlan.installments || []).filter((i) => i.status === 'Paid' || i.status === 'Closed')
      const pendingBalance = editPlan.pendingAmount || 0
      const { installments: newOpen } = generateEmiSchedule({
        installmentCount: Number(form.installmentCount) || 1,
        pendingBalance,
        startDate: form.startDate,
        frequency: form.frequency,
      })

      const merged = [
        ...paidRows,
        ...newOpen.map((inst, idx) => ({
          ...inst,
          emiNo: paidRows.length + idx + 1,
          installmentNo: paidRows.length + idx + 1,
          emiAmount: Number(form.emiAmount) || inst.emiAmount,
          status: inst.status === 'Scheduled' ? 'Due' : inst.status,
        })),
      ]

      const counselor = FINANCE_MOCK_COUNSELORS.find((c) => c.id === form.counselorId)
      const planPatch = {
        emiAmount: Number(form.emiAmount),
        frequency: form.frequency,
        emiFrequency: form.frequency,
        emiStartDate: form.startDate,
        ...(counselor ? { counselorId: counselor.id, counselorName: counselor.name } : {}),
      }

      await updateEmiPlan(editPlan.id, merged, planPatch)
      if (counselor && counselor.id !== editPlan.counselorId) {
        await assignEmiCounselor(editPlan.id, { counselorId: counselor.id, counselorName: counselor.name })
      }
      toast.success('EMI plan updated')
      setEditPlan(null)
      load(true)
    } catch {
      toast.error('Failed to update EMI plan')
    } finally {
      setSaving(false)
    }
  }

  const handleSettleSave = async (form) => {
    if (!settlePlan) return
    setSaving(true)
    try {
      const nextIdx = (settlePlan.installments || []).findIndex(
        (i) => !['Paid', 'Closed', 'Cancelled'].includes(i.status),
      )
      if (nextIdx < 0) {
        toast.error('No open installment to settle')
        return
      }

      const amount = Number(form.amountPaid) || 0
      const updated = (settlePlan.installments || []).map((inst, idx) => {
        if (idx !== nextIdx) return inst
        const paid = (Number(inst.paidAmount) || 0) + amount
        const due = Number(inst.emiAmount) || 0
        const status = paid >= due - 0.5 ? 'Paid' : 'Partial'
        return {
          ...inst,
          paidAmount: paid,
          status,
          paidDate: form.paymentDate,
          paymentMode: form.paymentMode,
          referenceNumber: form.referenceNumber,
          utrNumber: form.referenceNumber,
          remarks: form.notes,
          paymentHistory: [
            ...(inst.paymentHistory || []),
            {
              action: `Collected ${formatINR(amount)} via ${form.paymentMode}`,
              at: new Date().toISOString(),
              by: 'Finance Admin',
            },
          ],
        }
      })

      await updateEmiPlan(settlePlan.id, updated)
      toast.success('Payment recorded')
      setSettlePlan(null)
      load(true)
    } catch {
      toast.error('Failed to record payment')
    } finally {
      setSaving(false)
    }
  }

  const handleAssignSave = async (form) => {
    if (!assignPlan) return
    const counselor = FINANCE_MOCK_COUNSELORS.find((c) => c.id === form.counselorId)
    if (!counselor) return toast.error('Select a counselor')

    setSaving(true)
    try {
      await assignEmiCounselor(assignPlan.id, {
        counselorId: counselor.id,
        counselorName: counselor.name,
      })
      if (form.remarks || form.priority) {
        await updateEmiPlan(assignPlan.id, assignPlan.installments, {
          assignmentPriority: form.priority,
          followUpRemarks: form.remarks,
          followUpStatus: 'Contacted',
        })
      }
      toast.success('Counselor assigned')
      setAssignPlan(null)
      load(true)
    } catch {
      toast.error('Assignment failed')
    } finally {
      setSaving(false)
    }
  }

  const rowActions = (row) => (
    <div className="flex items-center justify-center gap-1.5">
      <ActionIconButton icon={Eye} label="View" onClick={() => setViewPlan(row)} />
      {canManageEmi && (
        <>
          <ActionIconButton icon={Pencil} label="Edit EMI" onClick={() => setEditPlan(row)} />
          <ActionIconButton icon={IndianRupee} label="Settle EMI" onClick={() => setSettlePlan(row)} />
          <ActionIconButton icon={UserPlus} label="Assign Unpaid Student to Counselor" onClick={() => setAssignPlan(row)} />
        </>
      )}
    </div>
  )

  const tableColumns = [
    { key: 'studentName', label: 'Student Name', render: (r) => <span className="font-medium text-[#222]">{r.studentName}</span> },
    { key: 'studentId', label: 'Student ID', render: (r) => <span className="font-mono text-xs">{r.studentId}</span> },
    { key: 'centerName', label: 'Center' },
    { key: 'courseName', label: 'Course', render: (r) => <span className="max-w-[160px] truncate" title={r.courseName}>{r.courseName}</span> },
    { key: 'emiPlanLabel', label: 'EMI Plan', render: (r) => <span className="text-xs text-[#686868]">{r.emiPlanLabel}</span> },
    { key: 'emiAmount', label: 'EMI Amount', render: (r) => formatINR(r.emiAmount) },
    { key: 'installmentsPaid', label: 'Installments Paid', render: (r) => r.installmentsPaid },
    { key: 'remainingInstallments', label: 'Remaining Installments', render: (r) => r.remainingInstallments },
    { key: 'nextDueDate', label: 'Next Due Date', render: (r) => formatDisplayDate(r.nextDueDate) },
    { key: 'pendingAmount', label: 'Pending Amount', render: (r) => <span className="font-semibold text-[#246392]">{formatINR(r.pendingAmount)}</span> },
    { key: 'emiStatus', label: 'EMI Status', render: (r) => <FinanceStatusBadge status={r.emiStatus} /> },
    { key: 'counselorName', label: 'Assigned Counselor' },
    { key: 'actions', label: 'Actions', render: (r) => rowActions(r) },
  ]

  return (
    <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6">
      <FinanceBreadcrumbs items={[{ label: 'EMI Management' }]} />

      <div className="rounded-lg bg-gradient-to-r from-[#55ace7] via-[#8b98bb] to-[#df8284] px-5 py-4 shadow-[0_5px_13px_rgba(0,0,0,0.08)] sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
                <CalendarClock className="h-5 w-5 text-[#8b98bb]" strokeWidth={2.4} />
              </div>
              <h1 className="text-lg font-bold text-white sm:text-xl">EMI Management</h1>
            </div>
            <p className="mt-2 pl-14 text-sm text-white/90">
              Manage student EMI plans and installment collections
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => load(true)}
              disabled={refreshing}
              aria-label="Refresh"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-60"
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              Refresh
            </button>
            {canExport && (
              <button
                type="button"
                onClick={handleExport}
                aria-label="Export"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3 text-sm font-semibold text-white hover:bg-white/20"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            )}
          </div>
        </div>
      </div>

      <OverviewSection metrics={overviewMetrics} loading={loading} />

      <AutomationReminderSection
        rows={reminderRows}
        onSendReminder={handleSendReminder}
        sendingId={sendingReminderId}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <FinanceSectionHeader title="EMI Students" subtitle="Students enrolled in EMI payment plans" />

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <FinanceSearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student…"
              aria-label="Search student"
              className="max-w-md flex-1"
            />
            <select value={centerFilter} onChange={(e) => setCenterFilter(e.target.value)} className={selectClass} aria-label="Center">
              <option value="all">All centers</option>
              {centerOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className={selectClass} aria-label="Course">
              <option value="all">All courses</option>
              {courseOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass} aria-label="EMI status">
              <option value="all">All EMI statuses</option>
              {FINANCE_EMI_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select value={counselorFilter} onChange={(e) => setCounselorFilter(e.target.value)} className={selectClass} aria-label="Counselor">
              <option value="all">All counselors</option>
              {FINANCE_MOCK_COUNSELORS.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className={selectClass} aria-label="Month">
              <option value="all">All months</option>
              {monthOptions.map((m) => (
                <option key={m} value={m}>{getEmiMonthLabel(`${m}-01`)}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <FinanceTableSkeleton rows={6} columns={8} />
          ) : filteredPlans.length === 0 ? (
            <FinanceEmptyState title="No EMI students found" description="Adjust filters or search to find students." />
          ) : (
            <>
              <div className="hidden lg:block">
                <PaginatedFigmaTable
                  columns={tableColumns}
                  data={filteredPlans}
                  itemLabel="students"
                  resetDeps={[debouncedSearch, centerFilter, courseFilter, statusFilter, counselorFilter, monthFilter]}
                  zebraStriping
                  stickyHeader
                  tableClassName="overflow-x-auto"
                  tableMinWidth={1200}
                />
              </div>
              <div className="space-y-3 lg:hidden">
                {filteredPlans.map((row) => (
                  <EmiMobileCard key={row.id} row={row} actions={rowActions(row)} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <EmiViewModal open={!!viewPlan} plan={viewPlan} onClose={() => setViewPlan(null)} />
      <EmiEditDialog open={!!editPlan} plan={editPlan} onClose={() => setEditPlan(null)} onSave={handleEditSave} saving={saving} />
      <EmiSettleDialog open={!!settlePlan} plan={settlePlan} onClose={() => setSettlePlan(null)} onSave={handleSettleSave} saving={saving} />
      <EmiAssignCounselorDialog open={!!assignPlan} plan={assignPlan} onClose={() => setAssignPlan(null)} onSave={handleAssignSave} saving={saving} />
    </div>
  )
}
