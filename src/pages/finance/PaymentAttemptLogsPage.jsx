import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  History,
  Eye,
  RotateCcw,
  Clock,
  UserPlus,
  Shield,
} from 'lucide-react'
import FinancePageShell from '../../components/finance/FinancePageShell'
import FinanceCenterFilterBar from '../../components/finance/FinanceCenterFilterBar'
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
import PaymentAttemptFailureModal from '../../components/finance/payment-attempts/PaymentAttemptFailureModal'
import PaymentAttemptTimelineDrawer from '../../components/finance/payment-attempts/PaymentAttemptTimelineDrawer'
import PaymentAttemptCounselorModal from '../../components/finance/payment-attempts/PaymentAttemptCounselorModal'
import PaymentAttemptFraudModal from '../../components/finance/payment-attempts/PaymentAttemptFraudModal'
import {
  fetchPaymentAttemptAnalytics,
  assignPaymentAttemptCounselor,
  blockPaymentAttemptDevice,
  unblockPaymentAttemptDevice,
} from '../../api/financeAPI'
import { filterAttemptLogs, filterAttemptsByFinanceCenters, computeAttemptSummary } from '../../utils/paymentAttemptAnalytics'
import { PAYMENT_ATTEMPT_TABS, PAYMENT_ATTEMPT_EXPORT_COLUMNS } from '../../constants/paymentAttemptConstants'
import { formatINR } from '../../utils/financeFilters'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useFinancePermissions } from '../../hooks/useFinancePermissions'
import { useFinanceCenterFilter } from '../../contexts/FinanceCenterFilterContext'
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
        <div><dt className="text-[#686868]">Fraud</dt><dd><PaymentAttemptFraudBadge status={row.fraudStatus} riskScore={row.ipRiskScore} /></dd></div>
      </dl>
      <div className="mt-3 flex justify-end">{actions}</div>
    </article>
  )
}

export default function PaymentAttemptLogsPage() {
  const { canExport, canEdit } = useFinancePermissions()
  const financeCenterFilter = useFinanceCenterFilter()
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
  const [fraudFilter, setFraudFilter] = useState('all')
  const [fraudOnly, setFraudOnly] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [detailRow, setDetailRow] = useState(null)
  const [failureRow, setFailureRow] = useState(null)
  const [timelineRow, setTimelineRow] = useState(null)
  const [counselorRow, setCounselorRow] = useState(null)
  const [fraudRow, setFraudRow] = useState(null)
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
  const centerScopedLogs = useMemo(
    () => filterAttemptsByFinanceCenters(logs, financeCenterFilter),
    [logs, financeCenterFilter],
  )
  const summary = useMemo(
    () => (centerScopedLogs.length ? computeAttemptSummary(centerScopedLogs) : analytics?.summary ?? {}),
    [centerScopedLogs, analytics?.summary],
  )

  const filterState = useMemo(
    () => ({
      search: debouncedSearch,
      statusFilter,
      modeFilter,
      gatewayFilter,
      failureFilter,
      fraudFilter,
      fraudOnly,
      dateFrom,
      dateTo,
    }),
    [debouncedSearch, statusFilter, modeFilter, gatewayFilter, failureFilter, fraudFilter, fraudOnly, dateFrom, dateTo],
  )

  const filtered = useMemo(
    () => filterAttemptLogs(centerScopedLogs, filterState),
    [centerScopedLogs, filterState],
  )

  const buildActions = (row) => (
    <FinanceActionMenu
      actions={[
        { label: 'View failure details', icon: Eye, onClick: () => setFailureRow(row), show: row.status === 'Failed' },
        { label: 'View timeline', icon: Clock, onClick: () => setTimelineRow(row) },
        { label: 'Assign counselor', icon: UserPlus, onClick: () => setCounselorRow(row), show: row.status === 'Failed' },
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
    { key: 'counselorName', label: 'Counselor', render: (r) => r.counselorName || '—' },
    {
      key: 'fraudStatus',
      label: 'Device/IP',
      render: (r) => (
        <PaymentAttemptFraudBadge status={r.fraudStatus} riskScore={r.ipRiskScore} onClick={() => setFraudRow(r)} />
      ),
    },
    { key: 'dateTime', label: 'Last attempt', render: (r) => formatCategoryDateTime(r.lastAttemptDate || r.dateTime) },
    { key: 'actions', label: 'Action', render: (row) => buildActions(row) },
  ]

  const handleAssignCounselor = async (payload) => {
    setSaving(true)
    try {
      await assignPaymentAttemptCounselor(payload)
      toast.success('Counselor assigned')
      setCounselorRow(null)
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

  return (
    <FinancePageShell
      icon={History}
      title="Payment Attempt Logs"
      breadcrumbs={[{ label: 'Payment Attempt Logs' }]}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <FinanceExportToolbar
            rows={filtered}
            filenameBase={`payment-attempts-${activeTab}`}
            columnDefs={PAYMENT_ATTEMPT_EXPORT_COLUMNS}
            canExport={canExport}
            variant="banner"
          />
        </div>
      }
    >
      <FinanceCenterFilterBar className="mb-4" />

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
            {activeTab === tab.id && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#246392]" />}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <PaymentAttemptOverview summary={summary} loading={loading} />
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
            <FinanceTableSkeleton rows={8} columns={10} />
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

      <PaymentAttemptFailureModal open={!!failureRow} row={failureRow} onClose={() => setFailureRow(null)} />
      <PaymentAttemptTimelineDrawer open={!!timelineRow} row={timelineRow} onClose={() => setTimelineRow(null)} />
      <PaymentAttemptCounselorModal
        open={!!counselorRow}
        row={counselorRow}
        onClose={() => setCounselorRow(null)}
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
      {/* Legacy gateway response modal — preserved for quick raw view */}
      {detailRow && (
        <PaymentAttemptFailureModal open={!!detailRow} row={detailRow} onClose={() => setDetailRow(null)} />
      )}
    </FinancePageShell>
  )
}
