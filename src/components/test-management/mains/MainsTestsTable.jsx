import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Search } from 'lucide-react'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import { BannerButton, StatusBadge } from '../../academics/AcademicsUi'
import { TEST_MANAGEMENT_ROUTES } from '../../../constants/testManagementNav'
import { enrichMainsTestRow } from '../../../utils/mainsEvaluationHierarchy'

export default function MainsTestsTable({ faculty, topic, loading }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const tests = useMemo(
    () => (topic?.tests ?? []).map((t) => enrichMainsTestRow(t, faculty)),
    [topic, faculty],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return tests
    return tests.filter((t) => t.title.toLowerCase().includes(q))
  }, [tests, search])

  const openResults = (test) => {
    navigate(TEST_MANAGEMENT_ROUTES.mainsResults(faculty.subjectId, topic.id, test.id))
  }

  const columns = [
    {
      key: 'title',
      label: 'Test Name',
      render: (row) => <span className="font-medium text-[#333]">{row.title}</span>,
    },
    { key: 'uploadedDate', label: 'Uploaded Date' },
    {
      key: 'studentsAssigned',
      label: 'Students Assigned',
      render: (row) => <span className="tabular-nums">{row.studentsAssigned}</span>,
    },
    {
      key: 'studentsDownloaded',
      label: 'PDF Downloads',
      render: (row) => <span className="tabular-nums">{row.studentsDownloaded}</span>,
    },
    {
      key: 'studentsUploaded',
      label: 'Answer Sheets Uploaded',
      render: (row) => <span className="tabular-nums">{row.studentsUploaded}</span>,
    },
    {
      key: 'evaluationStatusLabel',
      label: 'Evaluation Status',
      render: (row) => <StatusBadge status={row.evaluationStatusLabel} />,
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
          onClick={() => openResults(row)}
        >
          <Eye className="h-4 w-4" />
          View Results
        </BannerButton>
      ),
    },
  ]

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--card-shadow)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <div>
          <h2 className="text-sm font-bold text-[#1a3a5c]">Tests & PDFs</h2>
          <p className="mt-0.5 text-xs text-slate-500">{topic?.title ?? ''}</p>
        </div>
        <div className="relative min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tests…"
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-[#55ace7] focus:outline-none focus:ring-2 focus:ring-[#55ace7]/20"
          />
        </div>
      </div>
      <PaginatedFigmaTable
        columns={columns}
        data={filtered}
        loading={loading}
        itemLabel="tests"
        initialPageSize={10}
        resetDeps={[search, tests.length]}
        stickyHeader
        onRowClick={openResults}
        emptyMessage="No tests available for this topic."
        rowClassName="hover:bg-slate-50/80"
      />
    </div>
  )
}
