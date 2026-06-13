import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Search } from 'lucide-react'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import { BannerButton } from '../../academics/AcademicsUi'
import { TEST_MANAGEMENT_ROUTES } from '../../../constants/testManagementNav'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'

function formatLastUpdated(iso) {
  if (!iso) return '—'
  return formatCategoryDateTime(iso)
}

export default function CbtMappingTable({ rows, loading }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.subjectName.toLowerCase().includes(q) ||
        r.facultyName.toLowerCase().includes(q),
    )
  }, [rows, search])

  const openFaculty = (row) => {
    navigate(TEST_MANAGEMENT_ROUTES.cbtFaculty(row.subjectId))
  }

  const columns = [
    {
      key: 'subjectName',
      label: 'Faculty Subject',
      render: (row) => (
        <button
          type="button"
          onClick={() => openFaculty(row)}
          className="font-semibold text-[#1a3a5c] underline-offset-2 hover:text-[#55ace7] hover:underline"
        >
          {row.subjectName}
        </button>
      ),
    },
    {
      key: 'facultyName',
      label: 'Faculty Name',
      render: (row) => (
        <button
          type="button"
          onClick={() => openFaculty(row)}
          className="font-medium text-[#333] underline-offset-2 hover:text-[#55ace7] hover:underline"
        >
          {row.facultyName}
        </button>
      ),
    },
    {
      key: 'totalTopics',
      label: 'Total Topics',
      render: (row) => <span className="font-semibold tabular-nums">{row.totalTopics ?? 0}</span>,
    },
    {
      key: 'totalTestSeries',
      label: 'Total Test Series',
      render: (row) => <span className="font-semibold tabular-nums">{row.totalTestSeries}</span>,
    },
    {
      key: 'studentsAttempted',
      label: 'Total Students Attempted',
      render: (row) => <span className="tabular-nums">{row.studentsAttempted.toLocaleString()}</span>,
    },
    {
      key: 'averageScorePct',
      label: 'Average Score',
      render: (row) => (
        <span className="font-semibold text-[#55ace7] tabular-nums">{row.averageScorePct}%</span>
      ),
    },
    {
      key: 'lastUpdated',
      label: 'Last Updated',
      render: (row) => (
        <span className="text-sm text-slate-600">{formatLastUpdated(row.lastUpdated)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <BannerButton
          type="button"
          variant="secondary"
          className="!px-3 !py-1.5"
          showPlusIcon={false}
          onClick={() => openFaculty(row)}
        >
          <Eye className="h-4 w-4" />
          View
        </BannerButton>
      ),
    },
  ]

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--card-shadow)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <div>
          <h2 className="text-sm font-bold text-[#1a3a5c]">Academic Test Mapping</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Synced from Faculty Subjects — TEST category only
          </p>
        </div>
        <div className="relative min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subject or faculty…"
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-[#55ace7] focus:outline-none focus:ring-2 focus:ring-[#55ace7]/20"
          />
        </div>
      </div>
      <PaginatedFigmaTable
        columns={columns}
        data={filtered}
        loading={loading}
        itemLabel="mappings"
        initialPageSize={10}
        resetDeps={[search, rows.length]}
        stickyHeader
        onRowClick={openFaculty}
        emptyMessage="No TEST category mappings found. Add Test Series under Faculty Subjects."
        rowClassName="hover:bg-slate-50/80"
      />
      {!loading && filtered.length > 0 && (
        <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
          Click any row, faculty subject, faculty name, or View to open test series details.
        </p>
      )}
    </div>
  )
}
