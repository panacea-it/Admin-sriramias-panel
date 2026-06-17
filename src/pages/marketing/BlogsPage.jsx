import { useCallback, useMemo, useState } from 'react'
import { FileText, Layers, X } from 'lucide-react'
import { toast } from '@/utils/toast'
import BlogFilterToolbar from '../../components/blogs/BlogFilterToolbar'
import AddBlogModal from '../../components/blogs/AddBlogModal'
import BlogManagementTable from '../../components/blogs/BlogManagementTable'
import BlogRowActions from '../../components/blogs/BlogRowActions'
import BlogStatusBadge from '../../components/blogs/BlogStatusBadge'
import ConfirmDeleteDialog from '../../components/subjects/ConfirmDeleteDialog'
import {
  blogStatusLabel,
  isBlogActive,
  toggleBlogStatus,
} from '../../constants/blogManagementConstants'
import {
  formatBlogDate,
  formatBlogTime,
  loadBlogs,
  saveBlogs,
} from '../../data/blogsData'
import { isSameCalendarDay, startOfDay } from '../../utils/dailyCollectionUtils'
import { cn } from '../../utils/cn'

function MainBlogBadge() {
  return (
    <span
      className="inline-flex min-w-[88px] shrink-0 items-center justify-center rounded-full bg-violet-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-900 ring-1 ring-inset ring-violet-500/25"
    >
      Main Blog
    </span>
  )
}

function BlogTitleCell({ title, isMainBlog }) {
  return (
    <div className="flex min-w-0 max-w-md items-center gap-2">
      <span className="truncate font-semibold leading-snug text-[#111]">{title}</span>
      {isMainBlog && <MainBlogBadge />}
    </div>
  )
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState(loadBlogs)
  const [search, setSearch] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBlog, setEditingBlog] = useState(null)
  const [viewTarget, setViewTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [statusUpdatingIds, setStatusUpdatingIds] = useState(() => new Set())

  const persist = (next) => {
    setBlogs(next)
    saveBlogs(next)
  }

  const openCreate = () => {
    setEditingBlog(null)
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditingBlog(row)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingBlog(null)
  }

  const handleSave = useCallback(
    async (payload, { isEdit } = {}) => {
      const exists = blogs.some((b) => b.id === payload.id)
      if (isEdit || exists) {
        persist(blogs.map((b) => (b.id === payload.id ? payload : b)))
      } else {
        persist([payload, ...blogs])
      }
    },
    [blogs],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return blogs.filter((row) => {
      const matchSearch =
        !q ||
        row.title.toLowerCase().includes(q) ||
        (row.slug || '').toLowerCase().includes(q) ||
        (row.category || '').toLowerCase().includes(q) ||
        (row.language || '').toLowerCase().includes(q) ||
        (row.tags || []).some((t) => t.toLowerCase().includes(q))
      const matchStatus = statusFilter === 'all' || row.status === statusFilter
      const matchDate =
        !selectedDate ||
        isSameCalendarDay(new Date(row.publishedAt), selectedDate)
      return matchSearch && matchStatus && matchDate
    })
  }, [blogs, search, selectedDate, statusFilter])

  const handleToggleStatus = useCallback(
    (row) => {
      let blocked = false
      setStatusUpdatingIds((prev) => {
        if (prev.has(row.id)) {
          blocked = true
          return prev
        }
        return new Set(prev).add(row.id)
      })
      if (blocked) return

      const nextStatus = toggleBlogStatus(row.status)
      const now = new Date().toISOString()
      const snapshot = blogs

      const next = blogs.map((b) =>
        b.id === row.id
          ? {
              ...b,
              status: nextStatus,
              publishedAt:
                nextStatus === 'published' ? b.publishedAt || now : b.publishedAt,
              lastSavedAt: now,
            }
          : b,
      )

      setBlogs(next)

      try {
        saveBlogs(next)
        toast.success(isBlogActive(nextStatus) ? 'Blog enabled' : 'Blog disabled')
        if (editingBlog?.id === row.id) {
          setEditingBlog((prev) =>
            prev?.id === row.id ? { ...prev, status: nextStatus, lastSavedAt: now } : prev,
          )
        }
      } catch (err) {
        setBlogs(snapshot)
        toast.error(err?.message || 'Failed to update status')
      } finally {
        setStatusUpdatingIds((prev) => {
          const ids = new Set(prev)
          ids.delete(row.id)
          return ids
        })
      }
    },
    [blogs, editingBlog?.id],
  )

  const toggleMainBlog = useCallback(
    (rowId) => {
      const row = blogs.find((b) => b.id === rowId)
      if (!row) return
      const next = blogs.map((b) =>
        b.id === rowId ? { ...b, isMainBlog: !b.isMainBlog } : b,
      )
      persist(next)
      toast.success(row.isMainBlog ? 'Main Blog removed' : 'Marked as Main Blog')
    },
    [blogs],
  )

  const requestDelete = (row) => setDeleteTarget(row)

  const cancelDelete = () => {
    if (!deleting) setDeleteTarget(null)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return

    const id = deleteTarget.id
    const snapshot = blogs
    setDeleting(true)
    setBlogs((prev) => prev.filter((b) => b.id !== id))

    try {
      saveBlogs(snapshot.filter((b) => b.id !== id))
      toast.success('Blog deleted')
      setDeleteTarget(null)
      if (editingBlog?.id === id) closeModal()
      if (viewTarget?.id === id) setViewTarget(null)
    } catch (err) {
      setBlogs(snapshot)
      toast.error(err?.message || 'Failed to delete blog')
    } finally {
      setDeleting(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'title',
        label: 'Title',
        headerClassName: 'min-w-[220px] pl-4 sm:pl-6',
        cellClassName: 'min-w-[220px] pl-4 align-middle sm:pl-6',
        render: (row) => (
          <BlogTitleCell title={row.title} isMainBlog={row.isMainBlog} />
        ),
      },
      {
        key: 'category',
        label: 'Category',
        headerClassName: 'min-w-[140px]',
        cellClassName: 'min-w-[140px] align-middle text-[13px] font-medium text-[#111]',
        render: (row) => <span className="block truncate">{row.category || '—'}</span>,
      },
      {
        key: 'date',
        label: 'Date',
        headerClassName: 'min-w-[120px] whitespace-nowrap',
        cellClassName: 'min-w-[120px] align-middle whitespace-nowrap text-[13px] text-[#686868]',
        render: (row) => formatBlogDate(row.publishedAt),
      },
      {
        key: 'time',
        label: 'Time',
        headerClassName: 'min-w-[100px] whitespace-nowrap',
        cellClassName: 'min-w-[100px] align-middle whitespace-nowrap text-[13px] text-[#686868]',
        render: (row) => formatBlogTime(row.publishedAt),
      },
      {
        key: 'status',
        label: 'Status',
        headerClassName: 'min-w-[110px]',
        cellClassName: 'min-w-[110px] align-middle',
        render: (row) => <BlogStatusBadge status={row.status} />,
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        headerClassName: 'min-w-[300px] whitespace-nowrap pr-4 text-right sm:pr-6',
        cellClassName:
          'min-w-[300px] whitespace-nowrap align-middle pr-4 text-right sm:pr-6',
        render: (row) => (
          <BlogRowActions
            title={row.title}
            status={row.status}
            isMainBlog={row.isMainBlog}
            loading={statusUpdatingIds.has(row.id)}
            onView={() => setViewTarget(row)}
            onEdit={() => openEdit(row)}
            onStatusToggle={() => handleToggleStatus(row)}
            onToggleMainBlog={() => toggleMainBlog(row.id)}
            onDelete={() => requestDelete(row)}
          />
        ),
      },
    ],
    [handleToggleStatus, statusUpdatingIds, toggleMainBlog],
  )

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-6">
        <div
          className={cn(
            'flex min-h-[64px] flex-wrap items-center justify-between gap-4 rounded-xl px-5 py-4',
            'bg-gradient-to-r from-[#55ace7] via-[#8b98bb] to-[#df8284]',
            'shadow-[0_5px_16px_rgba(15,23,42,0.1)]',
          )}
        >
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <Layers className="h-6 w-6 text-[#246392]" strokeWidth={2.2} />
            </span>
            <h1 className="text-xl font-bold leading-none text-white">Blogs</h1>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1a3a5c] px-4 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition hover:bg-[#152f4a] active:scale-[0.98] sm:text-base"
          >
            Add Blog
          </button>
        </div>

        <BlogFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          selectedDate={selectedDate}
          onDateChange={(date) => setSelectedDate(date ? startOfDay(date) : null)}
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
        />

        <BlogManagementTable
          columns={columns}
          data={filtered}
          resetDeps={[search, selectedDate, statusFilter]}
        />
      </section>

      <AddBlogModal
        open={modalOpen}
        onClose={closeModal}
        blog={editingBlog}
        onSave={handleSave}
      />

      {viewTarget && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setViewTarget(null)}
        >
          <article
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex min-h-[56px] items-center justify-between gap-4 bg-gradient-to-r from-[#55ace7] via-[#4a9fd8] to-[#1a4d73] px-5 py-3.5 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                  <FileText className="h-5 w-5 text-[#246392]" strokeWidth={2.4} />
                </span>
                <h2 className="text-lg font-bold leading-none text-white sm:text-xl">
                  View Blog
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewTarget(null)}
                aria-label="Close dialog"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
              >
                <X className="h-5 w-5" strokeWidth={2.25} />
              </button>
            </header>

            <div className="space-y-5 px-5 py-6 sm:px-8">
              <div>
                <h3 className="text-lg font-bold text-[#111]">{viewTarget.title}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <BlogStatusBadge status={viewTarget.status} />
                  {viewTarget.isMainBlog && <MainBlogBadge />}
                </div>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                {[
                  ['Category', viewTarget.category],
                  ['Language', viewTarget.language],
                  ['Read Time', viewTarget.readTime],
                  ['Status', blogStatusLabel(viewTarget.status)],
                  ['Date', formatBlogDate(viewTarget.publishedAt)],
                  ['Time', formatBlogTime(viewTarget.publishedAt)],
                  ['Youtube URL', viewTarget.youtubeVideoUrl || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-[#f4f8fc] px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[#9ca0a8]">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-[#111]">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </article>
        </div>
      )}

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete Blog"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`
            : 'Are you sure you want to delete this blog?'
        }
        onCancel={cancelDelete}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        confirmLabel="Delete"
      />
    </div>
  )
}
