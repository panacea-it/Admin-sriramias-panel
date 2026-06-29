import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Monitor } from 'lucide-react'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import CbtBreadcrumbNav from '../../components/test-management/cbt/CbtBreadcrumbNav'
import CbtTestsTable from '../../components/test-management/cbt/CbtTestsTable'
import { BannerButton } from '../../components/academics/AcademicsUi'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'
import { useCbtFacultySubject } from '../../hooks/useCbtFacultySubject'
import { useCbtTopicTests } from '../../hooks/useCbtTopicTests'

export default function CbtTopicDetailPage() {
  const { subjectId, topicId } = useParams()
  const navigate = useNavigate()
  const { faculty, loading: facultyLoading } = useCbtFacultySubject(subjectId)
  const { tests, topic: topicHeader, loading: testsLoading } = useCbtTopicTests(topicId)

  const topic = useMemo(
    () => ({ id: topicId, title: topicHeader?.topicName || 'Topic' }),
    [topicId, topicHeader],
  )

  const facultyLabel =
    (faculty ? `${faculty.subjectName} — ${faculty.facultyName}` : '') ||
    topicHeader?.facultySubjectLabel ||
    ''

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
    { key: 'topic', label: topic.title },
  ]

  return (
    <TestManagementPageShell
      icon={Monitor}
      title={topic.title || 'Topic Tests'}
      actions={
        <BannerButton
          type="button"
          variant="secondary"
          showPlusIcon={false}
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
      <CbtTestsTable
        faculty={faculty || { subjectId }}
        topic={topic}
        tests={tests}
        loading={facultyLoading || testsLoading}
      />
    </TestManagementPageShell>
  )
}
