import { useCallback, useEffect, useMemo, useState } from 'react'
import { Globe, Loader2, PlusCircle } from 'lucide-react'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import WebsiteFilterToolbar from './WebsiteFilterToolbar'
import WebsiteFormShell from './WebsiteFormShell'
import WebsiteFormModal from './WebsiteFormModal'
import YoutubeIcon from './YoutubeIcon'
import YoutubeVideoRowActions from './YoutubeVideoRowActions'
import YoutubeRankAssignCell from './YoutubeRankAssignCell'
import YoutubePriorityUpdateCell from './YoutubePriorityUpdateCell'
import YoutubeRankManagementSection from './YoutubeRankManagementSection'
import YoutubeRankedVideosSection from './YoutubeRankedVideosSection'
import AdminConfirmModal from '../admin/AdminConfirmModal'
import CategoryEmptyState from '../categories/CategoryEmptyState'
import {
  DateTimeInline,
  WebsiteField,
  WebsiteStatusBadge,
  WebsiteStatusSelect,
  YoutubeUrlLink,
  websiteInputClass,
} from './websiteUi'
import { buildYoutubePriorityFilterOptions } from '../../constants/youtubeVideoConstants'
import { useYoutubeVideoManagement } from '../../hooks/useYoutubeVideoManagement'
import {
  useAssignYoutubeRank,
  useCreateYoutubeVideo,
  useDeleteYoutubeVideo,
  useUpdateYoutubePriority,
  useUpdateYoutubeStatus,
  useUpdateYoutubeVideo,
  useYoutubeVideo,
} from '../../hooks/useYoutubeVideos'
import { validateYoutubeVideoForm } from '../../utils/youtubeFormValidation'
import { isYoutubeMutationSuccess, mapUiStatusToApi } from '../../utils/youtubeApiHelpers'
import { getApiErrorMessage } from '../../utils/apiError'
import { startOfDay } from '../../utils/dailyCollectionUtils'
import { toast } from '@/utils/toast'
import { cn } from '../../utils/cn'

const emptyYoutubeForm = () => ({
  name: '',
  description: '',
  url: '',
  status: 'Active',
  priority: '',
  priorityExpiryDate: '',
})

function formFromRow(row) {
  return {
    name: row.name || '',
    description: row.description || '',
    url: row.url || '',
    status: row.status || 'Active',
    priority: row.priority > 0 ? String(row.priority) : '',
    priorityExpiryDate: row.priorityExpiryDate || '',
  }
}

const inputErrorClass = 'ring-2 ring-[#EF4444]/60 bg-red-50/40'

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1.5 text-xs font-medium text-[#EF4444]">{message}</p>
}

function YoutubeThumbnailCell({ thumbnailUrl, title }) {
  const src = thumbnailUrl || '/assets/youtube_video_image.png'

  return (
    <div className="h-12 w-20 overflow-hidden rounded-md bg-[#eef2fc]">
      <img
        src={src}
        alt={title ? `${title} thumbnail` : 'Video thumbnail'}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={(event) => {
          event.currentTarget.onerror = null
          event.currentTarget.src = '/assets/youtube_video_image.png'
        }}
      />
    </div>
  )
}

function YoutubeViewDetails({ row }) {
  if (!row) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <YoutubeThumbnailCell thumbnailUrl={row.thumbnailUrl} title={row.name} />
      </div>
      <div className="sm:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#686868]">Video Title</p>
        <p className="mt-1 text-sm font-semibold text-[#111]">{row.name}</p>
      </div>
      <div className="sm:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#686868]">Description</p>
        <p className="mt-1 text-sm text-[#333]">{row.description || '—'}</p>
      </div>
      <div className="sm:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#686868]">YouTube URL</p>
        <div className="mt-1">
          <YoutubeUrlLink url={row.url} />
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#686868]">Status</p>
        <div className="mt-2">
          <WebsiteStatusBadge status={row.status} />
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#686868]">Priority</p>
        <p className="mt-1 text-sm font-semibold text-[#111]">
          {row.priority > 0 ? row.priority : '—'}
        </p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#686868]">Created By</p>
        <p className="mt-1 text-sm text-[#111]">{row.createdByName || '—'}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#686868]">Created Date</p>
        <p className="mt-1 text-sm text-[#111]">
          <DateTimeInline time={row.time} date={row.date} />
        </p>
      </div>
      <div className="sm:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#686868]">Updated Date</p>
        <p className="mt-1 text-sm text-[#111]">
          <DateTimeInline time={row.updatedTime} date={row.updatedDate} />
        </p>
      </div>
    </div>
  )
}

function YoutubeVideoDetailSkeleton() {
  return (
    <div className="grid animate-pulse gap-4 sm:grid-cols-2">
      <div className="h-12 w-20 rounded-md bg-[#eef2fc] sm:col-span-2" />
      <div className="h-4 w-full rounded bg-[#eef2fc] sm:col-span-2" />
      <div className="h-16 w-full rounded bg-[#eef2fc] sm:col-span-2" />
      <div className="h-4 w-full rounded bg-[#eef2fc] sm:col-span-2" />
      <div className="h-8 w-24 rounded bg-[#eef2fc]" />
      <div className="h-8 w-16 rounded bg-[#eef2fc]" />
      <div className="h-8 w-32 rounded bg-[#eef2fc]" />
      <div className="h-8 w-36 rounded bg-[#eef2fc]" />
      <div className="h-8 w-40 rounded bg-[#eef2fc] sm:col-span-2" />
    </div>
  )
}

function YoutubeDetailLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <Loader2 className="h-8 w-8 animate-spin text-[#246392]" aria-hidden />
      <p className="text-sm font-medium text-[#686868]">Loading video details…</p>
    </div>
  )
}

function ReadOnlyField({ label, value, className }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#686868]">{label}</p>
      <p className="mt-1 break-all text-sm font-medium text-[#111]">{value || '—'}</p>
    </div>
  )
}

function YoutubeEditReadOnlyDetails({ row }) {
  if (!row) return null

  return (
    <div className="mb-2 grid gap-4 rounded-xl border border-[#e2ebf5] bg-[#f8fbfd] p-4 sm:grid-cols-2 sm:col-span-2">
      <ReadOnlyField label="Video ID" value={row.id} />
      <ReadOnlyField label="YouTube Video ID" value={row.youtubeVideoId || '—'} />
      <ReadOnlyField label="Thumbnail URL" value={row.thumbnailUrl || '—'} className="sm:col-span-2" />
      <ReadOnlyField label="Created By" value={row.createdByName || '—'} />
      <ReadOnlyField
        label="Created Date"
        value={row.date && row.date !== '—' ? `${row.date} ${row.time || ''}`.trim() : '—'}
      />
      <ReadOnlyField
        label="Updated Date"
        value={
          row.updatedDate && row.updatedDate !== '—'
            ? `${row.updatedDate} ${row.updatedTime || ''}`.trim()
            : '—'
        }
        className="sm:col-span-2"
      />
    </div>
  )
}

export default function YoutubeManagementTab() {
  const {
    videos,
    isFetching,
    listError,
    search,
    setSearch,
    selectedDate,
    setSelectedDate,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    controlledPagination,
    refreshVideos,
    isEmpty,
    hasActiveFilters,
    isListBusy,
  } = useYoutubeVideoManagement()

  const createVideoMutation = useCreateYoutubeVideo()
  const updateVideoMutation = useUpdateYoutubeVideo()
  const deleteVideoMutation = useDeleteYoutubeVideo()
  const updateStatusMutation = useUpdateYoutubeStatus()
  const assignRankMutation = useAssignYoutubeRank()
  const updatePriorityMutation = useUpdateYoutubePriority()

  const [formOpen, setFormOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [detailVideoId, setDetailVideoId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [assigningVideoId, setAssigningVideoId] = useState(null)
  const [updatingPriorityVideoId, setUpdatingPriorityVideoId] = useState(null)
  const [activeSection, setActiveSection] = useState('all')
  const [form, setForm] = useState(emptyYoutubeForm)
  const [formErrors, setFormErrors] = useState({})
  const [submitError, setSubmitError] = useState('')

  const activeDetailId = viewOpen ? detailVideoId : editingId
  const shouldFetchDetail = Boolean(
    activeDetailId && (viewOpen || (formOpen && editingId)),
  )

  const {
    data: videoDetail,
    isLoading: detailLoading,
    isFetching: detailFetching,
    isError: detailError,
    error: detailQueryError,
  } = useYoutubeVideo(activeDetailId, { enabled: shouldFetchDetail })

  const detailBusy = detailLoading || detailFetching
  const detailErrorMessage = detailError
    ? getApiErrorMessage(detailQueryError, 'Unable to fetch YouTube video details. Please try again.')
    : ''

  useEffect(() => {
    if (!formOpen || !editingId || detailBusy || detailError || !videoDetail) return
    setForm(formFromRow(videoDetail))
  }, [formOpen, editingId, videoDetail, detailBusy, detailError])

  const saving = createVideoMutation.isPending || updateVideoMutation.isPending
  const deleting = deleteVideoMutation.isPending
  const detailFormBlocked = Boolean(editingId) && (detailBusy || detailError)
  const formDisabled = saving || detailFormBlocked

  const clearFieldError = (field) => {
    if (!formErrors[field]) return
    setFormErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const clearFormErrors = () => {
    setFormErrors({})
    setSubmitError('')
  }

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyYoutubeForm())
    clearFormErrors()
    setFormOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setDetailVideoId(row.id)
    setForm(emptyYoutubeForm())
    clearFormErrors()
    setFormOpen(true)
  }

  const openView = (row) => {
    setDetailVideoId(row.id)
    setViewOpen(true)
  }

  const closeView = () => {
    setViewOpen(false)
    setDetailVideoId(null)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setDetailVideoId(null)
    clearFormErrors()
  }

  const handleStatusChange = async (row, newStatus) => {
    try {
      const response = await updateStatusMutation.mutateAsync({
        id: row.id,
        payload: { status: mapUiStatusToApi(newStatus) },
      })
      if (!isYoutubeMutationSuccess(response)) {
        throw new Error(response?.message || 'Something went wrong. Please try again.')
      }
      toast.success(`Status updated to ${newStatus}`)
      refreshVideos()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update status'))
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return

    setDeleteError('')

    try {
      const response = await deleteVideoMutation.mutateAsync(deleteTarget.id)
      if (!isYoutubeMutationSuccess(response)) {
        const message = response?.message || 'Unable to delete YouTube video. Please try again.'
        setDeleteError(message)
        toast.error(message)
        return
      }

      toast.success(response?.message || 'YouTube video deleted successfully')
      setDeleteTarget(null)
      setDeleteError('')
      refreshVideos()
    } catch (error) {
      const message = getApiErrorMessage(error, 'Unable to delete YouTube video. Please try again.')
      setDeleteError(message)
      toast.error(message)
    }
  }

  const closeDeleteModal = () => {
    if (deleting) return
    setDeleteTarget(null)
    setDeleteError('')
  }

  const handleAssignRank = useCallback(
    async (videoId, rank) => {
      setAssigningVideoId(videoId)
      try {
        const response = await assignRankMutation.mutateAsync({ videoId, rank })
        if (!isYoutubeMutationSuccess(response)) {
          throw new Error(response?.message || 'Unable to assign video rank. Please try again.')
        }
        toast.success(response?.message || 'Video rank assigned successfully')
      } catch (error) {
        const message = getApiErrorMessage(error, 'Unable to assign video rank. Please try again.')
        toast.error(message)
        throw new Error(message)
      } finally {
        setAssigningVideoId(null)
      }
    },
    [assignRankMutation],
  )

  const handleUpdatePriority = useCallback(
    async (videoId, priority) => {
      setUpdatingPriorityVideoId(videoId)
      try {
        const response = await updatePriorityMutation.mutateAsync({ videoId, priority })
        if (!isYoutubeMutationSuccess(response)) {
          throw new Error(response?.message || 'Unable to update video priority. Please try again.')
        }
        toast.success(response?.message || 'Video priority updated successfully')
      } catch (error) {
        const message = getApiErrorMessage(error, 'Unable to update video priority. Please try again.')
        toast.error(message)
        throw new Error(message)
      } finally {
        setUpdatingPriorityVideoId(null)
      }
    },
    [updatePriorityMutation],
  )

  const handleSave = async () => {
    if (formDisabled) return

    const errors = validateYoutubeVideoForm(form)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      toast.error('Please fix the highlighted fields')
      return
    }

    setSubmitError('')

    try {
      if (editingId) {
        const response = await updateVideoMutation.mutateAsync({ id: editingId, form })
        if (!isYoutubeMutationSuccess(response)) {
          const message =
            response?.message || 'Unable to update the YouTube video. Please try again.'
          setSubmitError(message)
          toast.error(message)
          return
        }
        toast.success(response?.message || 'YouTube video updated successfully')
        closeForm()
        return
      }

      const response = await createVideoMutation.mutateAsync(form)
      if (!isYoutubeMutationSuccess(response)) {
        const message = response?.message || 'Something went wrong. Please try again.'
        setSubmitError(message)
        toast.error(message)
        return
      }
      toast.success(response?.message || 'YouTube video created successfully')
      closeForm()
      refreshVideos()
    } catch (error) {
      const fallback = editingId
        ? 'Unable to update the YouTube video. Please try again.'
        : 'Something went wrong. Please try again.'
      const message = getApiErrorMessage(error, fallback)
      setSubmitError(message)
      toast.error(message)
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'thumbnail',
        label: 'Thumbnail',
        headerClassName: 'min-w-[96px] pl-4 sm:pl-6',
        cellClassName: 'min-w-[96px] pl-4 align-middle sm:pl-6',
        render: (row) => (
          <YoutubeThumbnailCell thumbnailUrl={row.thumbnailUrl} title={row.name} />
        ),
      },
      {
        key: 'name',
        label: 'Video Name',
        headerClassName: 'min-w-[180px]',
        cellClassName: 'min-w-[180px] align-middle',
        render: (row) => (
          <span className="block max-w-[220px] truncate font-semibold text-[#111]">{row.name}</span>
        ),
      },
      {
        key: 'description',
        label: 'Description',
        headerClassName: 'min-w-[220px]',
        cellClassName: 'min-w-[220px] align-middle',
        render: (row) => (
          <span className="block max-w-[260px] truncate text-sm text-[#686868]">
            {row.description || '—'}
          </span>
        ),
      },
      {
        key: 'url',
        label: 'YouTube URL',
        headerClassName: 'min-w-[200px]',
        cellClassName: 'min-w-[200px] align-middle',
        render: (row) => <YoutubeUrlLink url={row.url} />,
      },
      {
        key: 'status',
        label: 'Status',
        headerClassName: 'min-w-[110px] whitespace-nowrap',
        cellClassName: 'min-w-[110px] align-middle whitespace-nowrap',
        render: (row) => <WebsiteStatusBadge status={row.status} />,
      },
      {
        key: 'rank',
        label: 'Rank',
        headerClassName: 'min-w-[160px] whitespace-nowrap',
        cellClassName: 'min-w-[160px] align-middle whitespace-nowrap',
        render: (row) => (
          <YoutubeRankAssignCell
            videoId={row.id}
            currentRank={row.rank ?? row.priorityOrder}
            onAssign={handleAssignRank}
            assigning={assigningVideoId === row.id && assignRankMutation.isPending}
          />
        ),
      },
      {
        key: 'priority',
        label: 'Priority',
        headerClassName: 'min-w-[160px] whitespace-nowrap',
        cellClassName: 'min-w-[160px] align-middle whitespace-nowrap',
        render: (row) => (
          <YoutubePriorityUpdateCell
            videoId={row.id}
            currentPriority={row.priority}
            onUpdate={handleUpdatePriority}
            updating={updatingPriorityVideoId === row.id && updatePriorityMutation.isPending}
          />
        ),
      },
      {
        key: 'createdBy',
        label: 'Created By',
        headerClassName: 'min-w-[140px]',
        cellClassName: 'min-w-[140px] align-middle text-sm text-[#333]',
        render: (row) => (
          <span className="block max-w-[160px] truncate">{row.createdByName || '—'}</span>
        ),
      },
      {
        key: 'created',
        label: 'Created Date',
        headerClassName: 'min-w-[150px] whitespace-nowrap',
        cellClassName: 'min-w-[150px] align-middle whitespace-nowrap',
        render: (row) => <DateTimeInline time={row.time} date={row.date} />,
      },
      {
        key: 'updated',
        label: 'Updated Date',
        headerClassName: 'min-w-[150px] whitespace-nowrap',
        cellClassName: 'min-w-[150px] align-middle whitespace-nowrap',
        render: (row) => <DateTimeInline time={row.updatedTime} date={row.updatedDate} />,
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        headerClassName: 'min-w-[220px] whitespace-nowrap pr-4 text-right sm:pr-6',
        cellClassName: 'min-w-[220px] align-middle whitespace-nowrap pr-4 text-right sm:pr-6',
        render: (row) => (
          <YoutubeVideoRowActions
            rowName={row.name}
            status={row.status}
            onView={() => openView(row)}
            onEdit={() => openEdit(row)}
            onDelete={() => {
              setDeleteError('')
              setDeleteTarget(row)
            }}
            onStatusChange={(newStatus) => handleStatusChange(row, newStatus)}
          />
        ),
      },
    ],
    [assigningVideoId, assignRankMutation.isPending, handleAssignRank, handleUpdatePriority, updatingPriorityVideoId, updatePriorityMutation.isPending],
  )

  const listErrorMessage = listError
    ? getApiErrorMessage(listError, 'Unable to fetch YouTube videos. Please try again.')
    : ''

  const showListEmptyState = !isListBusy && isEmpty && !listError
  const showListTable = !showListEmptyState

  return (
    <div className="space-y-6">
      <div
        className={cn(
          'flex min-h-[64px] flex-wrap items-center justify-between gap-4 rounded-xl px-5 py-4',
          'bg-gradient-to-r from-[#55ace7] via-[#8b98bb] to-[#df8284]',
          'shadow-[0_5px_16px_rgba(15,23,42,0.1)]',
        )}
      >
        <div className="flex items-center gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
            <YoutubeIcon className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-bold leading-none text-white">Youtube Management</h1>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1a3a5c] px-4 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition hover:bg-[#152f4a] active:scale-[0.98] sm:text-base"
        >
          <PlusCircle className="h-4 w-4 shrink-0" strokeWidth={2.2} />
          Add Video
        </button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-100 bg-white p-2 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveSection('all')}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-semibold transition',
            activeSection === 'all'
              ? 'bg-[#246392] text-white shadow-sm'
              : 'text-[#475569] hover:bg-[#f4f8fc]',
          )}
        >
          All Videos
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('ranked')}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-semibold transition',
            activeSection === 'ranked'
              ? 'bg-[#246392] text-white shadow-sm'
              : 'text-[#475569] hover:bg-[#f4f8fc]',
          )}
        >
          Ranked Videos
        </button>
      </div>

      {activeSection === 'ranked' ? (
        <YoutubeRankedVideosSection />
      ) : (
        <>
      <WebsiteFilterToolbar
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        searchPlaceholder="Search youtube video"
        disabled={isListBusy}
        useDatePicker
        selectedDate={selectedDate}
        onDateChange={(date) => setSelectedDate(date ? startOfDay(date) : null)}
        statusFilter={statusFilter}
        onStatusFilterChange={(e) => setStatusFilter(e.target.value)}
        showStatusFilter
        priorityFilter={priorityFilter}
        onPriorityFilterChange={(e) => setPriorityFilter(e.target.value)}
        showPriorityFilter
        priorityFilterOptions={buildYoutubePriorityFilterOptions().map((o) => ({
          value: o.value,
          label: o.value === 'all' ? 'Priority' : o.label,
        }))}
      />

      {listErrorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-[#dc2626]">
          {listErrorMessage}
        </div>
      ) : null}

      {showListEmptyState ? (
        <CategoryEmptyState
          title="No YouTube Videos Available"
          description={
            hasActiveFilters
              ? 'No videos match your current search or filters.'
              : 'Add your first YouTube video to display it on the customer website.'
          }
          ctaLabel={hasActiveFilters ? undefined : 'Add Video'}
          onCta={hasActiveFilters ? undefined : openAdd}
        />
      ) : null}

      {showListTable ? (
        <PaginatedFigmaTable
          columns={columns}
          data={videos}
          emptyMessage="No YouTube Videos Available"
          itemLabel="videos"
          initialPageSize={10}
          loading={isListBusy}
          skeletonRowCount={6}
          density="comfortable"
          rowClassName="hover:bg-[#eef6fc]/70"
          className="rounded-xl border border-slate-100 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)]"
          tableClassName="rounded-none border-0 shadow-none"
          tableMinWidth={1680}
          gradientActivePage
          controlledPagination={{
            ...controlledPagination,
            onPageChange: (nextPage) => {
              if (isListBusy) return
              controlledPagination.onPageChange?.(nextPage)
            },
            onPageSizeChange: (nextSize) => {
              if (isListBusy) return
              controlledPagination.onPageSizeChange?.(nextSize)
            },
          }}
          paginationClassName={cn(
            '[&>div:last-child]:items-center',
            '[&_nav]:items-center',
            '[&_form]:flex [&_form]:items-center [&_form]:gap-2',
            '[&_form_input]:h-9 [&_form_input]:leading-none',
            '[&_form_button]:inline-flex [&_form_button]:h-9 [&_form_button]:items-center [&_form_button]:justify-center',
            isListBusy && 'pointer-events-none opacity-60',
          )}
        />
      ) : null}

      {!isListBusy && !listError && !isEmpty && <YoutubeRankManagementSection />}

        </>
      )}

      <WebsiteFormModal open={viewOpen} onClose={closeView}>
        <WebsiteFormShell
          iconNode={<YoutubeIcon className="h-5 w-5" />}
          title="View Youtube Video"
          sectionTitle="Video Details"
          closeVariant="icon"
          onGoBack={closeView}
          hideFooter
        >
          {detailBusy ? (
            <YoutubeDetailLoader />
          ) : detailErrorMessage ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-[#dc2626]">
              {detailErrorMessage}
            </p>
          ) : (
            <YoutubeViewDetails row={videoDetail} />
          )}
        </WebsiteFormShell>
      </WebsiteFormModal>

      <WebsiteFormModal open={formOpen} onClose={closeForm}>
        <WebsiteFormShell
          iconNode={<YoutubeIcon className="h-5 w-5" />}
          title={editingId ? 'Edit Youtube Video' : 'Add Youtube Video'}
          sectionTitle="Video Details"
          closeVariant="icon"
          onGoBack={closeForm}
          onReset={() => {
            clearFormErrors()
            if (editingId && videoDetail) {
              setForm(formFromRow(videoDetail))
              return
            }
            setForm(emptyYoutubeForm())
          }}
          onSave={handleSave}
          saving={saving}
          saveDisabled={detailFormBlocked}
          saveLabel={editingId ? 'Update' : 'Save'}
        >
          {submitError ? (
            <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-[#dc2626]">
              {submitError}
            </p>
          ) : null}

          {editingId && detailBusy ? (
            <YoutubeVideoDetailSkeleton />
          ) : editingId && detailErrorMessage ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-[#dc2626]">
              {detailErrorMessage}
            </p>
          ) : (
          <div
            className={cn(
              'grid gap-6 sm:grid-cols-2',
              formDisabled && 'pointer-events-none opacity-60',
            )}
          >
            {editingId && videoDetail && !detailBusy ? (
              <YoutubeEditReadOnlyDetails row={videoDetail} />
            ) : null}

            <WebsiteField label="Name" required className="sm:col-span-2">
              <input
                type="text"
                value={form.name}
                disabled={formDisabled}
                onChange={(e) => {
                  setForm((f) => ({ ...f, name: e.target.value }))
                  clearFieldError('name')
                }}
                aria-invalid={Boolean(formErrors.name)}
                className={cn(websiteInputClass, formErrors.name && inputErrorClass)}
              />
              <FieldError message={formErrors.name} />
            </WebsiteField>

            <WebsiteField label="Description" className="sm:col-span-2">
              <textarea
                value={form.description}
                disabled={formDisabled}
                onChange={(e) => {
                  setForm((f) => ({ ...f, description: e.target.value }))
                  clearFieldError('description')
                }}
                rows={3}
                aria-invalid={Boolean(formErrors.description)}
                className={cn(
                  websiteInputClass,
                  'h-auto min-h-[96px] resize-y py-3',
                  formErrors.description && inputErrorClass,
                )}
              />
              <FieldError message={formErrors.description} />
            </WebsiteField>

            <WebsiteField label="Youtube URL" required className="sm:col-span-2">
              <div className="relative">
                <input
                  id="youtube-url"
                  type="url"
                  value={form.url}
                  disabled={formDisabled}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, url: e.target.value }))
                    clearFieldError('url')
                  }}
                  aria-invalid={Boolean(formErrors.url)}
                  className={cn(
                    websiteInputClass,
                    'pr-11',
                    formErrors.url && inputErrorClass,
                  )}
                  placeholder="https://youtube.com/..."
                />
                <span className="pointer-events-none absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[#69df66]">
                  <Globe className="h-4 w-4 text-white" strokeWidth={2.2} />
                </span>
              </div>
              <FieldError message={formErrors.url} />
            </WebsiteField>

            <WebsiteField label="Status" required>
              <WebsiteStatusSelect
                id="youtube-status"
                value={form.status}
                disabled={formDisabled}
                onChange={(e) => {
                  setForm((f) => ({ ...f, status: e.target.value }))
                  clearFieldError('status')
                }}
                required
                className={formErrors.status ? inputErrorClass : undefined}
              />
              <FieldError message={formErrors.status} />
            </WebsiteField>

            <WebsiteField label="Priority Expiry Date">
              <input
                type="date"
                value={form.priorityExpiryDate}
                disabled={formDisabled}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priorityExpiryDate: e.target.value }))
                }
                className={websiteInputClass}
              />
            </WebsiteField>

            <WebsiteField label="Priority" required className="sm:col-span-2">
              <input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={form.priority}
                disabled={formDisabled}
                onChange={(e) => {
                  setForm((f) => ({ ...f, priority: e.target.value.replace(/\D/g, '') }))
                  clearFieldError('priority')
                }}
                aria-invalid={Boolean(formErrors.priority)}
                placeholder="Priority"
                className={cn(websiteInputClass, formErrors.priority && inputErrorClass)}
              />
              <FieldError message={formErrors.priority} />
            </WebsiteField>
          </div>
          )}
        </WebsiteFormShell>
      </WebsiteFormModal>

      <AdminConfirmModal
        open={Boolean(deleteTarget)}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Delete YouTube Video"
        description="Are you sure you want to delete this YouTube video? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleting}
        loadingLabel="Deleting…"
        errorMessage={deleteError}
        variant="danger"
      />
    </div>
  )
}
