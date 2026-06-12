import { useCallback, useEffect, useMemo, useState } from 'react'
import { UserCircle, Eye, RotateCcw } from 'lucide-react'
import FinancePageShell from '../../components/finance/FinancePageShell'
import FinanceCenterFilterBar from '../../components/finance/FinanceCenterFilterBar'
import FinanceStatusBadge from '../../components/finance/FinanceStatusBadge'
import FinanceSearchInput from '../../components/finance/FinanceSearchInput'
import FinanceStatCard from '../../components/finance/FinanceStatCard'
import FinanceTableSkeleton from '../../components/finance/FinanceTableSkeleton'
import FinanceEmptyState from '../../components/finance/FinanceEmptyState'
import FinanceExportToolbar from '../../components/finance/FinanceExportToolbar'
import FinanceActionMenu from '../../components/finance/FinanceActionMenu'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import ProfileListMobileCard from '../../components/finance/student-profiles/ProfileListMobileCard'
import { fetchStudentFinanceProfiles } from '../../api/financeAPI'
import { formatINR } from '../../utils/financeFilters'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { filterStudentProfiles, filterProfilesByFinanceCenters } from '../../utils/studentFinanceProfile'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useFinancePermissions } from '../../hooks/useFinancePermissions'
import { useFinanceOperations } from '../../contexts/FinanceOperationsContext'
import { useFinanceCenterFilter } from '../../contexts/FinanceCenterFilterContext'
import { FINANCE_COURSES } from '../../data/financeMockData'
import { ENROLLMENT_SOURCES, LOAN_STATUSES, PROFILE_EXPORT_COLUMNS } from '../../constants/studentFinanceProfiles'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

export default function StudentFinanceProfilesPage() {
  const { canExport } = useFinancePermissions()
  const { openStudentProfile } = useFinanceOperations()
  const financeCenterFilter = useFinanceCenterFilter()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [courseFilter, setCourseFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [loanFilter, setLoanFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setProfiles(await fetchStudentFinanceProfiles())
    } catch {
      toast.error('Failed to load profiles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const centerScopedProfiles = useMemo(
    () => filterProfilesByFinanceCenters(profiles, financeCenterFilter),
    [profiles, financeCenterFilter],
  )

  const filtered = useMemo(() => {
    const courseName = courseFilter !== 'all' ? FINANCE_COURSES.find((c) => c.id === courseFilter)?.name : 'all'
    return filterStudentProfiles(centerScopedProfiles, {
      search: debouncedSearch,
      course: courseName === 'all' ? 'all' : courseName,
      status: statusFilter,
      source: sourceFilter,
      loanStatus: loanFilter,
      dateFrom,
      dateTo,
    })
  }, [centerScopedProfiles, debouncedSearch, courseFilter, statusFilter, sourceFilter, loanFilter, dateFrom, dateTo])

  const openProfile = (profile) => {
    openStudentProfile(profile.id, profile)
  }

  const resetFilters = () => {
    setSearch('')
    setCourseFilter('all')
    setStatusFilter('all')
    setSourceFilter('all')
    setLoanFilter('all')
    setDateFrom('')
    setDateTo('')
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
    'h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20'

  return (
    <FinancePageShell
      icon={UserCircle}
      title="Student Finance Profiles"
      breadcrumbs={[{ label: 'Student Finance Profiles' }]}
      actions={
        <FinanceExportToolbar
          rows={filtered}
          filenameBase="student-finance-profiles"
          columnDefs={PROFILE_EXPORT_COLUMNS}
          canExport={canExport}
          variant="banner"
        />
      }
    >
      <FinanceCenterFilterBar className="mb-1" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FinanceStatCard label="Total profiles" value={filtered.length} />
        <FinanceStatCard
          label="Total collected"
          value={formatINR(filtered.reduce((s, p) => s + (p.totalPaid || 0), 0))}
        />
        <FinanceStatCard
          label="Total pending"
          value={formatINR(filtered.reduce((s, p) => s + (p.totalPending || 0), 0))}
          accent="from-[#efb36d] to-[#b8887a]"
        />
        <FinanceStatCard
          label="Avg risk score"
          value={
            filtered.length
              ? Math.round(filtered.reduce((s, p) => s + (p.riskScore || 0), 0) / filtered.length)
              : 0
          }
          accent="from-[#df8284] to-[#b85c5e]"
        />
      </div>

      <div className="sticky top-0 z-10 -mx-1 rounded-xl border border-slate-100 bg-white/95 p-3 shadow-sm backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <FinanceSearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, ID, course…"
              className="max-w-md flex-1"
            />
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-[#686868] hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className={selectClass} aria-label="Course">
              <option value="all">All courses</option>
              {FINANCE_COURSES.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className={selectClass} aria-label="Enrollment source">
              <option value="all">All sources</option>
              {ENROLLMENT_SOURCES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <select value={loanFilter} onChange={(e) => setLoanFilter(e.target.value)} className={selectClass} aria-label="Loan status">
              <option value="all">All loan statuses</option>
              {LOAN_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass} aria-label="Payment status">
              <option value="all">All statuses</option>
              {['Paid', 'Partial', 'Pending', 'EMI Running'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectClass} aria-label="From date" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectClass} aria-label="To date" />
          </div>
        </div>
      </div>

      {loading ? (
        <FinanceTableSkeleton rows={8} columns={8} />
      ) : filtered.length === 0 ? (
        <FinanceEmptyState title="No student profiles" description="Adjust filters or wait for student finance records." />
      ) : (
        <>
          <div className="hidden md:block">
            <h3 className="mb-3 text-sm font-bold text-[#246392]">Student profiles</h3>
            <PaginatedFigmaTable
              columns={profileColumns}
              data={filtered}
              itemLabel="profiles"
              resetDeps={[debouncedSearch, financeCenterFilter.selectedIds, courseFilter, statusFilter, sourceFilter, loanFilter, dateFrom, dateTo]}
              tableClassName="overflow-x-auto [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-[1] [&_thead]:bg-white"
            />
          </div>
          <div className="grid gap-3 md:hidden">
            {filtered.map((row) => (
              <ProfileListMobileCard key={row.id} row={row} onView={openProfile} />
            ))}
          </div>
        </>
      )}
    </FinancePageShell>
  )
}
