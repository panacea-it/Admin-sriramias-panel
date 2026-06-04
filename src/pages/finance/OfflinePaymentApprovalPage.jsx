import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Banknote,
  Bell,
  Check,
  Clock,
  Eye,
  History,
  ShieldAlert,
  X,
} from 'lucide-react'
import FinancePageShell from '../../components/finance/FinancePageShell'
import FinanceStatCard from '../../components/finance/FinanceStatCard'
import FinanceStatusBadge from '../../components/finance/FinanceStatusBadge'
import FinanceFilterPanel from '../../components/finance/FinanceFilterPanel'
import FinanceExportToolbar from '../../components/finance/FinanceExportToolbar'
import FinanceActionMenu from '../../components/finance/FinanceActionMenu'
import FinanceConfirmDialog from '../../components/finance/FinanceConfirmDialog'
import FinanceInfoBanner from '../../components/finance/FinanceInfoBanner'
import FinanceTableSkeleton from '../../components/finance/FinanceTableSkeleton'
import FinanceEmptyState from '../../components/finance/FinanceEmptyState'
import VerificationRejectDialog from '../../components/finance/VerificationRejectDialog'
import VerificationDuplicateDialog from '../../components/finance/VerificationDuplicateDialog'
import ProofViewerModal, { ProofThumbnail } from '../../components/finance/ProofViewerModal'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import OfflineBranchBadge from '../../components/finance/offline-approval/OfflineBranchBadge'
import OfflineBranchAccessDialog from '../../components/finance/offline-approval/OfflineBranchAccessDialog'
import OfflineDuplicateBadge from '../../components/finance/offline-approval/OfflineDuplicateBadge'
import OfflineReconciliationCards, {
  OfflineReconciliationBadge,
} from '../../components/finance/offline-approval/OfflineReconciliationCards'
import OfflineDailySummaryPanel from '../../components/finance/offline-approval/OfflineDailySummaryPanel'
import OfflineAuditHistoryModal from '../../components/finance/offline-approval/OfflineAuditHistoryModal'
import OfflineWorkflowTracker, {
  OfflineWorkflowChip,
} from '../../components/finance/offline-approval/OfflineWorkflowTracker'
import OfflineNotificationsPanel from '../../components/finance/offline-approval/OfflineNotificationsPanel'
import OfflineApprovalProofModal from '../../components/finance/offline-approval/OfflineApprovalProofModal'
import OfflineApprovalMobileCard from '../../components/finance/offline-approval/OfflineApprovalMobileCard'
import {
  fetchOfflineApprovals,
  approveOfflinePayment,
  fetchOfflineDailySummary,
  fetchOfflineNotifications,
  markOfflineNotificationRead,
  uploadOfflineProof,
  overrideOfflineDuplicate,
} from '../../api/financeAPI'
import {
  FINANCE_OFFLINE_STATUSES,
  FINANCE_PAYMENT_MODES,
} from '../../constants/financeConstants'
import {
  OFFLINE_BRANCH_CODES,
  OFFLINE_TABLE_EXPORT_COLUMNS,
  OFFLINE_WORKFLOW_STATUSES,
} from '../../constants/offlinePaymentApproval'
import { formatINR } from '../../utils/financeFilters'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import {
  canApproveOfflineRow,
  evaluateBranchAccess,
} from '../../utils/offlinePaymentApproval'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useFinancePermissions } from '../../hooks/useFinancePermissions'
import { useFinanceOperations } from '../../contexts/FinanceOperationsContext'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

function adminDisplayName(user) {
  return user?.name || user?.email || 'Finance Admin'
}

function isPendingRow(row) {
  const st = row.workflowStatus || row.status
  return ['Pending', 'Under Verification', 'Pending Approval', 'Uploaded', 'Reconciliation Pending'].includes(st)
}

function exportSummaryCsv(summary, rows) {
  const header = ['Metric', 'Value']
  const lines = [
    header.join(','),
    ['Total offline', summary.totalOffline].join(','),
    ['Approved collections', summary.totalCollections].join(','),
    ['Cash', summary.cashCollections].join(','),
    ['Bank', summary.bankCollections].join(','),
    ['Cheque', summary.chequeCollections].join(','),
    ['Pending approvals', summary.pendingApprovals].join(','),
    ['Rejected', summary.rejectedPayments].join(','),
    '',
    OFFLINE_TABLE_EXPORT_COLUMNS.map((c) => c.label).join(','),
    ...rows.map((r) =>
      OFFLINE_TABLE_EXPORT_COLUMNS.map((c) => {
        const v = r[c.key]
        return `"${String(v ?? '').replace(/"/g, '""')}"`
      }).join(','),
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `offline-summary-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function OfflinePaymentApprovalPage() {
  const { user } = useAuth()
  const { canApprove, canExport, canFinanceHeadApprove } = useFinancePermissions()
  const { bumpRefresh, goToFinance } = useFinanceOperations()

  const [requests, setRequests] = useState([])
  const [summary, setSummary] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [statusFilter, setStatusFilter] = useState('Pending Approval')
  const [branchFilter, setBranchFilter] = useState('all')
  const [modeFilter, setModeFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [auditFilterUser, setAuditFilterUser] = useState('')
  const [auditFilterAction, setAuditFilterAction] = useState('all')

  const [proofRow, setProofRow] = useState(null)
  const [proofModalRow, setProofModalRow] = useState(null)
  const [approveRow, setApproveRow] = useState(null)
  const [rejectRow, setRejectRow] = useState(null)
  const [duplicateRow, setDuplicateRow] = useState(null)
  const [auditRow, setAuditRow] = useState(null)
  const [branchBlockRow, setBranchBlockRow] = useState(null)
  const [branchBlockAccess, setBranchBlockAccess] = useState(null)
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const filterParams = useMemo(
    () => ({
      branch: branchFilter,
      paymentMode: modeFilter,
      status: statusFilter,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [branchFilter, modeFilter, statusFilter, dateFrom, dateTo],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rows, sum, notifs] = await Promise.all([
        fetchOfflineApprovals(filterParams),
        fetchOfflineDailySummary(filterParams),
        fetchOfflineNotifications(),
      ])
      setRequests(rows)
      setSummary(sum)
      setNotifications(notifs)
    } catch {
      toast.error('Failed to load offline requests')
    } finally {
      setLoading(false)
    }
  }, [filterParams])

  useEffect(() => {
    load()
  }, [load])

  const getRowAccess = useCallback(
    (row) =>
      evaluateBranchAccess(row, {
        user,
        role: user?.role,
        canFinanceHeadApprove,
      }),
    [user, canFinanceHeadApprove],
  )

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return requests.filter((row) => {
      if (!q) return true
      return `${row.studentName} ${row.course} ${row.id} ${row.utrNumber} ${row.receiptNumber} ${row.branchCode}`
        .toLowerCase()
        .includes(q)
    })
  }, [requests, debouncedSearch])

  const pendingCount = requests.filter(isPendingRow).length
  const unreadNotifications = notifications.filter((n) => !n.read).length

  const tryApprove = (row, override = false) => {
    const access = getRowAccess(row)
    const check = canApproveOfflineRow(row, access, { canApprove, canFinanceHeadApprove })
    if (!check.ok && !override) {
      if (!access.canAct) {
        setBranchBlockRow(row)
        setBranchBlockAccess(access)
        return
      }
      toast.error(check.reason)
      return
    }
    setApproveRow(row)
  }

  const handleDecision = async (row, approved, payload = {}) => {
    if (!canApprove) {
      toast.error('Not permitted')
      return
    }
    const access = getRowAccess(row)
    setActionLoading(true)
    try {
      await approveOfflinePayment(row.id, {
        newStatus: approved ? 'Approved' : 'Rejected',
        comment: approved ? payload.comment || 'Proof verified' : payload.comment,
        reason: payload.reason,
        adminName: adminDisplayName(user),
        forceOverride: access.status === 'Override Approved' || canFinanceHeadApprove,
        financeHeadOverride: canFinanceHeadApprove,
        overrideDuplicate: row.duplicateOverride,
      })
      toast.success(approved ? 'Payment approved' : 'Request rejected')
      setApproveRow(null)
      setRejectRow(null)
      setProofModalRow(null)
      load()
      bumpRefresh()
    } catch (err) {
      toast.error(err?.message || 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleProofUpload = async (row, files) => {
    setActionLoading(true)
    try {
      await uploadOfflineProof(row.id, files, { adminName: adminDisplayName(user) })
      toast.success('Receipt uploaded')
      load()
    } catch {
      toast.error('Upload failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDuplicateOverride = async (row) => {
    setActionLoading(true)
    try {
      await overrideOfflineDuplicate(row.id, {
        adminName: adminDisplayName(user),
        comment: 'Finance Head duplicate override',
      })
      toast.success('Duplicate override saved')
      setDuplicateModalOpen(false)
      setDuplicateRow(null)
      load()
    } catch {
      toast.error('Override failed')
    } finally {
      setActionLoading(false)
    }
  }

  const rowActions = (row) => {
    const access = getRowAccess(row)
    const pending = isPendingRow(row)
    const check = canApproveOfflineRow(row, access, { canApprove, canFinanceHeadApprove })
    const actions = [
      { label: 'Preview & verify', icon: Eye, onClick: () => setProofModalRow(row) },
      { label: 'View proof', icon: Eye, onClick: () => setProofRow(row) },
      { label: 'Audit history', icon: History, onClick: () => setAuditRow(row) },
    ]
    if (row.isDuplicate) {
      actions.push({
        label: 'Review duplicate',
        icon: ShieldAlert,
        onClick: () => {
          setDuplicateRow(row)
          setDuplicateModalOpen(true)
        },
      })
    }
    if (pending && canApprove) {
      actions.push(
        {
          label: check.ok ? 'Approve' : 'Approve (restricted)',
          icon: Check,
          onClick: () => tryApprove(row),
          disabled: !check.ok && !canFinanceHeadApprove,
        },
        { label: 'Reject', icon: X, onClick: () => setRejectRow(row), variant: 'danger' },
      )
    }
    return actions
  }

  const columns = [
    {
      key: 'id',
      label: 'Payment ID',
      render: (r) => (
        <span className="font-mono text-xs">{r.id}</span>
      ),
    },
    {
      key: 'studentName',
      label: 'Student Name',
      render: (r) => <span className="font-medium">{r.studentName}</span>,
    },
    {
      key: 'branchCode',
      label: 'Branch',
      render: (r) => {
        const access = getRowAccess(r)
        return (
          <OfflineBranchBadge
            branchCode={r.branchCode}
            accessStatus={access.status}
            showAccess={!access.canAct || access.status !== 'Allowed'}
          />
        )
      },
    },
    { key: 'paymentMode', label: 'Payment Mode' },
    {
      key: 'receiptNumber',
      label: 'Receipt Number',
      render: (r) => (
        <span className="font-mono text-xs">{r.receiptNumber || r.utrNumber || '—'}</span>
      ),
    },
    {
      key: 'proof',
      label: 'Uploaded Proof',
      render: (r) =>
        r.proofFiles?.[0] ? (
          <ProofThumbnail proof={r.proofFiles[0]} onClick={() => setProofModalRow(r)} />
        ) : r.paymentProof ? (
          <button
            type="button"
            onClick={() => setProofModalRow(r)}
            className="text-xs font-semibold text-[#246392] hover:underline"
          >
            {r.paymentProof.split(',')[0]}
          </button>
        ) : (
          <span className="text-xs font-semibold text-[#df8284]">Required</span>
        ),
    },
    {
      key: 'status',
      label: 'Approval Status',
      render: (r) => (
        <div className="flex flex-col gap-1">
          <FinanceStatusBadge status={r.status} />
          <OfflineWorkflowChip status={r.workflowStatus || r.status} />
        </div>
      ),
    },
    {
      key: 'reconciliationStatus',
      label: 'Reconciliation',
      render: (r) => <OfflineReconciliationBadge status={r.reconciliationStatus} />,
    },
    {
      key: 'duplicateStatus',
      label: 'Duplicate',
      render: (r) => (
        <OfflineDuplicateBadge
          status={r.duplicateStatus}
          onClick={
            r.isDuplicate
              ? () => {
                  setDuplicateRow(r)
                  setDuplicateModalOpen(true)
                }
              : undefined
          }
        />
      ),
    },
    {
      key: 'approvedBy',
      label: 'Approved By',
      render: (r) => <span className="text-xs">{r.approvedBy || '—'}</span>,
    },
    {
      key: 'updatedAt',
      label: 'Updated On',
      render: (r) => formatCategoryDateTime(r.updatedAt || r.requestedDate),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (r) => formatINR(r.amount),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => {
        const suspicious = row.isDuplicate || row.reconciliationStatus === 'Mismatch Detected'
        return (
          <div className={cn(suspicious && 'rounded-lg ring-1 ring-amber-200')}>
            <FinanceActionMenu actions={rowActions(row)} />
          </div>
        )
      },
    },
  ]

  const allAuditLogs = useMemo(
    () => requests.flatMap((r) => (r.auditTrail || []).map((a) => ({ ...a, paymentId: r.id }))),
    [requests],
  )

  return (
    <FinancePageShell
      icon={Banknote}
      title="Offline Payment Approval"
      breadcrumbs={[{ label: 'Offline Payment Approval' }]}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNotifications((v) => !v)}
            className="relative inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#444] hover:bg-slate-50"
          >
            <Bell className="h-4 w-4" />
            Alerts
            {unreadNotifications > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#df8284] px-1 text-[10px] font-bold text-white">
                {unreadNotifications}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setAuditRow({ id: 'ALL' })}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#444] hover:bg-slate-50"
          >
            <History className="h-4 w-4" /> Audit log
          </button>
          <FinanceExportToolbar
            rows={filtered}
            filenameBase="offline-approvals"
            columnDefs={OFFLINE_TABLE_EXPORT_COLUMNS}
            canExport={canExport}
            variant="banner"
          />
        </div>
      }
    >
      <FinanceInfoBanner
        title="How this differs from Verification Center"
        message="This page handles pre-submitted offline payment requests awaiting approval. To enter a new offline payment with EMI setup, use Payment Verification Center → Add Offline Payment."
        actionLabel="Add Offline Payment"
        onAction={() => goToFinance('verification', { addOffline: '1' })}
      />

      {showNotifications && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-[#222]">Notification logs</h2>
          <OfflineNotificationsPanel
            notifications={notifications}
            onMarkRead={async (id) => {
              await markOfflineNotificationRead(id)
              load()
            }}
          />
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FinanceStatCard label="Pending approval" value={pendingCount} icon={Banknote} />
        <FinanceStatCard label="Total requests" value={requests.length} icon={Clock} />
        <FinanceStatCard
          label="Approved"
          value={requests.filter((r) => r.status === 'Approved').length}
          accent="from-[#69df66] to-[#55ace7]"
        />
        <FinanceStatCard
          label="Mismatch / duplicate flags"
          value={
            requests.filter(
              (r) => r.reconciliationStatus === 'Mismatch Detected' || r.isDuplicate,
            ).length
          }
          accent="from-[#df8284] to-[#b94b4b]"
        />
      </div>

      <OfflineReconciliationCards summary={summary} />

      <OfflineDailySummaryPanel
        summary={summary}
        onExport={() => summary && exportSummaryCsv(summary, filtered)}
      />

      <FinanceFilterPanel
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        searchPlaceholder="Search student, receipt, UTR, payment ID…"
        dateFrom={dateFrom}
        onDateFromChange={(e) => setDateFrom(e.target.value)}
        dateTo={dateTo}
        onDateToChange={(e) => setDateTo(e.target.value)}
        selects={[
          {
            key: 'status',
            label: 'Approval status',
            value: statusFilter,
            onChange: (e) => setStatusFilter(e.target.value),
            options: [
              { value: 'all', label: 'All statuses' },
              ...FINANCE_OFFLINE_STATUSES.map((s) => ({ value: s, label: s })),
              ...OFFLINE_WORKFLOW_STATUSES.filter((s) => !FINANCE_OFFLINE_STATUSES.includes(s)).map((s) => ({
                value: s,
                label: s,
              })),
            ],
          },
          {
            key: 'branch',
            label: 'Branch',
            value: branchFilter,
            onChange: (e) => setBranchFilter(e.target.value),
            options: [
              { value: 'all', label: 'All branches' },
              ...OFFLINE_BRANCH_CODES.map((b) => ({ value: b, label: b })),
            ],
          },
          {
            key: 'mode',
            label: 'Payment mode',
            value: modeFilter,
            onChange: (e) => setModeFilter(e.target.value),
            options: [
              { value: 'all', label: 'All modes' },
              ...FINANCE_PAYMENT_MODES.map((m) => ({ value: m, label: m })),
            ],
          },
        ]}
        onReset={() => {
          setSearch('')
          setStatusFilter('Pending Approval')
          setBranchFilter('all')
          setModeFilter('all')
          setDateFrom('')
          setDateTo('')
        }}
      />

      {loading ? (
        <FinanceTableSkeleton rows={6} columns={10} />
      ) : filtered.length === 0 ? (
        <FinanceEmptyState
          title="No offline requests"
          description="Pending offline payment approvals will appear here."
          ctaLabel="Add Offline Payment"
          onCta={() => goToFinance('verification', { addOffline: '1' })}
        />
      ) : (
        <>
          <div className="hidden lg:block">
            <PaginatedFigmaTable
              columns={columns}
              data={filtered}
              itemLabel="requests"
              resetDeps={[debouncedSearch, statusFilter, branchFilter, modeFilter, dateFrom, dateTo]}
              tableClassName="overflow-x-auto [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead]:bg-white"
              rowClassName={(r) =>
                cn(
                  (r.isDuplicate || r.reconciliationStatus === 'Mismatch Detected') &&
                    'bg-amber-50/40',
                )
              }
            />
          </div>
          <div className="space-y-3 lg:hidden">
            {filtered.map((row) => (
              <OfflineApprovalMobileCard
                key={row.id}
                row={row}
                access={getRowAccess(row)}
                actions={rowActions(row)}
                suspicious={row.isDuplicate || row.reconciliationStatus === 'Mismatch Detected'}
                onProofClick={setProofModalRow}
                onDuplicateClick={() => {
                  setDuplicateRow(row)
                  setDuplicateModalOpen(true)
                }}
                onAuditClick={setAuditRow}
              />
            ))}
          </div>
        </>
      )}

      <ProofViewerModal
        open={!!proofRow}
        onClose={() => setProofRow(null)}
        title="Offline payment proof"
        proofFiles={proofRow?.proofFiles}
        proofName={proofRow?.paymentProof}
        utr={proofRow?.utrNumber || proofRow?.receiptNumber}
        notes={proofRow?.verificationNotes}
        row={proofRow}
      />

      <OfflineApprovalProofModal
        open={!!proofModalRow}
        row={proofModalRow}
        access={proofModalRow ? getRowAccess(proofModalRow) : null}
        canApprove={canApprove}
        canFinanceHeadApprove={canFinanceHeadApprove}
        actionLoading={actionLoading}
        onClose={() => setProofModalRow(null)}
        onApprove={(row) => tryApprove(row)}
        onReject={(row) => setRejectRow(row)}
        onProofChange={handleProofUpload}
        onDuplicateOverride={handleDuplicateOverride}
        duplicateOpen={duplicateModalOpen && !!proofModalRow}
        setDuplicateOpen={setDuplicateModalOpen}
      />

      <OfflineBranchAccessDialog
        open={!!branchBlockRow}
        row={branchBlockRow}
        access={branchBlockAccess}
        onClose={() => {
          setBranchBlockRow(null)
          setBranchBlockAccess(null)
        }}
        onOverride={
          canFinanceHeadApprove
            ? (row) => {
                setBranchBlockRow(null)
                setBranchBlockAccess(null)
                tryApprove(row, true)
              }
            : undefined
        }
      />

      <OfflineAuditHistoryModal
        open={!!auditRow}
        row={auditRow?.id === 'ALL' ? null : auditRow}
        allLogs={auditRow?.id === 'ALL' ? allAuditLogs : undefined}
        filterUser={auditFilterUser}
        filterAction={auditFilterAction}
        onFilterUserChange={setAuditFilterUser}
        onFilterActionChange={setAuditFilterAction}
        onClose={() => setAuditRow(null)}
      />

      <VerificationDuplicateDialog
        open={duplicateModalOpen && !!duplicateRow && !proofModalRow}
        row={
          duplicateRow
            ? {
                ...duplicateRow,
                student: duplicateRow.studentName,
                utrNumber: duplicateRow.utrNumber || duplicateRow.receiptNumber,
              }
            : null
        }
        onClose={() => {
          setDuplicateModalOpen(false)
          setDuplicateRow(null)
        }}
        onMarkValid={canFinanceHeadApprove ? handleDuplicateOverride : undefined}
        canMarkValid={canFinanceHeadApprove}
        loading={actionLoading}
      />

      <FinanceConfirmDialog
        open={!!approveRow}
        title="Approve offline payment?"
        message={
          approveRow
            ? `Confirm approval for ${approveRow.studentName} (${formatINR(approveRow.amount)}) at branch ${approveRow.branchCode}. Receipt proof will be locked after approval.`
            : ''
        }
        confirmLabel="Approve"
        loading={actionLoading}
        onConfirm={() => approveRow && handleDecision(approveRow, true, { comment: 'Proof verified' })}
        onCancel={() => setApproveRow(null)}
      />

      <VerificationRejectDialog
        open={!!rejectRow}
        row={rejectRow ? { student: rejectRow.studentName, id: rejectRow.id } : null}
        onClose={() => setRejectRow(null)}
        onConfirm={(payload) => rejectRow && handleDecision(rejectRow, false, payload)}
        loading={actionLoading}
      />
    </FinancePageShell>
  )
}
