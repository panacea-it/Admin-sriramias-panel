import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CbtTopicsManagementTable from './CbtTopicsManagementTable'
import CbtTopicsTableActions from './CbtTopicsTableActions'
import { CbtCardSearchInput, CBT_DATA_PANEL, CBT_TABLE_SCROLL_WRAP } from './ui'
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

  const facultySubtitle = faculty
    ? faculty.facultySubjectLabel ||
      `${faculty.subjectName || ''} — ${faculty.facultyName || ''}`.trim()
    : ''

  return (
    <section className={CBT_DATA_PANEL}>
      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#1a3a5c]">Topics</h2>
          {facultySubtitle ? (
            <p className="mt-0.5 text-sm text-slate-500">{facultySubtitle}</p>
          ) : null}
        </div>
        <CbtCardSearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search topics…"
          disabled={loading && topics.length === 0}
        />
      </header>

      <div className={CBT_TABLE_SCROLL_WRAP}>
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
