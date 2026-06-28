import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import CourseFilterToolbar from '../../courses/CourseFilterToolbar'
import MainsTestsManagementTable from './MainsTestsManagementTable'
import MainsTestsTableActions from './MainsTestsTableActions'
import { TEST_MANAGEMENT_ROUTES } from '../../../constants/testManagementNav'
import { mmSession } from '../../../utils/mmSessionStorage'

export default function MainsTestsTable({
  faculty,
  topic,
  tests: testsProp,
  loading,
  search = '',
  onSearchChange,
  controlledPagination,
}) {
  const navigate = useNavigate()

  const tests = testsProp ?? topic?.tests ?? []

  const openResults = useCallback(
    (test) => {
      const facultySubjectId = faculty?.facultySubjectId || faculty?.subjectId
      const topicId = topic?.topicId || topic?.id
      const testId = test.testId || test.id
      navigate(TEST_MANAGEMENT_ROUTES.mainsResults(facultySubjectId, topicId, testId), {
        state: {
          testId,
          testName: test.title,
          topicId,
          topicName: topic?.title,
          facultySubjectId,
        },
      })
      mmSession.save('testId', testId)
      mmSession.save('testName', test.title)
    },
    [navigate, faculty, topic],
  )

  const renderRowActions = useCallback(
    (row) => <MainsTestsTableActions row={row} onView={() => openResults(row)} />,
    [openResults],
  )

  const hasActiveFilters = Boolean(String(search).trim())

  const emptyMessage = hasActiveFilters
    ? 'No tests match your search.'
    : 'No tests available for this topic.'

  const resetDeps = useMemo(
    () => [
      search,
      controlledPagination?.page,
      controlledPagination?.pageSize,
      tests.length,
    ],
    [search, controlledPagination?.page, controlledPagination?.pageSize, tests.length],
  )

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
      <CourseFilterToolbar
        search={search}
        onSearchChange={(e) => onSearchChange?.(e.target.value)}
        searchPlaceholder="Search tests…"
        showStatusFilter={false}
        searchFullWidth
        disabled={loading && tests.length === 0}
      />

      <div className="mt-5 w-full max-w-full overflow-x-auto rounded-xl border border-slate-100">
        <MainsTestsManagementTable
          tests={tests}
          loading={loading}
          resetDeps={resetDeps}
          emptyMessage={emptyMessage}
          renderActions={renderRowActions}
          controlledPagination={controlledPagination}
        />
      </div>
    </div>
  )
}
