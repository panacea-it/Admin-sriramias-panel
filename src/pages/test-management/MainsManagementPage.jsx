import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListChecks } from 'lucide-react'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import EvaluationProgressCards from '../../components/test-management/EvaluationProgressCards'
import MainsFacultySubjectsTable from '../../components/test-management/mains/MainsFacultySubjectsTable'
import CourseFilterToolbar from '../../components/courses/CourseFilterToolbar'
import ViewButton from '../../components/common/ViewButton'
import { useMainsDashboardManagement } from '../../hooks/useMainsDashboardManagement'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'
import { TABLE_ACTIONS_WRAP_CENTER } from '../../utils/tableColumnHelpers'
import { mmSession } from '../../utils/mmSessionStorage'

function FacultySubjectTableActions({ row, onView }) {
  const label = row.facultySubject || `${row.subjectName} by ${row.facultyName}`

  return (
    <div className={TABLE_ACTIONS_WRAP_CENTER}>
      <ViewButton onClick={onView} label={`View topics for ${label}`} />
    </div>
  )
}

export default function MainsManagementPage() {
  const navigate = useNavigate()
  const {
    latestEvaluations,
    dashboardLoading,
    facultyRows,
    facultySubjectsLoading,
    search,
    setSearch,
    controlledPagination,
  } = useMainsDashboardManagement()

  const openFaculty = useCallback(
    (row) => {
      const facultySubjectId = row.facultySubjectId || row.subjectId
      navigate(TEST_MANAGEMENT_ROUTES.mainsFaculty(facultySubjectId), {
        state: {
          facultySubjectId,
          facultySubjectName: row.facultySubject || `${row.subjectName} by ${row.facultyName}`,
          subjectName: row.subjectName,
        },
      })
      mmSession.save('facultySubjectId', facultySubjectId)
      mmSession.save(
        'facultySubjectName',
        row.facultySubject || `${row.subjectName} by ${row.facultyName}`,
      )
      mmSession.save('subjectName', row.subjectName)
    },
    [navigate],
  )

  const renderRowActions = useCallback(
    (row) => <FacultySubjectTableActions row={row} onView={() => openFaculty(row)} />,
    [openFaculty],
  )

  const hasActiveFilters = Boolean(search.trim())
  const emptyMessage = hasActiveFilters
    ? 'No faculty subjects match your search.'
    : 'No faculty subjects with Mains tests available.'

  const tableResetDeps = useMemo(
    () => [search, controlledPagination.page, controlledPagination.pageSize, facultyRows.length],
    [search, controlledPagination.page, controlledPagination.pageSize, facultyRows.length],
  )

  return (
    <TestManagementPageShell icon={ListChecks} title="Mains Management">
      <EvaluationProgressCards
        cards={latestEvaluations}
        loading={dashboardLoading}
        emptyMessage="No evaluations completed yet."
        heading="Latest Test Series"
      />

      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
        <CourseFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder="Search faculty subjects by name…"
          status="all"
          onStatusChange={() => {}}
          showStatusFilter={false}
          searchFullWidth
          disabled={facultySubjectsLoading && facultyRows.length === 0}
        />

        <div className="mt-5 w-full overflow-hidden rounded-xl border border-slate-100">
          <MainsFacultySubjectsTable
            rows={facultyRows}
            loading={facultySubjectsLoading}
            resetDeps={tableResetDeps}
            emptyMessage={emptyMessage}
            renderActions={renderRowActions}
            controlledPagination={controlledPagination}
          />
        </div>
      </div>
    </TestManagementPageShell>
  )
}
