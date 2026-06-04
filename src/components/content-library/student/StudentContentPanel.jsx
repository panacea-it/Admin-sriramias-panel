import { useMemo, useState } from 'react'
import { Bookmark, Clock, Download, Play, Search } from 'lucide-react'
import { toast } from '@/utils/toast'
import {
  getContentForStudent,
  getRecentlyViewed,
  getStudentBookmarks,
  recordContentView,
  toggleBookmark,
} from '../../../api/contentLibraryAPI'
import ContentPreviewModal from '../ContentPreviewModal'
import { contentLibraryTw } from '../../../constants/contentLibraryTheme'

export default function StudentContentPanel({
  studentId = 'student-demo',
  batchIds = ['batch-2025'],
  courseIds = ['course-gs'],
  membership = 'paid',
}) {
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState(null)
  const [bookmarks, setBookmarks] = useState(() => getStudentBookmarks(studentId))

  const allowed = useMemo(
    () =>
      getContentForStudent({ studentId, batchIds, courseIds, membership }).filter((item) => {
        const q = search.trim().toLowerCase()
        if (!q) return true
        return item.title.toLowerCase().includes(q)
      }),
    [studentId, batchIds, courseIds, membership, search],
  )

  const recent = useMemo(() => getRecentlyViewed(studentId), [studentId, preview])

  const handleBookmark = (contentId) => {
    toggleBookmark(contentId, studentId)
    setBookmarks(getStudentBookmarks(studentId))
    toast.success('Bookmarks updated')
  }

  const handleView = (item) => {
    recordContentView(item.id, studentId, 0)
    setPreview(item)
  }

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your content"
          className="h-10 w-full rounded-lg border border-slate-200 pl-10 text-sm"
        />
      </div>

      {recent.length > 0 && (
        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-[#1a3a5c]">
            <Clock className="h-4 w-4" /> Continue watching
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recent.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleView(item)}
                className={cnCard('min-w-[180px] shrink-0 p-3 text-left')}
              >
                <p className="truncate text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-slate-500">{item.progress || 0}% complete</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-3 text-sm font-bold text-[#1a3a5c]">Your library ({allowed.length})</h3>
        {allowed.length === 0 ? (
          <p className="text-sm text-slate-500">No content available for your enrollment.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {allowed.map((item) => {
              const bookmarked = bookmarks.some((b) => b.contentId === item.id)
              return (
                <article key={item.id} className={cnCard('p-4')}>
                  <p className="font-semibold text-[#1a3a5c]">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.contentType}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleView(item)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#55ace7] px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      <Play className="h-3.5 w-3.5" /> Watch
                    </button>
                    {item.access?.downloadEnabled && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium"
                        onClick={() => toast.message('Download started (watermarked)')}
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleBookmark(item.id)}
                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
                        bookmarked ? 'bg-amber-100 text-amber-800' : 'border border-slate-200'
                      }`}
                    >
                      <Bookmark className="h-3.5 w-3.5" fill={bookmarked ? 'currentColor' : 'none'} />
                      {bookmarked ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <ContentPreviewModal item={preview} onClose={() => setPreview(null)} />
    </div>
  )
}

function cnCard(extra) {
  return `${contentLibraryTw.card} ${extra}`
}
