import { useMemo, useState } from 'react'
import { Eye, Layers, Loader2, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '../../utils/cn'
import { useFacultySubjectDetail } from '../../hooks/useFacultySubjectDetail'
import { loadSubjectContent } from '../../utils/facultySubjectContentStorage'
import {
  buildSystemCategoriesFromSubject,
  categoryLabelFromType,
  contentTypeFromCategoryType,
} from '../../utils/facultySubjectHierarchy'
import { enrichFolderItems } from '../../utils/contentItemDisplay'
import { parseDateForDisplay } from '../../utils/academicsSubjectsStorage'
import ContentItemPreviewModal from '../subject-content/ContentItemPreviewModal'

function buildContentSections(subject) {
  if (!subject) return []

  const stored = loadSubjectContent(subject.id, subject)
  const categories =
    stored?.categories?.length > 0
      ? stored.categories
      : buildSystemCategoriesFromSubject(subject)

  const sections = categories.map((category) => {
    const rows = []
    for (const folder of category.folders || []) {
      const enriched = enrichFolderItems(subject, folder.items || [], category.categoryType)
      enriched.forEach((row) => {
        rows.push({ ...row, folderName: folder.folderName })
      })
    }
    return {
      category,
      label: category.label || categoryLabelFromType(category.categoryType),
      rows,
    }
  })

  const legacyLive = subject.liveClasses || []
  if (legacyLive.length) {
    const liveSection = sections.find((s) => s.category.categoryType === 'LIVE_CLASS')
    const existingIds = new Set(
      (liveSection?.rows || []).map((r) => r.payload?.id || r.id),
    )
    legacyLive.forEach((lc) => {
      if (existingIds.has(lc.id)) return
      liveSection?.rows.push({
        id: lc.id,
        classTitle: lc.classTitle,
        date: parseDateForDisplay(lc.date),
        time: lc.startTime || lc.scheduledTime,
        faculty: subject.teacher || lc.teacher,
        status: lc.status,
        folderName: '—',
        payload: lc,
        item: { id: lc.id, title: lc.classTitle },
      })
    })
  }

  return sections.filter((section) => section.rows.length > 0)
}

function rowTitle(row, contentType) {
  if (contentType === 'live') return row.classTitle || row.title
  if (contentType === 'recording') return row.videoTitle || row.title
  if (contentType === 'test') return row.testName || row.title
  if (contentType === 'mainsAnswerWriting') return row.assignmentTitle || row.title
  if (contentType === 'pdf') return row.pdfName || row.title
  return row.title || 'Untitled'
}

function rowMeta(row, contentType) {
  if (contentType === 'live') {
    return [row.date, row.time, row.status || row.liveStatus].filter(Boolean).join(' · ')
  }
  if (contentType === 'recording') {
    return [row.duration, row.visibility || row.status].filter(Boolean).join(' · ')
  }
  if (contentType === 'test') {
    return [row.questions != null ? `${row.questions} questions` : null, row.duration]
      .filter(Boolean)
      .join(' · ')
  }
  if (contentType === 'pdf') {
    return [row.fileSize, row.uploaded].filter(Boolean).join(' · ')
  }
  if (contentType === 'mainsAnswerWriting') {
    return [row.dueDate, row.status].filter(Boolean).join(' · ')
  }
  return row.status || ''
}

export default function FacultySubjectViewListModal({ open, onClose, subjectRow }) {
  const subjectId = subjectRow?.id
  const { subject, loading, error } = useFacultySubjectDetail(subjectId, {
    enabled: open && Boolean(subjectId),
  })
  const resolvedSubject = subject || subjectRow
  const sections = useMemo(() => buildContentSections(resolvedSubject), [resolvedSubject])
  const [preview, setPreview] = useState(null)

  const handleClose = () => {
    setPreview(null)
    onClose?.()
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      <AnimatePresence>
        {open && subjectRow && (
          <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4 md:p-6">
            <motion.button
              type="button"
              aria-label="Close dialog"
              className="fixed inset-0 bg-slate-900/55 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="view-list-modal-title"
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 16 }}
              className={cn(
                'relative flex max-h-[96dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] ring-1 ring-slate-200/80',
                'sm:max-h-[92dvh] sm:w-[92vw] sm:max-w-[min(100%,1100px)] sm:rounded-2xl',
              )}
            >
              <header className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 border-b border-slate-200/80 bg-gradient-to-r from-[#55ace7] via-[#5a7ba8] to-[#1a3a5c] px-5 py-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                    <Layers className="h-6 w-6 text-[#246392]" strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0 text-white">
                    <h2 id="view-list-modal-title" className="truncate text-lg font-bold sm:text-xl">
                      View List — {resolvedSubject?.subjectName || 'Subject'}
                    </h2>
                    <p className="text-sm text-white/85">
                      {resolvedSubject?.teacher || '—'} · All linked content
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-6">
                {loading ? (
                  <div className="flex min-h-[240px] items-center justify-center gap-2 text-sm font-medium text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin text-[#246392]" />
                    Loading linked content…
                  </div>
                ) : error ? (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-8 text-center text-sm text-red-700">
                    {error}
                  </div>
                ) : sections.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500">
                    No linked content found for this subject yet.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {sections.map((section) => {
                      const contentType = contentTypeFromCategoryType(section.category.categoryType)
                      return (
                        <section
                          key={section.category.id}
                          className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.06)]"
                        >
                          <div className="border-b border-slate-100 bg-gradient-to-r from-[#eef6fc] to-white px-4 py-3 sm:px-5">
                            <h3 className="text-sm font-bold text-[#1a3a5c]">
                              {section.label}
                              <span className="ml-2 font-medium text-slate-500">
                                ({section.rows.length})
                              </span>
                            </h3>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] border-collapse text-sm">
                              <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  <th className="px-4 py-3 sm:px-5">Title</th>
                                  <th className="hidden px-4 py-3 sm:table-cell">Folder</th>
                                  <th className="px-4 py-3">Details</th>
                                  <th className="px-4 py-3 text-right sm:px-5">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {section.rows.map((row) => (
                                  <tr
                                    key={`${section.category.id}-${row.id}`}
                                    className="border-b border-slate-100/90 transition-colors hover:bg-[#f0f7ff]"
                                  >
                                    <td className="px-4 py-3 font-semibold text-[#111] sm:px-5">
                                      {rowTitle(row, contentType)}
                                    </td>
                                    <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                                      {row.folderName || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                      {rowMeta(row, contentType) || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right sm:px-5">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setPreview({ category: section.category, row })
                                        }
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#246392] transition hover:bg-[#eef2fc] hover:text-[#1a3a5c]"
                                        aria-label={`View ${rowTitle(row, contentType)}`}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </section>
                      )
                    })}
                  </div>
                )}
              </div>

              <footer className="sticky bottom-0 z-10 flex shrink-0 justify-end border-t border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex h-11 min-w-[120px] items-center justify-center rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-6 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                >
                  Close
                </button>
              </footer>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ContentItemPreviewModal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        category={preview?.category}
        row={preview?.row}
      />
    </>,
    document.body,
  )
}
