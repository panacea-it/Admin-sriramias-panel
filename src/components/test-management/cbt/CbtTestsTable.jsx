import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CourseFilterToolbar from '../../courses/CourseFilterToolbar'
import CbtTestsManagementTable from './CbtTestsManagementTable'
import CbtTestsTableActions from './CbtTestsTableActions'
import { TEST_MANAGEMENT_ROUTES } from '../../../constants/testManagementNav'
import { enrichCbtTestRow } from '../../../utils/cbtTestSeriesHierarchy'

function collectTestSeries(nodes = []) {
  const list = []
  const walk = (items) => {
    for (const node of items || []) {
      if (node.type === 'testSeries') list.push(node)
      if (node.children?.length) walk(node.children)
    }
  }
  walk(nodes)
  return list
}

export default function CbtTestsTable({ faculty, topic, tests: testsProp, loading }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const tests = useMemo(() => {
    if (Array.isArray(testsProp)) return testsProp
    const nodes = collectTestSeries(topic?.children || [])
    return nodes.map((n) => enrichCbtTestRow(n, faculty))
  }, [testsProp, topic, faculty])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return tests
    return tests.filter((t) => t.title.toLowerCase().includes(q))
  }, [tests, search])

  const openResults = useCallback(
    (test) => {
      navigate(TEST_MANAGEMENT_ROUTES.cbtResults(faculty.subjectId, test.id), {
        state: { topicId: topic?.id, topicTitle: topic?.title },
      })
    },
    [navigate, faculty, topic],
  )

  const renderRowActions = useCallback(
    (row) => <CbtTestsTableActions onView={() => openResults(row)} />,
    [openResults],
  )

  const hasActiveFilters = Boolean(search.trim())

  const emptyMessage = hasActiveFilters
    ? 'No tests match your search.'
    : 'No tests available for this topic.'

  return (
    <div className="box-border flex w-full max-w-full flex-col rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
      <CourseFilterToolbar
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        searchPlaceholder="Search tests…"
        showStatusFilter={false}
        searchFullWidth
        disabled={loading && tests.length === 0}
      />

      <div className="mt-5 w-full max-w-full overflow-x-auto rounded-xl border border-slate-100">
        <CbtTestsManagementTable
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
