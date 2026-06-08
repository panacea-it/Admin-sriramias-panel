import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarClock,
  Pencil,
  Bell,
  Eye,
  Calculator,
  UserPlus,
  Phone,
  AlertTriangle,
} from 'lucide-react'
import FinancePageShell from '../../components/finance/FinancePageShell'
import FinanceStatusBadge from '../../components/finance/FinanceStatusBadge'
import FinanceSectionHeader from '../../components/finance/FinanceSectionHeader'
import FinanceTableSkeleton from '../../components/finance/FinanceTableSkeleton'
import FinanceEmptyState from '../../components/finance/FinanceEmptyState'
import EmiEditModal from '../../components/finance/EmiEditModal'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import FinanceExportToolbar from '../../components/finance/FinanceExportToolbar'
import FinanceActionMenu from '../../components/finance/FinanceActionMenu'
import FinanceConfirmDialog from '../../components/finance/FinanceConfirmDialog'
import EmiDashboardOverview from '../../components/finance/emi-management/EmiDashboardOverview'
import EmiManagementFilters from '../../components/finance/emi-management/EmiManagementFilters'
import EmiScheduleGeneratorDialog from '../../components/finance/emi-management/EmiScheduleGeneratorDialog'
import EmiReminderPanel from '../../components/finance/emi-management/EmiReminderPanel'
import EmiAutomationSettings from '../../components/finance/emi-management/EmiAutomationSettings'
import EmiPlanDetailDrawer from '../../components/finance/emi-management/EmiPlanDetailDrawer'
import EmiOverdueSeverityBadge from '../../components/finance/emi-management/EmiOverdueSeverityBadge'
import {
  fetchEmiPlans,
  updateEmiPlan,
  bulkAssignEmiCounselor,
} from '../../api/financeAPI'
import { formatINR } from '../../utils/financeFilters'
import {
  enrichEmiPlans,
  computeEmiDashboardSummary,
  filterEmiPlans,
} from '../../utils/emiManagement'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useFinancePermissions } from '../../hooks/useFinancePermissions'
import { useFinanceOperations } from '../../contexts/FinanceOperationsContext'
import { FINANCE_MOCK_COUNSELORS } from '../../constants/financeConstants'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

const EMI_EXPORT_COLUMNS = [
  { key: 'studentId', label: 'Student ID' },
  { key: 'studentName', label: 'Student Name' },
  { key: 'courseName', label: 'Course' },
  { key: 'loanProvider', label: 'Loan Provider' },
  { key: 'emiAmount', label: 'EMI Amount', export: (r) => formatINR(r.emiAmount) },
  { key: 'pendingAmount', label: 'Pending', export: (r) => formatINR(r.pendingAmount) },
  { key: 'nextDueDate', label: 'Next Due Date' },
  { key: 'overdueDays', label: 'Overdue Days' },
  { key: 'counselorName', label: 'Counselor' },
  { key: 'emiStatus', label: 'EMI Status' },
  { key: 'suspensionStatus', label: 'Suspension' },
]

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'plans', label: 'Plans' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'automation', label: 'Automation' },
]

function EmiMobileCard({ row, actions }) {
  return (
    <article
      className={cn(
        'rounded-xl border bg-white p-4 shadow-sm',
        row.overdueDays > 0 && 'border-red-200 bg-red-50/20',
        row.suspensionStatus === 'Suspended' && 'opacity-90',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs font-semibold text-[#246392]">{row.studentId}</p>
          <p className="font-semibold text-[#222]">{row.studentName}</p>
          <p className="text-xs text-[#686868]">{row.courseName}</p>
        </div>
        <FinanceStatusBadge status={row.emiStatus} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div><dt className="text-[#686868]">Provider</dt><dd className="font-medium">{row.loanProvider}</dd></div>
        <div><dt className="text-[#686868]">Pending</dt><dd className="font-semibold text-[#246392]">{formatINR(row.pendingAmount)}</dd></div>
        <div><dt className="text-[#686868]">Next due</dt><dd>{row.nextDueDate || '—'}</dd></div>
        <div><dt className="text-[#686868]">Overdue</dt><dd><EmiOverdueSeverityBadge severityId={row.overdueSeverity} overdueDays={row.overdueDays} /></dd></div>
      </dl>
      <div className="mt-3 flex justify-end">{actions}</div>
    </article>
  )
}

export default function EmiManagementPage() {
  const { canManageEmi, canExport } = useFinancePermissions()
  const { goToFinance } = useFinanceOperations()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [statusFilter, setStatusFilter] = useState('all')
  const [providerFilter, setProviderFilter] = useState('all')
  const [counselorFilter, setCounselorFilter] = useState('all')
  const [overdueMin, setOverdueMin] = useState(0)
  const [suspensionFilter, setSuspensionFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [editPlan, setEditPlan] = useState(null)
  const [detailPlan, setDetailPlan] = useState(null)
  const [schedulePlan, setSchedulePlan] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkCounselor, setBulkCounselor] = useState('')
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const raw = await fetchEmiPlans()
      setPlans(enrichEmiPlans(raw))
    } catch {
      toast.error('Failed to load EMI plans')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filteredPlans = useMemo(
    () =>
      filterEmiPlans(plans, {
        search: debouncedSearch,
        statusFilter,
        providerFilter,
        counselorFilter,
        overdueDaysMin: overdueMin,
        suspensionFilter,
        dateFrom,
        dateTo,
      }),
    [
      plans,
      debouncedSearch,
      statusFilter,
      providerFilter,
      counselorFilter,
      overdueMin,
      suspensionFilter,
      dateFrom,
      dateTo,
    ],
  )

  const overduePlans = useMemo(
    () => filteredPlans.filter((p) => p.overdueDays >= overdueMin && p.overdueDays > 0),
    [filteredPlans, overdueMin],
  )

  const dashboardSummary = useMemo(() => computeEmiDashboardSummary(plans), [plans])

  const selectedPlan = detailPlan || (filteredPlans.length === 1 ? filteredPlans[0] : null)

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleBulkAssign = async () => {
    const c = FINANCE_MOCK_COUNSELORS.find((x) => x.id === bulkCounselor)
    if (!c) return toast.error('Select counselor')
    try {
      await bulkAssignEmiCounselor(selectedIds, { counselorId: c.id, counselorName: c.name })
      toast.success(`Assigned ${selectedIds.length} students`)
      setSelectedIds([])
      setBulkConfirm(false)
      load()
    } catch {
      toast.error('Bulk assign failed')
    }
  }

  const handleSave = async (installments, meta) => {
    if (!meta?.planId) return
    setSaving(true)
    try {
      await updateEmiPlan(meta.planId, installments, meta.plan)
      toast.success('EMI plan updated')
      setEditPlan(null)
      load()
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  const rowActions = (row) => (
    <FinanceActionMenu
      actions={[
        { label: 'View', icon: Eye, onClick: () => setDetailPlan(row) },
        { label: 'Edit EMI', icon: Pencil, onClick: () => setEditPlan(row), show: canManageEmi },
        { label: 'Schedule', icon: Calculator, onClick: () => setSchedulePlan(row), show: canManageEmi },
        { label: 'Arrange call', icon: Phone, onClick: () => setDetailPlan({ ...row, _openTab: 'calls' }) },
        { label: 'Remind', icon: Bell, onClick: () => goToFinance('communication') },
        { label: 'Overdue', icon: AlertTriangle, onClick: () => { setActiveTab('overdue'); setDetailPlan(row) }, show: row.overdueDays > 0 },
      ]}
    />
  )

  const planColumns = [
    {
      key: 'select',
      label: '',
      render: (r) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(r.id)}
          onChange={() => toggleSelect(r.id)}
          aria-label={`Select ${r.studentName}`}
          className="h-4 w-4 rounded border-slate-300"
        />
      ),
    },
    { key: 'studentId', label: 'Student ID', render: (r) => <span className="font-mono text-xs">{r.studentId}</span> },
    { key: 'studentName', label: 'Student', render: (r) => <span className="font-medium">{r.studentName}</span> },
    { key: 'courseName', label: 'Course' },
    { key: 'loanProvider', label: 'Provider' },
    { key: 'emiAmount', label: 'EMI', render: (r) => formatINR(r.emiAmount) },
    { key: 'pendingAmount', label: 'Pending', render: (r) => formatINR(r.pendingAmount) },
    { key: 'nextDueDate', label: 'Next due' },
    {
      key: 'overdueDays',
      label: 'Overdue',
      render: (r) => <EmiOverdueSeverityBadge severityId={r.overdueSeverity} overdueDays={r.overdueDays} />,
    },
    { key: 'counselorName', label: 'Counselor' },
    { key: 'emiStatus', label: 'EMI status', render: (r) => <FinanceStatusBadge status={r.emiStatus} /> },
    {
      key: 'suspensionStatus',
      label: 'Suspension',
      render: (r) => (
        <FinanceStatusBadge
          status={r.suspensionStatus}
          className={cn(r.suspensionStatus === 'Suspended' && 'ring-2 ring-red-300/50')}
        />
      ),
    },
    { key: 'actions', label: 'Actions', render: (r) => rowActions(r) },
  ]

  const overdueColumns = [
    { key: 'studentName', label: 'Student', render: (r) => <span className="font-semibold text-red-900">{r.studentName}</span> },
    { key: 'loanProvider', label: 'Provider' },
    { key: 'counselorName', label: 'Counselor' },
    { key: 'pendingAmount', label: 'Pending', render: (r) => formatINR(r.pendingAmount) },
    {
      key: 'overdueDays',
      label: 'Days',
      render: (r) => <EmiOverdueSeverityBadge severityId={r.overdueSeverity} overdueDays={r.overdueDays} />,
    },
    { key: 'actions', label: 'Actions', render: (r) => rowActions(r) },
  ]

  const tableData = activeTab === 'overdue' ? overduePlans : filteredPlans
  const tableColumns = activeTab === 'overdue' ? overdueColumns : planColumns

  return (
    <FinancePageShell
      icon={CalendarClock}
      title="EMI Management"
      breadcrumbs={[{ label: 'EMI Management' }]}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {canManageEmi && selectedIds.length > 0 && (
            <>
              <select
                value={bulkCounselor}
                onChange={(e) => setBulkCounselor(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm"
                aria-label="Bulk counselor"
              >
                <option value="">Bulk assign…</option>
                {FINANCE_MOCK_COUNSELORS.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setBulkConfirm(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-[#246392] px-3 py-1.5 text-sm font-semibold text-white"
              >
                <UserPlus className="h-4 w-4" /> ({selectedIds.length})
              </button>
            </>
          )}
          <FinanceExportToolbar
            rows={filteredPlans}
            filenameBase="emi-plans"
            columnDefs={EMI_EXPORT_COLUMNS}
            canExport={canExport}
            variant="banner"
          />
        </div>
      }
    >
      <EmiManagementFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        providerFilter={providerFilter}
        onProviderFilter={setProviderFilter}
        counselorFilter={counselorFilter}
        onCounselorFilter={setCounselorFilter}
        overdueMin={overdueMin}
        onOverdueMin={setOverdueMin}
        suspensionFilter={suspensionFilter}
        onSuspensionFilter={setSuspensionFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFrom={setDateFrom}
        onDateTo={setDateTo}
      />

      <div className="flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'shrink-0 rounded-md px-4 py-2 text-sm font-semibold transition',
              activeTab === tab.id ? 'bg-[#246392] text-white' : 'text-[#686868] hover:bg-slate-50',
            )}
          >
            {tab.label}
            {tab.id === 'overdue' && overduePlans.length > 0 && (
              <span className="ml-1.5 rounded-full bg-[#df8284] px-1.5 py-0.5 text-[10px] text-white">
                {overduePlans.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <EmiDashboardOverview summary={dashboardSummary} loading={loading} />}

      {activeTab === 'reminders' && (
        <EmiReminderPanel selectedPlan={selectedPlan} onRefresh={load} />
      )}

      {activeTab === 'automation' && <EmiAutomationSettings />}

      {(activeTab === 'plans' || activeTab === 'overdue') && (
        <>
          <FinanceSectionHeader
            title={TABS.find((t) => t.id === activeTab)?.label}
            subtitle={
              activeTab === 'overdue'
                ? 'Priority highlighting by severity — assign counselors and send reminders'
                : 'Full EMI registry with loan provider and suspension tracking'
            }
          />
          {loading ? (
            <FinanceTableSkeleton rows={6} columns={8} />
          ) : tableData.length === 0 ? (
            <FinanceEmptyState title={`No ${activeTab} records`} description="Adjust filters or search." />
          ) : (
            <>
              <div className="hidden md:block">
                <PaginatedFigmaTable
                  columns={tableColumns}
                  data={tableData}
                  itemLabel={activeTab}
                  resetDeps={[debouncedSearch, statusFilter, activeTab, providerFilter]}
                  tableClassName="overflow-x-auto [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10"
                />
              </div>
              <div className="space-y-3 md:hidden">
                {tableData.map((row) => (
                  <EmiMobileCard key={row.id} row={row} actions={rowActions(row)} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <EmiEditModal
        open={!!editPlan}
        plan={editPlan}
        onClose={() => setEditPlan(null)}
        onSubmit={handleSave}
        saving={saving}
      />

      <EmiPlanDetailDrawer
        open={!!detailPlan}
        plan={detailPlan}
        onClose={() => setDetailPlan(null)}
        onRefresh={load}
        canManage={canManageEmi}
      />

      <EmiScheduleGeneratorDialog
        open={!!schedulePlan}
        plan={schedulePlan}
        onClose={() => setSchedulePlan(null)}
        onSaved={load}
        canManage={canManageEmi}
      />

      <FinanceConfirmDialog
        open={bulkConfirm}
        title="Bulk assign counselor"
        message={`Assign ${selectedIds.length} student(s) to the selected counselor?`}
        confirmLabel="Assign"
        onConfirm={handleBulkAssign}
        onCancel={() => setBulkConfirm(false)}
      />
    </FinancePageShell>
  )
}
