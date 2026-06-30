import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CourseFilterToolbar from '../../courses/CourseFilterToolbar'
import CbtTopicsManagementTable from './CbtTopicsManagementTable'
import CbtTopicsTableActions from './CbtTopicsTableActions'
import { CBT_DATA_PANEL, CBT_TABLE_CONTAINER } from './ui'
import { TEST_MANAGEMENT_ROUTES } from '../../../constants/testManagementNav'
import { getCbtFacultyBySubjectId, getCbtTopics } from '../../../utils/cbtTestSeriesHierarchy'

export default function CbtTopicsTable({ faculty, topics: topicsProp, loading }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const topics = useMemo(
    () => (Array.isArray(topicsProp) ? topicsProp : getCbtTopics(faculty)),
    [topicsProp, faculty],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return topics
    return topics.filter((t) => t.title.toLowerCase().includes(q))
  }, [topics, search])

  const openTopic = useCallback(
    (topic) => {
      const subjectKey = faculty?.subjectId
      if (!subjectKey) return

      const topicKey = topic.id || topic.folderId
      const fullFaculty = getCbtFacultyBySubjectId(subjectKey)
      const facultyLabel = fullFaculty
        ? `${fullFaculty.subjectName} — ${fullFaculty.facultyName}`
        : faculty.facultySubjectLabel ||
          `${faculty.subjectName || ''} — ${faculty.facultyName || ''}`.trim()

      navigate(TEST_MANAGEMENT_ROUTES.cbtTopic(subjectKey, topicKey), {
        state: {
          topicId: topicKey,
          topicName: topic.title,
          facultySubjectLabel: facultyLabel,
        },
      })
    },
    [faculty, navigate],
  )

  const renderRowActions = useCallback(
    (row) => <CbtTopicsTableActions onView={() => openTopic(row)} />,
    [openTopic],
  )

  const hasActiveFilters = Boolean(search.trim())

  const emptyMessage = hasActiveFilters
    ? 'No topics match your search.'
    : 'No topics available for this faculty.'

  return (
    <section className={CBT_DATA_PANEL}>
      <CourseFilterToolbar
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        searchPlaceholder="Search topics..."
        showStatusFilter={false}
        searchFullWidth
        disabled={loading && topics.length === 0}
      />

      <div className={CBT_TABLE_CONTAINER}>
        <CbtTopicsManagementTable
          topics={filtered}
          loading={loading}
          resetDeps={[search, topics.length]}
          emptyMessage={emptyMessage}
          renderActions={renderRowActions}
        />
      </div>
    </section>
  )
}
