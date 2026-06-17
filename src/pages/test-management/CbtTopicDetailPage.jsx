import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Monitor } from 'lucide-react'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import CbtBreadcrumbNav from '../../components/test-management/cbt/CbtBreadcrumbNav'
import CbtTestsTable from '../../components/test-management/cbt/CbtTestsTable'
import { BannerButton } from '../../components/academics/AcademicsUi'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'
import { getCbtFacultyBySubjectId } from '../../utils/cbtTestSeriesHierarchy'
import { useCbtTestSeriesHierarchy } from '../../hooks/useCbtTestSeriesHierarchy'
import { useCbtTopicTests } from '../../hooks/useCbtTopicTests'

export default function CbtTopicDetailPage() {
  const { subjectId, topicId } = useParams()
  const navigate = useNavigate()
  const { mappingRows } = useCbtTestSeriesHierarchy()
  const { tests, topic: topicHeader, loading } = useCbtTopicTests(topicId)

  const faculty = useMemo(() => {
    const fromRows = mappingRows.find((r) => String(r.subjectId) === String(subjectId))
    return fromRows || getCbtFacultyBySubjectId(subjectId)
  }, [mappingRows, subjectId])

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
      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#55ace7] border-t-transparent" />
        </div>
      ) : (
        <CbtTestsTable
          faculty={faculty || { subjectId }}
          topic={topic}
          tests={tests}
          loading={loading}
        />
      )}
    </TestManagementPageShell>
  )
}
