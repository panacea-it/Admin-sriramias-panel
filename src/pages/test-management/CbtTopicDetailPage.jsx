import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Monitor } from 'lucide-react'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import CbtBreadcrumbNav from '../../components/test-management/cbt/CbtBreadcrumbNav'
import CbtTestsTable from '../../components/test-management/cbt/CbtTestsTable'
import { BannerButton } from '../../components/academics/AcademicsUi'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'
import { getCbtFacultyBySubjectId, getCbtTopic } from '../../utils/cbtTestSeriesHierarchy'
import { useCbtTestSeriesHierarchy } from '../../hooks/useCbtTestSeriesHierarchy'

export default function CbtTopicDetailPage() {
  const { subjectId, topicId } = useParams()
  const navigate = useNavigate()
  const { mappingRows, loading } = useCbtTestSeriesHierarchy()

  const faculty = useMemo(() => {
    const fromRows = mappingRows.find((r) => String(r.subjectId) === String(subjectId))
    return fromRows || getCbtFacultyBySubjectId(subjectId)
  }, [mappingRows, subjectId])

  const topic = useMemo(() => getCbtTopic(faculty, topicId), [faculty, topicId])

  const facultyLabel = faculty ? `${faculty.subjectName} — ${faculty.facultyName}` : ''

  const breadcrumbs = faculty
    ? [
        {
          key: 'faculty',
          label: facultyLabel,
          to: TEST_MANAGEMENT_ROUTES.cbtFaculty(subjectId),
        },
        { key: 'topic', label: topic?.title || 'Topic' },
      ]
    : []

  if (!loading && (!faculty || !topic)) {
    return (
      <TestManagementPageShell icon={Monitor} title="Topic Tests">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-600">Topic or tests not found.</p>
          <Link
            to={faculty ? TEST_MANAGEMENT_ROUTES.cbtFaculty(subjectId) : TEST_MANAGEMENT_ROUTES.cbt}
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
      icon={Monitor}
      title={topic?.title || 'Topic Tests'}
      actions={
        <BannerButton
          type="button"
          variant="secondary"
          onClick={() => navigate(TEST_MANAGEMENT_ROUTES.cbtFaculty(subjectId))}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Topics
        </BannerButton>
      }
    >
      <div className="mb-4">
        <CbtBreadcrumbNav items={breadcrumbs} />
      </div>
      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#55ace7] border-t-transparent" />
        </div>
      ) : (
        <CbtTestsTable faculty={faculty} topic={topic} loading={loading} />
      )}
    </TestManagementPageShell>
  )
}
