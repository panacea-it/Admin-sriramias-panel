import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarClock, Pencil, Eye, UserPlus, Wallet, Users, AlertTriangle, TrendingUp, Bell, Banknote } from 'lucide-react'
import { useFinanceCenterFilter } from '../../contexts/FinanceCenterFilterContext'
import FinanceBreadcrumbs from '../../components/finance/FinanceBreadcrumbs'
import FinanceCenterFilterBar from '../../components/finance/FinanceCenterFilterBar'
import FinanceStatCard from '../../components/finance/FinanceStatCard'
import FinanceStatusBadge from '../../components/finance/FinanceStatusBadge'
import FinanceSectionHeader from '../../components/finance/FinanceSectionHeader'
import FinanceTableSkeleton from '../../components/finance/FinanceTableSkeleton'
import FinanceEmptyState from '../../components/finance/FinanceEmptyState'
import FinanceSearchInput from '../../components/finance/FinanceSearchInput'
import FinanceActionMenu from '../../components/finance/FinanceActionMenu'
import IconActionButton from '../../components/common/IconActionButton'
import EmiEditModal from '../../components/finance/EmiEditModal'
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
import {
  enrichEmiPlans,
  filterEmiPlans,
  filterPlansByFinanceCenters,
  formatEmiCityLabel,
  getNextDueInstallment,
  resolveEmiPlanCenter,
} from '../../utils/emiManagement'
import { formatDisplayDate, getEmiMonthLabel } from '../../utils/emiSchedule'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useFinancePermissions } from '../../hooks/useFinancePermissions'
import { useFinanceOperations } from '../../contexts/FinanceOperationsContext'
import { FINANCE_MOCK_COUNSELORS, FINANCE_EMI_STATUSES } from '../../constants/financeConstants'
import { EMI_SCHEDULE_FREQUENCIES } from '../../constants/emiManagement'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

const ASSIGN_PRIORITIES = ['High', 'Medium', 'Low']
const REMINDER_WINDOW_DAYS = 30

const selectClass =
  'h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-[#222] outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20 min-w-[140px]'

const fieldClass =
  'mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-[#222] outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20'

const emiModalPanelClass = 'overflow-hidden rounded-2xl bg-white shadow-[0_11px_25px_rgba(15,23,42,0.08)]'

function EmiModalShell({ open, onClose, size = 'md', title, children }) {
  return (
    <Modal open={open} onClose={onClose} size={size} title={title} showCloseButton={false}>
      <div className={emiModalPanelClass}>{children}</div>
    </Modal>
  )
}

function EmiDetailRow({ label, children }) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-3 last:border-0 sm:grid-cols-[minmax(140px,38%)_1fr] sm:items-start sm:gap-4">
      <span className="text-sm font-medium text-[#686868]">{label}</span>
      <div className="text-sm font-semibold text-[#111] sm:text-right">{children}</div>
    </div>
  )
}

function EmiFormFooter({ onCancel, submitLabel, saving, savingLabel = 'Saving…' }) {
  return (
    <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
      <button
        type="button"
        onClick={onCancel}
        className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-[#444] hover:bg-slate-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving}
        className="h-10 rounded-lg bg-[#246392] px-4 text-sm font-semibold text-white hover:bg-[#1a4d73] disabled:opacity-60"
      >
        {saving ? savingLabel : submitLabel}
      </button>
    </div>
  )
}

function resolvePlanCenter(plan) {
  return resolveEmiPlanCenter(plan)
}

function getEmiPageCenterLabel({ isOverallView, selectedCenters, headerLabel }) {
  if (isOverallView) return 'All Centres'
  if (selectedCenters?.length) {
    return selectedCenters.map((center) => formatEmiCityLabel(center.centerName)).join(', ')
  }
  return formatEmiCityLabel(headerLabel)
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
  const rawCenter = resolvePlanCenter(plan)
  return {
    ...plan,
    centerName: rawCenter,
    centerCity: formatEmiCityLabel(rawCenter),
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
      centerName: formatEmiCityLabel(resolvePlanCenter(plan)),
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
    if (filters.courseFilter !== 'all' && plan.courseName !== filters.courseFilter) return false
    if (filters.monthFilter !== 'all') {
      const due = plan.nextDueDate?.slice(0, 7)
      if (due !== filters.monthFilter) return false
    }
    return true
  })
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

function AutomationReminderSection({ rows, onSendReminder, sendingId, centerLabel }) {
  const columns = [
    { key: 'studentName', label: 'Student Name', render: (r) => <span className="font-medium text-[#222]">{r.studentName}</span> },
    { key: 'centerName', label: 'City', render: (r) => <span className="text-[#444]">{r.centerName || '—'}</span> },
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
        <IconActionButton
          label={sendingId === r.id ? 'Sending reminder…' : 'Send reminder'}
          onClick={() => onSendReminder(r)}
          disabled={sendingId === r.id}
          className="text-white hover:border-[#1a4d73] hover:bg-[#1a4d73] hover:shadow-sm bg-[#246392]"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
        </IconActionButton>
      ),
    },
  ]

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <FinanceSectionHeader
        title="Automation Reminder"
        subtitle={`Upcoming EMI reminders for the next 30 days · ${centerLabel}`}
      />
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
    <EmiModalShell open={open} onClose={onClose} size="lg" title="EMI student details">
      <ModalPanelHeader
        icon={Eye}
        iconClassName="text-[#246392]"
        title="EMI Student Details"
        subtitle={`${plan.studentName} · ${plan.studentId}`}
        onClose={onClose}
        closeVariant="icon"
      />
      <div className="max-h-[min(70vh,560px)] overflow-y-auto px-5 py-4 sm:px-6">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-[#eef6fc]/50 p-3">
            <p className="text-xs font-semibold uppercase text-[#686868]">Amount Paid</p>
            <p className="mt-1 text-lg font-bold text-[#246392]">{formatINR(paidTotal)}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-red-50/40 p-3">
            <p className="text-xs font-semibold uppercase text-[#686868]">Pending Amount</p>
            <p className="mt-1 text-lg font-bold text-[#df8284]">{formatINR(plan.pendingAmount || 0)}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <p className="text-xs font-semibold uppercase text-[#686868]">Next Due Date</p>
            <p className="mt-1 text-lg font-bold text-[#222]">{formatDisplayDate(plan.nextDueDate)}</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50/40 px-4">
          <EmiDetailRow label="Student ID">{plan.studentId}</EmiDetailRow>
          <EmiDetailRow label="Mobile">{plan.mobile || '—'}</EmiDetailRow>
          <EmiDetailRow label="Email">{plan.email || '—'}</EmiDetailRow>
          <EmiDetailRow label="City">{formatEmiCityLabel(resolvePlanCenter(plan))}</EmiDetailRow>
          <EmiDetailRow label="Course">{plan.courseName}</EmiDetailRow>
          <EmiDetailRow label="Total Fees">{formatINR(plan.totalFees || 0)}</EmiDetailRow>
          <EmiDetailRow label="EMI Plan">{getEmiPlanLabel(plan)}</EmiDetailRow>
          <EmiDetailRow label="EMI Status">
            <FinanceStatusBadge status={plan.emiStatus} />
          </EmiDetailRow>
          <EmiDetailRow label="Assigned Counselor">{plan.counselorName || '—'}</EmiDetailRow>
        </div>

        <h4 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-[#686868]">Installment Schedule</h4>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-[#eef2fc] text-left text-xs uppercase text-[#246392]">
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

        <h4 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-[#686868]">Payment History</h4>
        {paidInstallments.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-[#686868]">
            No payments recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-[#eef2fc] text-left text-xs uppercase text-[#246392]">
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
      <div className="flex justify-end border-t border-slate-100 bg-slate-50/60 px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-lg bg-[#246392] px-5 text-sm font-semibold text-white hover:bg-[#1a4d73]"
        >
          Close
        </button>
      </div>
    </EmiModalShell>
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

  const selectedCounselor = FINANCE_MOCK_COUNSELORS.find((c) => c.id === form.counselorId)

  return (
    <EmiModalShell open={open} onClose={onClose} size="md" title="Assign counselor">
      <ModalPanelHeader
        icon={UserPlus}
        iconClassName="text-[#246392]"
        title="Assign Counselor"
        subtitle="Assign unpaid student for follow-up"
        onClose={onClose}
        closeVariant="icon"
      />
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 p-5">
          <div className="rounded-xl border border-slate-100 bg-[#eef6fc]/50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#686868]">Student</p>
            <p className="mt-1 text-sm font-bold text-[#1a3a5c]">{plan.studentName}</p>
            <p className="mt-0.5 text-xs text-[#686868]">
              {plan.studentId} · {plan.courseName} · Pending {formatINR(plan.pendingAmount || 0)}
            </p>
          </div>

          <label className="block text-sm font-semibold text-[#333]">
            Counselor
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

          {selectedCounselor && (
            <p className="text-xs text-[#686868]">
              Assigning to <span className="font-semibold text-[#246392]">{selectedCounselor.name}</span>
            </p>
          )}

          <label className="block text-sm font-semibold text-[#333]">
            Priority
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

          <label className="block text-sm font-semibold text-[#333]">
            Remarks
            <textarea
              rows={3}
              value={form.remarks}
              onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
              className={cn(fieldClass, 'h-auto min-h-[4.5rem] py-2')}
              placeholder="Follow-up notes for counselor"
            />
          </label>
        </div>
        <EmiFormFooter onCancel={onClose} submitLabel="Save Assignment" saving={saving} />
      </form>
    </EmiModalShell>
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
        <div><dt className="text-[#686868]">City</dt><dd className="font-medium">{row.centerCity}</dd></div>
        <div><dt className="text-[#686868]">Pending</dt><dd className="font-semibold text-[#246392]">{formatINR(row.pendingAmount)}</dd></div>
        <div><dt className="text-[#686868]">Next due</dt><dd>{formatDisplayDate(row.nextDueDate)}</dd></div>
        <div><dt className="text-[#686868]">Counselor</dt><dd>{row.counselorName}</dd></div>
      </dl>
      <div className="mt-3 flex justify-end gap-1.5">{actions}</div>
    </article>
  )
}

export default function EmiManagementPage() {
  const { canManageEmi } = useFinancePermissions()
  const { refreshToken } = useFinanceOperations()
  const financeCenterFilter = useFinanceCenterFilter()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [courseFilter, setCourseFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [counselorFilter, setCounselorFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [viewPlan, setViewPlan] = useState(null)
  const [editPlan, setEditPlan] = useState(null)
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
    load(refreshToken > 0)
  }, [refreshToken, load])

  const centerFilteredPlans = useMemo(
    () => filterPlansByFinanceCenters(plans, financeCenterFilter),
    [plans, financeCenterFilter],
  )

  const overviewMetrics = useMemo(
    () => computeOverviewMetrics(centerFilteredPlans),
    [centerFilteredPlans],
  )
  const reminderRows = useMemo(
    () => buildUpcomingReminders(centerFilteredPlans),
    [centerFilteredPlans],
  )
  const centerLabel = useMemo(
    () => getEmiPageCenterLabel(financeCenterFilter),
    [financeCenterFilter],
  )

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
      filterEmiStudentPlans(centerFilteredPlans, {
        search: debouncedSearch,
        statusFilter,
        counselorFilter,
        courseFilter,
        monthFilter,
      }),
    [centerFilteredPlans, debouncedSearch, statusFilter, counselorFilter, courseFilter, monthFilter],
  )

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

  const handleEditSave = async (installments, meta) => {
    if (!meta?.planId) return
    setSaving(true)
    try {
      await updateEmiPlan(meta.planId, installments, meta.plan)
      toast.success('EMI plan updated')
      setEditPlan(null)
      load(true)
    } catch {
      toast.error('Failed to update EMI plan')
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
    <FinanceActionMenu
      inlineFrom="lg"
      actions={[
        { label: 'View', icon: Eye, onClick: () => setViewPlan(row) },
        {
          label: 'Edit',
          icon: Pencil,
          onClick: () => setEditPlan(row),
          show: canManageEmi,
        },
        {
          label: 'Assign Counselor',
          icon: UserPlus,
          onClick: () => setAssignPlan(row),
          show: canManageEmi,
        },
      ]}
    />
  )

  const tableColumns = [
    { key: 'studentName', label: 'Student Name', render: (r) => <span className="font-medium text-[#222]">{r.studentName}</span> },
    { key: 'studentId', label: 'Student ID', render: (r) => <span className="font-mono text-xs">{r.studentId}</span> },
    { key: 'centerCity', label: 'City', render: (r) => <span className="text-[#444]">{r.centerCity || '—'}</span> },
    { key: 'courseName', label: 'Course', render: (r) => <span className="max-w-[160px] truncate" title={r.courseName}>{r.courseName}</span> },
    { key: 'emiPlanLabel', label: 'EMI Plan', render: (r) => <span className="text-xs text-[#686868]">{r.emiPlanLabel}</span> },
    { key: 'emiAmount', label: 'EMI Amount', render: (r) => formatINR(r.emiAmount) },
    { key: 'installmentsPaid', label: 'Installments Paid', render: (r) => r.installmentsPaid },
    { key: 'remainingInstallments', label: 'Remaining Installments', render: (r) => r.remainingInstallments },
    { key: 'nextDueDate', label: 'Next Due Date', render: (r) => formatDisplayDate(r.nextDueDate) },
    { key: 'pendingAmount', label: 'Pending Amount', render: (r) => <span className="font-semibold text-[#246392]">{formatINR(r.pendingAmount)}</span> },
    { key: 'emiStatus', label: 'EMI Status', render: (r) => <FinanceStatusBadge status={r.emiStatus} /> },
    { key: 'counselorName', label: 'Assigned Counselor' },
    { key: 'actions', label: 'Actions', align: 'center', render: (r) => rowActions(r) },
  ]

  return (
    <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6">
      <FinanceBreadcrumbs items={[{ label: 'EMI Management' }]} />

      <div className="rounded-lg bg-gradient-to-r from-[#55ace7] via-[#8b98bb] to-[#df8284] px-5 py-4 shadow-[0_5px_13px_rgba(0,0,0,0.08)] sm:px-6">
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
      </div>

      <FinanceCenterFilterBar />

      <OverviewSection metrics={overviewMetrics} loading={loading} />

      <AutomationReminderSection
        rows={reminderRows}
        onSendReminder={handleSendReminder}
        sendingId={sendingReminderId}
        centerLabel={centerLabel}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <FinanceSectionHeader title="EMI Students" subtitle="Students enrolled in EMI payment plans" />

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <FinanceSearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH STUDENT ID , STUDENT , COURSE  , MODE "
              aria-label="Search EMI students"
              className="max-w-md flex-1"
            />
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
                  resetDeps={[debouncedSearch, financeCenterFilter.selectedIds, courseFilter, statusFilter, counselorFilter, monthFilter]}
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
      <EmiEditModal
        open={!!editPlan}
        plan={editPlan}
        onClose={() => setEditPlan(null)}
        onSubmit={handleEditSave}
        saving={saving}
      />
      <EmiAssignCounselorDialog open={!!assignPlan} plan={assignPlan} onClose={() => setAssignPlan(null)} onSave={handleAssignSave} saving={saving} />
    </div>
  )
}
