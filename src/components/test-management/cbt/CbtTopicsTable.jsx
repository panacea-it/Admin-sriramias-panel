import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CourseFilterToolbar from '../../courses/CourseFilterToolbar'
import CbtTopicsManagementTable from './CbtTopicsManagementTable'
import CbtTopicsTableActions from './CbtTopicsTableActions'
import { TEST_MANAGEMENT_ROUTES } from '../../../constants/testManagementNav'
import { getCbtTopics } from '../../../utils/cbtTestSeriesHierarchy'

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
      if (!faculty) return
      navigate(TEST_MANAGEMENT_ROUTES.cbtTopic(faculty.subjectId, topic.id))
    },
    [faculty, navigate],
  )

  const renderRowActions = useCallback(
    (row) => <CbtTopicsTableActions row={row} onView={() => openTopic(row)} />,
    [openTopic],
  )

  const hasActiveFilters = Boolean(search.trim())

  const emptyMessage = hasActiveFilters
    ? 'No topics match your search.'
    : 'No topics available for this faculty.'

  return (
    <div className="box-border flex w-full max-w-full flex-col rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
      <CourseFilterToolbar
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        searchPlaceholder="Search topics…"
        showStatusFilter={false}
        disabled={loading && topics.length === 0}
      />

      <div className="mt-5 w-full max-w-full overflow-hidden rounded-xl border border-slate-100">
        <CbtTopicsManagementTable
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
