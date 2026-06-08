import { useCallback, useEffect, useMemo, useState } from 'react'
import { PlusCircle } from 'lucide-react'
import WebsiteFilterToolbar from './WebsiteFilterToolbar'
import WebsiteFormShell from './WebsiteFormShell'
import WebsiteFormModal from './WebsiteFormModal'
import YoutubeIcon from './YoutubeIcon'
import YoutubePriorityBadge from './YoutubePriorityBadge'
import YoutubePriorityManager from './YoutubePriorityManager'
import YoutubeSortablePaginatedTable from './YoutubeSortablePaginatedTable'
import YoutubeVideoTitleCell from './YoutubeVideoTitleCell'
import YoutubeRowActions from './YoutubeRowActions'
import YoutubePriorityPicker from './YoutubePriorityPicker'
import YoutubeDragHandle from './YoutubeDragHandle'
import ConfirmDeleteDialog from '../subjects/ConfirmDeleteDialog'
import {
  DateTimeInline,
  WebsiteField,
  WebsiteStatusBadge,
  WebsiteStatusSelect,
  WebsiteUrlInput,
  YoutubeUrlLink,
  websiteInputClass,
} from './websiteUi'
import { buildYoutubePriorityFilterOptions } from '../../constants/youtubeVideoConstants'
import {
  fetchYoutubeVideos,
  createYoutubeVideo,
  updateYoutubeVideo,
  deleteYoutubeVideo,
  assignYoutubeRank,
  removeYoutubeRank,
  reorderYoutubeRanks,
  recalculateYoutubeRanks,
  reorderYoutubeVideos,
} from '../../api/youtubeVideosAPI'
import {
  applyExpiredPriorityCleanup,
  filterVideosByPriority,
  getRankRowClassName,
  normalizeRankInput,
  normalizeYoutubeVideos,
  sortYoutubeVideos,
} from '../../utils/youtubeVideoPriority'
import {
  getAutoCompactEnabled,
  setAutoCompactEnabled,
  getAllowGapsEnabled,
  setAllowGapsEnabled,
} from '../../utils/youtubePrioritySettings'
import { toast } from '@/utils/toast'
import { cn } from '../../utils/cn'

const emptyYoutubeForm = () => ({
  id: String(56565 + Math.floor(Math.random() * 1000)),
  name: '',
  url: '',
  status: 'Active',
  priorityOrder: '',
  priorityExpiryDate: '',
  isFeatured: false,
})

function formFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    status: row.status || 'Active',
    priorityOrder: row.priorityOrder ? String(row.priorityOrder) : '',
    priorityExpiryDate: row.priorityExpiryDate || '',
    isFeatured: Boolean(row.isFeatured),
  }
}

function payloadFromForm(form, existing) {
  const rank = normalizeRankInput(form.priorityOrder)
  return {
    id: form.id,
    name: form.name.trim(),
    url: form.url.trim(),
    status: form.status,
    priorityOrder: rank,
    priorityLevel: rank ?? 0,
    isFeatured: form.isFeatured,
    priorityExpiryDate: form.priorityExpiryDate || null,
    time: existing?.time || '10 AM',
    date: existing?.date || '14 May 2026',
    dateBucket: existing?.dateBucket || 'Today',
    analyticsLabels: existing?.analyticsLabels || (form.isFeatured ? ['Featured'] : []),
  }
}

export default function YoutubeManagementTab() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [priorityMin, setPriorityMin] = useState('')
  const [priorityMax, setPriorityMax] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyYoutubeForm)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [autoCompact, setAutoCompact] = useState(() => getAutoCompactEnabled())
  const [allowGaps, setAllowGaps] = useState(() => getAllowGapsEnabled())

  const mergeVideosFromResult = useCallback((result) => {
    if (result?.videos?.length) {
      setVideos(normalizeYoutubeVideos(result.videos))
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const rows = await fetchYoutubeVideos({
          search,
          status: statusFilter,
          dateBucket: dateFilter,
          priority: priorityFilter,
          priorityMin: priorityMin || undefined,
          priorityMax: priorityMax || undefined,
          topN: priorityFilter === 'top' ? 10 : undefined,
        })
        if (!cancelled) {
          setVideos(sortYoutubeVideos(normalizeYoutubeVideos(rows)))
        }
      } catch {
        if (!cancelled) toast.error('Failed to load videos')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [search, statusFilter, dateFilter, priorityFilter, priorityMin, priorityMax])

  useEffect(() => {
    const interval = setInterval(() => {
      setVideos((prev) => applyExpiredPriorityCleanup(prev))
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let rows = filterVideosByPriority(videos, priorityFilter, {
      min: priorityMin,
      max: priorityMax,
    })
    return rows.filter((row) => {
      const matchSearch =
        !q ||
        row.id.includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.url.toLowerCase().includes(q)
      const matchDate = dateFilter === 'all' || row.dateBucket === dateFilter
      const matchStatus = statusFilter === 'all' || row.status === statusFilter
      return matchSearch && matchDate && matchStatus
    })
  }, [videos, search, dateFilter, statusFilter, priorityFilter, priorityMin, priorityMax])

  const sortedFiltered = useMemo(() => sortYoutubeVideos(filtered), [filtered])

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyYoutubeForm())
    setFormOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setForm(formFromRow(row))
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
  }

  const requestDelete = (row) => setDeleteTarget(row)

  const cancelDelete = () => {
    if (!deleting) setDeleteTarget(null)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteYoutubeVideo(deleteTarget.id)
      setVideos((prev) => prev.filter((v) => v.id !== deleteTarget.id))
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
      const result = await assignYoutubeRank(videoId, rank, { allowGaps })
      mergeVideosFromResult(result)
      toast.success(result?.message || 'Priority rank updated successfully')
    } catch {
      toast.error('Failed to update priority rank')
    }
  }

  const runRemoveRank = async (videoId) => {
    try {
      const result = await removeYoutubeRank(videoId, autoCompact)
      mergeVideosFromResult(result)
      toast.success(result?.message || 'Priority removed successfully')
    } catch {
      toast.error('Failed to remove priority')
    }
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.url.trim()) {
      toast.error('Please fill required fields')
      return
    }
    if (!form.status) {
      toast.error('Please select a status')
      return
    }
    const existing = videos.find((v) => v.id === editingId)
    const payload = payloadFromForm(form, existing)

    try {
      if (editingId) {
        const result = await updateYoutubeVideo(editingId, payload)
        if (result?.videos) mergeVideosFromResult(result)
        else {
          setVideos((prev) =>
            sortYoutubeVideos(
              prev.map((v) => (v.id === editingId ? { ...v, ...result } : v)),
            ),
          )
        }
        toast.success('Video updated successfully')
      } else {
        const result = await createYoutubeVideo(payload)
        if (result?.videos) mergeVideosFromResult(result)
        else setVideos((prev) => sortYoutubeVideos([result, ...prev]))
        toast.success('Video added successfully')
      }
      closeForm()
    } catch {
      toast.error('Failed to save video')
    }
  }

  const handleDropOnSlot = (videoId, rank) => {
    runAssignRank(videoId, rank)
  }

  const handleReorderRanks = async (orderedIds) => {
    try {
      const result = await reorderYoutubeRanks(orderedIds)
      mergeVideosFromResult(result)
      toast.success(result?.message || 'Priority list reordered')
    } catch {
      toast.error('Failed to reorder priorities')
    }
  }

  const handleRecalculate = async () => {
    try {
      const result = await recalculateYoutubeRanks()
      mergeVideosFromResult(result)
      toast.success(result?.message || 'Ranks recalculated successfully')
    } catch {
      toast.error('Failed to recalculate ranks')
    }
  }

  const handleReorder = async (orderedIds) => {
    try {
      await reorderYoutubeVideos(orderedIds)
      setVideos((prev) => {
        const orderMap = new Map(orderedIds.map((id, i) => [id, i]))
        const updated = prev.map((v) =>
          orderMap.has(v.id) ? { ...v, customOrder: orderMap.get(v.id) } : v,
        )
        return sortYoutubeVideos(updated)
      })
      toast.success('Video reordered successfully')
    } catch {
      toast.error('Failed to reorder videos')
    }
  }

  const columns = [
    {
      key: 'id',
      label: 'ID',
      headerClassName: 'w-[90px]',
      cellClassName: 'w-[90px] font-medium text-[#111]',
    },
    {
      key: 'name',
      label: 'Name',
      cellClassName: 'min-w-[180px] max-w-[280px]',
      render: (row) => (
        <YoutubeVideoTitleCell
          name={row.name}
          isFeatured={row.isFeatured}
          analyticsLabels={row.analyticsLabels}
        />
      ),
    },
    {
      key: 'url',
      label: 'URL',
      cellClassName: 'min-w-[200px] max-w-[260px]',
      render: (row) => <YoutubeUrlLink url={row.url} />,
    },
    {
      key: 'status',
      label: 'Status',
      cellClassName: 'whitespace-nowrap',
      render: (row) => <WebsiteStatusBadge status={row.status} />,
    },
    {
      key: 'priority',
      label: 'Priority Rank',
      cellClassName: 'whitespace-nowrap',
      render: (row) => (
        <YoutubePriorityBadge priorityOrder={row.priorityOrder} stacked />
      ),
    },
    {
      key: 'created',
      label: 'Created On',
      cellClassName: 'whitespace-nowrap',
      render: (row) => <DateTimeInline time={row.time} date={row.date} />,
    },
    {
      key: 'actions',
      label: 'Action',
      cellClassName: 'w-[240px] min-w-[200px]',
      render: (row) => (
        <YoutubeRowActions
          compact
          priorityOrder={row.priorityOrder}
          onEdit={() => openEdit(row)}
          onDelete={() => requestDelete(row)}
          onSetRank={(rank) => runAssignRank(row.id, rank)}
          onRemoveRank={() => runRemoveRank(row.id)}
        />
      ),
    },
  ]

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
          <h1 className="text-xl font-bold leading-none text-white">Youtube</h1>
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
        dateRange={dateFilter}
        onDateRangeChange={(e) => setDateFilter(e.target.value)}
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

      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm">
        <span className="text-xs font-semibold text-[#686868]">Rank range</span>
        <input
          type="number"
          min={1}
          placeholder="Min"
          value={priorityMin}
          onChange={(e) => setPriorityMin(e.target.value)}
          className={cn(websiteInputClass, 'h-9 w-24 text-sm')}
        />
        <span className="text-[#9ca0a8]">–</span>
        <input
          type="number"
          min={1}
          placeholder="Max"
          value={priorityMax}
          onChange={(e) => setPriorityMax(e.target.value)}
          className={cn(websiteInputClass, 'h-9 w-24 text-sm')}
        />
      </div>

      <YoutubePriorityManager
        videos={videos}
        autoCompact={autoCompact}
        onAutoCompactChange={(v) => {
          setAutoCompact(v)
          setAutoCompactEnabled(v)
        }}
        allowGaps={allowGaps}
        onAllowGapsChange={(v) => {
          setAllowGaps(v)
          setAllowGapsEnabled(v)
        }}
        onDropVideo={handleDropOnSlot}
        onReorderRanks={handleReorderRanks}
        onRemoveRank={runRemoveRank}
        onRecalculate={handleRecalculate}
      />

      {loading ? (
        <div className="rounded-xl bg-white px-6 py-16 text-center text-sm font-medium text-[#686868] shadow-[0_11px_25px_rgba(15,23,42,0.07)]">
          Loading videos…
        </div>
      ) : (
        <YoutubeSortablePaginatedTable
          columns={columns}
          data={sortedFiltered}
          renderPriorityDrag={(row) => <YoutubeDragHandle videoId={row.id} />}
          onReorder={handleReorder}
          emptyMessage="No youtube videos found."
          itemLabel="videos"
          initialPageSize={6}
          resetDeps={[search, dateFilter, statusFilter, priorityFilter, priorityMin, priorityMax]}
          className="rounded-xl shadow-[0_11px_25px_rgba(15,23,42,0.07)]"
          getRowClassName={(row) =>
            getRankRowClassName(row.priorityOrder, row.isFeatured)
          }
        />
      )}

      <WebsiteFormModal open={formOpen} onClose={closeForm}>
        <WebsiteFormShell
          iconNode={<YoutubeIcon className="h-5 w-5" />}
          title="Youtube Video"
          sectionTitle="Video Details"
          onGoBack={closeForm}
          onReset={() => setForm(emptyYoutubeForm())}
          onSave={handleSave}
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <WebsiteField label="ID">
              <input
                type="text"
                value={form.id}
                onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                className={websiteInputClass}
                disabled={Boolean(editingId)}
              />
            </WebsiteField>
            <WebsiteField label="Name" required>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={websiteInputClass}
              />
            </WebsiteField>
            <WebsiteField label="Youtube URL" required>
              <WebsiteUrlInput
                id="youtube-url"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              />
            </WebsiteField>
            <WebsiteField label="Status" required>
              <WebsiteStatusSelect
                id="youtube-status"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                required
              />
            </WebsiteField>
            <WebsiteField label="Priority Order" className="sm:col-span-2 lg:col-span-4">
              <YoutubePriorityPicker
                value={form.priorityOrder}
                onChange={(priorityOrder) =>
                  setForm((f) => ({ ...f, priorityOrder }))
                }
              />
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
              <p className="mt-1 text-xs text-[#9ca0a8]">Optional — auto-removes priority after date</p>
            </WebsiteField>
            <WebsiteField label="Featured Video" className="sm:col-span-2">
              <label className="inline-flex cursor-pointer items-center gap-3 rounded-lg bg-[#eef6fc] px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isFeatured: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-[#55ace7]/40 text-[#246392] accent-[#246392]"
                />
                <span className="text-sm font-medium text-[#333]">
                  Mark as featured video
                </span>
              </label>
            </WebsiteField>
          </div>
        </WebsiteFormShell>
      </WebsiteFormModal>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete Video"
        message="Are you sure you want to delete this video?"
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        loading={deleting}
        confirmLabel="Delete"
      />

    </div>
  )
}
