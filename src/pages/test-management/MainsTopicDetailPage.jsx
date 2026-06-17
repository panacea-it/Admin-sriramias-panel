import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ListChecks } from 'lucide-react'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import MainsBreadcrumbNav from '../../components/test-management/mains/MainsBreadcrumbNav'
import MainsTestsTable from '../../components/test-management/mains/MainsTestsTable'
import { BannerButton } from '../../components/academics/AcademicsUi'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'
import { useMainsTopicTests } from '../../hooks/useMainsTopicTests'

export default function MainsTopicDetailPage() {
  const { subjectId, topicId } = useParams()
  const navigate = useNavigate()
  const { topic, tests, loading } = useMainsTopicTests(topicId)

  const faculty = useMemo(() => ({ subjectId }), [subjectId])

  const facultyLabel = topic?.facultyLabel || ''

  const breadcrumbs = topic
    ? [
        {
          key: 'faculty',
          label: facultyLabel || 'Faculty Subject',
          to: TEST_MANAGEMENT_ROUTES.mainsFaculty(subjectId),
        },
        { key: 'topic', label: topic?.title || 'Topic' },
      ]
    : []

  if (!loading && !topic) {
    return (
      <TestManagementPageShell icon={ListChecks} title="Topic Tests">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-600">Topic or tests not found.</p>
          <Link
            to={TEST_MANAGEMENT_ROUTES.mainsFaculty(subjectId)}
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
        <MainsTestsTable faculty={faculty} topic={topic} tests={tests} loading={loading} />
      )}
    </TestManagementPageShell>
  )
}
