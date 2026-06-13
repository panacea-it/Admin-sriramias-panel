import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Search } from 'lucide-react'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import { BannerButton } from '../../academics/AcademicsUi'
import { TEST_MANAGEMENT_ROUTES } from '../../../constants/testManagementNav'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'

export default function MainsFacultySubjectsTable({ rows, loading }) {
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
    navigate(TEST_MANAGEMENT_ROUTES.mainsFaculty(row.subjectId))
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
          {row.subjectName} by {row.facultyName}
        </button>
      ),
    },
    {
      key: 'totalTopics',
      label: 'Topics',
      render: (row) => <span className="tabular-nums font-semibold">{row.totalTopics}</span>,
    },
    {
      key: 'totalTests',
      label: 'Tests / PDFs',
      render: (row) => <span className="tabular-nums">{row.totalTests}</span>,
    },
    {
      key: 'lastUpdated',
      label: 'Last Updated',
      render: (row) => (
        <span className="text-sm text-slate-600">
          {row.lastUpdated ? formatCategoryDateTime(row.lastUpdated) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <BannerButton
          type="button"
          variant="secondary"
          showPlusIcon={false}
          className="!px-3 !py-1.5"
          onClick={() => openFaculty(row)}
        >
          <Eye className="h-4 w-4" />
          View Topics
        </BannerButton>
      ),
    },
  ]

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--card-shadow)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <div>
          <h2 className="text-sm font-bold text-[#1a3a5c]">Faculty Subjects</h2>
          <p className="mt-0.5 text-xs text-slate-500">Mains Answer Writing — select a subject to view topics</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Faculty Subject"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-[#55ace7] focus:outline-none focus:ring-2 focus:ring-[#55ace7]/20"
            />
          </div>
        </div>
      </div>
      <PaginatedFigmaTable
        columns={columns}
        data={filtered}
        loading={loading}
        itemLabel="faculty subjects"
        initialPageSize={10}
        resetDeps={[search, rows.length]}
        stickyHeader
        onRowClick={openFaculty}
        emptyMessage="No faculty subjects with Mains tests available."
        rowClassName="hover:bg-slate-50/80"
      />
    </div>
  )
}
