import { useCallback, useEffect, useMemo, useState } from 'react'
import { Banknote, ChevronDown, Search } from 'lucide-react'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import FinanceCenterFilterBar from '../../components/finance/FinanceCenterFilterBar'
import ConfirmOfflineDisableModal from '../../components/finance/offline-approval/ConfirmOfflineDisableModal'
import OfflineTableActions from '../../components/finance/offline-approval/OfflineTableActions'
import ProofViewerModal, { ProofThumbnail } from '../../components/finance/ProofViewerModal'
import { disableOfflinePayment, fetchOfflineApprovals } from '../../api/financeAPI'
import { FINANCE_PAYMENT_MODES } from '../../constants/financeConstants'
import { formatINR } from '../../utils/financeFilters'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { filterOfflineByFinanceCenters, resolveOfflineApprovedBy } from '../../utils/offlinePaymentApproval'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useFinanceOperations } from '../../contexts/FinanceOperationsContext'
import { useFinanceCenterFilter } from '../../contexts/FinanceCenterFilterContext'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

const MODE_OPTIONS = [
  { value: 'all', label: 'All Modes' },
  ...FINANCE_PAYMENT_MODES.map((mode) => ({ value: mode, label: mode })),
]

function adminDisplayName(user) {
  return user?.name || user?.email || 'Finance Admin'
}

function isRowDisabled(row) {
  return row.disabled || row.status === 'Disabled' || row.workflowStatus === 'Disabled'
}

export default function OfflinePaymentApprovalPage() {
  const { user } = useAuth()
  const { goToFinance } = useFinanceOperations()
  const centerFilter = useFinanceCenterFilter()

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [modeFilter, setModeFilter] = useState('all')
  const [filterDate, setFilterDate] = useState('')
  const [previewRow, setPreviewRow] = useState(null)
  const [disableRow, setDisableRow] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const filterParams = useMemo(
    () => ({
      paymentMode: modeFilter,
      status: 'all',
      dateFrom: filterDate || undefined,
      dateTo: filterDate || undefined,
      ...(centerFilter.apiParams?.centerNames?.length
        ? { centerNames: centerFilter.apiParams.centerNames.join(',') }
        : {}),
    }),
    [modeFilter, filterDate, centerFilter.apiParams],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await fetchOfflineApprovals(filterParams)
      setRequests(rows)
    } catch {
      toast.error('Failed to load offline requests')
    } finally {
      setLoading(false)
    }
  }, [filterParams])

  useEffect(() => {
    load()
  }, [load])

  const centerScopedRequests = useMemo(
    () => filterOfflineByFinanceCenters(requests, centerFilter),
    [requests, centerFilter],
  )

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return centerScopedRequests.filter((row) => {
      if (!q) return true
      return `${row.id} ${row.studentName}`.toLowerCase().includes(q)
    })
  }, [centerScopedRequests, debouncedSearch])

  const handleDisable = async () => {
    if (!disableRow) return
    setActionLoading(true)
    try {
      await disableOfflinePayment(disableRow.id, {
        adminName: adminDisplayName(user),
        comment: 'Disabled from Offline Payment Approval',
      })
      toast.success('Offline payment request disabled')
      setDisableRow(null)
      load()
    } catch (err) {
      toast.error(err?.message || 'Failed to disable request')
    } finally {
      setActionLoading(false)
    }
  }

  const renderRowActions = useCallback(
    (row) => (
      <OfflineTableActions
        row={row}
        onPreview={() => setPreviewRow(row)}
        onViewVerification={() => goToFinance('verification', { q: row.id || '' })}
        onDisable={() => setDisableRow(row)}
      />
    ),
    [goToFinance],
  )

  const columns = useMemo(
    () => [
      {
        key: 'id',
        label: 'Payment ID',
        headerClassName: 'min-w-[120px]',
        cellClassName: 'min-w-[120px] align-middle',
        render: (row) => (
          <span className="font-mono text-xs font-semibold text-[#246392]">{row.id}</span>
        ),
      },
      {
        key: 'studentName',
        label: 'Student Name',
        headerClassName: 'min-w-[160px]',
        cellClassName: 'min-w-[160px] align-middle',
        render: (row) => (
          <span className="font-semibold text-slate-900">{row.studentName}</span>
        ),
      },
      {
        key: 'branchCode',
        label: 'Branch',
        headerClassName: 'min-w-[100px] whitespace-nowrap',
        cellClassName: 'min-w-[100px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-medium text-[#111]">{row.branchCode || '—'}</span>
        ),
      },
      {
        key: 'paymentMode',
        label: 'Payment Mode',
        headerClassName: 'min-w-[130px] whitespace-nowrap',
        cellClassName: 'min-w-[130px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-medium text-[#111]">{row.paymentMode || '—'}</span>
        ),
      },
      {
        key: 'receiptNumber',
        label: 'Receipt Number',
        headerClassName: 'min-w-[130px]',
        cellClassName: 'min-w-[130px] align-middle',
        render: (row) => (
          <span className="font-mono text-xs text-[#111]">
            {row.receiptNumber || row.utrNumber || '—'}
          </span>
        ),
      },
      {
        key: 'proof',
        label: 'Uploaded Proof / PDF',
        headerClassName: 'min-w-[140px]',
        cellClassName: 'min-w-[140px] align-middle',
        render: (row) => {
          if (row.proofFiles?.[0]) {
            return (
              <ProofThumbnail proof={row.proofFiles[0]} onClick={() => setPreviewRow(row)} />
            )
          }
          if (row.paymentProof) {
            return (
              <button
                type="button"
                onClick={() => setPreviewRow(row)}
                className="max-w-[160px] truncate text-left text-xs font-medium text-[#246392] hover:underline"
              >
                {row.paymentProof.split(',')[0]}
              </button>
            )
          }
          return <span className="text-xs text-[#686868]">—</span>
        },
      },
      {
        key: 'approvedBy',
        label: 'Approved By',
        headerClassName: 'min-w-[130px]',
        cellClassName: 'min-w-[130px] align-middle',
        render: (row) => (
          <span className="text-[13px] font-medium text-[#111]">
            {resolveOfflineApprovedBy(row)}
          </span>
        ),
      },
      {
        key: 'updatedAt',
        label: 'Updated On',
        headerClassName: 'min-w-[150px] whitespace-nowrap',
        cellClassName: 'min-w-[150px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="text-[13px] font-medium text-[#686868]">
            {formatCategoryDateTime(row.updatedAt || row.requestedDate)}
          </span>
        ),
      },
      {
        key: 'amount',
        label: 'Amount',
        headerClassName: 'min-w-[110px] whitespace-nowrap',
        cellClassName: 'min-w-[110px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-semibold text-[#111]">{formatINR(row.amount)}</span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        headerClassName: 'min-w-[280px] whitespace-nowrap pr-4 sm:pr-6',
        cellClassName: 'min-w-[280px] whitespace-nowrap align-middle pr-4 sm:pr-6',
        render: (row) => renderRowActions(row),
      },
    ],
    [renderRowActions],
  )

  const emptyState = (
    <div className="px-4 py-10 text-center sm:px-6">
      <p className="text-base font-semibold text-slate-700">No offline payment requests found</p>
      <p className="mt-1 text-sm text-slate-500">Try changing filters or search criteria.</p>
    </div>
  )

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-10 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <PageBanner icon={Banknote} title="Offline Payment Approval" />

        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
          <FinanceCenterFilterBar className="mb-4" sticky={false} />

          <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:px-4">
            <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180] sm:left-4" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Payment ID / Student Name"
                disabled={loading && requests.length === 0}
                className="h-10 w-full min-h-[38px] rounded-lg bg-[#eef2fc] pl-10 pr-3 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7] disabled:opacity-60 sm:pl-11 sm:text-base"
              />
            </div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                aria-label="Filter date"
                title="MM/DD/YYYY"
                disabled={loading && requests.length === 0}
                className="h-10 w-full min-h-[38px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-[#222] outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20 disabled:opacity-60 sm:min-w-[150px] sm:w-auto"
              />
              <div className="relative w-full sm:w-auto sm:min-w-[150px]">
                <select
                  value={modeFilter}
                  onChange={(e) => setModeFilter(e.target.value)}
                  aria-label="Payment mode"
                  disabled={loading && requests.length === 0}
                  className="h-10 w-full min-h-[38px] appearance-none rounded-lg border-0 bg-[#55ace7] pl-4 pr-9 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#246392]/50 disabled:opacity-60 sm:text-base"
                >
                  {MODE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white text-[#222]">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
              </div>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
            <PaginatedFigmaTable
              columns={columns}
              data={filtered}
              loading={loading}
              emptyMessage="No offline payment requests found"
              emptyState={emptyState}
              itemLabel="requests"
              skeletonRowCount={8}
              resetDeps={[debouncedSearch, modeFilter, filterDate, centerFilter.selectedIds]}
              density="comfortable"
              rowClassName={(row) =>
                cn(
                  'hover:bg-[#eef6fc]/70',
                  isRowDisabled(row) && 'opacity-60',
                )
              }
              tableClassName="rounded-none border-0 shadow-none"
              tableMinWidth={1180}
              paginationClassName={cn(
                '[&>div:last-child]:items-center',
                '[&_nav]:items-center',
                '[&_form]:flex [&_form]:items-center [&_form]:gap-2',
                '[&_form_input]:h-9 [&_form_input]:leading-none',
                '[&_form_button]:inline-flex [&_form_button]:h-9 [&_form_button]:items-center [&_form_button]:justify-center',
              )}
            />
          </div>
        </div>
      </section>

      <ProofViewerModal
        open={!!previewRow}
        onClose={() => setPreviewRow(null)}
        title="Uploaded proof"
        proofFiles={previewRow?.proofFiles}
        proofName={previewRow?.paymentProof?.split(',')[0]}
        utr={previewRow?.utrNumber || previewRow?.receiptNumber}
        row={previewRow}
      />

      <ConfirmOfflineDisableModal
        open={!!disableRow}
        paymentId={disableRow?.id}
        studentName={disableRow?.studentName}
        loading={actionLoading}
        onCancel={() => {
          if (!actionLoading) setDisableRow(null)
        }}
        onConfirm={handleDisable}
      />
    </div>
  )
}
