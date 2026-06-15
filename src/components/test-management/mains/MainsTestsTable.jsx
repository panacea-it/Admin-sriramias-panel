import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CourseFilterToolbar from '../../courses/CourseFilterToolbar'
import MainsTestsManagementTable from './MainsTestsManagementTable'
import MainsTestsTableActions from './MainsTestsTableActions'
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

  const openResults = useCallback(
    (test) => {
      navigate(TEST_MANAGEMENT_ROUTES.mainsResults(faculty.subjectId, topic.id, test.id))
    },
    [navigate, faculty, topic],
  )

  const renderRowActions = useCallback(
    (row) => <MainsTestsTableActions row={row} onView={() => openResults(row)} />,
    [openResults],
  )

  const hasActiveFilters = Boolean(search.trim())

  const emptyMessage = hasActiveFilters
    ? 'No tests match your search.'
    : 'No tests available for this topic.'

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
      <CourseFilterToolbar
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        searchPlaceholder="Search tests…"
        showStatusFilter={false}
        searchFullWidth
        disabled={loading && tests.length === 0}
      />

      <div className="mt-5 w-full max-w-full overflow-x-auto rounded-xl border border-slate-100">
        <MainsTestsManagementTable
          tests={filtered}
          loading={loading}
          resetDeps={[search, tests.length]}
          emptyMessage={emptyMessage}
          renderActions={renderRowActions}
        />
      </div>
    </div>
  )
}
