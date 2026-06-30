import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MessageSquarePlus, UserCheck } from 'lucide-react'
import PageBanner from '../../components/figma/PageBanner'
import FinanceCenterFilterBar from '../../components/finance/FinanceCenterFilterBar'
import PaymentAttemptBackNav from '../../components/finance/payment-attempts/PaymentAttemptBackNav'
import PaymentAttemptTable from '../../components/finance/payment-attempts/PaymentAttemptTable'
import PaymentAttemptViewModal from '../../components/finance/payment-attempts/PaymentAttemptViewModal'
import PaymentAttemptAddRemarkModal from '../../components/finance/payment-attempts/PaymentAttemptAddRemarkModal'
import IconActionButton from '../../components/common/IconActionButton'
import ViewButton from '../../components/common/ViewButton'
import { TABLE_ACTIONS_WRAP } from '../../utils/tableColumnHelpers'
import { sortAttemptLogs } from '../../utils/paymentAttemptAnalytics'
import { usePaymentAttemptLogs } from '../../contexts/PaymentAttemptLogsContext'
import { useFinanceCenterFilter } from '../../contexts/FinanceCenterFilterContext'
import {
  fetchPaymentAttemptAssignedDashboard,
  fetchPaymentAttemptDetails,
} from '../../api/paymentAttemptLogsAPI'
import { buildControlledPagination } from '../../utils/paymentAttemptLogsHelpers'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { buildFilterSignature, createListFetchGuard, useEffectivePage } from '../../hooks/useMasterListQuery'
import { toast } from '../../utils/toast'

const DEFAULT_PAGE_SIZE = 10
const listFetchGuard = createListFetchGuard()

function AssignedCounselorTableActions({ row, onView, onAddRemark }) {
  return (
    <div className={TABLE_ACTIONS_WRAP}>
      <ViewButton
        onClick={onView}
        label={`View attempt ${row.attemptId || row.id}`}
      />
      <IconActionButton
        label={`Add counselor remark for ${row.student}`}
        onClick={onAddRemark}
        className="text-[#555] hover:border-slate-200 hover:bg-slate-100 hover:text-[#246392] hover:shadow-sm"
      >
        <MessageSquarePlus className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
      </IconActionButton>
    </div>
  )
}

export default function AssignedCounselorPage() {
  const financeCenterFilter = useFinanceCenterFilter()
  const { refreshToken, saveRemark } = usePaymentAttemptLogs()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [sortKey, setSortKey] = useState('lastAttempt')
  const [sortDir, setSortDir] = useState('desc')
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [viewRow, setViewRow] = useState(null)
  const [viewDetail, setViewDetail] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [remarkRow, setRemarkRow] = useState(null)

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

  const filterSignature = buildFilterSignature([
    debouncedSearch,
    centerId,
    pageSize,
    refreshToken,
  ])
  const effectivePage = useEffectivePage(page, setPage, filterSignature)

  const listParams = useMemo(
    () => ({
      centerId,
      search: debouncedSearch.trim(),
      gateway: 'ALL',
      failureReason: 'ALL',
      page: effectivePage,
      limit: pageSize,
      remarksPage: 1,
      remarksLimit: 1,
    }),
    [centerId, debouncedSearch, effectivePage, pageSize],
  )

  const fetchList = useCallback(async (params, { signal } = {}) => {
    const result = await fetchPaymentAttemptAssignedDashboard(params, { signal })
    if (!mountedRef.current) return
    const pendingRows = (result.paymentAttempts.items || []).filter(
      (row) => (row.remarksCount ?? 0) === 0,
    )
    setRows(pendingRows)
    setTotalCount(result.paymentAttempts.total ?? pendingRows.length)
    setTotalPages(result.paymentAttempts.totalPages || 1)
  }, [])

  useEffect(() => {
    const ctx = listFetchGuard.beginRequest()
    if (!ctx) return
    const { controller, seq } = ctx

    setLoading(true)
    fetchList(listParams, { signal: controller.signal })
      .catch((error) => {
        if (!listFetchGuard.shouldApplyResult(seq, controller)) return
        if (listFetchGuard.isAbortError(error)) return
        listFetchGuard.toastListError(
          listFetchGuard.getListErrorMessage(error, 'Failed to load assigned payment attempts'),
        )
      })
      .finally(() => {
        if (listFetchGuard.endRequest(seq) && mountedRef.current) {
          setLoading(false)
        }
      })
  }, [listParams, fetchList])

  const sorted = useMemo(
    () => sortAttemptLogs(rows, sortKey, sortDir),
    [rows, sortKey, sortDir],
  )

  const controlledPagination = useMemo(
    () =>
      buildControlledPagination({
        page: effectivePage,
        pageSize,
        totalCount,
        totalPages,
        setPage,
        setPageSize,
      }),
    [effectivePage, pageSize, totalCount, totalPages],
  )

  const handleSort = useCallback((key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }, [sortKey])

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

  const renderRowActions = useCallback(
    (row) => (
      <AssignedCounselorTableActions
        row={row}
        onView={() => openViewAttempt(row)}
        onAddRemark={() => setRemarkRow(row)}
      />
    ),
    [openViewAttempt],
  )

  const emptyState = (
    <div className="px-4 py-10 text-center sm:px-6">
      <p className="text-base font-semibold text-slate-700">No pending assigned attempts</p>
      <p className="mt-1 text-sm text-slate-500">All assigned counselors have completed their remarks.</p>
    </div>
  )

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-10 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <PaymentAttemptBackNav />

        <PageBanner icon={UserCheck} title="Assigned Counselor" />

        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
          <FinanceCenterFilterBar className="mb-4" sticky={false} />

          <div className="mb-4 flex min-h-14 items-center rounded-lg bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:px-4">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by attempt ID, student, mobile, or email…"
              disabled={loading && rows.length === 0}
              className="h-10 w-full max-w-md rounded-lg bg-[#eef2fc] px-4 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7] disabled:opacity-60"
            />
          </div>

          <div className="min-w-0 rounded-xl border border-slate-100">
            <PaymentAttemptTable
              rows={sorted}
              loading={loading}
              resetDeps={[listParams, sortKey, sortDir]}
              emptyMessage="No pending assigned attempts"
              emptyState={emptyState}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              renderActions={renderRowActions}
              controlledPagination={controlledPagination}
            />
          </div>
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
      <PaymentAttemptAddRemarkModal
        open={!!remarkRow}
        row={remarkRow}
        onClose={() => setRemarkRow(null)}
        onSave={handleSaveRemark}
      />
    </div>
  )
}
