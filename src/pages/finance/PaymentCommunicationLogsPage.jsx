import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MessageSquare, Eye, UserPlus, RotateCcw, Clock, Send } from 'lucide-react'
import FinancePageShell from '../../components/finance/FinancePageShell'
import FinanceCenterFilterBar from '../../components/finance/FinanceCenterFilterBar'
import FinanceStatusBadge from '../../components/finance/FinanceStatusBadge'
import FinanceConfirmDialog from '../../components/finance/FinanceConfirmDialog'
import FinanceTableSkeleton from '../../components/finance/FinanceTableSkeleton'
import FinanceEmptyState from '../../components/finance/FinanceEmptyState'
import FinanceTableRowActions from '../../components/finance/FinanceTableRowActions'
import FinanceExportToolbar from '../../components/finance/FinanceExportToolbar'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import VerificationCenterNav from '../../components/finance/communication/VerificationCenterNav'
import CommunicationOverview from '../../components/finance/communication/CommunicationOverview'
import CommunicationFilters from '../../components/finance/communication/CommunicationFilters'
import CommunicationFollowUpBadge from '../../components/finance/communication/CommunicationFollowUpBadge'
import CommunicationTrackingTimeline from '../../components/finance/communication/CommunicationTrackingTimeline'
import CommunicationMobileCard from '../../components/finance/communication/CommunicationMobileCard'
import CommunicationCounselorModal from '../../components/finance/communication/CommunicationCounselorModal'
import CommunicationTimelineDrawer from '../../components/finance/communication/CommunicationTimelineDrawer'
import CommunicationTemplatesPanel from '../../components/finance/communication/CommunicationTemplatesPanel'
import CommunicationTemplateDialog from '../../components/finance/communication/CommunicationTemplateDialog'
import CommunicationAutomationPanel from '../../components/finance/communication/CommunicationAutomationPanel'
import CommunicationAutomationDialog from '../../components/finance/communication/CommunicationAutomationDialog'
import CommunicationJourneyModal from '../../components/finance/communication/CommunicationJourneyModal'
import {
  fetchCommunicationAnalytics,
  sendPaymentReminder,
  tagCommunicationCounselor,
  bulkCommunicationAction,
  saveCommunicationTemplate,
  deleteCommunicationTemplate,
  testSendCommunicationTemplate,
  saveCommunicationAutomationRule,
  deleteCommunicationAutomationRule,
  toggleCommunicationAutomationRule,
} from '../../api/financeAPI'
import {
  filterCommunicationLogs,
  filterCommunicationByFinanceCenters,
  computeCommunicationSummary,
  buildDailyActivityChart,
  buildChannelUsageChart,
  buildDeliveryTrendChart,
} from '../../utils/paymentCommunicationAnalytics'
import {
  PAYMENT_COMMUNICATION_TABS,
  COMMUNICATION_EXPORT_COLUMNS,
  COMMUNICATION_CHANNELS,
} from '../../constants/paymentCommunicationConstants'
import { FINANCE_BATCHES } from '../../constants/financeConstants'
import { FINANCE_COURSES } from '../../data/financeMockData'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useFinancePermissions } from '../../hooks/useFinancePermissions'
import { useFinanceCenterFilter } from '../../contexts/FinanceCenterFilterContext'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

const REMINDER_TEMPLATES = [
  { id: 'default', label: 'Default payment reminder' },
  { id: 'overdue', label: 'Overdue payment notice' },
  { id: 'emi', label: 'EMI due reminder' },
]

const REMINDER_CHANNELS = ['all', ...COMMUNICATION_CHANNELS]

function formatCommCenterLabel(centerName) {
  return centerName?.replace(/\s+Center$/i, '') || centerName || 'All Centres'
}

export default function PaymentCommunicationLogsPage() {
  const { canExport, canEdit } = useFinancePermissions()
  const financeCenterFilter = useFinanceCenterFilter()
  const { user } = useAuth()
  const adminName = user?.name || user?.email || 'Finance Admin'
  const [searchParams] = useSearchParams()
  const studentParam = searchParams.get('student')

  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [channelFilter, setChannelFilter] = useState('all')
  const [centerFilter, setCenterFilter] = useState('all')
  const [courseFilter, setCourseFilter] = useState('all')
  const [batchFilter, setBatchFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [followUpFilter, setFollowUpFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [timelineRow, setTimelineRow] = useState(null)
  const [journeyRow, setJourneyRow] = useState(null)
  const [counselorRow, setCounselorRow] = useState(null)
  const [counselorBulk, setCounselorBulk] = useState([])
  const [templateDialog, setTemplateDialog] = useState(null)
  const [automationDialog, setAutomationDialog] = useState(null)
  const [automationLogsRule, setAutomationLogsRule] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmSend, setConfirmSend] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reminderForm, setReminderForm] = useState({
    mobile: '',
    email: '',
    channel: 'all',
    template: 'default',
    centerName: 'all',
    courseId: 'all',
    batchId: 'all',
  })
  const [formErrors, setFormErrors] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setAnalytics(await fetchCommunicationAnalytics())
    } catch {
      toast.error('Failed to load communication data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (studentParam) {
      setSearch(studentParam)
      setActiveTab('activity')
    }
  }, [studentParam])

  const logs = analytics?.logs ?? []
  const templates = analytics?.templates ?? []
  const rules = analytics?.rules ?? []

  const centerScopedLogs = useMemo(
    () => filterCommunicationByFinanceCenters(logs, financeCenterFilter),
    [logs, financeCenterFilter],
  )

  const centerOptions = useMemo(
    () =>
      (financeCenterFilter.isOverallView ? financeCenterFilter.financeCenters : financeCenterFilter.selectedCenters).map((c) => ({
        value: c.centerName,
        label: formatCommCenterLabel(c.centerName),
      })),
    [financeCenterFilter.financeCenters, financeCenterFilter.isOverallView, financeCenterFilter.selectedCenters],
  )

  const courseOptions = useMemo(() => {
    const names = new Set(centerScopedLogs.map((l) => l.courseName).filter(Boolean))
    FINANCE_COURSES.forEach((c) => names.add(c.name))
    return [...names].sort().map((name) => {
      const course = FINANCE_COURSES.find((c) => c.name === name)
      return { value: course?.id || name, label: name }
    })
  }, [centerScopedLogs])

  const batchOptions = useMemo(() => {
    const names = new Set(centerScopedLogs.map((l) => l.batchName).filter(Boolean))
    FINANCE_BATCHES.forEach((b) => names.add(b.name))
    return [...names].sort().map((name) => {
      const batch = FINANCE_BATCHES.find((b) => b.name === name)
      return { value: batch?.id || name, label: name }
    })
  }, [centerScopedLogs])

  const filterState = useMemo(
    () => ({
      search: debouncedSearch,
      centerFilter,
      courseFilter,
      batchFilter,
      channelFilter,
      typeFilter,
      statusFilter,
      followUpFilter,
      dateFrom,
      dateTo,
    }),
    [debouncedSearch, centerFilter, courseFilter, batchFilter, channelFilter, typeFilter, statusFilter, followUpFilter, dateFrom, dateTo],
  )

  const filtered = useMemo(() => filterCommunicationLogs(centerScopedLogs, filterState), [centerScopedLogs, filterState])
  const summary = useMemo(() => computeCommunicationSummary(centerScopedLogs), [centerScopedLogs])
  const charts = useMemo(
    () => ({
      dailyActivity: buildDailyActivityChart(centerScopedLogs),
      channelUsage: buildChannelUsageChart(centerScopedLogs),
      deliveryTrend: buildDeliveryTrendChart(centerScopedLogs),
    }),
    [centerScopedLogs],
  )
  const activeRules = rules.filter((r) => r.active).length

  const validateForm = () => {
    const errors = {}
    if (!reminderForm.mobile?.trim() && !reminderForm.email?.trim()) errors.contact = 'Enter mobile or email'
    if (reminderForm.mobile?.trim() && !/^\d{10}$/.test(reminderForm.mobile.trim())) errors.mobile = 'Enter valid 10-digit mobile'
    if (reminderForm.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reminderForm.email.trim())) errors.email = 'Enter valid email'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSendReminder = async () => {
    try {
      await sendPaymentReminder({ ...reminderForm, adminName })
      toast.success('Reminder queued')
      setReminderForm({
        mobile: '',
        email: '',
        channel: 'all',
        template: 'default',
        centerName: 'all',
        courseId: 'all',
        batchId: 'all',
      })
      setConfirmSend(false)
      await load()
    } catch {
      toast.error('Failed to send reminder')
    }
  }

  const handleAssignCounselor = async (payload) => {
    setSaving(true)
    try {
      for (const id of payload.ids) {
        await tagCommunicationCounselor(id, { ...payload, adminName })
      }
      toast.success('Counselor tagged')
      setCounselorRow(null)
      setCounselorBulk([])
      setSelectedIds([])
      await load()
    } catch {
      toast.error('Assignment failed')
    } finally {
      setSaving(false)
    }
  }

  const handleBulkResend = async () => {
    setSaving(true)
    try {
      await bulkCommunicationAction({ ids: selectedIds, action: 'resend', adminName })
      toast.success(`Resent ${selectedIds.length} communication(s)`)
      setSelectedIds([])
      await load()
    } catch {
      toast.error('Bulk resend failed')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveTemplate = async (form) => {
    setSaving(true)
    try {
      await saveCommunicationTemplate({ ...form, adminName }, templateDialog?.id)
      toast.success(templateDialog?.id ? 'Template updated' : 'Template created')
      setTemplateDialog(null)
      await load()
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTemplate = async () => {
    if (!confirmDelete?.id) return
    setSaving(true)
    try {
      await deleteCommunicationTemplate(confirmDelete.id)
      toast.success('Template deleted')
      setConfirmDelete(null)
      await load()
    } catch {
      toast.error('Delete failed')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveRule = async (form) => {
    setSaving(true)
    try {
      await saveCommunicationAutomationRule({ ...form, adminName }, automationDialog?.id)
      toast.success(automationDialog?.id ? 'Rule updated' : 'Rule created')
      setAutomationDialog(null)
      await load()
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRule = async () => {
    if (!confirmDelete?.id) return
    setSaving(true)
    try {
      await deleteCommunicationAutomationRule(confirmDelete.id)
      toast.success('Rule deleted')
      setConfirmDelete(null)
      await load()
    } catch {
      toast.error('Delete failed')
    } finally {
      setSaving(false)
    }
  }

  const openDetailsModal = (row) => {
    setJourneyRow(null)
    setTimelineRow(row)
  }

  const openJourneyModal = (row) => {
    setTimelineRow(null)
    setJourneyRow(row)
  }

  const buildActions = (row) => (
    <FinanceTableRowActions
      actions={[
        { label: 'View', icon: Eye, onClick: () => openDetailsModal(row) },
        { label: 'Tag', icon: UserPlus, onClick: () => setCounselorRow(row), show: canEdit },
        { label: 'Resend', icon: RotateCcw, onClick: () => bulkCommunicationAction({ ids: [row.id], action: 'resend', adminName }).then(load), show: canEdit },
        { label: 'Timeline', icon: Clock, onClick: () => openJourneyModal(row) },
      ]}
    />
  )

  const activityColumns = [
    {
      key: 'select',
      label: '',
      render: (r) =>
        canEdit ? (
          <input
            type="checkbox"
            checked={selectedIds.includes(r.id)}
            onChange={(e) => setSelectedIds((prev) => (e.target.checked ? [...prev, r.id] : prev.filter((id) => id !== r.id)))}
            aria-label={`Select ${r.id}`}
          />
        ) : null,
    },
    { key: 'id', label: 'Comm ID', render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: 'studentName', label: 'Student', render: (r) => <span className="font-medium">{r.studentName || r.recipient}</span> },
    { key: 'studentId', label: 'Student ID', render: (r) => r.studentId || '—' },
    { key: 'paymentReference', label: 'Payment Ref', render: (r) => <span className="font-mono text-xs">{r.paymentReference || '—'}</span> },
    { key: 'type', label: 'Type' },
    { key: 'channel', label: 'Channel' },
    { key: 'status', label: 'Status', render: (r) => <FinanceStatusBadge status={r.status} /> },
    { key: 'sentBy', label: 'Sent By', render: (r) => r.sentBy || '—' },
    { key: 'timestamp', label: 'Sent', render: (r) => formatCategoryDateTime(r.timestamp) },
    { key: 'deliveryStatus', label: 'Delivery', render: (r) => <FinanceStatusBadge status={r.deliveryStatus || r.status} /> },
    { key: 'openStatus', label: 'Open', render: (r) => r.openStatus || '—' },
    { key: 'readStatus', label: 'Read', render: (r) => r.readStatus || '—' },
    {
      key: 'followUp',
      label: 'Follow-up',
      render: (r) => <CommunicationFollowUpBadge priority={r.followUpPriority} tag={r.followUpTag} />,
    },
    {
      key: 'tracking',
      label: 'Timeline',
      render: (r) => <CommunicationTrackingTimeline row={r} compact onView={openJourneyModal} />,
    },
    { key: 'actions', label: 'Actions', align: 'right', headerClassName: 'text-right pr-6 sm:pr-8', cellClassName: 'text-right pr-6 sm:pr-8', render: (row) => buildActions(row) },
  ]

  const inputClass =
    'rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20'

  const exportRows =
    activeTab === 'templates' ? templates : activeTab === 'automation' ? rules : filtered

  return (
    <FinancePageShell
      icon={MessageSquare}
      title="Payment Verification Center"
      breadcrumbs={[{ label: 'Payment Verification Center' }, { label: 'Communication Logs' }]}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && activeTab === 'activity' && canEdit && (
            <>
              <button type="button" onClick={handleBulkResend} disabled={saving} className="rounded-lg bg-[#246392] px-3 py-2 text-sm font-semibold text-white">
                Bulk resend ({selectedIds.length})
              </button>
              <button
                type="button"
                onClick={() => setCounselorBulk(filtered.filter((r) => selectedIds.includes(r.id)))}
                className="rounded-lg border border-[#246392] px-3 py-2 text-sm font-semibold text-[#246392]"
              >
                Bulk assign
              </button>
            </>
          )}
          <FinanceExportToolbar
            rows={exportRows}
            filenameBase={`communication-${activeTab}`}
            columnDefs={COMMUNICATION_EXPORT_COLUMNS}
            canExport={canExport}
            variant="banner"
          />
        </div>
      }
    >
      <VerificationCenterNav />

      <FinanceCenterFilterBar className="mb-4" />

      <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
        {PAYMENT_COMMUNICATION_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative px-4 py-2.5 text-sm font-semibold transition',
              activeTab === tab.id ? 'text-[#246392]' : 'text-[#686868] hover:text-[#222]',
            )}
          >
            {tab.label}
            {activeTab === tab.id && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#246392]" />}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <CommunicationOverview summary={summary} charts={charts} activeRules={activeRules} loading={loading} />
      )}

      {activeTab === 'activity' && (
        <>
          {canEdit && (
            <section className="mb-4 rounded-xl bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
              <h2 className="text-sm font-bold text-[#1a3a5c]">Send payment reminder</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (validateForm()) setConfirmSend(true)
                }}
                className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
              >
                <input placeholder="Mobile (10 digits)" value={reminderForm.mobile} onChange={(e) => setReminderForm((f) => ({ ...f, mobile: e.target.value }))} className={inputClass} aria-label="Mobile" />
                <input placeholder="Email" value={reminderForm.email} onChange={(e) => setReminderForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} aria-label="Email" />
                <select value={reminderForm.centerName} onChange={(e) => setReminderForm((f) => ({ ...f, centerName: e.target.value }))} className={inputClass} aria-label="Centre">
                  <option value="all">All centres</option>
                  {centerOptions.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <select value={reminderForm.courseId} onChange={(e) => setReminderForm((f) => ({ ...f, courseId: e.target.value }))} className={inputClass} aria-label="Course">
                  <option value="all">All courses</option>
                  {courseOptions.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <select value={reminderForm.batchId} onChange={(e) => setReminderForm((f) => ({ ...f, batchId: e.target.value }))} className={inputClass} aria-label="Batch">
                  <option value="all">All batches</option>
                  {batchOptions.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
                <select value={reminderForm.channel} onChange={(e) => setReminderForm((f) => ({ ...f, channel: e.target.value }))} className={inputClass} aria-label="Channel">
                  {REMINDER_CHANNELS.map((c) => (
                    <option key={c} value={c}>{c === 'all' ? 'All channels' : c}</option>
                  ))}
                </select>
                <select value={reminderForm.template} onChange={(e) => setReminderForm((f) => ({ ...f, template: e.target.value }))} className={inputClass} aria-label="Template">
                  {REMINDER_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
                <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#246392] px-4 text-sm font-semibold text-white sm:col-span-2 lg:col-span-1">
                  <Send className="h-4 w-4" /> Send
                </button>
                {formErrors.contact && <p className="text-xs text-[#df8284] sm:col-span-2 lg:col-span-full">{formErrors.contact}</p>}
              </form>
            </section>
          )}

          <div className="rounded-xl bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
            <CommunicationFilters
              search={search}
              onSearchChange={setSearch}
              centerFilter={centerFilter}
              onCenterChange={setCenterFilter}
              centerOptions={centerOptions}
              courseFilter={courseFilter}
              onCourseChange={setCourseFilter}
              courseOptions={courseOptions}
              batchFilter={batchFilter}
              onBatchChange={setBatchFilter}
              batchOptions={batchOptions}
              channelFilter={channelFilter}
              onChannelChange={setChannelFilter}
              typeFilter={typeFilter}
              onTypeChange={setTypeFilter}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              followUpFilter={followUpFilter}
              onFollowUpChange={setFollowUpFilter}
              dateFrom={dateFrom}
              onDateFromChange={setDateFrom}
              dateTo={dateTo}
              onDateToChange={setDateTo}
              className="mb-4"
            />
            {loading ? (
              <FinanceTableSkeleton rows={6} columns={8} />
            ) : filtered.length === 0 ? (
              <FinanceEmptyState title="No communication logs" description="Sent reminders and automated messages will appear here." />
            ) : (
              <>
                <div className="hidden lg:block">
                  <PaginatedFigmaTable columns={activityColumns} data={filtered} itemLabel="logs" resetDeps={[filterState]} stickyHeader />
                </div>
                <div className="space-y-3 lg:hidden">
                  {filtered.map((row) => (
                    <CommunicationMobileCard key={row.id} row={row} actions={buildActions(row)} />
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {activeTab === 'templates' && (
        <div className="rounded-xl bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          <CommunicationTemplatesPanel
            templates={templates}
            canEdit={canEdit}
            onAdd={() => setTemplateDialog({})}
            onEdit={(t) => setTemplateDialog(t)}
            onDelete={(t) => setConfirmDelete({ type: 'template', id: t.id, name: t.name })}
          />
        </div>
      )}

      {activeTab === 'automation' && (
        <div className="rounded-xl bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          <CommunicationAutomationPanel
            rules={rules}
            canEdit={canEdit}
            selectedRule={automationLogsRule}
            onAdd={() => setAutomationDialog({})}
            onEdit={(r) => setAutomationDialog(r)}
            onDelete={(r) => setConfirmDelete({ type: 'rule', id: r.id, name: r.name })}
            onToggle={async (r) => {
              await toggleCommunicationAutomationRule(r.id, adminName)
              await load()
            }}
            onViewLogs={(r) => setAutomationLogsRule(automationLogsRule?.id === r.id ? null : r)}
          />
        </div>
      )}

      <CommunicationTimelineDrawer row={timelineRow} onClose={() => setTimelineRow(null)} />
      <CommunicationJourneyModal row={journeyRow} onClose={() => setJourneyRow(null)} />
      <CommunicationCounselorModal
        open={!!counselorRow || counselorBulk.length > 0}
        row={counselorRow}
        rows={counselorBulk}
        onClose={() => { setCounselorRow(null); setCounselorBulk([]) }}
        onAssign={handleAssignCounselor}
        saving={saving}
      />
      <CommunicationTemplateDialog
        open={!!templateDialog}
        template={templateDialog}
        onClose={() => setTemplateDialog(null)}
        onSave={handleSaveTemplate}
        onTestSend={async (payload) => {
          await testSendCommunicationTemplate({ ...payload, adminName, recipient: 'test@example.com' })
          toast.success('Test message queued')
          await load()
        }}
        saving={saving}
      />
      <CommunicationAutomationDialog
        open={!!automationDialog}
        rule={automationDialog}
        templates={templates}
        onClose={() => setAutomationDialog(null)}
        onSave={handleSaveRule}
        saving={saving}
      />
      <FinanceConfirmDialog
        open={confirmSend}
        title="Send payment reminder?"
        message={`Send reminder via ${reminderForm.channel === 'all' ? 'all channels' : reminderForm.channel}?`}
        confirmLabel="Send reminder"
        onConfirm={handleSendReminder}
        onCancel={() => setConfirmSend(false)}
      />
      <FinanceConfirmDialog
        open={!!confirmDelete}
        title={`Delete ${confirmDelete?.type}?`}
        message={`Remove "${confirmDelete?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete?.type === 'rule' ? handleDeleteRule : handleDeleteTemplate}
        onCancel={() => setConfirmDelete(null)}
      />
    </FinancePageShell>
  )
}
