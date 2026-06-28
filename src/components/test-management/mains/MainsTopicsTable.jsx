import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CourseFilterToolbar from '../../courses/CourseFilterToolbar'
import MainsTopicsManagementTable from './MainsTopicsManagementTable'
import MainsTopicsTableActions from './MainsTopicsTableActions'
import { TEST_MANAGEMENT_ROUTES } from '../../../constants/testManagementNav'
import { mmSession } from '../../../utils/mmSessionStorage'

export default function MainsTopicsTable({ faculty, topics: topicsProp, loading }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const topics = topicsProp ?? faculty?.topics ?? []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return topics
    return topics.filter((t) => (t.title || '').toLowerCase().includes(q))
  }, [topics, search])

  const openTopic = useCallback(
    (topic) => {
      if (!faculty) return
      const facultySubjectId = faculty.facultySubjectId || faculty.subjectId
      const topicId = topic.topicId || topic.id
      navigate(TEST_MANAGEMENT_ROUTES.mainsTopic(facultySubjectId, topicId), {
        state: {
          topicId,
          topicName: topic.title,
          facultySubjectId,
          facultySubjectName: faculty.facultySubjectName,
        },
      })
      mmSession.save('topicId', topicId)
      mmSession.save('topicName', topic.title)
    },
    [faculty, navigate],
  )

  const renderRowActions = useCallback(
    (row) => <MainsTopicsTableActions row={row} onView={() => openTopic(row)} />,
    [openTopic],
  )

  const hasActiveFilters = Boolean(search.trim())

  const emptyMessage = hasActiveFilters
    ? 'No topics match your search.'
    : 'No topics available for this faculty subject.'

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
      <CourseFilterToolbar
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        searchPlaceholder="Search topics…"
        showStatusFilter={false}
        searchFullWidth
        disabled={loading && topics.length === 0}
      />

      <div className="mt-5 w-full overflow-hidden rounded-xl border border-slate-100">
        <MainsTopicsManagementTable
          topics={filtered}
          loading={loading}
          resetDeps={[search, topics.length]}
          emptyMessage={emptyMessage}
          renderActions={renderRowActions}
        />
      </div>
    </div>
  )
}
