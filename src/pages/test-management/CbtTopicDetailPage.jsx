import { useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Monitor } from 'lucide-react'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import CbtBreadcrumbNav from '../../components/test-management/cbt/CbtBreadcrumbNav'
import CbtTestsTable from '../../components/test-management/cbt/CbtTestsTable'
import { CbtBackButton } from '../../components/test-management/cbt/ui'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'
import { useCbtFacultySubject } from '../../hooks/useCbtFacultySubject'
import { useCbtTopicTests } from '../../hooks/useCbtTopicTests'
import {
  enrichCbtTestRow,
  findCbtTopicContext,
  getCbtFacultyBySubjectId,
  getCbtTestsForTopic,
  getCbtTopic,
} from '../../utils/cbtTestSeriesHierarchy'
import { getCbtDummyTopicTests } from '../../utils/cbtTopicTestsDummyData'

function collectTestSeriesNodes(nodes = []) {
  const list = []
  const walk = (items) => {
    for (const node of items || []) {
      if (node.type === 'testSeries') list.push(node)
      if (node.children?.length) walk(node.children)
    }
  }
  walk(nodes)
  return list
}

export default function CbtTopicDetailPage() {
  const { subjectId, topicId: topicIdParam } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const navState = location.state || {}

  const topicId = topicIdParam || navState.topicId
  const { faculty: facultyRow, loading: facultyLoading } = useCbtFacultySubject(subjectId)
  const { tests: fetchedTests, topic: topicHeader, loading: testsLoading } =
    useCbtTopicTests(topicId)

  const fullFaculty = useMemo(() => getCbtFacultyBySubjectId(subjectId), [subjectId])

  const topicContext = useMemo(() => {
    const scopedTopic = getCbtTopic(fullFaculty, topicId)
    if (scopedTopic) return { faculty: fullFaculty, topic: scopedTopic }
    return findCbtTopicContext(topicId)
  }, [fullFaculty, topicId])

  const hierarchyTopic = topicContext.topic
  const resolvedFaculty = topicContext.faculty || fullFaculty

  const topic = useMemo(
    () => ({
      id: topicId,
      title:
        hierarchyTopic?.title ||
        navState.topicName ||
        topicHeader?.topicName ||
        'Topic',
      children: hierarchyTopic?.children || [],
    }),
    [topicId, hierarchyTopic, navState.topicName, topicHeader?.topicName],
  )

  const faculty = resolvedFaculty || facultyRow || { subjectId }

  const facultyLabel =
    (resolvedFaculty
      ? `${resolvedFaculty.subjectName} — ${resolvedFaculty.facultyName}`
      : fullFaculty
        ? `${fullFaculty.subjectName} — ${fullFaculty.facultyName}`
        : facultyRow
          ? `${facultyRow.subjectName} — ${facultyRow.facultyName}`
          : '') ||
    navState.facultySubjectLabel ||
    topicHeader?.facultySubjectName ||
    ''

  const tests = useMemo(() => {
    if (!topicId) return []

    if (Array.isArray(fetchedTests) && fetchedTests.length > 0) return fetchedTests

    const fromHierarchy = getCbtTestsForTopic(topicId)
    if (fromHierarchy.tests?.length > 0) return fromHierarchy.tests

    const nodes = collectTestSeriesNodes(hierarchyTopic?.children || [])
    if (nodes.length > 0 && resolvedFaculty) {
      return nodes.map((node) => enrichCbtTestRow(node, resolvedFaculty))
    }

    return getCbtDummyTopicTests({
      topicId,
      topicTitle:
        hierarchyTopic?.title ||
        navState.topicName ||
        topicHeader?.topicName ||
        'Topic',
      faculty: resolvedFaculty || facultyRow,
    })
  }, [
    fetchedTests,
    topicId,
    hierarchyTopic,
    resolvedFaculty,
    facultyRow,
    navState.topicName,
    topicHeader?.topicName,
  ])

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

  const loading =
    (facultyLoading && !resolvedFaculty && !facultyRow) ||
    (testsLoading && !topicId)

  return (
    <TestManagementPageShell
      icon={Monitor}
      title={topic.title}
      actions={
        <CbtBackButton onClick={() => navigate(TEST_MANAGEMENT_ROUTES.cbtFaculty(subjectId))}>
          <ArrowLeft className="h-4 w-4" />
          Back to Topics
        </CbtBackButton>
      }
    >
      <CbtBreadcrumbNav items={breadcrumbs} />

      <div className="mt-5 sm:mt-6">
        <CbtTestsTable
          faculty={faculty}
          topic={topic}
          tests={tests}
          loading={loading}
        />
      </div>
    </TestManagementPageShell>
  )
}
