import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CbtTestsManagementTable from './CbtTestsManagementTable'
import { CbtCardSearchInput, CbtTestsListCard, CBT_TABLE_SCROLL_WRAP } from './ui'
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
      if (!test?.id || !faculty?.subjectId || !topic?.id) return
      const facultyLabel =
        faculty.subjectName && faculty.facultyName
          ? `${faculty.subjectName} — ${faculty.facultyName}`
          : undefined
      navigate(
        TEST_MANAGEMENT_ROUTES.cbtTopicTestResults(faculty.subjectId, topic.id, test.id),
        {
          state: {
            topicId: topic.id,
            topicTitle: topic.title,
            testTitle: test.title,
            facultySubjectLabel: facultyLabel,
          },
        },
      )
    },
    [navigate, faculty, topic],
  )

  const hasActiveFilters = Boolean(search.trim())

  const emptyMessage = hasActiveFilters
    ? 'No tests match your search.'
    : 'No tests available for this topic.'

  return (
    <CbtTestsListCard
      title="Tests"
      subtitle={topic?.title}
      search={
        <CbtCardSearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tests..."
          disabled={loading && tests.length === 0}
        />
      }
    >
      <div className={CBT_TABLE_SCROLL_WRAP}>
        <CbtTestsManagementTable
          tests={filtered}
          loading={loading}
          resetDeps={[search, tests.length]}
          emptyMessage={emptyMessage}
          onViewTest={openResults}
        />
      </div>
    </CbtTestsListCard>
  )
}
