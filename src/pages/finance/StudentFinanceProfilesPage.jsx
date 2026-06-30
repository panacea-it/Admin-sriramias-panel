import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { UserCircle, Eye } from 'lucide-react'
import FinancePageShell from '../../components/finance/FinancePageShell'
import FinanceCenterFilterBar from '../../components/finance/FinanceCenterFilterBar'
import FinanceStatusBadge from '../../components/finance/FinanceStatusBadge'
import FinanceSearchInput from '../../components/finance/FinanceSearchInput'
import FinanceStatCard from '../../components/finance/FinanceStatCard'
import FinanceTableSkeleton from '../../components/finance/FinanceTableSkeleton'
import FinanceEmptyState from '../../components/finance/FinanceEmptyState'
import FinanceActionMenu from '../../components/finance/FinanceActionMenu'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import ProfileListMobileCard from '../../components/finance/student-profiles/ProfileListMobileCard'
import {
  fetchStudentFinanceFilterOptions,
  fetchStudentFinanceDashboard,
} from '../../api/studentFinanceProfilesAPI'
import { formatINR } from '../../utils/financeFilters'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useFinanceOperations } from '../../contexts/FinanceOperationsContext'
import { useFinanceCenterFilter } from '../../contexts/FinanceCenterFilterContext'
import { buildFilterSignature, createListFetchGuard, useEffectivePage } from '../../hooks/useMasterListQuery'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

const DEFAULT_PAGE_SIZE = 10
const listFetchGuard = createListFetchGuard()

export default function StudentFinanceProfilesPage() {
  const { openStudentProfile, refreshToken } = useFinanceOperations()
  const financeCenterFilter = useFinanceCenterFilter()
  const [filterOptions, setFilterOptions] = useState(null)
  const [rows, setRows] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [bootstrapping, setBootstrapping] = useState(true)
  const [listLoading, setListLoading] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 400)
  const [courseFilter, setCourseFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [loanFilter, setLoanFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const centreId = useMemo(() => {
    if (financeCenterFilter.isOverallView) return ''
    if (financeCenterFilter.selectedIds.length === 1) return financeCenterFilter.selectedIds[0]
    return ''
  }, [financeCenterFilter.isOverallView, financeCenterFilter.selectedIds])

  const filterSignature = buildFilterSignature([
    debouncedSearch,
    centreId,
    courseFilter,
    statusFilter,
    sourceFilter,
    loanFilter,
    dateFrom,
    dateTo,
    pageSize,
  ])
  const effectivePage = useEffectivePage(page, setPage, filterSignature)

  const listParams = useMemo(
    () => ({
      search: debouncedSearch.trim(),
      centreId,
      courseId: courseFilter !== 'all' ? courseFilter : '',
      source: sourceFilter !== 'all' ? sourceFilter : '',
      loanStatus: loanFilter !== 'all' ? loanFilter : '',
      paymentStatus: statusFilter !== 'all' ? statusFilter : '',
      fromDate: dateFrom || '',
      toDate: dateTo || '',
      page: effectivePage,
      limit: pageSize,
      sortBy: 'lastUpdated',
      sortOrder: 'desc',
    }),
    [
      debouncedSearch,
      centreId,
      courseFilter,
      statusFilter,
      sourceFilter,
      loanFilter,
      dateFrom,
      dateTo,
      effectivePage,
      pageSize,
    ],
  )

  const fetchList = useCallback(async (params, { signal } = {}) => {
    const result = await fetchStudentFinanceDashboard(params, { signal })
    if (!mountedRef.current) return
    setRows(result.items)
    setStatistics(result.statistics)
    setTotalCount(result.totalCount)
    setTotalPages(result.totalPages || 1)
  }, [])

  const loadBootstrap = useCallback(async () => {
    setBootstrapping(true)
    try {
      const options = await fetchStudentFinanceFilterOptions()
      if (!mountedRef.current) return
      setFilterOptions(options)
    } catch {
      if (mountedRef.current) toast.error('Failed to load filter options')
    } finally {
      if (mountedRef.current) setBootstrapping(false)
    }
  }, [])

  useEffect(() => {
    loadBootstrap()
  }, [refreshToken, loadBootstrap])

  useEffect(() => {
    const ctx = listFetchGuard.beginRequest()
    if (!ctx) return
    const { controller, seq } = ctx

    setListLoading(true)
    fetchList(listParams, { signal: controller.signal })
      .catch((error) => {
        if (!listFetchGuard.shouldApplyResult(seq, controller)) return
        if (listFetchGuard.isAbortError(error)) return
        listFetchGuard.toastListError(
          listFetchGuard.getListErrorMessage(error, 'Failed to load student finance profiles'),
        )
      })
      .finally(() => {
        if (listFetchGuard.endRequest(seq) && mountedRef.current) {
          setListLoading(false)
        }
      })
  }, [listParams, refreshToken, fetchList])

  const openProfile = (profile) => {
    openStudentProfile(profile.id, profile)
  }

  const profileColumns = [
    { key: 'id', label: 'Student ID', render: (r) => <span className="font-mono text-xs text-[#246392]">{r.id}</span> },
    { key: 'studentName', label: 'Student', render: (r) => <span className="font-medium">{r.studentName}</span> },
    { key: 'primaryCourse', label: 'Course' },
    {
      key: 'enrollmentSource',
      label: 'Source',
      render: (r) => (
        <span className={cn('rounded-md px-2 py-0.5 text-xs font-semibold', r.enrollmentSourceColor)}>
          {r.enrollmentSourceLabel}
        </span>
      ),
    },
    { key: 'totalFees', label: 'Total fees', render: (r) => formatINR(r.totalFees) },
    { key: 'totalPaid', label: 'Paid', render: (r) => formatINR(r.totalPaid) },
    { key: 'totalPending', label: 'Pending', render: (r) => formatINR(r.totalPending) },
    { key: 'emiStatus', label: 'EMI', render: (r) => <FinanceStatusBadge status={r.emiStatus} className="text-xs" /> },
    { key: 'loanStatus', label: 'Loan', render: (r) => <FinanceStatusBadge status={r.loanStatus} className="text-xs" /> },
    { key: 'walletBalance', label: 'Wallet', render: (r) => formatINR(r.walletBalance) },
    { key: 'riskScore', label: 'Risk', render: (r) => <span className="font-semibold tabular-nums">{r.riskScore}</span> },
    { key: 'updatedAt', label: 'Updated', render: (r) => (r.updatedAt ? formatCategoryDateTime(r.updatedAt) : '—') },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <FinanceActionMenu
          actions={[
            {
              label: 'View profile',
              icon: Eye,
              onClick: () => openProfile(row),
              ariaLabel: `View profile for ${row.studentName}`,
            },
          ]}
        />
      ),
    },
  ]

  const selectClass =
    'h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm transition focus:border-[#55ace7] focus:outline-none focus:ring-2 focus:ring-[#55ace7]/20'

  const pagination = useMemo(() => {
    const safePage = Math.min(Math.max(1, page), totalPages || 1)
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
  }, [page, pageSize, totalCount, totalPages])

  const controlledPagination = useMemo(
    () => ({
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems: pagination.totalItems,
      totalPages: pagination.totalPages,
      startIndex: pagination.startIndex,
      endIndex: pagination.endIndex,
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
    }),
    [pagination],
  )

  const loading = bootstrapping || listLoading
  const stats = statistics || {
    totalProfiles: 0,
    totalCollected: 0,
    totalPending: 0,
    averageRiskScore: 0,
  }

  return (
    <FinancePageShell
      icon={UserCircle}
      title="Student Finance Profiles"
      breadcrumbs={[{ label: 'Student Finance Profiles' }]}
    >
      <FinanceCenterFilterBar className="mb-1" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FinanceStatCard label="Total profiles" value={stats.totalProfiles} />
        <FinanceStatCard label="Total collected" value={formatINR(stats.totalCollected)} />
        <FinanceStatCard
          label="Total pending"
          value={formatINR(stats.totalPending)}
          accent="from-[#efb36d] to-[#b8887a]"
        />
        <FinanceStatCard
          label="Avg risk score"
          value={stats.averageRiskScore ?? 0}
          accent="from-[#df8284] to-[#b85c5e]"
        />
      </div>

      <div className="sticky top-0 z-10 -mx-1 rounded-[12px] border border-slate-200/80 bg-white/95 p-4 shadow-[0_5px_20px_rgba(0,0,0,0.08)] backdrop-blur sm:static sm:border sm:bg-white sm:p-5">
        <div className="flex flex-col gap-4">
          <FinanceSearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, ID, course…"
            className="w-full"
            inputClassName="h-10"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className={selectClass}
              aria-label="Course"
              disabled={bootstrapping}
            >
              <option value="all">All courses</option>
              {(filterOptions?.courses || []).map((c) => (
                <option key={c.courseId} value={c.courseId}>
                  {c.courseName}
                </option>
              ))}
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className={selectClass}
              aria-label="Enrollment source"
              disabled={bootstrapping}
            >
              <option value="all">All sources</option>
              {(filterOptions?.sources || []).map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              value={loanFilter}
              onChange={(e) => setLoanFilter(e.target.value)}
              className={selectClass}
              aria-label="Loan status"
              disabled={bootstrapping}
            >
              <option value="all">All loan statuses</option>
              {(filterOptions?.loanStatuses || []).map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={selectClass}
              aria-label="Payment status"
              disabled={bootstrapping}
            >
              <option value="all">All statuses</option>
              {(filterOptions?.paymentStatuses || []).map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={selectClass}
              aria-label="From date"
              disabled={bootstrapping}
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={selectClass}
              aria-label="To date"
              disabled={bootstrapping}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <FinanceTableSkeleton rows={8} columns={8} />
      ) : rows.length === 0 ? (
        <FinanceEmptyState title="No student profiles" description="Adjust filters or wait for student finance records." />
      ) : (
        <>
          <div className="hidden md:block">
            <h3 className="mb-3 text-sm font-bold text-[#246392]">Student profiles</h3>
            <PaginatedFigmaTable
              columns={profileColumns}
              data={rows}
              itemLabel="profiles"
              controlledPagination={controlledPagination}
              tableClassName="overflow-x-auto [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-[1] [&_thead]:bg-white"
            />
          </div>
          <div className="grid gap-3 md:hidden">
            {rows.map((row) => (
              <ProfileListMobileCard key={row.id} row={row} onView={openProfile} />
            ))}
          </div>
        </>
      )}
    </FinancePageShell>
  )
}
