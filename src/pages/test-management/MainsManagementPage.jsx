import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, ListChecks } from 'lucide-react'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import EvaluationProgressCards from '../../components/test-management/EvaluationProgressCards'
import MainsFacultySubjectsTable from '../../components/test-management/mains/MainsFacultySubjectsTable'
import CourseFilterToolbar from '../../components/courses/CourseFilterToolbar'
import { useMainsEvaluationHierarchy } from '../../hooks/useMainsEvaluationHierarchy'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'
import { cn } from '../../utils/cn'

const actionButtonClass =
  'inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition sm:min-w-0 sm:px-2.5'

function FacultySubjectTableActions({ row, onView }) {
  const label = `${row.subjectName} by ${row.facultyName}`

  return (
    <div className="flex flex-nowrap items-center justify-center gap-1 sm:gap-1.5">
      <button
        type="button"
        onClick={onView}
        title="View Topics"
        aria-label={`View topics for ${label}`}
        className={cn(
          actionButtonClass,
          'text-slate-500 hover:bg-slate-100 hover:text-[#246392]',
        )}
      >
        <Eye className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">View Topics</span>
      </button>
    </div>
  )
}

export default function MainsManagementPage() {
  const navigate = useNavigate()
  const { facultyRows, latestEvaluations, loading } = useMainsEvaluationHierarchy()
  const [search, setSearch] = useState('')

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return facultyRows
    return facultyRows.filter(
      (row) =>
        row.subjectName.toLowerCase().includes(q) ||
        row.facultyName.toLowerCase().includes(q),
    )
  }, [facultyRows, search])

  const openEvaluation = (card, nav) => {
    if (card.subjectId && card.topicId) {
      nav(TEST_MANAGEMENT_ROUTES.mainsResults(card.subjectId, card.topicId, card.id))
    }
  }

  const openFaculty = useCallback(
    (row) => {
      navigate(TEST_MANAGEMENT_ROUTES.mainsFaculty(row.subjectId))
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

  return (
    <TestManagementPageShell icon={ListChecks} title="Mains Management">
      <EvaluationProgressCards
        cards={latestEvaluations}
        loading={loading}
        emptyMessage="No evaluations completed yet."
        heading="Latest Test Series"
        onCardClick={openEvaluation}
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
          disabled={loading && facultyRows.length === 0}
        />

        <div className="mt-5 w-full overflow-hidden rounded-xl border border-slate-100">
          <MainsFacultySubjectsTable
            rows={filteredRows}
            loading={loading}
            resetDeps={[search, facultyRows.length]}
            emptyMessage={emptyMessage}
            renderActions={renderRowActions}
          />
        </div>
      </div>
    </TestManagementPageShell>
  )
}
