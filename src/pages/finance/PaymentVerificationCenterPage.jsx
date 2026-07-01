import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import {
  fetchVerificationFilterOptions,
  fetchVerificationPaymentModes,
  fetchVerificationCentersDropdown,
  fetchVerificationList,
  fetchAllVerificationRecords,
  fetchVerificationDetail,
  approveVerificationRecord,
  rejectVerificationRecord,
  submitFullPayment,
  saveEmiPlan,
  fetchCoursesByCenter,
} from '../../api/paymentVerificationAPI'
import {
  buildFullPaymentFormData,
  buildEmiPlanFormData,
  canVerifyRecord,
  canRejectRecord,
  canFinanceHeadApproveRecord,
  mapCoursesToOptions,
  mapCentersDropdownToOptions,
  mapPaymentModesToOptions,
  isMongoObjectId,
  VERIFICATION_EXPORT_COLUMNS,
} from '../../utils/paymentVerificationHelpers'
import { VERIFICATION_QUEUE_EXPORT_COLUMNS } from '../../constants/financeVerification'
import { formatINR } from '../../utils/financeFilters'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { exportFinanceCsv } from '../../utils/financeExport'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { buildFilterSignature, createListFetchGuard, useEffectivePage } from '../../hooks/useMasterListQuery'
import { useFinancePermissions } from '../../hooks/useFinancePermissions'
import { useFinanceOperations } from '../../contexts/FinanceOperationsContext'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

const PAGE_SIZE = 25
const listFetchGuard = createListFetchGuard()

function dedupeFilterOptions(options = []) {
  const seen = new Set()
  return options.filter((opt) => {
    const key = String(opt?.value ?? '')
    if (seen.has(key)) return false
    seen.add(key)
    return opt?.value != null && opt?.value !== ''
  })
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
            proof={row.proofFiles?.[0] || { name: row.paymentProof, url: row.paymentProofUrl }}
            onClick={() => actions.onViewProof(row)}
          />
        )}
        {actions.renderMenu(row)}
      </div>
    </article>
  )
}

export default function PaymentVerificationCenterPage() {
  const { canVerify, canFinanceHeadApprove, canEdit, canExport } = useFinancePermissions()
  const { bumpRefresh } = useFinanceOperations()
  const [searchParams, setSearchParams] = useSearchParams()

  const [filterOptions, setFilterOptions] = useState(null)
  const [paymentModes, setPaymentModes] = useState([])
  const [centers, setCenters] = useState([])
  const [courseOptions, setCourseOptions] = useState([])
  const [queue, setQueue] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 400)
  const [statusFilter, setStatusFilter] = useState('all')
  const [approvalFilter, setApprovalFilter] = useState('all')
  const [modeFilter, setModeFilter] = useState('all')
  const [centerFilter, setCenterFilter] = useState('all')
  const [courseFilter, setCourseFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [viewRow, setViewRow] = useState(null)
  const [viewDetailLoading, setViewDetailLoading] = useState(false)
  const [proofRow, setProofRow] = useState(null)
  const [verifyRow, setVerifyRow] = useState(null)
  const [headApproveRow, setHeadApproveRow] = useState(null)
  const [rejectRow, setRejectRow] = useState(null)
  const [duplicateRow, setDuplicateRow] = useState(null)
  const [offlineOpen, setOfflineOpen] = useState(false)
  const [listRefreshToken, setListRefreshToken] = useState(0)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const filterSignature = buildFilterSignature([
    debouncedSearch,
    statusFilter,
    approvalFilter,
    modeFilter,
    centerFilter,
    courseFilter,
    dateFrom,
    dateTo,
    pageSize,
  ])

  const effectivePage = useEffectivePage(page, setPage, filterSignature)

  const listParams = useMemo(
    () => ({
      search: debouncedSearch,
      verificationStatus: statusFilter,
      financeHeadStatus: approvalFilter,
      paymentModeId: modeFilter,
      centerId: centerFilter,
      courseId: courseFilter,
      dateFrom,
      dateTo,
      page: effectivePage,
      limit: pageSize,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    }),
    [
      debouncedSearch,
      statusFilter,
      approvalFilter,
      modeFilter,
      centerFilter,
      courseFilter,
      dateFrom,
      dateTo,
      effectivePage,
      pageSize,
    ],
  )

  const refreshList = useCallback(() => {
    setListRefreshToken((token) => token + 1)
  }, [])

  const loadSetup = useCallback(async () => {
    try {
      const [options, modes, centerList] = await Promise.all([
        fetchVerificationFilterOptions(),
        fetchVerificationPaymentModes(),
        fetchVerificationCentersDropdown(),
      ])
      if (!mountedRef.current) return
      setFilterOptions(options)
      setPaymentModes(modes)
      setCenters(mapCentersDropdownToOptions(centerList))
    } catch {
      if (mountedRef.current) toast.error('Failed to load verification filters')
    }
  }, [])

  useEffect(() => {
    loadSetup()
  }, [loadSetup])

  useEffect(() => {
    const ctx = listFetchGuard.beginRequest()
    if (!ctx) return
    const { controller, seq } = ctx

    setLoading(true)
    fetchVerificationList(listParams, { signal: controller.signal })
      .then((result) => {
        if (!listFetchGuard.shouldApplyResult(seq, controller)) return
        if (!mountedRef.current) return
        setQueue(result.items || [])
        setTotalCount(result.totalCount ?? 0)
        setTotalPages(result.totalPages ?? 1)
      })
      .catch((error) => {
        if (!listFetchGuard.shouldApplyResult(seq, controller)) return
        if (listFetchGuard.isAbortError(error)) return
        listFetchGuard.toastListError(
          listFetchGuard.getListErrorMessage(error, 'Failed to load verification queue'),
        )
        if (!mountedRef.current) return
        setQueue([])
        setTotalCount(0)
        setTotalPages(1)
      })
      .finally(() => {
        if (listFetchGuard.endRequest(seq) && mountedRef.current) {
          setLoading(false)
        }
      })
  }, [listParams, listRefreshToken])

  useEffect(() => {
    if (searchParams.get('addOffline') === '1' && (canVerify || canEdit)) {
      setOfflineOpen(true)
      searchParams.delete('addOffline')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams, canVerify, canEdit])

  useEffect(() => {
    if (centerFilter === 'all' || !isMongoObjectId(centerFilter)) {
      setCourseOptions([])
      return
    }
    let cancelled = false
    fetchCoursesByCenter(centerFilter)
      .then((items) => {
        if (!cancelled) setCourseOptions(mapCoursesToOptions(items))
      })
      .catch(() => {
        if (!cancelled) setCourseOptions([])
      })
    return () => {
      cancelled = true
    }
  }, [centerFilter])

  const handleCenterFilterChange = (e) => {
    setCenterFilter(e.target.value)
    setCourseFilter('all')
  }

  const verificationStatusOptions = useMemo(() => {
    const fromApi = dedupeFilterOptions(
      (filterOptions?.verificationStatuses || []).filter((s) => s.value && s.value !== 'ALL'),
    )
    return [{ value: 'all', label: 'All verification' }, ...fromApi]
  }, [filterOptions])

  const approvalStatusOptions = useMemo(() => {
    const fromApi = dedupeFilterOptions(filterOptions?.financeHeadStatuses || [])
    return [{ value: 'all', label: 'All approval' }, ...fromApi]
  }, [filterOptions])

  const modeOptions = useMemo(() => {
    const fromApi = dedupeFilterOptions(mapPaymentModesToOptions(paymentModes))
    return [{ value: 'all', label: 'All modes' }, ...fromApi]
  }, [paymentModes])

  const centerOptions = useMemo(() => {
    const fromCenters = dedupeFilterOptions(
      centers.map((c) => ({ value: c.id, label: c.name })),
    )
    return [{ value: 'all', label: 'All centers' }, ...fromCenters]
  }, [centers])

  const courseFilterOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All courses' },
      ...dedupeFilterOptions(courseOptions.map((c) => ({ value: c.value, label: c.label }))),
    ]
  }, [courseOptions])

  const pagination = useMemo(() => {
    const safePage = Math.min(Math.max(1, effectivePage), totalPages || 1)
    const startIndex = totalCount === 0 ? 0 : (safePage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalCount)
    return {
      page: safePage,
      pageSize,
      totalItems: totalCount,
      totalPages: totalPages || 1,
      startIndex,
      endIndex,
    }
  }, [effectivePage, pageSize, totalCount, totalPages])

  const controlledPagination = useMemo(
    () => ({
      ...pagination,
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
    }),
    [pagination],
  )

  const runAction = async (fn, successMsg, errorMsg = 'Action failed') => {
    setActionLoading(true)
    try {
      await fn()
      if (successMsg) toast.success(successMsg)
      refreshList()
      bumpRefresh()
      return true
    } catch (err) {
      toast.error(err?.message || errorMsg)
      return false
    } finally {
      setActionLoading(false)
    }
  }

  const resolveRecordId = (row) => row?.verificationId || row?.id || row?._id

  const handleViewRow = async (row) => {
    setViewRow(row)
    setViewDetailLoading(true)
    try {
      const detail = await fetchVerificationDetail(resolveRecordId(row))
      if (detail) setViewRow(detail)
      refreshList()
    } catch (err) {
      toast.error(err?.message || 'Failed to load payment details')
      setViewRow(null)
    } finally {
      setViewDetailLoading(false)
    }
  }

  const handleViewProof = (row) => {
    if (row?.paymentProofUrl) {
      window.open(row.paymentProofUrl, '_blank', 'noopener,noreferrer')
      return
    }
    setProofRow(row)
  }

  const handleVerifyConfirm = async () => {
    if (!verifyRow) return
    const recordId = resolveRecordId(verifyRow)
    const ok = await runAction(
      () => approveVerificationRecord(recordId),
      'Payment verified successfully.',
    )
    if (ok) {
      setVerifyRow(null)
      setViewRow(null)
    }
  }

  const handleHeadApproveConfirm = async () => {
    if (!headApproveRow) return
    const recordId = resolveRecordId(headApproveRow)
    const ok = await runAction(
      () => approveVerificationRecord(recordId),
      `${headApproveRow.student} approved — moved to Student Payment Reports`,
    )
    if (ok) {
      setHeadApproveRow(null)
      setViewRow(null)
    }
  }

  const handleReject = async (payload) => {
    if (!rejectRow) return
    const recordId = resolveRecordId(rejectRow)
    const ok = await runAction(
      () =>
        rejectVerificationRecord(recordId, {
          reason: payload.reason,
          comment: payload.comment || payload.rejectionRemarks,
        }),
      'Payment rejected',
    )
    if (ok) {
      setRejectRow(null)
      setViewRow(null)
    }
  }

  const handleExportCsv = async () => {
    setExportLoading(true)
    try {
      const allRows = await fetchAllVerificationRecords({
        ...listParams,
        page: undefined,
        limit: undefined,
      })
      if (!allRows.length) {
        toast.error('No records to export')
        return
      }
      const ok = exportFinanceCsv(
        allRows,
        `payment-verification-export-${Date.now()}.csv`,
        VERIFICATION_EXPORT_COLUMNS.length ? VERIFICATION_EXPORT_COLUMNS : VERIFICATION_QUEUE_EXPORT_COLUMNS,
      )
      if (ok !== false) toast.success('CSV ready')
    } catch (err) {
      toast.error(err?.message || 'Export failed')
    } finally {
      setExportLoading(false)
    }
  }

  const handleOfflineSubmit = async (form) => {
    setActionLoading(true)
    try {
      if (form.emiEnabled) {
        const result = await saveEmiPlan(buildEmiPlanFormData(form, paymentModes))
        const verificationId = result?.verificationId || result?.data?.verificationId
        toast.success(
          verificationId
            ? `EMI plan submitted for verification (${verificationId})`
            : 'EMI plan submitted for verification',
        )
      } else {
        const result = await submitFullPayment(buildFullPaymentFormData(form, paymentModes))
        const verificationId =
          result?.verifications?.[0]?.verificationId || result?.data?.verifications?.[0]?.verificationId
        toast.success(
          verificationId
            ? `Payment submitted for verification (${verificationId})`
            : 'Payment submitted for verification',
        )
      }
      setOfflineOpen(false)
      refreshList()
      bumpRefresh()
    } catch (err) {
      toast.error(err?.message || 'Failed to submit offline payment')
    } finally {
      setActionLoading(false)
    }
  }

  const buildRowActions = useCallback(
    (row) => {
      const verifierCanAct = canVerify && canVerifyRecord(row)
      const headCanAct = canFinanceHeadApprove && canFinanceHeadApproveRecord(row)
      const canActOnPayment = verifierCanAct || headCanAct

      const actions = [{ label: 'View', icon: Eye, onClick: () => handleViewRow(row) }]

      if (canActOnPayment) {
        actions.push({
          label: 'Approve',
          icon: Check,
          onClick: () => (headCanAct ? setHeadApproveRow(row) : setVerifyRow(row)),
        })
      }

      if (canActOnPayment && canRejectRecord(row)) {
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
          const files = r.proofFiles?.length
            ? r.proofFiles
            : r.paymentProof
              ? [{ name: r.paymentProof, url: r.paymentProofUrl }]
              : []
          if (!files.length) return <span className="text-xs text-[#686868]">—</span>
          return (
            <div className="flex items-center gap-1">
              <ProofThumbnail proof={files[0]} onClick={() => handleViewProof(r)} />
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
          if (r.approvalStatus === 'Rejected' || r.verificationStatusRaw === 'REJECTED') {
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
    onViewProof: handleViewProof,
    renderMenu: (row) => <FinanceActionMenu actions={buildRowActions(row)} inlineFrom="sm" />,
  }

  const rejectionReasons = filterOptions?.rejectionReasons || []

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
            filenameBase="payment-verification-export"
            canExport={canExport}
            variant="banner"
            onExportCsv={handleExportCsv}
            exportLoading={exportLoading}
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
            options: verificationStatusOptions,
          },
          {
            key: 'approval',
            label: 'Approval status',
            value: approvalFilter,
            onChange: (e) => setApprovalFilter(e.target.value),
            options: approvalStatusOptions,
          },
          {
            key: 'mode',
            label: 'Payment mode',
            value: modeFilter,
            onChange: (e) => setModeFilter(e.target.value),
            options: modeOptions,
          },
          {
            key: 'center',
            label: 'Center',
            value: centerFilter,
            onChange: handleCenterFilterChange,
            options: centerOptions,
          },
          {
            key: 'course',
            label: 'Course',
            value: courseFilter,
            onChange: (e) => setCourseFilter(e.target.value),
            options: courseFilterOptions,
          },
        ]}
      />

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-[#686868]">
          {loading
            ? 'Loading verification queue…'
            : `${totalCount} verification record${totalCount === 1 ? '' : 's'}`}
        </p>
      </div>

      {loading ? (
        <FinanceTableSkeleton rows={6} columns={9} />
      ) : queue.length === 0 ? (
        <FinanceEmptyState
          title="No verification records"
          description="No payments match your filters, or the queue is empty."
        />
      ) : (
        <>
          <div className="hidden md:block">
            <PaginatedFigmaTable
              columns={columns}
              data={queue}
              itemLabel="verifications"
              controlledPagination={controlledPagination}
              density="compact"
              stickyHeader
              rowClassName="hover:bg-slate-50/90 [&_td]:align-middle transition-colors"
              tableClassName="[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_tbody_td]:align-middle"
            />
          </div>

          <div className="space-y-3 md:hidden">
            {queue.map((row) => (
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
        loading={viewDetailLoading}
        onClose={() => setViewRow(null)}
        onViewProof={handleViewProof}
      />

      <ProofViewerModal
        open={!!proofRow}
        onClose={() => setProofRow(null)}
        title="Payment verification proof"
        proofName={proofRow?.paymentProof}
        proofUrl={proofRow?.paymentProofUrl}
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
        rejectionReasons={rejectionReasons}
      />

      <VerificationDuplicateDialog
        open={!!duplicateRow}
        row={duplicateRow}
        onClose={() => setDuplicateRow(null)}
        onMarkValid={() => toast.info('Duplicate review is handled through verification actions')}
        loading={false}
        canMarkValid={false}
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
