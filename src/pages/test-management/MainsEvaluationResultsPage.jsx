import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ListChecks } from 'lucide-react'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import MainsBreadcrumbNav from '../../components/test-management/mains/MainsBreadcrumbNav'
import MainsEvaluationResultsView from '../../components/test-management/mains/MainsEvaluationResultsView'
import { BannerButton } from '../../components/academics/AcademicsUi'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'
import { useMainsTestResults } from '../../hooks/useMainsTestResults'

export default function MainsEvaluationResultsPage() {
  const { subjectId, topicId, testItemId } = useParams()
  const navigate = useNavigate()
  const { test, summary, rows, loading } = useMainsTestResults(testItemId)

  const facultyLabel = test?.facultySubjectName || ''

  const testView = useMemo(
    () => (test ? { id: testItemId, title: test.testName || 'Results' } : null),
    [test, testItemId],
  )

  const breadcrumbs = test
    ? [
        {
          key: 'faculty',
          label: facultyLabel || 'Faculty Subject',
          to: TEST_MANAGEMENT_ROUTES.mainsFaculty(subjectId),
        },
        {
          key: 'topic',
          label: test?.topicName || 'Topic',
          to: TEST_MANAGEMENT_ROUTES.mainsTopic(subjectId, topicId),
        },
        { key: 'test', label: test?.testName || 'Results' },
      ]
    : []

  if (!loading && !test) {
    return (
      <TestManagementPageShell icon={ListChecks} title="Evaluation Results">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-600">Test or evaluation results not found.</p>
          <Link
            to={TEST_MANAGEMENT_ROUTES.mainsTopic(subjectId, topicId)}
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
      title={test?.testName || 'Evaluation Results'}
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
        <MainsEvaluationResultsView
          test={testView}
          facultyLabel={facultyLabel}
          summary={summary}
          rows={rows}
        />
      )}
    </TestManagementPageShell>
  )
}
