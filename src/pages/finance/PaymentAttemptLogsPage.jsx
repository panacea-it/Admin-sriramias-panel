import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  History,
  Eye,
  RotateCcw,
  Clock,
  UserPlus,
  Send,
  Shield,
  Bell,
  Copy,
} from 'lucide-react'
import FinancePageShell from '../../components/finance/FinancePageShell'
import FinanceStatusBadge from '../../components/finance/FinanceStatusBadge'
import FinanceSectionHeader from '../../components/finance/FinanceSectionHeader'
import FinanceTableSkeleton from '../../components/finance/FinanceTableSkeleton'
import FinanceEmptyState from '../../components/finance/FinanceEmptyState'
import FinanceActionMenu from '../../components/finance/FinanceActionMenu'
import FinanceExportToolbar from '../../components/finance/FinanceExportToolbar'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import PaymentAttemptOverview from '../../components/finance/payment-attempts/PaymentAttemptOverview'
import PaymentAttemptFilters from '../../components/finance/payment-attempts/PaymentAttemptFilters'
import PaymentAttemptFailureBadge from '../../components/finance/payment-attempts/PaymentAttemptFailureBadge'
import PaymentAttemptFraudBadge from '../../components/finance/payment-attempts/PaymentAttemptFraudBadge'
import PaymentAttemptRecoveryBadge from '../../components/finance/payment-attempts/PaymentAttemptRecoveryBadge'
import PaymentAttemptFailureModal from '../../components/finance/payment-attempts/PaymentAttemptFailureModal'
import PaymentAttemptTimelineDrawer from '../../components/finance/payment-attempts/PaymentAttemptTimelineDrawer'
import PaymentAttemptCounselorModal from '../../components/finance/payment-attempts/PaymentAttemptCounselorModal'
import PaymentAttemptFraudModal from '../../components/finance/payment-attempts/PaymentAttemptFraudModal'
import PaymentAttemptRecoveryMessageModal from '../../components/finance/payment-attempts/PaymentAttemptRecoveryMessageModal'
import PaymentAttemptAlertsPanel from '../../components/finance/payment-attempts/PaymentAttemptAlertsPanel'
import { RecoveryHeatmapChart } from '../../components/finance/payment-attempts/PaymentAttemptCharts'
import FinanceChartContainer from '../../components/finance/FinanceChartContainer'
import {
  fetchPaymentAttemptAnalytics,
  assignPaymentAttemptCounselor,
  blockPaymentAttemptDevice,
  unblockPaymentAttemptDevice,
  sendPaymentAttemptRecoveryMessage,
  markPaymentAttemptAlertRead,
} from '../../api/financeAPI'
import { filterAttemptLogs } from '../../utils/paymentAttemptAnalytics'
import { PAYMENT_ATTEMPT_TABS, PAYMENT_ATTEMPT_EXPORT_COLUMNS } from '../../constants/paymentAttemptConstants'
import { formatINR } from '../../utils/financeFilters'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useFinancePermissions } from '../../hooks/useFinancePermissions'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

function ContactCell({ row }) {
  return (
    <div className="min-w-[120px] text-xs">
      <p className="font-medium text-[#222]">{row.mobile || '—'}</p>
      <p className="truncate text-[#686868]" title={row.email}>{row.email || '—'}</p>
    </div>
  )
}

function AttemptMobileCard({ row, actions }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-[#246392]">{row.attemptId || row.id}</p>
          <p className="font-semibold text-[#222]">{row.student}</p>
          <ContactCell row={row} />
        </div>
        <FinanceStatusBadge status={row.status} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div><dt className="text-[#686868]">Amount</dt><dd className="font-semibold">{formatINR(row.amount)}</dd></div>
        <div><dt className="text-[#686868]">Retries</dt><dd>{row.retryCount}</dd></div>
        <div className="col-span-2"><dt className="text-[#686868]">Failure</dt><dd><PaymentAttemptFailureBadge category={row.failureCategory} /></dd></div>
        <div><dt className="text-[#686868]">Recovery</dt><dd><PaymentAttemptRecoveryBadge status={row.recoveryStatus} /></dd></div>
        <div><dt className="text-[#686868]">Fraud</dt><dd><PaymentAttemptFraudBadge status={row.fraudStatus} riskScore={row.ipRiskScore} /></dd></div>
      </dl>
      <div className="mt-3 flex justify-end">{actions}</div>
    </article>
  )
}

export default function PaymentAttemptLogsPage() {
  const { canExport, canEdit } = useFinancePermissions()
  const { user } = useAuth()
  const adminName = user?.name || user?.email || 'Finance Admin'

  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [statusFilter, setStatusFilter] = useState('all')
  const [modeFilter, setModeFilter] = useState('all')
  const [gatewayFilter, setGatewayFilter] = useState('all')
  const [failureFilter, setFailureFilter] = useState('all')
  const [recoveryFilter, setRecoveryFilter] = useState('all')
  const [fraudFilter, setFraudFilter] = useState('all')
  const [fraudOnly, setFraudOnly] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [detailRow, setDetailRow] = useState(null)
  const [failureRow, setFailureRow] = useState(null)
  const [timelineRow, setTimelineRow] = useState(null)
  const [counselorRow, setCounselorRow] = useState(null)
  const [counselorBulk, setCounselorBulk] = useState([])
  const [fraudRow, setFraudRow] = useState(null)
  const [messageRow, setMessageRow] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setAnalytics(await fetchPaymentAttemptAnalytics())
    } catch {
      toast.error('Failed to load attempt logs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const logs = analytics?.logs ?? []
  const abandoned = analytics?.abandoned ?? []
  const retryRows = analytics?.retryRows ?? []
  const recovery = analytics?.recovery ?? {}
  const summary = analytics?.summary ?? {}
  const alerts = analytics?.alerts ?? []

  const filterState = useMemo(
    () => ({
      search: debouncedSearch,
      statusFilter,
      modeFilter,
      gatewayFilter,
      failureFilter,
      recoveryFilter,
      fraudFilter,
      fraudOnly,
      dateFrom,
      dateTo,
    }),
    [debouncedSearch, statusFilter, modeFilter, gatewayFilter, failureFilter, recoveryFilter, fraudFilter, fraudOnly, dateFrom, dateTo],
  )

  const filtered = useMemo(() => filterAttemptLogs(logs, filterState), [logs, filterState])

  const buildActions = (row) => (
    <FinanceActionMenu
      actions={[
        { label: 'View failure details', icon: Eye, onClick: () => setFailureRow(row), show: row.status === 'Failed' },
        { label: 'View timeline', icon: Clock, onClick: () => setTimelineRow(row) },
        { label: 'Assign counselor', icon: UserPlus, onClick: () => setCounselorRow(row), show: row.status === 'Failed' },
        { label: 'Send recovery message', icon: Send, onClick: () => setMessageRow(row), show: row.status === 'Failed' || row.recoveryStatus === 'Not Recovered' },
        { label: 'Device / IP details', icon: Shield, onClick: () => setFraudRow(row) },
        {
          label: 'Retry payment',
          icon: RotateCcw,
          onClick: () => toast.success('Retry queued (UI placeholder — awaiting gateway API)'),
          show: row.status === 'Failed',
          variant: 'accent',
        },
      ]}
    />
  )

  const attemptColumns = [
    {
      key: 'select',
      label: '',
      render: (r) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(r.id)}
          onChange={(e) => {
            setSelectedIds((prev) => (e.target.checked ? [...prev, r.id] : prev.filter((id) => id !== r.id)))
          }}
          aria-label={`Select ${r.id}`}
        />
      ),
    },
    { key: 'id', label: 'Attempt ID', render: (r) => <span className="font-mono text-xs">{r.attemptId || r.id}</span> },
    { key: 'student', label: 'Student', render: (r) => <span className="font-medium">{r.student}</span> },
    { key: 'contact', label: 'Contact', render: (r) => <ContactCell row={r} /> },
    { key: 'course', label: 'Course', render: (r) => <span className="max-w-[140px] truncate" title={r.course}>{r.course}</span> },
    { key: 'amount', label: 'Amount', render: (r) => formatINR(r.amount) },
    {
      key: 'failureCategory',
      label: 'Failure reason',
      render: (r) => (
        <PaymentAttemptFailureBadge
          category={r.failureCategory}
          rawMessage={r.gatewayMessage}
          onClick={r.failureCategory ? () => setFailureRow(r) : undefined}
        />
      ),
    },
    { key: 'retryCount', label: 'Retries', render: (r) => r.retryCount ?? 0 },
    { key: 'recoveryStatus', label: 'Recovery', render: (r) => <PaymentAttemptRecoveryBadge status={r.recoveryStatus} /> },
    { key: 'counselorName', label: 'Counselor', render: (r) => r.counselorName || '—' },
    {
      key: 'fraudStatus',
      label: 'Device/IP',
      render: (r) => (
        <PaymentAttemptFraudBadge status={r.fraudStatus} riskScore={r.ipRiskScore} onClick={() => setFraudRow(r)} />
      ),
    },
    { key: 'dateTime', label: 'Last attempt', render: (r) => formatCategoryDateTime(r.lastAttemptDate || r.dateTime) },
    { key: 'actions', label: '', render: (row) => buildActions(row) },
  ]

  const retryColumns = [
    { key: 'studentName', label: 'Student Name', render: (r) => <span className="font-medium">{r.studentName}</span> },
    { key: 'mobile', label: 'Phone', render: (r) => r.mobile || '—' },
    { key: 'email', label: 'Email', render: (r) => <span className="max-w-[160px] truncate" title={r.email}>{r.email || '—'}</span> },
    { key: 'failedAttempts', label: 'Failed Attempts' },
    { key: 'retryCount', label: 'Retry Count' },
    {
      key: 'successfulRetry',
      label: 'Successful Retry',
      render: (r) => (r.successfulRetry ? <FinanceStatusBadge status="Success" /> : <FinanceStatusBadge status="Failed" />),
    },
    { key: 'retrySuccessPct', label: 'Conversion %', render: (r) => `${r.retrySuccessPct ?? 0}%` },
    { key: 'lastRetryDate', label: 'Last Retry', render: (r) => formatCategoryDateTime(r.lastRetryDate) },
    { key: 'counselorAssigned', label: 'Counselor', render: (r) => r.counselorAssigned || '—' },
    { key: 'primaryRetrySource', label: 'Retry source', render: (r) => r.primaryRetrySource || '—' },
  ]

  const abandonedColumns = [
    { key: 'student', label: 'Student', render: (r) => <span className="font-medium">{r.student}</span> },
    { key: 'contact', label: 'Contact', render: (r) => <ContactCell row={r} /> },
    { key: 'course', label: 'Course' },
    { key: 'amount', label: 'Amount', render: (r) => formatINR(r.amount) },
    { key: 'stage', label: 'Stage abandoned' },
    { key: 'timeSpentLabel', label: 'Time before exit' },
    { key: 'recoveryStatus', label: 'Recovery', render: (r) => <FinanceStatusBadge status={r.recoveryStatus} /> },
    { key: 'campaignTag', label: 'Campaign' },
    {
      key: 'resume',
      label: 'Resume link',
      render: (r) => (
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#246392] hover:underline"
          onClick={() => {
            navigator.clipboard?.writeText(r.resumePaymentLink)
            toast.success('Resume link copied')
          }}
        >
          <Copy className="h-3.5 w-3.5" /> Copy
        </button>
      ),
    },
  ]

  const recoveryColumns = [
    { key: 'student', label: 'Student' },
    { key: 'amount', label: 'Amount', render: (r) => formatINR(r.amount) },
    { key: 'recoverySource', label: 'Recovery source' },
    { key: 'recoveryTime', label: 'Recovery time' },
    { key: 'retryCount', label: 'Retries before success' },
    { key: 'counselorName', label: 'Counselor' },
    {
      key: 'influence',
      label: 'Influence',
      render: (r) => (
        <span className="text-xs">
          {r.counselorInfluence && 'Counselor '}
          {r.reminderInfluence && 'Reminder'}
          {!r.counselorInfluence && !r.reminderInfluence && '—'}
        </span>
      ),
    },
    { key: 'dateTime', label: 'Recovered at', render: (r) => formatCategoryDateTime(r.dateTime) },
  ]

  const handleAssignCounselor = async (payload) => {
    setSaving(true)
    try {
      await assignPaymentAttemptCounselor(payload)
      toast.success('Counselor assigned')
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

  const handleBlock = async (row) => {
    setSaving(true)
    try {
      await blockPaymentAttemptDevice({ attemptId: row.id, adminName })
      toast.success('Device/IP blocked')
      setFraudRow(null)
      await load()
    } catch {
      toast.error('Block action failed')
    } finally {
      setSaving(false)
    }
  }

  const handleUnblock = async (row) => {
    setSaving(true)
    try {
      await unblockPaymentAttemptDevice({ attemptId: row.id, adminName })
      toast.success('Device/IP unblocked')
      setFraudRow(null)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const handleSendMessage = async (payload) => {
    setSaving(true)
    try {
      await sendPaymentAttemptRecoveryMessage({ ...payload, mobile: messageRow?.mobile, email: messageRow?.email })
      toast.success('Recovery message queued')
      setMessageRow(null)
      await load()
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSaving(false)
    }
  }

  const handleMarkAlertRead = async (alertId) => {
    await markPaymentAttemptAlertRead(alertId)
    await load()
  }

  const exportRows = activeTab === 'retry' ? retryRows : activeTab === 'abandoned' ? abandoned : activeTab === 'recovery' ? (recovery.recoveredRows || []) : filtered

  return (
    <FinancePageShell
      icon={History}
      title="Payment Attempt Logs"
      breadcrumbs={[{ label: 'Payment Attempt Logs' }]}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && activeTab === 'attempts' && (
            <button
              type="button"
              onClick={() => setCounselorBulk(filtered.filter((r) => selectedIds.includes(r.id)))}
              className="rounded-lg bg-[#246392] px-3 py-2 text-sm font-semibold text-white"
            >
              Bulk assign ({selectedIds.length})
            </button>
          )}
          <FinanceExportToolbar
            rows={exportRows}
            filenameBase={`payment-attempts-${activeTab}`}
            columnDefs={PAYMENT_ATTEMPT_EXPORT_COLUMNS}
            canExport={canExport}
            variant="banner"
          />
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
        {PAYMENT_ATTEMPT_TABS.map((tab) => (
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
            {tab.id === 'alerts' && alerts.filter((a) => !a.read).length > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#df8284] px-1 text-[10px] font-bold text-white">
                {alerts.filter((a) => !a.read).length}
              </span>
            )}
            {activeTab === tab.id && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#246392]" />}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <PaymentAttemptOverview summary={summary} recovery={recovery} retryRows={retryRows} loading={loading} />
      )}

      {activeTab === 'attempts' && (
        <>
          <div className="rounded-xl bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
            <PaymentAttemptFilters
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              modeFilter={modeFilter}
              onModeChange={setModeFilter}
              gatewayFilter={gatewayFilter}
              onGatewayChange={setGatewayFilter}
              failureFilter={failureFilter}
              onFailureChange={setFailureFilter}
              recoveryFilter={recoveryFilter}
              onRecoveryChange={setRecoveryFilter}
              fraudFilter={fraudFilter}
              onFraudChange={setFraudFilter}
              fraudOnly={fraudOnly}
              onFraudOnlyChange={setFraudOnly}
              dateFrom={dateFrom}
              onDateFromChange={setDateFrom}
              dateTo={dateTo}
              onDateToChange={setDateTo}
            />
          </div>
          <FinanceSectionHeader title="Gateway attempt log" subtitle={`${filtered.length} records`} />
          {loading ? (
            <FinanceTableSkeleton rows={8} columns={12} />
          ) : filtered.length === 0 ? (
            <FinanceEmptyState title="No attempt logs" description="Payment gateway attempts will appear here." />
          ) : (
            <>
              <div className="hidden lg:block">
                <PaginatedFigmaTable
                  columns={attemptColumns}
                  data={filtered}
                  itemLabel="attempts"
                  resetDeps={[filterState]}
                  tableClassName="overflow-x-auto"
                  stickyHeader
                />
              </div>
              <div className="space-y-3 lg:hidden">
                {filtered.map((row) => (
                  <AttemptMobileCard key={row.id} row={row} actions={buildActions(row)} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'retry' && (
        <>
          <FinanceSectionHeader
            title="Retry conversion analytics"
            subtitle={`${retryRows.length} students · ${retryRows.filter((r) => r.successfulRetry).length} converted`}
          />
          {loading ? (
            <FinanceTableSkeleton rows={6} columns={9} />
          ) : retryRows.length === 0 ? (
            <FinanceEmptyState title="No retry data" description="Retry analytics appear when students retry failed payments." />
          ) : (
            <PaginatedFigmaTable columns={retryColumns} data={retryRows} itemLabel="students" stickyHeader tableClassName="overflow-x-auto" />
          )}
        </>
      )}

      {activeTab === 'abandoned' && (
        <>
          <FinanceSectionHeader title="Abandoned checkout tracking" subtitle={`${abandoned.length} sessions`} />
          {loading ? (
            <FinanceTableSkeleton rows={6} columns={8} />
          ) : abandoned.length === 0 ? (
            <FinanceEmptyState title="No abandoned checkouts" description="Incomplete payment sessions will appear here." />
          ) : (
            <PaginatedFigmaTable columns={abandonedColumns} data={abandoned} itemLabel="sessions" stickyHeader tableClassName="overflow-x-auto" />
          )}
        </>
      )}

      {activeTab === 'recovery' && (
        <>
          <FinanceChartContainer className="mb-4 lg:grid-cols-2">
            <RecoveryHeatmapChart trend={recovery.trend} />
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1a3a5c]">
                <Bell className="h-4 w-4" /> Recovered payments
              </h3>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div><dt className="text-[#686868]">Recovery rate</dt><dd className="text-xl font-bold text-[#246392]">{recovery.recoveryPct ?? 0}%</dd></div>
                <div><dt className="text-[#686868]">Revenue recovered</dt><dd className="text-xl font-bold text-[#69df66]">{formatINR(recovery.revenueRecovered ?? 0)}</dd></div>
              </dl>
            </div>
          </FinanceChartContainer>
          <FinanceSectionHeader title="Recovered payment records" subtitle={`${(recovery.recoveredRows || []).length} recoveries`} />
          {(recovery.recoveredRows || []).length === 0 ? (
            <FinanceEmptyState title="No recoveries yet" description="Recovered payments will be tracked here." />
          ) : (
            <PaginatedFigmaTable
              columns={recoveryColumns}
              data={recovery.recoveredRows}
              itemLabel="recoveries"
              stickyHeader
              tableClassName="overflow-x-auto"
            />
          )}
        </>
      )}

      {activeTab === 'alerts' && (
        <>
          <FinanceSectionHeader title="Notifications & alerts" subtitle="Failed attempts, fraud, recoveries" />
          <PaymentAttemptAlertsPanel
            alerts={alerts}
            onMarkRead={handleMarkAlertRead}
            onSelectAlert={(alert) => {
              const row = logs.find((l) => l.id === alert.rowId)
              if (row) {
                setActiveTab('attempts')
                setFailureRow(row)
              }
            }}
          />
        </>
      )}

      <PaymentAttemptFailureModal open={!!failureRow} row={failureRow} onClose={() => setFailureRow(null)} />
      <PaymentAttemptTimelineDrawer open={!!timelineRow} row={timelineRow} onClose={() => setTimelineRow(null)} />
      <PaymentAttemptCounselorModal
        open={!!counselorRow || counselorBulk.length > 0}
        row={counselorRow}
        rows={counselorBulk}
        onClose={() => { setCounselorRow(null); setCounselorBulk([]) }}
        onAssign={handleAssignCounselor}
        saving={saving}
      />
      <PaymentAttemptFraudModal
        open={!!fraudRow}
        row={fraudRow}
        onClose={() => setFraudRow(null)}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        canBlock={canEdit}
        saving={saving}
      />
      <PaymentAttemptRecoveryMessageModal
        open={!!messageRow}
        row={messageRow}
        onClose={() => setMessageRow(null)}
        onSend={handleSendMessage}
        saving={saving}
      />

      {/* Legacy gateway response modal — preserved for quick raw view */}
      {detailRow && (
        <PaymentAttemptFailureModal open={!!detailRow} row={detailRow} onClose={() => setDetailRow(null)} />
      )}
    </FinancePageShell>
  )
}
