import { useCallback, useEffect, useMemo, useState } from 'react'
import { Layers } from 'lucide-react'
import { toast } from '@/utils/toast'
import BlogFilterToolbar from '../../components/blogs/BlogFilterToolbar'
import AddBlogModal from '../../components/blogs/AddBlogModal'
import BlogViewModal from '../../components/blogs/BlogViewModal'
import BlogManagementTable from '../../components/blogs/BlogManagementTable'
import BlogRowActions from '../../components/blogs/BlogRowActions'
import BlogStatusBadge from '../../components/blogs/BlogStatusBadge'
import AdminConfirmModal from '../../components/admin/AdminConfirmModal'
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
import { useBlogLanguageLookup } from '../../hooks/blogs/useBlogDropdowns'
import { useBlogDetails, useDeleteBlog, useSaveBlog, useUpdateBlogMain, useUpdateBlogStatus } from '../../hooks/blogs/useBlogManagement'
import { useBlogListManagement } from '../../hooks/blogs/useBlogListManagement'
import { fetchBlogDetails } from '../../api/blogAPI'
import { isFrontendOnly } from '../../config/appMode'
import { getApiErrorMessage } from '../../utils/apiError'
import { applyBlogMainUpdateToRow, applyBlogStatusUpdateToRow, mapUiStatusToApi } from '../../utils/blogApiHelpers'
import { isSameCalendarDay, startOfDay } from '../../utils/dailyCollectionUtils'
import { createActionsColumn } from '../../utils/tableColumnHelpers'
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

function BlogTitleCell({ title, isMainBlog, showBadge = true }) {
  return (
    <div className="flex min-w-0 max-w-md items-center gap-2">
      <span className="truncate font-semibold leading-snug text-[#111]">{title}</span>
      {showBadge && isMainBlog ? <MainBlogBadge /> : null}
    </div>
  )
}

export default function BlogsPage() {
  const useLiveApi = !isFrontendOnly && import.meta.env.VITE_BLOG_USE_MOCK !== 'true'
  const [localBlogs, setLocalBlogs] = useState(loadBlogs)
  const [localSearch, setLocalSearch] = useState('')
  const [localSelectedDate, setLocalSelectedDate] = useState(null)
  const [localStatusFilter, setLocalStatusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBlog, setEditingBlog] = useState(null)
  const [viewTarget, setViewTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [statusUpdatingIds, setStatusUpdatingIds] = useState(() => new Set())
  const [mainBlogUpdatingIds, setMainBlogUpdatingIds] = useState(() => new Set())

  const { languageLookup } = useBlogLanguageLookup({ enabled: useLiveApi })

  const listManagement = useBlogListManagement({
    enabled: useLiveApi,
    languageLookup,
  })

  const {
    items: apiItems,
    search,
    setSearch,
    selectedDate,
    setSelectedDate,
    statusFilter,
    handleStatusFilterChange,
    controlledPagination,
    listLoading,
    isError: blogsError,
    error: blogsQueryError,
    refetch: refetchBlogs,
  } = listManagement

  const saveBlogMutation = useSaveBlog()
  const updateBlogStatusMutation = useUpdateBlogStatus()
  const updateBlogMainMutation = useUpdateBlogMain()
  const deleteBlogMutation = useDeleteBlog()

  const blogs = useLiveApi ? apiItems : localBlogs
  const searchValue = useLiveApi ? search : localSearch
  const selectedDateValue = useLiveApi ? selectedDate : localSelectedDate
  const statusFilterValue = useLiveApi ? statusFilter : localStatusFilter

  const {
    data: editDetail,
    isFetching: editDetailLoading,
    isError: editDetailError,
    error: editDetailQueryError,
  } = useBlogDetails(editingBlog?.blogId, {
    enabled: useLiveApi && modalOpen && Boolean(editingBlog?.blogId),
    languageLookup,
  })

  const { data: viewDetail, isFetching: viewDetailLoading, isError: viewDetailError, error: viewDetailQueryError } = useBlogDetails(viewTarget?.blogId, {
    enabled: useLiveApi && Boolean(viewTarget?.blogId),
    languageLookup,
  })

  const activeViewTarget = useLiveApi ? viewDetail : viewTarget
  const activeEditingBlog = useLiveApi ? (editDetail ?? editingBlog) : editingBlog
  const editDetailsLoading = useLiveApi && modalOpen && Boolean(editingBlog?.blogId) && editDetailLoading
  const viewDetailsLoading = useLiveApi && Boolean(viewTarget?.blogId) && viewDetailLoading

  useEffect(() => {
    if (useLiveApi && viewDetailError && viewTarget) {
      toast.error(getApiErrorMessage(viewDetailQueryError, 'Unable to fetch blog details.'))
    }
  }, [useLiveApi, viewDetailError, viewDetailQueryError, viewTarget])

  useEffect(() => {
    if (useLiveApi && editDetailError && modalOpen && editingBlog) {
      toast.error(getApiErrorMessage(editDetailQueryError, 'Unable to fetch blog details.'))
      setModalOpen(false)
      setEditingBlog(null)
    }
  }, [useLiveApi, editDetailError, editDetailQueryError, modalOpen, editingBlog])

  useEffect(() => {
    if (useLiveApi && blogsError) {
      toast.error(getApiErrorMessage(blogsQueryError, 'Unable to fetch blogs.'))
    }
  }, [useLiveApi, blogsError, blogsQueryError])

  const persistLocal = (next) => {
    setLocalBlogs(next)
    saveBlogs(next)
  }

  const resolveBlogForSave = useCallback(
    async (row) => {
      if (!useLiveApi || !row?.blogId) return row
      try {
        return await fetchBlogDetails(row.blogId, languageLookup)
      } catch {
        return row
      }
    },
    [useLiveApi, languageLookup],
  )

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
    async (payload, { isEdit, backgroundFile, languageLookup: lookup } = {}) => {
      if (useLiveApi) {
        const saved = await saveBlogMutation.mutateAsync({
          form: payload,
          backgroundFile,
          isEdit,
          languageLookup: lookup || languageLookup,
        })

        if (!isEdit) {
          listManagement.setPage(1)
        }

        await refetchBlogs()
        return saved
      }

      const exists = localBlogs.some((b) => b.id === payload.id)
      if (isEdit || exists) {
        persistLocal(localBlogs.map((b) => (b.id === payload.id ? payload : b)))
      } else {
        persistLocal([payload, ...localBlogs])
      }
      return { message: isEdit ? 'Blog updated successfully' : 'Blog created successfully', data: payload }
    },
    [useLiveApi, localBlogs, saveBlogMutation, languageLookup, refetchBlogs, listManagement],
  )

  const filtered = useMemo(() => {
    if (useLiveApi) return blogs

    const q = localSearch.trim().toLowerCase()
    return blogs.filter((row) => {
      const matchSearch =
        !q ||
        row.title.toLowerCase().includes(q) ||
        (row.slug || '').toLowerCase().includes(q) ||
        (row.category || '').toLowerCase().includes(q) ||
        (row.language || '').toLowerCase().includes(q) ||
        (row.tags || []).some((t) => t.toLowerCase().includes(q))
      const matchStatus = localStatusFilter === 'all' || row.status === localStatusFilter
      const matchDate =
        !localSelectedDate ||
        isSameCalendarDay(new Date(row.publishedAt), localSelectedDate)
      return matchSearch && matchStatus && matchDate
    })
  }, [useLiveApi, blogs, localSearch, localSelectedDate, localStatusFilter])

  const handleToggleStatus = useCallback(
    async (row) => {
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

      try {
        if (useLiveApi) {
          if (!row.blogId) {
            toast.error('Blog ID is missing.')
            return
          }

          const response = await updateBlogStatusMutation.mutateAsync({
            blogId: row.blogId,
            status: mapUiStatusToApi(nextStatus),
          })

          toast.success(response?.message || 'Blog status updated successfully')

          if (editingBlog?.id === row.id && response?.data) {
            setEditingBlog((prev) =>
              prev?.id === row.id ? applyBlogStatusUpdateToRow(prev, response.data) : prev,
            )
          }
        } else {
          setLocalBlogs(next)
          saveBlogs(next)
          toast.success(isBlogActive(nextStatus) ? 'Blog enabled' : 'Blog disabled')

          if (editingBlog?.id === row.id) {
            setEditingBlog((prev) =>
              prev?.id === row.id ? { ...prev, status: nextStatus, lastSavedAt: now } : prev,
            )
          }
        }
      } catch (err) {
        if (!useLiveApi) {
          setLocalBlogs(snapshot)
        }
        toast.error(getApiErrorMessage(err, 'Failed to update status'))
      } finally {
        setStatusUpdatingIds((prev) => {
          const ids = new Set(prev)
          ids.delete(row.id)
          return ids
        })
      }
    },
    [
      blogs,
      editingBlog?.id,
      useLiveApi,
      updateBlogStatusMutation,
    ],
  )

  const toggleMainBlog = useCallback(
    async (rowId) => {
      const row = blogs.find((b) => b.id === rowId)
      if (!row) return

      let blocked = false
      setMainBlogUpdatingIds((prev) => {
        if (prev.has(rowId)) {
          blocked = true
          return prev
        }
        return new Set(prev).add(rowId)
      })
      if (blocked) return

      const wasMainBlog = Boolean(row.isMainBlog)
      const now = new Date().toISOString()

      try {
        if (useLiveApi) {
          if (!row.blogId) {
            toast.error('Blog ID is missing.')
            return
          }

          const response = await updateBlogMainMutation.mutateAsync({
            blogId: row.blogId,
            isMainBlog: wasMainBlog,
          })

          toast.success(response?.message || 'Main blog updated successfully')

          if (editingBlog?.id === rowId && response?.data) {
            setEditingBlog((prev) =>
              prev?.id === rowId ? applyBlogMainUpdateToRow(prev, response.data) : prev,
            )
          }
        } else {
          const next = localBlogs.map((b) => ({
            ...b,
            isMainBlog: b.id === rowId ? !wasMainBlog : wasMainBlog ? false : b.isMainBlog,
            lastSavedAt: b.id === rowId ? now : b.lastSavedAt,
          }))
          persistLocal(next)
          toast.success(wasMainBlog ? 'Main Blog removed' : 'Marked as Main Blog')

          if (editingBlog?.id === rowId) {
            setEditingBlog((prev) =>
              prev?.id === rowId
                ? { ...prev, isMainBlog: !wasMainBlog, lastSavedAt: now }
                : prev,
            )
          }
        }
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Failed to update main blog status'))
      } finally {
        setMainBlogUpdatingIds((prev) => {
          const ids = new Set(prev)
          ids.delete(rowId)
          return ids
        })
      }
    },
    [blogs, localBlogs, useLiveApi, updateBlogMainMutation, editingBlog?.id],
  )

  const requestDelete = (row) => setDeleteTarget(row)

  const cancelDelete = () => {
    if (!deleting) setDeleteTarget(null)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return

    const id = deleteTarget.id
    const blogId = deleteTarget.blogId
    const snapshot = blogs
    const wasOnlyItemOnPage = useLiveApi ? blogs.length === 1 : false
    const currentPage = listManagement.page

    if (useLiveApi && !blogId) {
      toast.error('Blog ID is missing.')
      return
    }

    setDeleting(true)
    if (!useLiveApi) {
      setLocalBlogs((prev) => prev.filter((b) => b.id !== id))
    }

    try {
      if (useLiveApi) {
        const response = await deleteBlogMutation.mutateAsync({ blogId })
        toast.success(response?.message || 'Blog deleted successfully')

        if (wasOnlyItemOnPage && currentPage > 1) {
          listManagement.setPage(currentPage - 1)
        }

        await refetchBlogs()
      } else {
        saveBlogs(snapshot.filter((b) => b.id !== id))
        toast.success('Blog deleted')
      }

      setDeleteTarget(null)
      if (editingBlog?.id === id) closeModal()
      if (viewTarget?.id === id) setViewTarget(null)
    } catch (err) {
      if (!useLiveApi) {
        setLocalBlogs(snapshot)
      }
      toast.error(getApiErrorMessage(err, 'Failed to delete blog'))
    } finally {
      setDeleting(false)
    }
  }

  const apiColumns = useMemo(
    () => [
      {
        key: 'blogId',
        label: 'Blog ID',
        headerClassName: 'min-w-[110px] pl-4 sm:pl-6 whitespace-nowrap',
        cellClassName: 'min-w-[110px] pl-4 align-middle whitespace-nowrap text-[13px] font-semibold text-[#111] sm:pl-6',
        render: (row) => row.blogId || '—',
      },
      {
        key: 'title',
        label: 'Title',
        headerClassName: 'min-w-[220px]',
        cellClassName: 'min-w-[220px] align-middle',
        render: (row) => <BlogTitleCell title={row.title} isMainBlog={false} showBadge={false} />,
      },
      {
        key: 'category',
        label: 'Category',
        headerClassName: 'min-w-[140px]',
        cellClassName: 'min-w-[140px] align-middle text-[13px] font-medium text-[#111]',
        render: (row) => <span className="block truncate">{row.category || '—'}</span>,
      },
      {
        key: 'language',
        label: 'Language',
        headerClassName: 'min-w-[120px]',
        cellClassName: 'min-w-[120px] align-middle text-[13px] font-medium text-[#111]',
        render: (row) => <span className="block truncate">{row.language || '—'}</span>,
      },
      {
        key: 'readTime',
        label: 'Read Time',
        headerClassName: 'min-w-[110px] whitespace-nowrap',
        cellClassName: 'min-w-[110px] align-middle whitespace-nowrap text-[13px] text-[#686868]',
        render: (row) => row.readTime || '—',
      },
      {
        key: 'date',
        label: 'Date',
        headerClassName: 'min-w-[120px] whitespace-nowrap',
        cellClassName: 'min-w-[120px] align-middle whitespace-nowrap text-[13px] text-[#686868]',
        render: (row) => row.listDate || '—',
      },
      {
        key: 'time',
        label: 'Time',
        headerClassName: 'min-w-[100px] whitespace-nowrap',
        cellClassName: 'min-w-[100px] align-middle whitespace-nowrap text-[13px] text-[#686868]',
        render: (row) => row.listTime || '—',
      },
      {
        key: 'status',
        label: 'Status',
        headerClassName: 'min-w-[110px]',
        cellClassName: 'min-w-[110px] align-middle text-[13px] font-semibold text-[#111]',
        render: (row) => row.listStatus || '—',
      },
      {
        key: 'isMainBlog',
        label: 'Main Blog',
        headerClassName: 'min-w-[100px] whitespace-nowrap',
        cellClassName: 'min-w-[100px] align-middle whitespace-nowrap text-[13px] font-semibold text-[#111]',
        render: (row) => row.mainBlogLabel || (row.isMainBlog ? 'Yes' : 'No'),
      },
      createActionsColumn({
        buttonCount: 5,
        align: 'right',
        render: (row) => (
          <BlogRowActions
            title={row.title}
            status={row.status}
            isMainBlog={row.isMainBlog}
            loading={statusUpdatingIds.has(row.id)}
            mainBlogLoading={mainBlogUpdatingIds.has(row.id)}
            deleteLoading={deleting && deleteTarget?.id === row.id}
            onView={() => setViewTarget(row)}
            onEdit={() => openEdit(row)}
            onStatusToggle={() => handleToggleStatus(row)}
            onToggleMainBlog={() => toggleMainBlog(row.id)}
            onDelete={() => requestDelete(row)}
          />
        ),
      }),
    ],
    [handleToggleStatus, statusUpdatingIds, mainBlogUpdatingIds, deleting, deleteTarget, toggleMainBlog],
  )

  const localColumns = useMemo(
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
      createActionsColumn({
        buttonCount: 5,
        align: 'right',
        render: (row) => (
          <BlogRowActions
            title={row.title}
            status={row.status}
            isMainBlog={row.isMainBlog}
            loading={statusUpdatingIds.has(row.id)}
            mainBlogLoading={mainBlogUpdatingIds.has(row.id)}
            deleteLoading={deleting && deleteTarget?.id === row.id}
            onView={() => setViewTarget(row)}
            onEdit={() => openEdit(row)}
            onStatusToggle={() => handleToggleStatus(row)}
            onToggleMainBlog={() => toggleMainBlog(row.id)}
            onDelete={() => requestDelete(row)}
          />
        ),
      }),
    ],
    [handleToggleStatus, statusUpdatingIds, mainBlogUpdatingIds, deleting, deleteTarget, toggleMainBlog],
  )

  const columns = useLiveApi ? apiColumns : localColumns
  const tableData = useLiveApi ? blogs : filtered

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
          search={searchValue}
          onSearchChange={(e) =>
            useLiveApi ? setSearch(e.target.value) : setLocalSearch(e.target.value)
          }
          selectedDate={selectedDateValue}
          onDateChange={(date) => {
            const nextDate = date ? startOfDay(date) : null
            if (useLiveApi) {
              setSelectedDate(nextDate)
              listManagement.setPage(1)
            } else {
              setLocalSelectedDate(nextDate)
            }
          }}
          status={statusFilterValue}
          onStatusChange={
            useLiveApi
              ? handleStatusFilterChange
              : (e) => setLocalStatusFilter(e.target.value)
          }
          disabled={useLiveApi && listLoading}
        />

        {useLiveApi && blogsError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {getApiErrorMessage(blogsQueryError, 'Unable to fetch blogs.')}
          </p>
        ) : null}

        <BlogManagementTable
          columns={columns}
          data={tableData}
          loading={useLiveApi && listLoading}
          controlledPagination={useLiveApi ? controlledPagination : undefined}
          emptyMessage={useLiveApi ? 'No Blogs Found' : 'No blogs match your filters.'}
          resetDeps={
            useLiveApi
              ? [searchValue, selectedDateValue, statusFilterValue]
              : [localSearch, localSelectedDate, localStatusFilter]
          }
        />
      </section>

      <AddBlogModal
        open={modalOpen}
        onClose={closeModal}
        blog={activeEditingBlog}
        onSave={handleSave}
        detailsLoading={editDetailsLoading}
      />

      <BlogViewModal
        open={Boolean(viewTarget)}
        blog={activeViewTarget}
        loading={viewDetailsLoading}
        onClose={() => setViewTarget(null)}
      />

      <AdminConfirmModal
        open={Boolean(deleteTarget)}
        onClose={cancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Blog"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.title || deleteTarget.blogId || 'this blog'}"? This will remove it from the customer website if published.`
            : 'Are you sure you want to delete this blog?'
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleting}
        loadingLabel="Deleting…"
        variant="danger"
      />
    </div>
  )
}
