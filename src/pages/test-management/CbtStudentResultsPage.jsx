import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Monitor } from 'lucide-react'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import CbtBreadcrumbNav from '../../components/test-management/cbt/CbtBreadcrumbNav'
import CbtStudentResultsView from '../../components/test-management/cbt/CbtStudentResultsView'
import { BannerButton } from '../../components/academics/AcademicsUi'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'
import {
  findTestSeriesInTree,
  getCbtFacultyBySubjectId,
  getCbtTopics,
} from '../../utils/cbtTestSeriesHierarchy'
import { useCbtTestSeriesHierarchy } from '../../hooks/useCbtTestSeriesHierarchy'

export default function CbtStudentResultsPage() {
  const { subjectId, testItemId } = useParams()
  const navigate = useNavigate()
  const { mappingRows, loading } = useCbtTestSeriesHierarchy()

  const faculty = useMemo(() => {
    const fromRows = mappingRows.find((r) => String(r.subjectId) === String(subjectId))
    return fromRows || getCbtFacultyBySubjectId(subjectId)
  }, [mappingRows, subjectId])

  const testItem = useMemo(() => {
    if (!faculty?.folders) return null
    return findTestSeriesInTree(faculty.folders, testItemId)
  }, [faculty, testItemId])

  const topicForTest = useMemo(() => {
    if (!faculty || !testItem) return null
    const topics = getCbtTopics(faculty)
    for (const topic of topics) {
      const found = findTestSeriesInTree(topic.children, testItemId)
      if (found) return topic
    }
    return null
  }, [faculty, testItem, testItemId])

  const facultyLabel = faculty
    ? `${faculty.subjectName} — ${faculty.facultyName}`
    : ''

  const breadcrumbs = faculty
    ? [
        {
          key: 'faculty',
          label: facultyLabel,
          to: TEST_MANAGEMENT_ROUTES.cbtFaculty(subjectId),
        },
        ...(topicForTest
          ? [
              {
                key: 'topic',
                label: topicForTest.title,
                to: TEST_MANAGEMENT_ROUTES.cbtTopic(subjectId, topicForTest.id),
              },
            ]
          : []),
        {
          key: 'test',
          label: testItem?.title || 'Results',
        },
      ]
    : []

  if (!loading && (!faculty || !testItem)) {
    return (
      <TestManagementPageShell icon={Monitor} title="Student Results">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-600">Test series or results not found.</p>
          <Link
            to={
              faculty
                ? TEST_MANAGEMENT_ROUTES.cbtFaculty(subjectId)
                : TEST_MANAGEMENT_ROUTES.cbt
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
      icon={Monitor}
      title={testItem?.title || 'Student Results'}
      actions={
        <BannerButton
          type="button"
          variant="secondary"
          onClick={() =>
            navigate(
              topicForTest
                ? TEST_MANAGEMENT_ROUTES.cbtTopic(subjectId, topicForTest.id)
                : TEST_MANAGEMENT_ROUTES.cbtFaculty(subjectId),
            )
          }
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tests
        </BannerButton>
      }
    >
      <div className="mb-4">
        <CbtBreadcrumbNav items={breadcrumbs} />
        <p className="mt-2 text-xs text-slate-500">{facultyLabel}</p>
      </div>
      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#55ace7] border-t-transparent" />
        </div>
      ) : (
        <CbtStudentResultsView testItem={testItem} facultyLabel={facultyLabel} />
      )}
    </TestManagementPageShell>
  )
}
