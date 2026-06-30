import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CourseFilterToolbar from '../../courses/CourseFilterToolbar'
import CbtTestsManagementTable from './CbtTestsManagementTable'
import { CBT_DATA_PANEL, CBT_TABLE_CONTAINER } from './ui'
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
    if (Array.isArray(testsProp) && testsProp.length > 0) return testsProp
    const nodes = collectTestSeries(topic?.children || [])
    if (nodes.length > 0) {
      return nodes.map((n) => enrichCbtTestRow(n, faculty))
    }
    return Array.isArray(testsProp) ? testsProp : []
  }, [testsProp, topic, faculty])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return tests
    return tests.filter((t) => t.title.toLowerCase().includes(q))
  }, [tests, search])

  const openResults = useCallback(
    (test) => {
      if (!test?.id || !faculty?.subjectId) return
      navigate(TEST_MANAGEMENT_ROUTES.cbtResults(faculty.subjectId, test.id), {
        state: { topicId: topic?.id, topicTitle: topic?.title },
      })
    },
    [navigate, faculty, topic],
  )

  const hasActiveFilters = Boolean(search.trim())

  const emptyMessage = hasActiveFilters
    ? 'No tests match your search.'
    : 'No tests available for this topic.'

  return (
    <section className={CBT_DATA_PANEL}>
      <CourseFilterToolbar
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        searchPlaceholder="Search tests..."
        showStatusFilter={false}
        searchFullWidth
        disabled={loading && tests.length === 0}
      />

      <div className={CBT_TABLE_CONTAINER}>
        <CbtTestsManagementTable
          tests={filtered}
          loading={loading}
          resetDeps={[search, tests.length]}
          emptyMessage={emptyMessage}
          onViewTest={openResults}
        />
      </div>
    </section>
  )
}
