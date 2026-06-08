import { useCallback, useMemo, useState } from 'react'
import { Edit3, Layers, Trash2 } from 'lucide-react'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import BlogFilterToolbar from '../../components/blogs/BlogFilterToolbar'
import AddBlogModal from '../../components/blogs/AddBlogModal'
import BlogStatusBadge from '../../components/blogs/BlogStatusBadge'
import ConfirmDeleteDialog from '../../components/subjects/ConfirmDeleteDialog'
import { BannerButton } from '../../components/academics/AcademicsUi'
import { useTableRowSelection } from '../../hooks/useTableRowSelection'
import {
  formatBlogDate,
  formatBlogTime,
  isBlogToday,
  loadBlogs,
  saveBlogs,
} from '../../data/blogsData'

function BlogTitleCell({ title }) {
  return <span className="block max-w-md font-medium leading-snug">{title}</span>
}

function isThisWeek(iso) {
  const d = new Date(iso)
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay())
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 7)
  return d >= start && d < end
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState(loadBlogs)
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState('today')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBlog, setEditingBlog] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [statusUpdatingIds, setStatusUpdatingIds] = useState(() => new Set())
  const { selection, clearSelection } = useTableRowSelection((row) => row.id)

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

  const handleSave = useCallback(async (payload, { isEdit } = {}) => {
    const exists = blogs.some((b) => b.id === payload.id)
    if (isEdit || exists) {
      persist(blogs.map((b) => (b.id === payload.id ? payload : b)))
    } else {
      persist([...blogs, payload])
    }
  }, [blogs])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return blogs.filter((row) => {
      const matchSearch =
        !q ||
        row.title.toLowerCase().includes(q) ||
        (row.slug || '').toLowerCase().includes(q) ||
        (row.tags || []).some((t) => t.toLowerCase().includes(q))
      const matchStatus = statusFilter === 'all' || row.status === statusFilter
      let matchDate = true
      if (dateRange === 'today') matchDate = isBlogToday(row.publishedAt)
      if (dateRange === 'week') matchDate = isThisWeek(row.publishedAt)
      return matchSearch && matchStatus && matchDate
    })
  }, [blogs, search, dateRange, statusFilter])

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

      const previous = row.status
      const nextStatus = previous === 'published' ? 'draft' : 'published'
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
        toast.success(
          nextStatus === 'published' ? 'Blog published' : 'Blog marked as draft',
        )
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
      clearSelection()
      if (editingBlog?.id === id) closeModal()
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
        headerClassName: 'pl-4 sm:pl-6',
        cellClassName: 'pl-4 sm:pl-6 align-middle',
        render: (row) => <BlogTitleCell title={row.title} />,
      },
      {
        key: 'date',
        label: 'Date',
        cellClassName: 'align-middle whitespace-nowrap',
        render: (row) => formatBlogDate(row.publishedAt),
      },
      {
        key: 'time',
        label: 'Time',
        cellClassName: 'align-middle whitespace-nowrap',
        render: (row) => formatBlogTime(row.publishedAt),
      },
      {
        key: 'status',
        label: 'Status',
        cellClassName: 'align-middle',
        render: (row) => (
          <BlogStatusBadge
            status={row.status}
            loading={statusUpdatingIds.has(row.id)}
            disabled={statusUpdatingIds.has(row.id)}
            onClick={() => handleToggleStatus(row)}
          />
        ),
      },
      {
        key: 'actions',
        label: 'Action',
        cellClassName: 'align-middle',
        render: (row) => (
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => openEdit(row)}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#686868] transition hover:text-[#246392] sm:text-base"
            >
              <Edit3 className="h-4 w-4" strokeWidth={2.35} />
              Edit
            </button>
            <button
              type="button"
              onClick={() => requestDelete(row)}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#c96565] transition hover:text-[#b94b4b] sm:text-base"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2.1} />
              Delete
            </button>
          </div>
        ),
      },
    ],
    [handleToggleStatus, statusUpdatingIds],
  )

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <PageBanner
          icon={Layers}
          iconClassName="text-[#246392]"
          title="Blogs"
          className="from-[#55ace7] via-[#8b98bb] to-[#df8284]"
        >
          <BannerButton onClick={openCreate}>Add Blog</BannerButton>
        </PageBanner>

        <BlogFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          dateRange={dateRange}
          onDateRangeChange={(e) => setDateRange(e.target.value)}
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
        />

        <PaginatedFigmaTable
          columns={columns}
          data={filtered}
          emptyMessage="No blogs match your filters."
          itemLabel="blogs"
          resetDeps={[search, dateRange, statusFilter]}
          rowClassName="hover:bg-slate-50/90"
          selection={selection}
        />
      </section>

      <AddBlogModal
        open={modalOpen}
        onClose={closeModal}
        blog={editingBlog}
        onSave={handleSave}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete Blog"
        message="Are you sure you want to delete this blog?"
        onCancel={cancelDelete}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        confirmLabel="Delete"
      />
    </div>
  )
}
