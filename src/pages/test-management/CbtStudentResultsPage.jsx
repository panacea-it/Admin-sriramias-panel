import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Monitor } from 'lucide-react'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import CbtBreadcrumbNav from '../../components/test-management/cbt/CbtBreadcrumbNav'
import CbtStudentResultsView from '../../components/test-management/cbt/CbtStudentResultsView'
import { BannerButton } from '../../components/academics/AcademicsUi'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'
import { useCbtTestResults } from '../../hooks/useCbtTestResults'

export default function CbtStudentResultsPage() {
  const { subjectId, testItemId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const navState = location.state || {}

  const { rows, test, totalStudents, attempted, analytics, loading } =
    useCbtTestResults(testItemId)

  const testItem = test ? { id: test.testId, title: test.testName } : null
  const facultyLabel = test?.facultySubjectLabel || ''

  const topicCrumb = navState.topicId
    ? {
        key: 'topic',
        label: navState.topicTitle || test?.topicName || 'Topic',
        to: TEST_MANAGEMENT_ROUTES.cbtTopic(subjectId, navState.topicId),
      }
    : test?.topicName
      ? { key: 'topic', label: test.topicName }
      : null

  const breadcrumbs = [
    ...(facultyLabel
      ? [
          {
            key: 'faculty',
            label: facultyLabel,
            to: TEST_MANAGEMENT_ROUTES.cbtFaculty(subjectId),
          },
        ]
      : []),
    ...(topicCrumb ? [topicCrumb] : []),
    { key: 'test', label: testItem?.title || 'Results' },
  ]

  const goBack = () =>
    navigate(
      navState.topicId
        ? TEST_MANAGEMENT_ROUTES.cbtTopic(subjectId, navState.topicId)
        : TEST_MANAGEMENT_ROUTES.cbtFaculty(subjectId),
    )

  if (!loading && !testItem) {
    return (
      <TestManagementPageShell icon={Monitor} title="Student Results">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-600">Test series or results not found.</p>
          <Link to={TEST_MANAGEMENT_ROUTES.cbtFaculty(subjectId)} className="mt-4 inline-block">
            <BannerButton type="button" showPlusIcon={false}>Go Back</BannerButton>
          </Link>
        </div>
      </TestManagementPageShell>
    )
  }

  return (
    <TestManagementPageShell
      icon={Monitor}
      title={testItem?.title || 'Student Results'}
      actions={
        <BannerButton type="button" variant="secondary" showPlusIcon={false} onClick={goBack}>
          <ArrowLeft className="h-4 w-4" />
          Back to Tests
        </BannerButton>
      }
    >
      <div className="mb-4">
        <CbtBreadcrumbNav items={breadcrumbs} />
        {facultyLabel && <p className="mt-2 text-xs text-slate-500">{facultyLabel}</p>}
      </div>
      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#55ace7] border-t-transparent" />
        </div>
      ) : (
        <CbtStudentResultsView
          testItem={testItem}
          testId={testItemId}
          facultyLabel={facultyLabel}
          rows={rows}
          analytics={analytics}
          totalStudents={totalStudents}
          attempted={attempted}
        />
      )}
    </TestManagementPageShell>
  )
}
