import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ListChecks } from 'lucide-react'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import MainsBreadcrumbNav from '../../components/test-management/mains/MainsBreadcrumbNav'
import MainsTestsTable from '../../components/test-management/mains/MainsTestsTable'
import { BannerButton } from '../../components/academics/AcademicsUi'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'
import { getMainsFacultyBySubjectId, getMainsTopic } from '../../utils/mainsEvaluationHierarchy'
import { useMainsEvaluationHierarchy } from '../../hooks/useMainsEvaluationHierarchy'

export default function MainsTopicDetailPage() {
  const { subjectId, topicId } = useParams()
  const navigate = useNavigate()
  const { facultyRows, loading } = useMainsEvaluationHierarchy()

  const faculty = useMemo(() => {
    const fromRows = facultyRows.find((r) => String(r.subjectId) === String(subjectId))
    return fromRows || getMainsFacultyBySubjectId(subjectId)
  }, [facultyRows, subjectId])

  const topic = useMemo(() => getMainsTopic(faculty, topicId), [faculty, topicId])

  const facultyLabel = faculty ? `${faculty.subjectName} by ${faculty.facultyName}` : ''

  const breadcrumbs = faculty
    ? [
        {
          key: 'faculty',
          label: facultyLabel,
          to: TEST_MANAGEMENT_ROUTES.mainsFaculty(subjectId),
        },
        { key: 'topic', label: topic?.title || 'Topic' },
      ]
    : []

  if (!loading && (!faculty || !topic)) {
    return (
      <TestManagementPageShell icon={ListChecks} title="Topic Tests">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-600">Topic or tests not found.</p>
          <Link
            to={faculty ? TEST_MANAGEMENT_ROUTES.mainsFaculty(subjectId) : TEST_MANAGEMENT_ROUTES.mains}
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
      title={topic?.title || 'Topic Tests'}
      actions={
        <BannerButton
          type="button"
          variant="secondary"
          showPlusIcon={false}
          onClick={() => navigate(TEST_MANAGEMENT_ROUTES.mainsFaculty(subjectId))}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Topics
        </BannerButton>
      }
    >
      <div className="mb-4">
        <MainsBreadcrumbNav items={breadcrumbs} />
      </div>
      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#55ace7] border-t-transparent" />
        </div>
      ) : (
        <MainsTestsTable faculty={faculty} topic={topic} loading={loading} />
      )}
    </TestManagementPageShell>
  )
}
