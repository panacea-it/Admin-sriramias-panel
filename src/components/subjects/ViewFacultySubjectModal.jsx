import { BookOpen } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalCloseButton from './ModalCloseButton'
import SubjectStatusToggle from './SubjectStatusToggle'
import TableValueChips from './TableValueChips'
import { normalizeCategories } from '../../utils/subjectCategoryHelpers'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { isMongoObjectId } from '../../utils/facultySubjectHelpers'

function DetailItem({ label, children }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#686868]">{label}</p>
      <div className="mt-1 text-sm font-semibold text-[#111]">{children}</div>
    </div>
  )
}

function resolveTeacherDisplay(item) {
  if (item?.teacherMeta?.length) {
    const label = String(item.teacherMeta[0]?.label || '').trim()
    if (label) return label
  }
  if (item?.teacherName) return String(item.teacherName).trim()
  const teacher = item?.teacher
  if (teacher && typeof teacher === 'object') {
    return String(teacher.teacherName || teacher.name || '').trim() || '—'
  }
  if (typeof teacher === 'string' && teacher.trim() && !isMongoObjectId(teacher)) {
    return teacher.trim()
  }
  return '—'
}

function resolveTopicLabels(item) {
  if (Array.isArray(item?.topicMeta) && item.topicMeta.length) {
    return item.topicMeta.map((entry) => String(entry?.label || '').trim()).filter(Boolean)
  }

  const raw = Array.isArray(item?.topics) && item.topics.length
    ? item.topics
    : item?.topic
      ? [item.topic]
      : []

  return raw
    .map((entry) => {
      if (entry && typeof entry === 'object') {
        return String(entry.topicName || entry.name || entry.label || '').trim()
      }
      const text = String(entry || '').trim()
      return isMongoObjectId(text) ? '' : text
    })
    .filter(Boolean)
}

export default function ViewFacultySubjectModal({ open, onClose, item, loading = false, error = null }) {
  if (!open) return null

  if (loading) {
    return (
      <Modal open={open} onClose={onClose} size="md" title="View subject" showCloseButton={false}>
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl bg-white p-8 text-sm font-medium text-[#686868]">
          Loading subject details…
        </div>
      </Modal>
    )
  }

  if (error && !item) {
    return (
      <Modal open={open} onClose={onClose} size="md" title="View subject" showCloseButton={false}>
        <div className="space-y-4 rounded-2xl bg-white p-6">
          <p className="text-sm font-medium text-red-700">{error}</p>
          <div className="text-right">
            <button
              type="button"
              onClick={onClose}
              className="min-w-[120px] rounded-full bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-110"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  if (!item) return null

  const teacherName = resolveTeacherDisplay(item)
  const topicLabels = resolveTopicLabels(item)

  return (
    <Modal open={open} onClose={onClose} size="md" title={`View ${item.subjectName || 'Subject'}`} showCloseButton={false}>
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <header className="flex items-start justify-between gap-3 bg-gradient-to-r from-[#55ace7] via-[#5a7ba8] to-[#1a3a5c] px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <BookOpen className="h-6 w-6 text-[#246392]" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 text-white">
              <h2 className="truncate text-lg font-bold sm:text-xl">
                {item.subjectName || 'Untitled Subject'}
              </h2>
              <p className="text-sm text-white/85">
                {item.displayId || item.facultySubjectId || item.id}
              </p>
            </div>
          </div>
          <ModalCloseButton onClick={onClose} aria-label="Close" />
        </header>

        <div className="space-y-4 p-5 sm:p-6">
          <h3 className="border-b border-[#eef2fc] pb-2 text-sm font-bold uppercase tracking-wide text-[#246392]">
            Course Details
          </h3>
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Subject Name">{item.subjectName || '—'}</DetailItem>
            <DetailItem label="Subject">{item.subjectLabel || item.subject || '—'}</DetailItem>
            <DetailItem label="Faculty">{teacherName}</DetailItem>
            <DetailItem label="Status">
              <SubjectStatusToggle status={item.status} disabled />
            </DetailItem>
            <DetailItem label="Topics">
              {topicLabels.length ? (
                <TableValueChips values={topicLabels} moreLabel="More" />
              ) : (
                '—'
              )}
            </DetailItem>
            <DetailItem label="Categories">
              {normalizeCategories(item.categories ?? item.category).length ? (
                <TableValueChips values={normalizeCategories(item.categories ?? item.category)} />
              ) : (
                '—'
              )}
            </DetailItem>
            <DetailItem label="Created On">
              {formatCategoryDateTime(item.createdAt)}
            </DetailItem>
            <DetailItem label="Modified On">
              {formatCategoryDateTime(item.modifiedAt)}
            </DetailItem>
          </dl>
        </div>

        <footer className="border-t border-[#eef2fc] bg-[#fafafa] px-5 py-4 text-right sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="min-w-[120px] rounded-full bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-110"
          >
            Close
          </button>
        </footer>
      </div>
    </Modal>
  )
}
