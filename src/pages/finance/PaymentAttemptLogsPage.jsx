import { useCallback, useMemo, useState } from 'react'
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
import {
  filterAttemptLogs,
  filterAttemptsByFinanceCenters,
  sortAttemptLogs,
} from '../../utils/paymentAttemptAnalytics'
import { usePaymentAttemptLogs } from '../../contexts/PaymentAttemptLogsContext'
import { useFinanceCenterFilter } from '../../contexts/FinanceCenterFilterContext'
import { FINANCE_ROUTES } from '../../constants/financeNav'

export default function PaymentAttemptLogsPage() {
  const financeCenterFilter = useFinanceCenterFilter()
  const {
    logs,
    loading,
    sortedRemarks,
    pendingAssignedLogs,
    assignCounselor,
    saveRemark,
    deleteRemark,
    getRemarkForAttempt,
  } = usePaymentAttemptLogs()

  const [search, setSearch] = useState('')
  const [gatewayFilter, setGatewayFilter] = useState('all')
  const [failureFilter, setFailureFilter] = useState('all')
  const [counselorAssignmentFilter, setCounselorAssignmentFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortKey, setSortKey] = useState('lastAttempt')
  const [sortDir, setSortDir] = useState('desc')
  const [viewRow, setViewRow] = useState(null)
  const [counselorRow, setCounselorRow] = useState(null)
  const [remarkRow, setRemarkRow] = useState(null)
  const [viewRemark, setViewRemark] = useState(null)
  const [deleteRemarkTarget, setDeleteRemarkTarget] = useState(null)

  const filterState = useMemo(
    () => ({
      search,
      gatewayFilter,
      failureFilter,
      counselorAssignmentFilter,
      dateFrom,
      dateTo,
    }),
    [search, gatewayFilter, failureFilter, counselorAssignmentFilter, dateFrom, dateTo],
  )

  const centerScopedLogs = useMemo(
    () => filterAttemptsByFinanceCenters(logs, financeCenterFilter),
    [logs, financeCenterFilter],
  )

  const filtered = useMemo(
    () => filterAttemptLogs(centerScopedLogs, filterState),
    [centerScopedLogs, filterState],
  )

  const sorted = useMemo(
    () => sortAttemptLogs(filtered, sortKey, sortDir),
    [filtered, sortKey, sortDir],
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
    (payload) => {
      assignCounselor(payload)
      setCounselorRow(null)
    },
    [assignCounselor],
  )

  const handleSaveRemark = useCallback(
    ({ subject, failureAnalysis, remark }) => {
      if (!remarkRow) return
      saveRemark(remarkRow, { subject, failureAnalysis, remark })
      setRemarkRow(null)
    },
    [remarkRow, saveRemark],
  )

  const handleRequestDeleteRemark = useCallback((remark) => {
    setDeleteRemarkTarget(remark)
  }, [])

  const handleCancelDeleteRemark = useCallback(() => {
    setDeleteRemarkTarget(null)
  }, [])

  const handleConfirmDeleteRemark = useCallback(() => {
    if (!deleteRemarkTarget) return
    deleteRemark(deleteRemarkTarget.id)
    if (viewRemark?.id === deleteRemarkTarget.id) {
      setViewRemark(null)
    }
    setDeleteRemarkTarget(null)
  }, [deleteRemark, deleteRemarkTarget, viewRemark?.id])

  const showCounselorRemarksTable = counselorAssignmentFilter === 'all'

  const renderRowActions = useCallback(
    (row) => (
      <PaymentAttemptTableActions
        row={row}
        hasRemark={Boolean(getRemarkForAttempt(row.id))}
        onView={() => setViewRow(row)}
        onAssignCounselor={() => setCounselorRow(row)}
        onAddRemark={() => setRemarkRow(row)}
      />
    ),
    [getRemarkForAttempt],
  )

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
            {pendingAssignedLogs.length > 0 && (
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#246392]">
                {pendingAssignedLogs.length}
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
            disabled={loading && logs.length === 0}
          />

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
            <PaymentAttemptTable
              rows={sorted}
              loading={loading}
              resetDeps={[filterState, sortKey, sortDir, financeCenterFilter.selectedIds, sortedRemarks.length]}
              emptyMessage="No Payment Attempts Found"
              emptyState={emptyState}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              renderActions={renderRowActions}
            />
          </div>

          {showCounselorRemarksTable ? (
            <div className="mt-8">
              <h2 className="mb-4 text-lg font-bold text-[#1a3a5c] sm:text-xl">Counselor Remarks</h2>
              <div className="min-w-0 rounded-xl border border-slate-100">
                <CounselorRemarksTable
                  remarks={sortedRemarks}
                  onViewRemark={setViewRemark}
                  onRequestDeleteRemark={handleRequestDeleteRemark}
                  resetDeps={[sortedRemarks.length]}
                />
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <PaymentAttemptViewModal open={!!viewRow} row={viewRow} onClose={() => setViewRow(null)} />
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
        remark={viewRemark}
        onClose={() => setViewRemark(null)}
      />
      
    </div>
  )
}
