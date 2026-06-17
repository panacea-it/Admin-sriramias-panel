import { useMemo, useState } from 'react'
import { Globe, PlusCircle } from 'lucide-react'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import WebsiteFilterToolbar from './WebsiteFilterToolbar'
import WebsiteFormShell from './WebsiteFormShell'
import WebsiteFormModal from './WebsiteFormModal'
import YoutubeIcon from './YoutubeIcon'
import YoutubePriorityBadge from './YoutubePriorityBadge'
import YoutubeVideoTitleCell from './YoutubeVideoTitleCell'
import YoutubeRowActions from './YoutubeRowActions'
import YoutubePriorityPicker from './YoutubePriorityPicker'
import YoutubeRankManagementSection from './YoutubeRankManagementSection'
import ConfirmDeleteDialog from '../subjects/ConfirmDeleteDialog'
import {
  DateTimeInline,
  WebsiteField,
  WebsiteStatusBadge,
  WebsiteStatusSelect,
  YoutubeUrlLink,
  websiteInputClass,
} from './websiteUi'
import { buildYoutubePriorityFilterOptions } from '../../constants/youtubeVideoConstants'
import { useYoutubeVideos } from '../../contexts/YoutubeVideosContext'
import {
  filterVideosByPriority,
  normalizeRankInput,
  sortYoutubeVideos,
} from '../../utils/youtubeVideoPriority'
import { validateYoutubeVideoForm } from '../../utils/youtubeFormValidation'
import { isSameCalendarDay, startOfDay } from '../../utils/dailyCollectionUtils'
import { toast } from '@/utils/toast'
import { cn } from '../../utils/cn'

const emptyYoutubeForm = () => ({
  name: '',
  url: '',
  status: 'Active',
  priorityOrder: '',
  priorityExpiryDate: '',
})

function formFromRow(row) {
  return {
    name: row.name,
    url: row.url,
    status: row.status || 'Active',
    priorityOrder: row.priorityOrder ? String(row.priorityOrder) : '',
    priorityExpiryDate: row.priorityExpiryDate || '',
  }
}

function payloadFromForm(form, existing, generatedId) {
  const rank = normalizeRankInput(form.priorityOrder)
  return {
    id: existing?.id || generatedId,
    name: form.name.trim(),
    url: form.url.trim(),
    status: form.status,
    priorityOrder: rank,
    priorityLevel: rank ?? 0,
    priorityExpiryDate: form.priorityExpiryDate || null,
    time: existing?.time || '10 AM',
    date: existing?.date || '14 May 2026',
    dateBucket: existing?.dateBucket || 'Today',
  }
}

function matchesSelectedDate(row, selectedDate) {
  if (!selectedDate) return true
  const created = row.createdAt ? new Date(row.createdAt) : null
  if (!created || Number.isNaN(created.getTime())) return false
  return isSameCalendarDay(created, selectedDate)
}

function nextVideoId() {
  return String(Date.now())
}

const inputErrorClass = 'ring-2 ring-[#EF4444]/60 bg-red-50/40'

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1.5 text-xs font-medium text-[#EF4444]">{message}</p>
}

export default function YoutubeManagementTab() {
  const {
    videos,
    loading,
    assignRank,
    removeRank,
    createVideo,
    updateVideo,
    deleteVideo,
    updateStatus,
  } = useYoutubeVideos()

  const [search, setSearch] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyYoutubeForm)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  const clearFieldError = (field) => {
    if (!formErrors[field]) return
    setFormErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const clearFormErrors = () => setFormErrors({})

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let rows = filterVideosByPriority(videos, priorityFilter)
    return rows.filter((row) => {
      const matchSearch =
        !q ||
        row.id.includes(q) ||
        (row.name || '').toLowerCase().includes(q) ||
        (row.url || '').toLowerCase().includes(q)
      const matchDate = matchesSelectedDate(row, selectedDate)
      const matchStatus = statusFilter === 'all' || row.status === statusFilter
      return matchSearch && matchDate && matchStatus
    })
  }, [videos, search, selectedDate, statusFilter, priorityFilter])

  const sortedFiltered = useMemo(() => sortYoutubeVideos(filtered), [filtered])

  const rankSignature = useMemo(
    () => sortedFiltered.map((v) => `${v.id}:${v.priorityOrder ?? 'x'}:${v.status}`).join('|'),
    [sortedFiltered],
  )

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyYoutubeForm())
    clearFormErrors()
    setFormOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setForm(formFromRow(row))
    clearFormErrors()
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    clearFormErrors()
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteVideo(deleteTarget.id)
      toast.success('Video deleted')
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete video. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const runAssignRank = async (videoId, rank) => {
    try {
      await assignRank(videoId, rank)
      toast.success('Priority rank updated successfully')
    } catch {
      toast.error('Failed to update priority rank')
      throw new Error('assign failed')
    }
  }

  const runRemoveRank = async (videoId) => {
    try {
      await removeRank(videoId)
      toast.success('Priority removed successfully')
    } catch {
      toast.error('Failed to remove priority')
      throw new Error('remove failed')
    }
  }

  const handleStatusChange = async (row, newStatus) => {
    try {
      await updateStatus(row, newStatus)
      toast.success(`Status updated to ${newStatus}`)
    } catch {
      /* handled in context */
    }
  }

  const handleSave = async () => {
    const errors = validateYoutubeVideoForm(form)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      toast.error('Please fix the highlighted fields')
      return
    }

    const existing = videos.find((v) => v.id === editingId)
    const generatedId = nextVideoId()
    const payload = payloadFromForm(form, existing, generatedId)

    setSaving(true)
    try {
      if (editingId) {
        await updateVideo(editingId, payload)
        toast.success('Video updated successfully')
      } else {
        await createVideo(payload)
        toast.success('Video added successfully')
      }
      closeForm()
    } catch {
      toast.error('Failed to save video')
    } finally {
      setSaving(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'id',
        label: 'ID',
        headerClassName: 'min-w-[88px] pl-4 sm:pl-6',
        cellClassName: 'min-w-[88px] pl-4 align-middle font-mono text-xs font-bold tracking-tight text-[#1a3a5c] sm:pl-6',
      },
      {
        key: 'name',
        label: 'Name',
        headerClassName: 'min-w-[180px]',
        cellClassName: 'min-w-[180px] align-middle',
        render: (row) => <YoutubeVideoTitleCell name={row.name} />,
      },
      {
        key: 'url',
        label: 'URL',
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
        key: 'priority',
        label: 'Priority Rank',
        headerClassName: 'min-w-[120px] whitespace-nowrap',
        cellClassName: 'min-w-[120px] align-middle whitespace-nowrap',
        render: (row) => (
          <YoutubePriorityBadge priorityOrder={row.priorityOrder} stacked />
        ),
      },
      {
        key: 'created',
        label: 'Created On',
        headerClassName: 'min-w-[150px] whitespace-nowrap',
        cellClassName: 'min-w-[150px] align-middle whitespace-nowrap',
        render: (row) => <DateTimeInline time={row.time} date={row.date} />,
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        headerClassName: 'min-w-[320px] whitespace-nowrap pr-4 text-right sm:pr-6',
        cellClassName: 'min-w-[320px] align-middle whitespace-nowrap pr-4 text-right sm:pr-6',
        render: (row) => (
          <YoutubeRowActions
            rowName={row.name}
            status={row.status}
            priorityOrder={row.priorityOrder}
            onEdit={() => openEdit(row)}
            onDelete={() => setDeleteTarget(row)}
            onSetRank={(rank) => runAssignRank(row.id, rank)}
            onRemoveRank={() => runRemoveRank(row.id)}
            onStatusChange={(newStatus) => handleStatusChange(row, newStatus)}
          />
        ),
      },
    ],
    [videos],
  )

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

      <WebsiteFilterToolbar
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        searchPlaceholder="Search youtube video"
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

      <PaginatedFigmaTable
        columns={columns}
        data={sortedFiltered}
        emptyMessage="No youtube videos found."
        itemLabel="videos"
        initialPageSize={6}
        loading={loading}
        skeletonRowCount={6}
        resetDeps={[search, selectedDate, statusFilter, priorityFilter, rankSignature]}
        density="comfortable"
        rowClassName="hover:bg-[#eef6fc]/70"
        className="rounded-xl border border-slate-100 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)]"
        tableClassName="rounded-none border-0 shadow-none"
        tableMinWidth={1040}
        gradientActivePage
        paginationClassName={cn(
          '[&>div:last-child]:items-center',
          '[&_nav]:items-center',
          '[&_form]:flex [&_form]:items-center [&_form]:gap-2',
          '[&_form_input]:h-9 [&_form_input]:leading-none',
          '[&_form_button]:inline-flex [&_form_button]:h-9 [&_form_button]:items-center [&_form_button]:justify-center',
        )}
      />

      {!loading && <YoutubeRankManagementSection />}

      <WebsiteFormModal open={formOpen} onClose={closeForm}>
        <WebsiteFormShell
          iconNode={<YoutubeIcon className="h-5 w-5" />}
          title={editingId ? 'Edit Youtube Video' : 'Add Youtube Video'}
          sectionTitle="Video Details"
          closeVariant="icon"
          onGoBack={closeForm}
          onReset={() => {
            clearFormErrors()
            setForm(
              editingId
                ? formFromRow(videos.find((v) => v.id === editingId) || {})
                : emptyYoutubeForm(),
            )
          }}
          onSave={handleSave}
          saving={saving}
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <WebsiteField label="Name" required className="sm:col-span-2">
              <input
                type="text"
                value={form.name}
                onChange={(e) => {
                  setForm((f) => ({ ...f, name: e.target.value }))
                  clearFieldError('name')
                }}
                aria-invalid={Boolean(formErrors.name)}
                className={cn(websiteInputClass, formErrors.name && inputErrorClass)}
              />
              <FieldError message={formErrors.name} />
            </WebsiteField>
            <WebsiteField label="Youtube URL" required className="sm:col-span-2">
              <div className="relative">
                <input
                  id="youtube-url"
                  type="url"
                  value={form.url}
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, priorityExpiryDate: e.target.value }))
                }
                className={websiteInputClass}
              />
            </WebsiteField>
            <WebsiteField label="Priority Order" className="sm:col-span-2">
              <YoutubePriorityPicker
                value={form.priorityOrder}
                onChange={(priorityOrder) => {
                  setForm((f) => ({ ...f, priorityOrder }))
                  clearFieldError('priorityOrder')
                }}
                error={formErrors.priorityOrder}
                onClearError={() => clearFieldError('priorityOrder')}
              />
            </WebsiteField>
          </div>
        </WebsiteFormShell>
      </WebsiteFormModal>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete Video"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
            : 'Are you sure you want to delete this video?'
        }
        onCancel={() => {
          if (!deleting) setDeleteTarget(null)
        }}
        onConfirm={confirmDelete}
        loading={deleting}
        confirmLabel="Delete"
      />
    </div>
  )
}
