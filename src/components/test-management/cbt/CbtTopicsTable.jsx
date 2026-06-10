import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Search } from 'lucide-react'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import { BannerButton } from '../../academics/AcademicsUi'
import { TEST_MANAGEMENT_ROUTES } from '../../../constants/testManagementNav'
import { getCbtTopics } from '../../../utils/cbtTestSeriesHierarchy'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'

export default function CbtTopicsTable({ faculty, loading }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const topics = useMemo(() => getCbtTopics(faculty), [faculty])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return topics
    return topics.filter((t) => t.title.toLowerCase().includes(q))
  }, [topics, search])

  const openTopic = (topic) => {
    navigate(TEST_MANAGEMENT_ROUTES.cbtTopic(faculty.subjectId, topic.id))
  }

  const columns = [
    {
      key: 'title',
      label: 'Topic',
      render: (row) => (
        <button
          type="button"
          onClick={() => openTopic(row)}
          className="font-semibold text-[#1a3a5c] underline-offset-2 hover:text-[#55ace7] hover:underline"
        >
          {row.title}
        </button>
      ),
    },
    {
      key: 'testCount',
      label: 'Test Series',
      render: (row) => <span className="tabular-nums font-semibold">{row.testCount}</span>,
    },
    {
      key: 'updatedAt',
      label: 'Last Updated',
      render: (row) => (
        <span className="text-sm text-slate-600">
          {row.updatedAt ? formatCategoryDateTime(row.updatedAt) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <BannerButton type="button" variant="secondary" className="!px-3 !py-1.5" onClick={() => openTopic(row)}>
          <Eye className="h-4 w-4" />
          View Tests
        </BannerButton>
      ),
    },
  ]

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--card-shadow)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <div>
          <h2 className="text-sm font-bold text-[#1a3a5c]">Topics</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {faculty ? `${faculty.subjectName} — ${faculty.facultyName}` : ''}
          </p>
        </div>
        <div className="relative min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics…"
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-[#55ace7] focus:outline-none focus:ring-2 focus:ring-[#55ace7]/20"
          />
        </div>
      </div>
      <PaginatedFigmaTable
        columns={columns}
        data={filtered}
        loading={loading}
        itemLabel="topics"
        initialPageSize={10}
        resetDeps={[search, topics.length]}
        stickyHeader
        onRowClick={openTopic}
        emptyMessage="No topics available for this faculty."
        rowClassName="hover:bg-slate-50/80"
      />
    </div>
  )
}
