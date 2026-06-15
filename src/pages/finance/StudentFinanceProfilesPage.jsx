import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { fetchStudentFinanceProfiles } from '../../api/financeAPI'
import { formatINR } from '../../utils/financeFilters'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { filterStudentProfiles, filterProfilesByFinanceCenters } from '../../utils/studentFinanceProfile'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useFinanceOperations } from '../../contexts/FinanceOperationsContext'
import { useFinanceCenterFilter } from '../../contexts/FinanceCenterFilterContext'
import { FINANCE_COURSES } from '../../data/financeMockData'
import { ENROLLMENT_SOURCES, LOAN_STATUSES } from '../../constants/studentFinanceProfiles'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

export default function StudentFinanceProfilesPage() {
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

  return (
    <FinancePageShell
      icon={UserCircle}
      title="Student Finance Profiles"
      breadcrumbs={[{ label: 'Student Finance Profiles' }]}
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
