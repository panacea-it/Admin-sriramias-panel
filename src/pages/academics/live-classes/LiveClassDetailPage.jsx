import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Radio, Video } from 'lucide-react'
import { motion } from 'framer-motion'
import CategoryBreadcrumb from '../../../components/categories/CategoryBreadcrumb'
import LiveClassStatusBadge from '../../../components/live-classes/LiveClassStatusBadge'
import ScheduleClassModal from '../../../components/live-classes/ScheduleClassModal'
import { useLiveClasses } from '../../../contexts/LiveClassesContext'
import { useEditModal } from '../../../hooks/useEditModal'
import { getCoursesForSubject } from '../../../utils/liveClassInheritance'
import { LIVE_CLASSES_BASE } from '../../../constants/liveClassesNav'

const BREADCRUMB = [
  { label: 'Academics' },
  { label: 'Live Classes' },
  { label: 'Lesson detail' },
]

export default function LiveClassDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { lessons, saveLesson, loading } = useLiveClasses()
  const modal = useEditModal()
  const [lesson, setLesson] = useState(null)

  useEffect(() => {
    const found = lessons.find((l) => l.id === id)
    setLesson(found ?? null)
  }, [lessons, id])

  const inheritedCourses = lesson ? getCoursesForSubject(lesson.subjectId) : []

  if (!loading && !lesson) {
    return (
      <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 py-12 text-center">
        <p className="text-[#686868]">Lesson not found.</p>
        <Link to={`${LIVE_CLASSES_BASE}/schedule`} className="mt-4 inline-block text-[#246392] font-semibold">
          Back to schedule
        </Link>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="figma-admin-section min-h-screen animate-pulse bg-[#f7f7f7] px-4 py-8">
        <div className="mx-auto max-w-4xl h-64 rounded-2xl bg-white" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6"
    >
      <section className="mx-auto max-w-4xl space-y-6">
        <CategoryBreadcrumb items={BREADCRUMB} />

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#246392] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="rounded-2xl bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.08)] ring-1 ring-[#e8f4fc] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#cbeeff] text-[#246392]">
                {lesson.lessonType === 'Recording' ? (
                  <Video className="h-6 w-6" />
                ) : (
                  <Radio className="h-6 w-6" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1a3a5c]">{lesson.lessonName}</h1>
                <p className="mt-1 text-sm text-[#686868]">
                  {lesson.mainCategoryName} — {lesson.subjectName} · {lesson.topic}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LiveClassStatusBadge status={lesson.status} />
              <button
                type="button"
                onClick={() => modal.openEdit(lesson)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1a3a5c] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(0,0,0,0.15)] hover:bg-[#152f4a]"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            </div>
          </div>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase text-[#9ca0a8]">Faculty</dt>
              <dd className="font-medium text-[#222]">{lesson.teacher}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#9ca0a8]">Location</dt>
              <dd className="font-medium text-[#222]">{lesson.location}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#9ca0a8]">Type</dt>
              <dd className="font-medium text-[#222]">{lesson.lessonType}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#9ca0a8]">Schedule</dt>
              <dd className="font-medium text-[#222]">
                {lesson.scheduledDate || '—'}
                {lesson.scheduledTime ? ` at ${lesson.scheduledTime}` : ''}
              </dd>
            </div>
          </dl>

          {lesson.description && (
            <p className="mt-6 rounded-xl bg-[#eef2fc] p-4 text-sm text-[#444]">{lesson.description}</p>
          )}

          <div className="mt-8 rounded-xl border border-[#e8f4fc] bg-[#f7f9fc] p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#246392]">
              Course inheritance
            </h2>
            <p className="mt-1 text-xs text-[#686868]">
              This lesson is attached to subject <strong>{lesson.subjectName}</strong> only. These
              courses automatically include it:
            </p>
            <ul className="mt-3 space-y-2">
              {inheritedCourses.length === 0 ? (
                <li className="text-sm text-[#9ca0a8]">No courses linked to this subject yet.</li>
              ) : (
                inheritedCourses.map((c) => (
                  <li
                    key={c.courseId}
                    className="flex items-center justify-between rounded-lg bg-white px-4 py-2 text-sm shadow-sm"
                  >
                    <span className="font-medium text-[#222]">{c.courseName}</span>
                    <span className="text-xs text-[#246392]">Inherited</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          {lesson.lessonType === 'Live' && lesson.zoomLink && (
            <div className="mt-6">
              <a
                href={lesson.zoomLink}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-[#246392] hover:underline"
              >
                Open meeting link →
              </a>
            </div>
          )}
        </div>
      </section>

      <ScheduleClassModal
        open={modal.isOpen}
        onClose={modal.close}
        item={modal.selectedItem}
        onSubmit={(form, meta) => saveLesson(form, meta)}
        lessons={lessons}
      />
    </motion.div>
  )
}
