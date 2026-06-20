import { useCallback, useMemo, useState } from 'react'
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
import {
  filterAttemptLogs,
  filterAttemptsByFinanceCenters,
  sortAttemptLogs,
} from '../../utils/paymentAttemptAnalytics'
import { usePaymentAttemptLogs } from '../../contexts/PaymentAttemptLogsContext'
import { useFinanceCenterFilter } from '../../contexts/FinanceCenterFilterContext'

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
  const { pendingAssignedLogs, loading, saveRemark } = usePaymentAttemptLogs()

  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('lastAttempt')
  const [sortDir, setSortDir] = useState('desc')
  const [viewRow, setViewRow] = useState(null)
  const [remarkRow, setRemarkRow] = useState(null)

  const filterState = useMemo(() => ({ search }), [search])

  const centerScopedLogs = useMemo(
    () => filterAttemptsByFinanceCenters(pendingAssignedLogs, financeCenterFilter),
    [pendingAssignedLogs, financeCenterFilter],
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

  const handleSaveRemark = useCallback(
    ({ subject, failureAnalysis, remark }) => {
      if (!remarkRow) return
      saveRemark(remarkRow, { subject, failureAnalysis, remark })
      setRemarkRow(null)
    },
    [remarkRow, saveRemark],
  )

  const renderRowActions = useCallback(
    (row) => (
      <AssignedCounselorTableActions
        row={row}
        onView={() => setViewRow(row)}
        onAddRemark={() => setRemarkRow(row)}
      />
    ),
    [],
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
              disabled={loading && pendingAssignedLogs.length === 0}
              className="h-10 w-full max-w-md rounded-lg bg-[#eef2fc] px-4 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7] disabled:opacity-60"
            />
          </div>

          <div className="min-w-0 rounded-xl border border-slate-100">
            <PaymentAttemptTable
              rows={sorted}
              loading={loading}
              resetDeps={[filterState, sortKey, sortDir, financeCenterFilter.selectedIds, pendingAssignedLogs.length]}
              emptyMessage="No pending assigned attempts"
              emptyState={emptyState}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              renderActions={renderRowActions}
            />
          </div>
        </div>
      </section>

      <PaymentAttemptViewModal open={!!viewRow} row={viewRow} onClose={() => setViewRow(null)} />
      <PaymentAttemptAddRemarkModal
        open={!!remarkRow}
        row={remarkRow}
        onClose={() => setRemarkRow(null)}
        onSave={handleSaveRemark}
      />
    </div>
  )
}
