import { useEffect, useMemo } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ListChecks } from 'lucide-react'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import MainsBreadcrumbNav from '../../components/test-management/mains/MainsBreadcrumbNav'
import MainsTestsTable from '../../components/test-management/mains/MainsTestsTable'
import { BannerButton } from '../../components/academics/AcademicsUi'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'
import { useMainsTopicTestsManagement } from '../../hooks/useMainsTopicTestsManagement'
import { mmSession } from '../../utils/mmSessionStorage'
import { toast } from '../../utils/toast'

export default function MainsTopicDetailPage() {
  const { subjectId, topicId: topicIdParam } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()

  const facultySubjectId =
    state?.facultySubjectId || mmSession.get('facultySubjectId') || subjectId
  const topicId = state?.topicId || mmSession.get('topicId') || topicIdParam

  const {
    topic,
    tests,
    loading,
    search,
    setSearch,
    controlledPagination,
  } = useMainsTopicTestsManagement(topicId)

  useEffect(() => {
    if (!topicId) {
      toast.error('Topic not found')
      navigate(
        facultySubjectId
          ? TEST_MANAGEMENT_ROUTES.mainsFaculty(facultySubjectId)
          : TEST_MANAGEMENT_ROUTES.mains,
        { replace: true },
      )
    }
  }, [topicId, facultySubjectId, navigate])

  const faculty = useMemo(
    () => ({ subjectId: facultySubjectId, facultySubjectId }),
    [facultySubjectId],
  )

  const facultyLabel =
    state?.facultySubjectName ||
    mmSession.get('facultySubjectName') ||
    topic?.facultyLabel ||
    ''

  const breadcrumbs = topic
    ? [
        {
          key: 'faculty',
          label: facultyLabel || 'Faculty Subject',
          to: TEST_MANAGEMENT_ROUTES.mainsFaculty(facultySubjectId),
        },
        { key: 'topic', label: topic?.title || state?.topicName || mmSession.get('topicName') || 'Topic' },
      ]
    : []

  if (!loading && !topic) {
    return (
      <TestManagementPageShell icon={ListChecks} title="Topic Tests">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-600">Topic or tests not found.</p>
          <Link
            to={TEST_MANAGEMENT_ROUTES.mainsFaculty(facultySubjectId)}
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
      title={topic?.title || state?.topicName || mmSession.get('topicName') || 'Topic Tests'}
      actions={
        <BannerButton
          type="button"
          variant="secondary"
          showPlusIcon={false}
          onClick={() => navigate(TEST_MANAGEMENT_ROUTES.mainsFaculty(facultySubjectId))}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Topics
        </BannerButton>
      }
    >
      <div className="mb-4">
        <MainsBreadcrumbNav items={breadcrumbs} />
      </div>
      {loading && !topic ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#55ace7] border-t-transparent" />
        </div>
      ) : (
        <MainsTestsTable
          faculty={faculty}
          topic={topic}
          tests={tests}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          controlledPagination={controlledPagination}
        />
      )}
    </TestManagementPageShell>
  )
}
