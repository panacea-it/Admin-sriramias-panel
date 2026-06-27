import { useCallback, useMemo, useState } from 'react'
import { Layers } from 'lucide-react'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import CourseFilterToolbar from '../../components/courses/CourseFilterToolbar'
import AddCurrentAffairsModal from '../../components/current-affairs/AddCurrentAffairsModal'
import CurrentAffairsBulkActionsBar from '../../components/current-affairs/CurrentAffairsBulkActionsBar'
import CurrentAffairsBulkConfirmDialog from '../../components/current-affairs/CurrentAffairsBulkConfirmDialog'
import CurrentAffairsTableActions from '../../components/current-affairs/CurrentAffairsTableActions'
import ViewCurrentAffairsModal from '../../components/current-affairs/ViewCurrentAffairsModal'
import ConfirmDeleteDialog from '../../components/subjects/ConfirmDeleteDialog'
import ErrorState from '../../components/feedback/ErrorState'
import { BannerButton, StatusBadge } from '../../components/academics/AcademicsUi'
import { CURRENT_AFFAIRS_FORM_CATEGORIES } from '../../constants/currentAffairsForm'
import { MONTH_OPTIONS } from '../../data/currentAffairsData'
import { useEditModal } from '../../hooks/useEditModal'
import { useCurrentAffairsManagement } from '../../hooks/useCurrentAffairsManagement'
import { useDeleteCurrentAffair } from '../../hooks/useDeleteCurrentAffair'
import { useUpdateCurrentAffairStatus } from '../../hooks/useUpdateCurrentAffairStatus'
import handleApiError from '../../utils/errorHandler'
import { cn } from '../../utils/cn'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { mapUiStatusToApi } from '../../utils/currentAffairsApiHelpers'
import { getCurrentAffairsYearOptions } from '../../utils/currentAffairsYearOptions'

function nextRowStatus(status) {
  return status === 'Active' ? 'In Active' : 'Active'
}

function TruncateCell({ value, className }) {
  const text = value || '—'
  return (
    <span className={cn('block truncate text-sm font-medium', className)} title={text}>
      {text}
    </span>
  )
}

function ExtraFilterSelect({ label, value, onChange, options }) {
  return (
    <div className="relative w-full sm:w-auto sm:min-w-[130px]">
      <select
        value={value}
        onChange={onChange}
        aria-label={label}
        className="h-10 w-full min-h-[38px] appearance-none rounded-lg border-0 bg-[#55ace7] pl-4 pr-9 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#246392]/50"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white text-[#222]">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function CurrentAffairsPage() {
  const {
    items,
    loading,
    isFetching,
    listError,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    yearFilter,
    setYearFilter,
    monthFilter,
    setMonthFilter,
    statusFilter,
    setStatusFilter,
    controlledPagination,
    refreshItems,
  } = useCurrentAffairsManagement()

  const deleteMutation = useDeleteCurrentAffair()
  const statusMutation = useUpdateCurrentAffairStatus()

  const modal = useEditModal()
  const [selectedIds, setSelectedIds] = useState([])
  const [viewItem, setViewItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [bulkConfirm, setBulkConfirm] = useState(null)
  const [statusLoadingId, setStatusLoadingId] = useState(null)

  const yearOptions = useMemo(
    () => [
      { value: 'all', label: 'Year' },
      ...getCurrentAffairsYearOptions().map((y) => ({ value: y, label: y })),
    ],
    [],
  )

  const monthOptions = useMemo(
    () => [
      { value: 'all', label: 'Month' },
      ...MONTH_OPTIONS.map((m) => ({ value: m, label: m })),
    ],
    [],
  )

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: 'Category' },
      ...CURRENT_AFFAIRS_FORM_CATEGORIES.map((name) => ({ value: name, label: name })),
    ],
    [],
  )

  const itemsById = useMemo(
    () => new Map(items.map((row) => [String(row.id), row])),
    [items],
  )

  const disableableCount = useMemo(
    () => selectedIds.filter((id) => itemsById.get(String(id))?.status === 'Active').length,
    [selectedIds, itemsById],
  )

  const enableableCount = useMemo(
    () => selectedIds.filter((id) => itemsById.get(String(id))?.status === 'In Active').length,
    [selectedIds, itemsById],
  )

  const handleToggleItemStatus = async (row) => {
    const nextStatus = nextRowStatus(row.status)
    setStatusLoadingId(row.id)
    try {
      await statusMutation.mutateAsync({
        id: row.id,
        status: mapUiStatusToApi(nextStatus),
      })
      toast.success(
        nextStatus === 'Active'
          ? 'Current affairs entry activated'
          : 'Current affairs entry deactivated',
      )
    } catch (error) {
      handleApiError(error, { fallback: 'Failed to update status' })
      await refreshItems()
    } finally {
      setStatusLoadingId(null)
    }
  }

  const performDelete = useCallback(
    async (ids) => {
      await Promise.all(
        ids.map((id) => {
          const row = itemsById.get(String(id))
          return deleteMutation.mutateAsync({ id, category: row?.category })
        }),
      )
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)))
      toast.success(
        ids.length > 1 ? `${ids.length} entries deleted` : 'Current affairs entry deleted',
      )
    },
    [deleteMutation, itemsById],
  )

  const handleBulkEnable = async () => {
    const ids = selectedIds.filter((id) => itemsById.get(String(id))?.status === 'In Active')
    if (!ids.length) return

    try {
      await Promise.all(
        ids.map((id) => statusMutation.mutateAsync({ id, status: true })),
      )
      setSelectedIds([])
      toast.success(ids.length > 1 ? `${ids.length} entries enabled` : 'Current affairs entry enabled')
    } catch (error) {
      handleApiError(error, { fallback: 'Failed to enable selected entries' })
      await refreshItems()
    } finally {
      setBulkConfirm(null)
    }
  }

  const handleBulkDisable = async () => {
    const ids = selectedIds.filter((id) => itemsById.get(String(id))?.status === 'Active')
    if (!ids.length) return

    try {
      await Promise.all(
        ids.map((id) => statusMutation.mutateAsync({ id, status: false })),
      )
      setSelectedIds([])
      toast.success(ids.length > 1 ? `${ids.length} entries disabled` : 'Current affairs entry disabled')
    } catch (error) {
      handleApiError(error, { fallback: 'Failed to disable selected entries' })
      await refreshItems()
    } finally {
      setBulkConfirm(null)
    }
  }

  const handleBulkDelete = async () => {
    const ids = [...selectedIds]
    if (!ids.length) return

    try {
      await performDelete(ids)
      setBulkConfirm(null)
    } catch (error) {
      handleApiError(error, { fallback: 'Failed to delete selected entries' })
    }
  }

  const handleConfirmBulkAction = async () => {
    if (!bulkConfirm) return
    if (bulkConfirm.type === 'enable') {
      await handleBulkEnable()
    } else if (bulkConfirm.type === 'disable') {
      await handleBulkDisable()
    } else if (bulkConfirm.type === 'delete') {
      await handleBulkDelete()
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await performDelete(deleteTarget.ids)
      setDeleteTarget(null)
    } catch (error) {
      handleApiError(error, { fallback: 'Failed to delete current affairs entry' })
    }
  }

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

  const toggleSelectPage = useCallback((ids, select) => {
    setSelectedIds((prev) => {
      if (!select) return prev.filter((id) => !ids.includes(id))
      return [...new Set([...prev, ...ids])]
    })
  }, [])

  const allItemIds = useMemo(() => items.map((row) => row.id), [items])

  const bulkActionLoading =
    deleteMutation.isPending || statusMutation.isPending

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Title',
        width: '20%',
        headerClassName: 'min-w-0',
        cellClassName: 'min-w-0 max-w-0 align-middle',
        render: (row) => <TruncateCell value={row.name} className="text-[#111111]" />,
      },
      {
        key: 'category',
        label: 'Category',
        width: '16%',
        headerTruncate: false,
        headerClassName: 'min-w-0',
        cellClassName: 'min-w-0 max-w-0 align-middle',
        render: (row) => <TruncateCell value={row.category} className="text-[#686868]" />,
      },
      {
        key: 'year',
        label: 'Year',
        width: '8%',
        headerClassName: 'min-w-0',
        cellClassName: 'min-w-0 align-middle',
        render: (row) => <TruncateCell value={row.year} className="text-[#686868]" />,
      },
      {
        key: 'month',
        label: 'Month',
        width: '10%',
        headerClassName: 'min-w-0',
        cellClassName: 'min-w-0 align-middle',
        render: (row) => <TruncateCell value={row.month} className="text-[#686868]" />,
      },
      {
        key: 'status',
        label: 'Status',
        align: 'center',
        width: '10%',
        headerClassName: 'min-w-0 text-center',
        cellClassName: 'min-w-0 align-middle text-center',
        render: (row) => (
          <div className="flex items-center justify-center px-1">
            <button
              type="button"
              onClick={() => handleToggleItemStatus(row)}
              disabled={statusLoadingId === row.id || statusMutation.isPending}
              className="inline-flex items-center justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/50 disabled:opacity-60"
              aria-label={`Toggle status for ${row.name}, currently ${row.status}`}
            >
              <StatusBadge status={row.status} />
            </button>
          </div>
        ),
      },
      {
        key: 'uploadedOn',
        label: 'Created',
        width: '14%',
        headerClassName: 'min-w-0 whitespace-nowrap',
        cellClassName: 'min-w-0 align-middle whitespace-nowrap',
        render: (row) => (
          <span
            className="block truncate text-sm font-medium text-[#686868]"
            title={row.uploadedOn ? formatCategoryDateTime(row.uploadedOn) : undefined}
          >
            {row.uploadedOn ? formatCategoryDateTime(row.uploadedOn) : '—'}
          </span>
        ),
      },
      {
        key: 'createdBy',
        label: 'Created By',
        width: '12%',
        headerClassName: 'min-w-0',
        cellClassName: 'min-w-0 align-middle',
        render: (row) => (
          <TruncateCell value={row.createdBy?.name} className="text-[#686868]" />
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'center',
        width: '10%',
        headerClassName: 'min-w-0 text-center',
        cellClassName: 'min-w-0 align-middle text-center',
        render: (row) => (
          <CurrentAffairsTableActions
            row={row}
            onView={() => setViewItem(row)}
            onEdit={() => modal.openEdit(row)}
            onStatusToggle={() => handleToggleItemStatus(row)}
            onDelete={() => setDeleteTarget({ ids: [row.id], name: row.name, category: row.category })}
            statusLoading={statusLoadingId === row.id}
          />
        ),
      },
    ],
    [statusLoadingId, statusMutation.isPending, modal],
  )

  const deleteMessage =
    deleteTarget?.ids?.length > 1
      ? `Delete ${deleteTarget.ids.length} selected current affairs entries? This is a permanent action and cannot be undone.`
      : `Delete "${deleteTarget?.name || 'this entry'}"? This is a permanent action and cannot be undone.`

  const hasActiveFilters =
    Boolean(search.trim()) ||
    categoryFilter !== 'all' ||
    yearFilter !== 'all' ||
    monthFilter !== 'all' ||
    statusFilter !== 'all'

  const emptyMessage = listError
    ? 'Unable to load current affairs.'
    : hasActiveFilters
      ? 'No current affairs match your filters.'
      : 'No current affairs found.'

  const listErrorMessage = listError
    ? handleApiError(listError, { silent: true }).message
    : null

  const emptyState = listError ? (
    <ErrorState
      title="Unable to load current affairs"
      message={listErrorMessage}
      onRetry={() => refreshItems()}
    />
  ) : undefined

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <PageBanner
          icon={Layers}
          iconClassName="text-[#dc2626]"
          title="Current Affairs"
          className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
        >
          <BannerButton onClick={modal.openCreate}>Add Current Affairs</BannerButton>
        </PageBanner>

        <div className="space-y-2">
          <CourseFilterToolbar
            search={search}
            onSearchChange={(e) => setSearch(e.target.value)}
            searchPlaceholder="Search Current Affairs"
            category={categoryFilter}
            onCategoryChange={(e) => setCategoryFilter(e.target.value)}
            status={statusFilter}
            onStatusChange={(e) => setStatusFilter(e.target.value)}
            categoryOptions={categoryOptions}
            showStatusFilter
          />
          <div className="flex flex-wrap gap-2 rounded-lg bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:px-4">
            <ExtraFilterSelect
              label="Year"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              options={yearOptions}
            />
            <ExtraFilterSelect
              label="Month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              options={monthOptions}
            />
          </div>
        </div>

        <CurrentAffairsBulkActionsBar
          count={selectedIds.length}
          enableCount={enableableCount}
          disableCount={disableableCount}
          onClearSelection={() => setSelectedIds([])}
          onEnable={() => setBulkConfirm({ type: 'enable' })}
          onDisable={() => setBulkConfirm({ type: 'disable' })}
          onDelete={() => setBulkConfirm({ type: 'delete' })}
        />

        <PaginatedFigmaTable
          columns={columns}
          data={items}
          loading={loading || isFetching || bulkActionLoading}
          emptyMessage={emptyMessage}
          emptyState={emptyState}
          itemLabel="entries"
          resetDeps={[search, categoryFilter, yearFilter, monthFilter, statusFilter]}
          rowClassName="hover:bg-[#eef6fc]/70"
          density="comfortable"
          tableLayoutFixed
          tableMinWidth={0}
          className="min-w-0 rounded-2xl shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80"
          tableClassName="rounded-none border-0 shadow-none"
          controlledPagination={controlledPagination}
          selection={{
            selectedIds,
            onToggle: toggleSelect,
            onTogglePage: toggleSelectPage,
            allItemIds,
            columnWidth: 44,
            headerClassName: 'w-11 min-w-[2.75rem] px-2 text-center',
            cellClassName: 'w-11 min-w-[2.75rem] px-2 text-center',
          }}
        />
      </section>

      <AddCurrentAffairsModal
        open={modal.isOpen}
        onClose={modal.close}
        item={modal.selectedItem}
        onSuccess={refreshItems}
      />

      <ViewCurrentAffairsModal
        open={Boolean(viewItem)}
        item={viewItem}
        onClose={() => setViewItem(null)}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Permanently delete entry?"
        message={deleteMessage}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleteMutation.isPending) setDeleteTarget(null)
        }}
        loading={deleteMutation.isPending}
        confirmLabel="Delete permanently"
      />

      <CurrentAffairsBulkConfirmDialog
        open={Boolean(bulkConfirm)}
        type={bulkConfirm?.type}
        onConfirm={handleConfirmBulkAction}
        onCancel={() => {
          if (!bulkActionLoading) setBulkConfirm(null)
        }}
        loading={bulkActionLoading}
      />
    </div>
  )
}
