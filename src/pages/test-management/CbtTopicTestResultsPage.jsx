import { useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Monitor } from 'lucide-react'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import CbtBreadcrumbNav from '../../components/test-management/cbt/CbtBreadcrumbNav'
import CbtTopicTestResultsView from '../../components/test-management/cbt/CbtTopicTestResultsView'
import { CbtBackButton } from '../../components/test-management/cbt/ui'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'
import { useCbtFacultySubject } from '../../hooks/useCbtFacultySubject'
import {
  findCbtTopicContext,
  getCbtFacultyBySubjectId,
  getCbtTopic,
} from '../../utils/cbtTestSeriesHierarchy'
import { getCbtDummyTopicTests } from '../../utils/cbtTopicTestsDummyData'

export default function CbtTopicTestResultsPage() {
  const { subjectId, topicId, testId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const navState = location.state || {}

  const { faculty: facultyRow } = useCbtFacultySubject(subjectId)

  const fullFaculty = useMemo(() => getCbtFacultyBySubjectId(subjectId), [subjectId])

  const topicContext = useMemo(() => {
    const scopedTopic = getCbtTopic(fullFaculty, topicId)
    if (scopedTopic) return { faculty: fullFaculty, topic: scopedTopic }
    return findCbtTopicContext(topicId)
  }, [fullFaculty, topicId])

  const hierarchyTopic = topicContext.topic
  const resolvedFaculty = topicContext.faculty || fullFaculty || facultyRow

  const topicTitle =
    navState.topicTitle ||
    hierarchyTopic?.title ||
    navState.topicName ||
    'Topic'

  const facultyLabel =
    (resolvedFaculty
      ? `${resolvedFaculty.subjectName} — ${resolvedFaculty.facultyName}`
      : fullFaculty
        ? `${fullFaculty.subjectName} — ${fullFaculty.facultyName}`
        : facultyRow
          ? `${facultyRow.subjectName} — ${facultyRow.facultyName}`
          : '') ||
    navState.facultySubjectLabel ||
    ''

  const dummyTests = useMemo(
    () =>
      getCbtDummyTopicTests({
        topicId,
        topicTitle,
        faculty: resolvedFaculty || facultyRow,
      }),
    [topicId, topicTitle, resolvedFaculty, facultyRow],
  )

  const testTitle =
    navState.testTitle ||
    dummyTests.find((test) => String(test.id) === String(testId))?.title ||
    'Test'

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
    {
      key: 'topic',
      label: topicTitle,
      to: TEST_MANAGEMENT_ROUTES.cbtTopic(subjectId, topicId),
    },
    { key: 'results', label: 'Student Results' },
  ]

  const goBack = () => {
    navigate(TEST_MANAGEMENT_ROUTES.cbtTopic(subjectId, topicId), {
      state: {
        topicId,
        topicName: topicTitle,
        facultySubjectLabel: facultyLabel,
      },
    })
  }

  return (
    <TestManagementPageShell
      icon={Monitor}
      title={topicTitle}
      actions={
        <CbtBackButton onClick={goBack}>
          <ArrowLeft className="h-4 w-4" />
          Back to Tests
        </CbtBackButton>
      }
    >
      <CbtBreadcrumbNav items={breadcrumbs} className="mt-1" />

      <div className="mt-6 sm:mt-7">
        <CbtTopicTestResultsView testId={testId} testTitle={testTitle} />
      </div>
    </TestManagementPageShell>
  )
}
