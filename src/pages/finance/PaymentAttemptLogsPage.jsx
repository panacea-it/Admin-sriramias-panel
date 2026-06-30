import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { History } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageBanner from '../../components/figma/PageBanner'
import FinanceCenterFilterBar from '../../components/finance/FinanceCenterFilterBar'
import PaymentAttemptFilters from '../../components/finance/payment-attempts/PaymentAttemptFilters'
import PaymentAttemptTable from '../../components/finance/payment-attempts/PaymentAttemptTable'
import PaymentAttemptTableActions from '../../components/finance/payment-attempts/PaymentAttemptTableActions'
import CounselorRemarksTable from '../../components/finance/payment-attempts/CounselorRemarksTable'
import PaymentAttemptViewModal from '../../components/finance/payment-attempts/PaymentAttemptViewModal'
import PaymentAttemptCounselorModal from '../../components/finance/payment-attempts/PaymentAttemptCounselorModal'
import PaymentAttemptAddRemarkModal from '../../components/finance/payment-attempts/PaymentAttemptAddRemarkModal'
import PaymentAttemptViewRemarkModal from '../../components/finance/payment-attempts/PaymentAttemptViewRemarkModal'
import { sortAttemptLogs } from '../../utils/paymentAttemptAnalytics'
import { usePaymentAttemptLogs } from '../../contexts/PaymentAttemptLogsContext'
import { useFinanceCenterFilter } from '../../contexts/FinanceCenterFilterContext'
import { FINANCE_ROUTES } from '../../constants/financeNav'
import { fetchPaymentAttemptDashboard, fetchPaymentAttemptDetails, fetchPaymentAttemptRemarkDetails } from '../../api/paymentAttemptLogsAPI'
import { buildControlledPagination } from '../../utils/paymentAttemptLogsHelpers'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { buildFilterSignature, createListFetchGuard, useEffectivePage } from '../../hooks/useMasterListQuery'
import { toast } from '../../utils/toast'

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_REMARKS_PAGE_SIZE = 10
const listFetchGuard = createListFetchGuard()

export default function PaymentAttemptLogsPage() {
  const financeCenterFilter = useFinanceCenterFilter()
  const {
    filterOptions,
    optionsLoading,
    refreshToken,
    assignCounselor,
    saveRemark,
    canAssignCounselor,
    canAddRemark,
  } = usePaymentAttemptLogs()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [gatewayFilter, setGatewayFilter] = useState('ALL')
  const [failureFilter, setFailureFilter] = useState('ALL')
  const [counselorAssignmentFilter, setCounselorAssignmentFilter] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortKey, setSortKey] = useState('lastAttempt')
  const [sortDir, setSortDir] = useState('desc')

  const [attemptRows, setAttemptRows] = useState([])
  const [remarkRows, setRemarkRows] = useState([])
  const [assignedCounselorCount, setAssignedCounselorCount] = useState(0)
  const [attemptsPage, setAttemptsPage] = useState(1)
  const [attemptsPageSize, setAttemptsPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [attemptsTotal, setAttemptsTotal] = useState(0)
  const [attemptsTotalPages, setAttemptsTotalPages] = useState(1)
  const [remarksPage, setRemarksPage] = useState(1)
  const [remarksPageSize, setRemarksPageSize] = useState(DEFAULT_REMARKS_PAGE_SIZE)
  const [remarksTotal, setRemarksTotal] = useState(0)
  const [remarksTotalPages, setRemarksTotalPages] = useState(1)
  const [listLoading, setListLoading] = useState(true)

  const [viewRow, setViewRow] = useState(null)
  const [viewDetail, setViewDetail] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [counselorRow, setCounselorRow] = useState(null)
  const [remarkRow, setRemarkRow] = useState(null)
  const [viewRemark, setViewRemark] = useState(null)
  const [viewRemarkDetail, setViewRemarkDetail] = useState(null)
  const [viewRemarkLoading, setViewRemarkLoading] = useState(false)

  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const centerId = useMemo(() => {
    if (financeCenterFilter.isOverallView || !financeCenterFilter.selectedIds.length) {
      return null
    }
    return financeCenterFilter.selectedIds[0]
  }, [financeCenterFilter.isOverallView, financeCenterFilter.selectedIds])

  const attemptsFilterSignature = buildFilterSignature([
    debouncedSearch,
    centerId,
    gatewayFilter,
    failureFilter,
    counselorAssignmentFilter,
    dateFrom,
    dateTo,
    attemptsPageSize,
    refreshToken,
  ])
  const effectiveAttemptsPage = useEffectivePage(attemptsPage, setAttemptsPage, attemptsFilterSignature)

  const remarksFilterSignature = buildFilterSignature([
    debouncedSearch,
    centerId,
    gatewayFilter,
    failureFilter,
    counselorAssignmentFilter,
    dateFrom,
    dateTo,
    remarksPageSize,
    refreshToken,
  ])
  const effectiveRemarksPage = useEffectivePage(remarksPage, setRemarksPage, remarksFilterSignature)

  const dashboardParams = useMemo(
    () => ({
      centerId,
      search: debouncedSearch.trim(),
      gateway: gatewayFilter,
      failureReason: failureFilter,
      assignmentStatus: counselorAssignmentFilter,
      startDate: dateFrom || null,
      endDate: dateTo || null,
      page: effectiveAttemptsPage,
      limit: attemptsPageSize,
      remarksPage: effectiveRemarksPage,
      remarksLimit: remarksPageSize,
    }),
    [
      centerId,
      debouncedSearch,
      gatewayFilter,
      failureFilter,
      counselorAssignmentFilter,
      dateFrom,
      dateTo,
      effectiveAttemptsPage,
      attemptsPageSize,
      effectiveRemarksPage,
      remarksPageSize,
    ],
  )

  const fetchDashboard = useCallback(async (params, { signal } = {}) => {
    const result = await fetchPaymentAttemptDashboard(params, { signal })
    if (!mountedRef.current) return
    setAttemptRows(result.paymentAttempts.items)
    setAttemptsTotal(result.paymentAttempts.total)
    setAttemptsTotalPages(result.paymentAttempts.totalPages || 1)
    setRemarkRows(result.remarks.items)
    setRemarksTotal(result.remarks.total)
    setRemarksTotalPages(result.remarks.totalPages || 1)
    setAssignedCounselorCount(result.assignedCounselorCount ?? 0)
  }, [])

  useEffect(() => {
    const ctx = listFetchGuard.beginRequest()
    if (!ctx) return
    const { controller, seq } = ctx

    setListLoading(true)
    fetchDashboard(dashboardParams, { signal: controller.signal })
      .catch((error) => {
        if (!listFetchGuard.shouldApplyResult(seq, controller)) return
        if (listFetchGuard.isAbortError(error)) return
        listFetchGuard.toastListError(
          listFetchGuard.getListErrorMessage(error, 'Failed to load payment attempt logs'),
        )
      })
      .finally(() => {
        if (listFetchGuard.endRequest(seq) && mountedRef.current) {
          setListLoading(false)
        }
      })
  }, [dashboardParams, fetchDashboard])

  const sortedAttempts = useMemo(
    () => sortAttemptLogs(attemptRows, sortKey, sortDir),
    [attemptRows, sortKey, sortDir],
  )

  const attemptsPagination = useMemo(
    () =>
      buildControlledPagination({
        page: effectiveAttemptsPage,
        pageSize: attemptsPageSize,
        totalCount: attemptsTotal,
        totalPages: attemptsTotalPages,
        setPage: setAttemptsPage,
        setPageSize: setAttemptsPageSize,
      }),
    [effectiveAttemptsPage, attemptsPageSize, attemptsTotal, attemptsTotalPages],
  )

  const remarksPagination = useMemo(
    () =>
      buildControlledPagination({
        page: effectiveRemarksPage,
        pageSize: remarksPageSize,
        totalCount: remarksTotal,
        totalPages: remarksTotalPages,
        setPage: setRemarksPage,
        setPageSize: setRemarksPageSize,
      }),
    [effectiveRemarksPage, remarksPageSize, remarksTotal, remarksTotalPages],
  )

  const handleSort = useCallback((key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }, [sortKey])

  const handleAssignCounselor = useCallback(
    async (payload) => {
      const ok = await assignCounselor(payload)
      if (ok) setCounselorRow(null)
    },
    [assignCounselor],
  )

  const handleSaveRemark = useCallback(
    async ({ subject, failureAnalysis, remark }) => {
      if (!remarkRow) return
      const ok = await saveRemark(remarkRow, { subject, failureAnalysis, remark })
      if (ok) setRemarkRow(null)
    },
    [remarkRow, saveRemark],
  )

  const openViewAttempt = useCallback(async (row) => {
    setViewRow(row)
    setViewDetail(null)
    setViewLoading(true)
    try {
      const detail = await fetchPaymentAttemptDetails(row.attemptId || row.id)
      if (mountedRef.current) setViewDetail(detail)
    } catch (error) {
      if (mountedRef.current) {
        toast.error(error.message || 'Failed to load payment attempt details')
        setViewRow(null)
      }
    } finally {
      if (mountedRef.current) setViewLoading(false)
    }
  }, [])

  const openViewRemark = useCallback(async (remark) => {
    setViewRemark(remark)
    setViewRemarkDetail(null)
    setViewRemarkLoading(true)
    try {
      const detail = await fetchPaymentAttemptRemarkDetails(remark.remarkId || remark.id)
      if (mountedRef.current) setViewRemarkDetail(detail)
    } catch (error) {
      if (mountedRef.current) {
        toast.error(error.message || 'Failed to load remark details')
        setViewRemark(null)
      }
    } finally {
      if (mountedRef.current) setViewRemarkLoading(false)
    }
  }, [])

  const showCounselorRemarksTable = counselorAssignmentFilter === 'ALL'

  const renderRowActions = useCallback(
    (row) => (
      <PaymentAttemptTableActions
        row={row}
        canAssign={canAssignCounselor}
        canAddRemark={canAddRemark}
        onView={() => openViewAttempt(row)}
        onAssignCounselor={() => setCounselorRow(row)}
        onAddRemark={() => setRemarkRow(row)}
      />
    ),
    [canAssignCounselor, canAddRemark, openViewAttempt],
  )

  const loading = optionsLoading || listLoading

  const emptyState = (
    <div className="px-4 py-10 text-center sm:px-6">
      <p className="text-base font-semibold text-slate-700">No Payment Attempts Found</p>
      <p className="mt-1 text-sm text-slate-500">Try changing filters or search criteria.</p>
    </div>
  )

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-10 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <PageBanner icon={History} title="Payment Attempt Logs">
          <Link
            to={FINANCE_ROUTES.attemptsAssigned}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/25 sm:w-auto"
          >
            Assigned Counselor
            {assignedCounselorCount > 0 && (
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#246392]">
                {assignedCounselorCount}
              </span>
            )}
          </Link>
        </PageBanner>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
          <FinanceCenterFilterBar className="mb-4" sticky={false} />

          <PaymentAttemptFilters
            search={search}
            onSearchChange={setSearch}
            gatewayFilter={gatewayFilter}
            onGatewayChange={setGatewayFilter}
            failureFilter={failureFilter}
            onFailureChange={setFailureFilter}
            counselorAssignmentFilter={counselorAssignmentFilter}
            onCounselorAssignmentChange={setCounselorAssignmentFilter}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            gatewayOptions={filterOptions?.gateways}
            failureOptions={filterOptions?.failureReasons}
            assignmentOptions={filterOptions?.assignmentStatuses}
            disabled={loading && attemptRows.length === 0}
          />

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
            <PaymentAttemptTable
              rows={sortedAttempts}
              loading={loading}
              resetDeps={[dashboardParams, sortKey, sortDir]}
              emptyMessage="No Payment Attempts Found"
              emptyState={emptyState}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              renderActions={renderRowActions}
              controlledPagination={attemptsPagination}
            />
          </div>

          {showCounselorRemarksTable ? (
            <div className="mt-8">
              <h2 className="mb-4 text-lg font-bold text-[#1a3a5c] sm:text-xl">Counselor Remarks</h2>
              <div className="min-w-0 rounded-xl border border-slate-100">
                <CounselorRemarksTable
                  remarks={remarkRows}
                  loading={loading}
                  onViewRemark={openViewRemark}
                  resetDeps={[dashboardParams]}
                  controlledPagination={remarksPagination}
                />
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <PaymentAttemptViewModal
        open={!!viewRow}
        row={viewDetail || viewRow}
        loading={viewLoading}
        onClose={() => {
          setViewRow(null)
          setViewDetail(null)
        }}
      />
      <PaymentAttemptCounselorModal
        open={!!counselorRow}
        row={counselorRow}
        onClose={() => setCounselorRow(null)}
        onAssign={handleAssignCounselor}
      />
      <PaymentAttemptAddRemarkModal
        open={!!remarkRow}
        row={remarkRow}
        onClose={() => setRemarkRow(null)}
        onSave={handleSaveRemark}
      />
      <PaymentAttemptViewRemarkModal
        open={!!viewRemark}
        remark={viewRemarkDetail || viewRemark}
        loading={viewRemarkLoading}
        onClose={() => {
          setViewRemark(null)
          setViewRemarkDetail(null)
        }}
      />
    </div>
  )
}
