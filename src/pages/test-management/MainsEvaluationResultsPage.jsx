import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ListChecks } from 'lucide-react'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import MainsBreadcrumbNav from '../../components/test-management/mains/MainsBreadcrumbNav'
import MainsEvaluationResultsView from '../../components/test-management/mains/MainsEvaluationResultsView'
import { BannerButton } from '../../components/academics/AcademicsUi'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'
import {
  findMainsTest,
  getMainsFacultyBySubjectId,
} from '../../utils/mainsEvaluationHierarchy'
import { useMainsEvaluationHierarchy } from '../../hooks/useMainsEvaluationHierarchy'

export default function MainsEvaluationResultsPage() {
  const { subjectId, topicId, testItemId } = useParams()
  const navigate = useNavigate()
  const { facultyRows, loading } = useMainsEvaluationHierarchy()

  const faculty = useMemo(() => {
    const fromRows = facultyRows.find((r) => String(r.subjectId) === String(subjectId))
    return fromRows || getMainsFacultyBySubjectId(subjectId)
  }, [facultyRows, subjectId])

  const match = useMemo(() => findMainsTest(faculty, testItemId), [faculty, testItemId])
  const test = match?.test
  const topic = match?.topic

  const facultyLabel = faculty ? `${faculty.subjectName} — ${faculty.facultyName}` : ''

  const breadcrumbs = faculty
    ? [
        {
          key: 'faculty',
          label: `${faculty.subjectName} by ${faculty.facultyName}`,
          to: TEST_MANAGEMENT_ROUTES.mainsFaculty(subjectId),
        },
        {
          key: 'topic',
          label: topic?.title || 'Topic',
          to: TEST_MANAGEMENT_ROUTES.mainsTopic(subjectId, topicId),
        },
        { key: 'test', label: test?.title || 'Results' },
      ]
    : []

  if (!loading && (!faculty || !test)) {
    return (
      <TestManagementPageShell icon={ListChecks} title="Evaluation Results">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-600">Test or evaluation results not found.</p>
          <Link
            to={
              faculty && topicId
                ? TEST_MANAGEMENT_ROUTES.mainsTopic(subjectId, topicId)
                : TEST_MANAGEMENT_ROUTES.mains
            }
            className="mt-4 inline-block"
          >
            <BannerButton type="button">Go Back</BannerButton>
          </Link>
        </div>
      </TestManagementPageShell>
    )
  }

  return (
    <TestManagementPageShell
      icon={ListChecks}
      title={test?.title || 'Evaluation Results'}
      actions={
        <BannerButton
          type="button"
          variant="secondary"
          onClick={() => navigate(TEST_MANAGEMENT_ROUTES.mainsTopic(subjectId, topicId))}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tests
        </BannerButton>
      }
    >
      <div className="mb-4">
        <MainsBreadcrumbNav items={breadcrumbs} />
        <p className="mt-2 text-xs text-slate-500">{facultyLabel}</p>
      </div>
      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#55ace7] border-t-transparent" />
        </div>
      ) : (
        <MainsEvaluationResultsView test={test} facultyLabel={facultyLabel} />
      )}
    </TestManagementPageShell>
  )
}
