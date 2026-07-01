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
  fetchEmiFilterOptions,
  fetchEmiDashboard,
  fetchEmiDetails,
  assignEmiCounselor,
  sendEmiReminder,
} from '../../api/emiManagementAPI'
import { formatINR } from '../../utils/financeFilters'
import { formatDisplayDate } from '../../utils/emiSchedule'
import {
  mapFilterOptionsToUi,
  resolveDashboardCenterId,
  buildAssignCounselorBody,
  buildStudentPaginationControl,
  canEditEmiPlan,
  canAssignCounselor,
} from '../../utils/emiManagementHelpers'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useFinancePermissions } from '../../hooks/useFinancePermissions'
import { useFinanceOperations } from '../../contexts/FinanceOperationsContext'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

const ASSIGN_PRIORITIES = ['High', 'Medium', 'Low']

function formatPriorityForForm(priority) {
  if (!priority) return 'Medium'
  const normalized = String(priority).toLowerCase()
  if (normalized === 'high') return 'High'
  if (normalized === 'low') return 'Low'
  return 'Medium'
}
const REMINDER_WINDOW_DAYS = 30
const DEFAULT_PAGE_SIZE = 10

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

function getEmiPageCenterLabel({ isOverallView, selectedCenters, headerLabel }) {
  if (isOverallView) return 'All Centres'
  if (selectedCenters?.length) {
    return selectedCenters.map((center) => center.city || center.centerName).join(', ')
  }
  return headerLabel || 'All Centres'
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
          disabled={sendingId === r.id || !r.canResend}
          className="text-white hover:border-[#1a4d73] hover:bg-[#1a4d73] hover:shadow-sm bg-[#246392] disabled:opacity-45"
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
        subtitle={`Upcoming EMI reminders for the next ${REMINDER_WINDOW_DAYS} days · ${centerLabel}`}
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

function EmiViewModal({ open, plan, loading, onClose }) {
  if (!open) return null

  const paymentHistory = plan?.paymentHistory || []

  return (
    <EmiModalShell open={open} onClose={onClose} size="lg" title="EMI student details">
      <ModalPanelHeader
        icon={Eye}
        iconClassName="text-[#246392]"
        title="EMI Student Details"
        subtitle={plan ? `${plan.studentName} · ${plan.studentId}` : 'Loading…'}
        onClose={onClose}
        closeVariant="icon"
      />
      <div className="max-h-[min(70vh,560px)] overflow-y-auto px-5 py-4 sm:px-6">
        {loading || !plan ? (
          <FinanceTableSkeleton rows={4} columns={4} />
        ) : (
          <>
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-[#eef6fc]/50 p-3">
                <p className="text-xs font-semibold uppercase text-[#686868]">Amount Paid</p>
                <p className="mt-1 text-lg font-bold text-[#246392]">{formatINR(plan.amountPaid || 0)}</p>
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
              <EmiDetailRow label="City">{plan.city || plan.centerName || '—'}</EmiDetailRow>
              <EmiDetailRow label="Course">{plan.courseName}</EmiDetailRow>
              <EmiDetailRow label="Total Fees">{formatINR(plan.totalFees || 0)}</EmiDetailRow>
              <EmiDetailRow label="EMI Plan">{plan.emiPlanSummary || '—'}</EmiDetailRow>
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
                    <tr key={inst._id || inst.emiNo || idx} className={cn('border-b border-slate-50', idx % 2 === 1 && 'bg-slate-50/40')}>
                      <td className="px-3 py-2.5 font-medium">{inst.emiNo || inst.installmentNo}</td>
                      <td className="px-3 py-2.5">{formatDisplayDate(inst.dueDate || inst.emiDate)}</td>
                      <td className="px-3 py-2.5">{formatINR(inst.emiAmount)}</td>
                      <td className="px-3 py-2.5"><FinanceStatusBadge status={inst.statusLabel || inst.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-[#686868]">Payment History</h4>
            {paymentHistory.length === 0 ? (
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
                    {paymentHistory.map((entry) => (
                      <tr key={`${entry.installmentNo}-${entry.paidDate}`} className="border-b border-slate-50">
                        <td className="px-3 py-2.5">{entry.installmentNo}</td>
                        <td className="px-3 py-2.5">{formatDisplayDate(entry.paidDate)}</td>
                        <td className="px-3 py-2.5 font-medium">{formatINR(entry.amount)}</td>
                        <td className="px-3 py-2.5">{entry.mode || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
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

function EmiAssignCounselorDialog({ open, plan, counselors, onClose, onSave, saving }) {
  const [form, setForm] = useState({ counselorId: '', priority: 'Medium', remarks: '' })

  useEffect(() => {
    if (!open || !plan) return
    setForm({
      counselorId: plan.counselorId || '',
      priority: formatPriorityForForm(plan.counselorPriority),
      remarks: '',
    })
  }, [open, plan])

  if (!open || !plan) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave?.(form)
  }

  const selectedCounselor = counselors.find((c) => c.value === form.counselorId)

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
              {counselors.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>

          {selectedCounselor && (
            <p className="text-xs text-[#686868]">
              Assigning to <span className="font-semibold text-[#246392]">{selectedCounselor.label}</span>
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

  const [filterOptions, setFilterOptions] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [reminderRows, setReminderRows] = useState([])
  const [students, setStudents] = useState([])
  const [studentPagination, setStudentPagination] = useState({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  })

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 400)
  const [courseFilter, setCourseFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [counselorFilter, setCounselorFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const [viewPlanId, setViewPlanId] = useState(null)
  const [viewPlan, setViewPlan] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [editPlanId, setEditPlanId] = useState(null)
  const [assignPlan, setAssignPlan] = useState(null)
  const [saving, setSaving] = useState(false)
  const [sendingReminderId, setSendingReminderId] = useState(null)

  const uiFilterOptions = useMemo(
    () => mapFilterOptionsToUi(filterOptions || {}),
    [filterOptions],
  )

  const centerLabel = useMemo(
    () => getEmiPageCenterLabel(financeCenterFilter),
    [financeCenterFilter],
  )

  const loadFilterOptions = useCallback(async () => {
    try {
      const data = await fetchEmiFilterOptions()
      setFilterOptions(data)
    } catch (err) {
      toast.error(err.message || 'Failed to load filter options')
    }
  }, [])

  const loadDashboard = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true)
      else setLoading(true)

      try {
        const result = await fetchEmiDashboard({
          centerId: resolveDashboardCenterId(financeCenterFilter),
          courseId: courseFilter,
          emiStatus: statusFilter,
          counselorId: counselorFilter,
          month: monthFilter,
          search: debouncedSearch,
          page,
          limit: pageSize,
          nextDays: REMINDER_WINDOW_DAYS,
          reminderPage: 1,
          reminderLimit: 50,
        })

        setMetrics(result.metrics)
        setReminderRows(result.reminders)
        setStudents(result.students)
        setStudentPagination(result.studentPagination)
      } catch (err) {
        toast.error(err.message || 'Failed to load EMI dashboard')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [
      financeCenterFilter,
      courseFilter,
      statusFilter,
      counselorFilter,
      monthFilter,
      debouncedSearch,
      page,
      pageSize,
    ],
  )

  useEffect(() => {
    loadFilterOptions()
  }, [loadFilterOptions])

  useEffect(() => {
    loadDashboard(refreshToken > 0)
  }, [loadDashboard, refreshToken])

  useEffect(() => {
    setPage(1)
  }, [
    debouncedSearch,
    courseFilter,
    statusFilter,
    counselorFilter,
    monthFilter,
    financeCenterFilter.selectedIds,
    financeCenterFilter.isOverallView,
    pageSize,
  ])

  useEffect(() => {
    if (!viewPlanId) {
      setViewPlan(null)
      return undefined
    }

    let cancelled = false
    setViewLoading(true)
    fetchEmiDetails(viewPlanId)
      .then((details) => {
        if (!cancelled) setViewPlan(details)
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err.message || 'Failed to load EMI details')
          setViewPlanId(null)
        }
      })
      .finally(() => {
        if (!cancelled) setViewLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [viewPlanId])

  const handleSendReminder = async (row) => {
    if (!row.canResend) return
    setSendingReminderId(row.id)
    try {
      await sendEmiReminder(row.emiPlanId, row.installmentId)
      toast.success('Reminder sent')
      loadDashboard(true)
    } catch (err) {
      toast.error(err.message || 'Failed to send reminder')
    } finally {
      setSendingReminderId(null)
    }
  }

  const handleAssignSave = async (form) => {
    if (!assignPlan) return
    if (!form.counselorId) return toast.error('Select a counselor')

    setSaving(true)
    try {
      await assignEmiCounselor(
        buildAssignCounselorBody({
          emiPlanId: assignPlan.emiPlanId || assignPlan.id,
          counselorId: form.counselorId,
          priority: form.priority,
          remarks: form.remarks,
        }),
      )
      toast.success('Counselor assigned')
      setAssignPlan(null)
      loadDashboard(true)
    } catch (err) {
      toast.error(err.message || 'Assignment failed')
    } finally {
      setSaving(false)
    }
  }

  const handleEditComplete = useCallback(() => {
    setEditPlanId(null)
    loadDashboard(true)
  }, [loadDashboard])

  const rowActions = (row) => (
    <FinanceActionMenu
      inlineFrom="lg"
      actions={[
        {
          label: 'View',
          icon: Eye,
          onClick: () => setViewPlanId(row.emiPlanId || row.id),
        },
        {
          label: 'Edit',
          icon: Pencil,
          onClick: () => setEditPlanId(row.emiPlanId || row.id),
          show: canManageEmi && canEditEmiPlan(row),
        },
        {
          label: 'Assign Counselor',
          icon: UserPlus,
          onClick: () => setAssignPlan(row),
          show: canManageEmi && canAssignCounselor(row),
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

  const paginationControl = useMemo(() => {
    const base = buildStudentPaginationControl({
      page: studentPagination.page,
      pageSize: studentPagination.limit,
      total: studentPagination.total,
      totalPages: studentPagination.totalPages,
    })
    return {
      ...base,
      onPageChange: setPage,
      onPageSizeChange: (size) => {
        setPageSize(Number(size))
        setPage(1)
      },
    }
  }, [studentPagination])

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

      <OverviewSection metrics={metrics} loading={loading && !metrics} />

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
              {uiFilterOptions.courses.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass} aria-label="EMI status">
              <option value="all">All EMI statuses</option>
              {uiFilterOptions.emiStatuses.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select value={counselorFilter} onChange={(e) => setCounselorFilter(e.target.value)} className={selectClass} aria-label="Counselor">
              <option value="all">All counselors</option>
              {uiFilterOptions.counselors.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className={selectClass} aria-label="Month">
              <option value="all">All months</option>
              {uiFilterOptions.months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <FinanceTableSkeleton rows={6} columns={8} />
          ) : students.length === 0 ? (
            <FinanceEmptyState title="No EMI students found" description="Adjust filters or search to find students." />
          ) : (
            <>
              <div className="hidden lg:block">
                <PaginatedFigmaTable
                  columns={tableColumns}
                  data={students}
                  itemLabel="students"
                  controlledPagination={paginationControl}
                  zebraStriping
                  stickyHeader
                  tableClassName="overflow-x-auto"
                  tableMinWidth={1200}
                />
              </div>
              <div className="space-y-3 lg:hidden">
                {students.map((row) => (
                  <EmiMobileCard key={row.id} row={row} actions={rowActions(row)} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <EmiViewModal
        open={!!viewPlanId}
        plan={viewPlan}
        loading={viewLoading}
        onClose={() => setViewPlanId(null)}
      />

      <EmiEditModal
        open={!!editPlanId}
        emiPlanId={editPlanId}
        paymentModes={uiFilterOptions.paymentModes}
        onClose={() => setEditPlanId(null)}
        onComplete={handleEditComplete}
      />

      <EmiAssignCounselorDialog
        open={!!assignPlan}
        plan={assignPlan}
        counselors={uiFilterOptions.counselors}
        onClose={() => setAssignPlan(null)}
        onSave={handleAssignSave}
        saving={saving}
      />
    </div>
  )
}
