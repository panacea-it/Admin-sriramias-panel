import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ShieldCheck, Check, X, Eye, Plus, AlertTriangle } from 'lucide-react'
import FinancePageShell from '../../components/finance/FinancePageShell'
import FinanceExportToolbar from '../../components/finance/FinanceExportToolbar'
import FinanceActionMenu from '../../components/finance/FinanceActionMenu'
import FinanceConfirmDialog from '../../components/finance/FinanceConfirmDialog'
import FinanceTableSkeleton from '../../components/finance/FinanceTableSkeleton'
import FinanceEmptyState from '../../components/finance/FinanceEmptyState'
import VerificationStatusBadge from '../../components/finance/VerificationStatusBadge'
import ProofViewerModal, { ProofThumbnail } from '../../components/finance/ProofViewerModal'
import VerificationRejectDialog from '../../components/finance/VerificationRejectDialog'
import VerificationDuplicateDialog from '../../components/finance/VerificationDuplicateDialog'
import AddOfflinePaymentModal from '../../components/finance/AddOfflinePaymentModal'
import VerificationCenterFilters from '../../components/finance/verification/VerificationCenterFilters'
import VerificationPaymentViewModal from '../../components/finance/verification/VerificationPaymentViewModal'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import { FINANCE_COURSES } from '../../data/financeMockData'
import {
  fetchVerificationQueue,
  verifyPayment,
  financeHeadApproveVerification,
  rejectVerification,
  markDuplicatePaymentValid,
  submitOfflinePaymentReport,
  generateReceipt,
} from '../../api/financeAPI'
import {
  FINANCE_VERIFICATION_STATUSES,
  FINANCE_STANDARD_PAYMENT_MODES,
} from '../../constants/financeConstants'
import { FINANCE_APPROVAL_STATUSES, VERIFICATION_QUEUE_EXPORT_COLUMNS } from '../../constants/financeVerification'
import { formatINR } from '../../utils/financeFilters'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { canVerifierAct, canFinanceHeadAct } from '../../utils/financeVerificationWorkflow'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useFinancePermissions } from '../../hooks/useFinancePermissions'
import { useFinanceOperations } from '../../contexts/FinanceOperationsContext'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

function adminDisplayName(user, roleLabel) {
  return user?.name || user?.email || roleLabel || 'Finance Admin'
}

function DuplicateBadge({ row, onClick }) {
  if (!row.isDuplicate) return <span className="text-xs text-[#686868]">—</span>
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 transition hover:bg-amber-50"
    >
      <AlertTriangle className="h-3.5 w-3.5" /> Possible Duplicate
    </button>
  )
}

function VerificationMobileCard({ row, actions, onDuplicateClick }) {
  return (
    <article
      className={cn(
        'rounded-xl border bg-white p-4 shadow-sm transition',
        row.isDuplicate && !row.duplicateOverride && 'border-amber-300 bg-amber-50/30',
        !row.isDuplicate && 'border-slate-200',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs font-semibold text-[#246392]">{row.id}</p>
          <p className="mt-0.5 font-semibold text-[#222]">{row.student}</p>
          <p className="text-xs text-[#686868]">
            {row.paymentMode} · {formatINR(row.amount)}
          </p>
        </div>
        <VerificationStatusBadge status={row.verificationStatus} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {row.isDuplicate && <DuplicateBadge row={row} onClick={() => onDuplicateClick(row)} />}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-[#686868]">Approver</dt>
          <dd className="font-medium text-[#222]">{row.currentApprover}</dd>
        </div>
        <div>
          <dt className="text-[#686868]">Updated</dt>
          <dd className="font-medium">{formatCategoryDateTime(row.updatedAt || row.submittedAt)}</dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        {(row.proofFiles?.length > 0 || row.paymentProof) && (
          <ProofThumbnail
            proof={row.proofFiles?.[0] || { name: row.paymentProof }}
            onClick={() => actions.onViewProof(row)}
          />
        )}
        {actions.renderMenu(row)}
      </div>
    </article>
  )
}

export default function PaymentVerificationCenterPage() {
  const { user, roleLabel } = useAuth()
  const adminName = adminDisplayName(user, roleLabel)
  const { canVerify, canFinanceHeadApprove, canEdit, canReceipts, canExport } = useFinancePermissions()
  const { bumpRefresh } = useFinanceOperations()
  const [searchParams, setSearchParams] = useSearchParams()
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 200)
  const [statusFilter, setStatusFilter] = useState('all')
  const [approvalFilter, setApprovalFilter] = useState('all')
  const [modeFilter, setModeFilter] = useState('all')
  const [centerFilter, setCenterFilter] = useState('all')
  const [courseFilter, setCourseFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [viewRow, setViewRow] = useState(null)
  const [proofRow, setProofRow] = useState(null)
  const [verifyRow, setVerifyRow] = useState(null)
  const [headApproveRow, setHeadApproveRow] = useState(null)
  const [rejectRow, setRejectRow] = useState(null)
  const [duplicateRow, setDuplicateRow] = useState(null)
  const [offlineOpen, setOfflineOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setQueue(await fetchVerificationQueue())
    } catch {
      toast.error('Failed to load verification queue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (searchParams.get('addOffline') === '1' && (canVerify || canEdit)) {
      setOfflineOpen(true)
      searchParams.delete('addOffline')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams, canVerify, canEdit])

  const centerOptions = useMemo(() => {
    const names = [...new Set(queue.map((r) => r.centerName).filter(Boolean))]
    return names.sort()
  }, [queue])

  const modeOptions = useMemo(() => {
    const modes = [...new Set(queue.map((r) => r.paymentMode).filter(Boolean))]
    return modes.sort()
  }, [queue])

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return queue.filter((row) => {
      const st = row.verificationStatus
      const ap = row.approvalStatus
      if (statusFilter !== 'all' && st !== statusFilter) return false
      if (approvalFilter !== 'all' && ap !== approvalFilter) return false
      if (modeFilter !== 'all' && row.paymentMode !== modeFilter) return false
      if (centerFilter !== 'all' && row.centerName !== centerFilter) return false
      if (courseFilter !== 'all' && row.course !== FINANCE_COURSES.find((c) => c.id === courseFilter)?.name)
        return false
      const dateVal = row.updatedAt || row.submittedAt
      if (dateFrom && dateVal && new Date(dateVal) < new Date(dateFrom)) return false
      if (dateTo && dateVal && new Date(dateVal) > new Date(`${dateTo}T23:59:59`)) return false
      if (!q) return true
      const hay = [
        row.student,
        row.studentId,
        row.id,
        row.utrNumber,
        row.transactionId,
        row.course,
        row.centerName,
        row.paymentMode,
        row.approvalStatus,
        row.verificationStatus,
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [
    queue,
    debouncedSearch,
    statusFilter,
    approvalFilter,
    modeFilter,
    centerFilter,
    courseFilter,
    dateFrom,
    dateTo,
  ])

  const runAction = async (fn, successMsg, errorMsg = 'Action failed') => {
    setActionLoading(true)
    try {
      await fn()
      if (successMsg) toast.success(successMsg)
      await load()
      bumpRefresh()
    } catch (err) {
      toast.error(err?.message || errorMsg)
    } finally {
      setActionLoading(false)
    }
  }

  const handleVerifyConfirm = async () => {
    if (!verifyRow) return
    await runAction(
      () => verifyPayment(verifyRow.id, { adminName, comment: 'Payment verified by officer' }),
      `${verifyRow.student} verified — sent to Finance Head`,
    )
    setVerifyRow(null)
  }

  const handleHeadApproveConfirm = async () => {
    if (!headApproveRow) return
    await runAction(async () => {
      await financeHeadApproveVerification(headApproveRow.id, {
        adminName,
        comment: 'Final approval by Finance Head',
      })
      if (canReceipts) {
        try {
          await generateReceipt(headApproveRow.id)
        } catch {
          /* optional */
        }
      }
    }, `${headApproveRow.student} approved — moved to Student Payment Reports`)
    setHeadApproveRow(null)
  }

  const handleReject = async (payload) => {
    if (!rejectRow) return
    await runAction(
      () => rejectVerification(rejectRow.id, { ...payload, adminName }),
      'Payment rejected',
    )
    setRejectRow(null)
  }

  const handleMarkDuplicateValid = async (row) => {
    await runAction(
      () => markDuplicatePaymentValid(row.id, { adminName, remark: 'Duplicate reviewed and marked valid' }),
      'Duplicate override saved — approval unlocked',
    )
    setDuplicateRow(null)
  }

  const handleOfflineSubmit = async (form) => {
    setActionLoading(true)
    try {
      const result = await submitOfflinePaymentReport(form)
      if (result?.draft) {
        toast.success('Offline payment saved as draft')
      } else if (form.submitAction === 'emi_plan') {
        toast.success('EMI plan saved successfully')
      } else if (form.submitAction === 'receipt' && result?.receiptId) {
        await generateReceipt(result.receiptId)
        toast.success('Payment approved and receipt generated')
      } else if (form.emiEnabled && result?.emiPlan) {
        toast.success('Offline payment approved with EMI plan activated')
      } else {
        toast.success('Offline payment approved and added to Student Payment Reports')
      }
      setOfflineOpen(false)
      await load()
      bumpRefresh()
    } catch {
      toast.error('Failed to submit offline payment')
    } finally {
      setActionLoading(false)
    }
  }

  const buildRowActions = useCallback(
    (row) => {
      const verifierCanAct = canVerify && canVerifierAct(row)
      const headCanAct = canFinanceHeadApprove && canFinanceHeadAct(row)
      const canActOnPayment = verifierCanAct || headCanAct
      const duplicateBlocked = row.isDuplicate && !row.duplicateOverride

      const actions = [
        { label: 'View', icon: Eye, onClick: () => setViewRow(row) },
      ]

      if (canActOnPayment && !duplicateBlocked) {
        actions.push({
          label: 'Approve',
          icon: Check,
          onClick: () => (headCanAct ? setHeadApproveRow(row) : setVerifyRow(row)),
        })
      }

      if (canActOnPayment && row.approvalStatus !== 'Approved' && row.verificationStatus !== 'Rejected') {
        actions.push({
          label: 'Reject',
          icon: X,
          onClick: () => setRejectRow(row),
          variant: 'danger',
        })
      }

      if (row.isDuplicate) {
        actions.push({
          label: 'Detect duplicate payment',
          icon: AlertTriangle,
          onClick: () => setDuplicateRow(row),
          variant: 'accent',
        })
      }

      return actions
    },
    [canVerify, canFinanceHeadApprove],
  )

  const columns = useMemo(
    () => [
      {
        key: 'id',
        label: 'Payment ID',
        cellClassName: 'whitespace-nowrap align-middle',
        render: (r) => <span className="font-mono text-xs font-semibold">{r.id}</span>,
      },
      {
        key: 'student',
        label: 'Student Name',
        cellClassName: 'align-middle min-w-[120px]',
        render: (r) => (
          <div>
            <span className="font-medium">{r.student}</span>
            <p className="text-xs text-[#686868]">{r.studentId}</p>
          </div>
        ),
      },
      {
        key: 'paymentMode',
        label: 'Payment Mode',
        cellClassName: 'whitespace-nowrap align-middle',
      },
      {
        key: 'verificationStatus',
        label: 'Verification Status',
        cellClassName: 'whitespace-nowrap align-middle',
        render: (r) => <VerificationStatusBadge status={r.verificationStatus} />,
      },
      {
        key: 'duplicate',
        label: 'Duplicate',
        cellClassName: 'whitespace-nowrap align-middle',
        render: (r) => <DuplicateBadge row={r} onClick={() => setDuplicateRow(r)} />,
      },
      {
        key: 'proof',
        label: 'Uploaded Proof',
        cellClassName: 'whitespace-nowrap align-middle',
        render: (r) => {
          const files = r.proofFiles?.length ? r.proofFiles : r.paymentProof ? [{ name: r.paymentProof }] : []
          if (!files.length) return <span className="text-xs text-[#686868]">—</span>
          return (
            <div className="flex items-center gap-1">
              <ProofThumbnail proof={files[0]} onClick={() => setProofRow(r)} />
              {files.length > 1 && (
                <span className="text-[10px] font-semibold text-[#686868]">+{files.length - 1}</span>
              )}
            </div>
          )
        },
      },
      {
        key: 'verifiedBy',
        label: 'Verified By',
        cellClassName: 'whitespace-nowrap align-middle text-sm',
        render: (r) => r.verifiedBy || '—',
      },
      {
        key: 'financeHead',
        label: 'Finance Head Status',
        cellClassName: 'align-middle min-w-[100px]',
        render: (r) => {
          if (r.approvalStatus === 'Approved') {
            return (
              <div className="text-xs">
                <span className="font-semibold text-[#69df66]">Approved</span>
                {r.approvedBy && <p className="text-[#686868]">by {r.approvedBy}</p>}
                {r.approvedAt && (
                  <p className="tabular-nums text-[#9ca0a8]">{formatCategoryDateTime(r.approvedAt)}</p>
                )}
              </div>
            )
          }
          if (r.approvalStatus === 'Rejected') {
            return (
              <div className="text-xs">
                <span className="font-semibold text-[#df8284]">Rejected</span>
                {r.rejectedBy && <p className="text-[#686868]">by {r.rejectedBy}</p>}
              </div>
            )
          }
          return (
            <div className="text-xs">
              <p className="font-medium text-[#222]">{r.currentApprover}</p>
              {r.sentToFinanceHeadAt && r.approvalStatus === 'Sent to Finance Head' && (
                <p className="text-[#686868]">Since {formatCategoryDateTime(r.sentToFinanceHeadAt)}</p>
              )}
            </div>
          )
        },
      },
      {
        key: 'amount',
        label: 'Amount',
        cellClassName: 'whitespace-nowrap align-middle tabular-nums',
        render: (r) => formatINR(r.amount),
      },
      {
        key: 'updatedAt',
        label: 'Updated On',
        cellClassName: 'whitespace-nowrap align-middle text-xs tabular-nums text-[#686868]',
        render: (r) => formatCategoryDateTime(r.updatedAt || r.submittedAt),
      },
      {
        key: 'actions',
        label: 'Actions',
        cellClassName: 'align-middle min-w-[120px]',
        render: (row) => {
          const actions = buildRowActions(row)
          if (!actions.length) return <span className="text-xs text-[#686868]">—</span>
          return <FinanceActionMenu actions={actions} inlineFrom="sm" />
        },
      },
    ],
    [buildRowActions],
  )

  const addOfflineBtn =
    'inline-flex h-10 items-center gap-2 rounded-lg bg-white/20 px-3 text-sm font-semibold text-white ring-1 ring-white/40 transition hover:bg-white/30'

  const mobileActions = {
    onViewProof: setProofRow,
    renderMenu: (row) => <FinanceActionMenu actions={buildRowActions(row)} inlineFrom="sm" />,
  }

  return (
    <FinancePageShell
      icon={ShieldCheck}
      title="Payment Verification Center"
      breadcrumbs={[{ label: 'Payment Verification Center' }]}
      actions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {(canVerify || canEdit) && (
            <button type="button" onClick={() => setOfflineOpen(true)} className={addOfflineBtn}>
              <Plus className="h-4 w-4" /> Add Offline Payment
            </button>
          )}
          <FinanceExportToolbar
            rows={filtered}
            filenameBase="verification-queue"
            canExport={canExport}
            variant="banner"
            columnDefs={VERIFICATION_QUEUE_EXPORT_COLUMNS}
          />
        </div>
      }
    >
      <VerificationCenterFilters
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        searchPlaceholder="SEARCH PAYMENT ID , STUDENT , MODE "
        dateFrom={dateFrom}
        onDateFromChange={(e) => setDateFrom(e.target.value)}
        dateTo={dateTo}
        onDateToChange={(e) => setDateTo(e.target.value)}
        selects={[
          {
            key: 'verification',
            label: 'Verification status',
            value: statusFilter,
            onChange: (e) => setStatusFilter(e.target.value),
            options: [
              { value: 'all', label: 'All verification' },
              ...FINANCE_VERIFICATION_STATUSES.map((s) => ({ value: s, label: s })),
            ],
          },
          {
            key: 'approval',
            label: 'Approval status',
            value: approvalFilter,
            onChange: (e) => setApprovalFilter(e.target.value),
            options: [
              { value: 'all', label: 'All approval' },
              ...FINANCE_APPROVAL_STATUSES.map((s) => ({ value: s, label: s })),
            ],
          },
          {
            key: 'mode',
            label: 'Payment mode',
            value: modeFilter,
            onChange: (e) => setModeFilter(e.target.value),
            options: [
              { value: 'all', label: 'All modes' },
              ...modeOptions.map((m) => ({ value: m, label: m })),
              ...FINANCE_STANDARD_PAYMENT_MODES.filter((m) => !modeOptions.includes(m.label)).map((m) => ({
                value: m.label,
                label: m.label,
              })),
            ],
          },
          {
            key: 'center',
            label: 'Center',
            value: centerFilter,
            onChange: (e) => setCenterFilter(e.target.value),
            options: [{ value: 'all', label: 'All centers' }, ...centerOptions.map((n) => ({ value: n, label: n }))],
          },
          {
            key: 'course',
            label: 'Course',
            value: courseFilter,
            onChange: (e) => setCourseFilter(e.target.value),
            options: [
              { value: 'all', label: 'All courses' },
              ...FINANCE_COURSES.map((c) => ({ value: c.id, label: c.name })),
            ],
          },
        ]}
      />

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-[#686868]">
          {loading ? 'Loading verification queue…' : `${filtered.length} verification record${filtered.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {loading ? (
        <FinanceTableSkeleton rows={6} columns={9} />
      ) : filtered.length === 0 ? (
        <FinanceEmptyState
          title="No verification records"
          description="No payments match your filters, or the queue is empty."
        />
      ) : (
        <>
          <div className="hidden md:block">
            <PaginatedFigmaTable
              columns={columns}
              data={filtered}
              itemLabel="verifications"
              resetDeps={[
                debouncedSearch,
                statusFilter,
                approvalFilter,
                modeFilter,
                centerFilter,
                courseFilter,
                dateFrom,
                dateTo,
                queue.length,
              ]}
              density="compact"
              stickyHeader
              rowClassName="hover:bg-slate-50/90 [&_td]:align-middle transition-colors"
              tableClassName="[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_tbody_td]:align-middle"
            />
          </div>

          <div className="space-y-3 md:hidden">
            {filtered.map((row) => (
              <VerificationMobileCard
                key={row.id}
                row={row}
                actions={mobileActions}
                onDuplicateClick={setDuplicateRow}
              />
            ))}
          </div>
        </>
      )}

      <VerificationPaymentViewModal
        open={!!viewRow}
        row={viewRow}
        onClose={() => setViewRow(null)}
        onViewProof={setProofRow}
      />

      <ProofViewerModal
        open={!!proofRow}
        onClose={() => setProofRow(null)}
        title="Payment verification proof"
        proofName={proofRow?.paymentProof}
        proofFiles={proofRow?.proofFiles}
        utr={proofRow?.utrNumber}
        notes={proofRow?.remarks}
        row={proofRow}
      />

      <FinanceConfirmDialog
        open={!!verifyRow}
        title="Verify payment?"
        message={
          verifyRow
            ? `Confirm verification for ${verifyRow.student} (${verifyRow.id}). This will mark the payment as verified and route it to Finance Head for final approval.`
            : ''
        }
        confirmLabel="Verify & route"
        loading={actionLoading}
        onConfirm={handleVerifyConfirm}
        onCancel={() => setVerifyRow(null)}
      />

      <FinanceConfirmDialog
        open={!!headApproveRow}
        title="Final approval?"
        message={
          headApproveRow
            ? `Grant final approval for ${headApproveRow.student} (${headApproveRow.id}). This record will be removed from the verification queue and appear in Student Payment Reports as Paid.`
            : ''
        }
        confirmLabel="Approve"
        loading={actionLoading}
        onConfirm={handleHeadApproveConfirm}
        onCancel={() => setHeadApproveRow(null)}
      />

      <VerificationRejectDialog
        open={!!rejectRow}
        row={rejectRow}
        onClose={() => setRejectRow(null)}
        onConfirm={handleReject}
        loading={actionLoading}
      />

      <VerificationDuplicateDialog
        open={!!duplicateRow}
        row={duplicateRow}
        onClose={() => setDuplicateRow(null)}
        onMarkValid={handleMarkDuplicateValid}
        loading={actionLoading}
        canMarkValid={canFinanceHeadApprove}
      />

      <AddOfflinePaymentModal
        open={offlineOpen}
        onClose={() => setOfflineOpen(false)}
        onSubmit={handleOfflineSubmit}
        loading={actionLoading}
      />
    </FinancePageShell>
  )
}
