import { useCallback, useMemo, useState } from 'react'
import { Layers } from 'lucide-react'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import CourseFilterToolbar from '../../components/courses/CourseFilterToolbar'
import AddCurrentAffairsModal from '../../components/current-affairs/AddCurrentAffairsModal'
import CurrentAffairsBulkActionsBar from '../../components/current-affairs/CurrentAffairsBulkActionsBar'
import CurrentAffairsTableActions from '../../components/current-affairs/CurrentAffairsTableActions'
import ViewCurrentAffairsModal from '../../components/current-affairs/ViewCurrentAffairsModal'
import ConfirmDeleteDialog from '../../components/subjects/ConfirmDeleteDialog'
import { BannerButton, ResourceNameCell, StatusBadge } from '../../components/academics/AcademicsUi'
import { CURRENT_AFFAIRS_FORM_CATEGORIES } from '../../constants/currentAffairsForm'
import { CURRENT_AFFAIRS_CATEGORIES } from '../../data/currentAffairsData'
import { useEditModal } from '../../hooks/useEditModal'
import { useCurrentAffairs } from '../../hooks/useCurrentAffairs'
import { getApiErrorMessage } from '../../utils/apiError'
import { mapUiStatusToApi } from '../../utils/currentAffairsApiHelpers'
import {
  deleteCurrentAffair,
  updateCurrentAffairStatus,
} from '../../services/currentAffairsService'

function nextRowStatus(status) {
  return status === 'Active' ? 'In Active' : 'Active'
}

export default function CurrentAffairsPage() {
  const {
    items,
    loading,
    loadError,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    resourceFilter,
    setResourceFilter,
    statusFilter,
    setStatusFilter,
    refreshItems,
    removeItemsLocally,
    patchItemLocally,
  } = useCurrentAffairs()

  const modal = useEditModal()
  const [selectedIds, setSelectedIds] = useState([])
  const [viewItem, setViewItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [bulkDisableLoading, setBulkDisableLoading] = useState(false)
  const [statusLoadingId, setStatusLoadingId] = useState(null)

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: 'Category' },
      ...CURRENT_AFFAIRS_CATEGORIES.map((c) => ({ value: c.name, label: c.name })),
    ],
    [],
  )

  const resourceOptions = useMemo(
    () => [
      { value: 'all', label: 'Resource' },
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

  const handleToggleItemStatus = async (row) => {
    const nextStatus = nextRowStatus(row.status)
    setStatusLoadingId(row.id)
    try {
      await updateCurrentAffairStatus(row.id, mapUiStatusToApi(nextStatus))
      patchItemLocally(row.id, { status: nextStatus })
      toast.success(
        nextStatus === 'Active'
          ? 'Current affairs entry activated'
          : 'Current affairs entry deactivated',
      )
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Current Affairs] Status toggle failed:', error)
      }
      toast.error(getApiErrorMessage(error, 'Failed to update status'))
    } finally {
      setStatusLoadingId(null)
    }
  }

  const performDelete = useCallback(
    async (ids) => {
      await Promise.all(ids.map((id) => deleteCurrentAffair(id)))
      removeItemsLocally(ids)
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)))
      toast.success(
        ids.length > 1 ? `${ids.length} entries deleted` : 'Current affairs entry deleted',
      )
    },
    [removeItemsLocally],
  )

  const handleBulkDisable = async () => {
    const ids = selectedIds.filter((id) => itemsById.get(String(id))?.status === 'Active')
    if (!ids.length) return

    setBulkDisableLoading(true)
    try {
      await Promise.all(ids.map((id) => updateCurrentAffairStatus(id, false)))
      ids.forEach((id) => patchItemLocally(id, { status: 'In Active' }))
      toast.success(ids.length > 1 ? `${ids.length} entries disabled` : 'Current affairs entry disabled')
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Current Affairs] Bulk disable failed:', error)
      }
      toast.error(getApiErrorMessage(error, 'Failed to disable selected entries'))
      await refreshItems()
    } finally {
      setBulkDisableLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await performDelete(deleteTarget.ids)
      setDeleteTarget(null)
      await refreshItems()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Current Affairs] Delete failed:', error)
      }
      toast.error(getApiErrorMessage(error, 'Failed to delete current affairs entry'))
    } finally {
      setDeleteLoading(false)
    }
  }

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

  const toggleSelectPage = useCallback((pageIds, select) => {
    setSelectedIds((prev) => {
      if (!select) return prev.filter((id) => !pageIds.includes(id))
      const merged = new Set([...prev, ...pageIds])
      return [...merged]
    })
  }, [])

  const columns = [
    {
      key: 'name',
      label: 'Current Affairs Name',
      headerClassName: 'pl-6 sm:pl-10',
      cellClassName: 'pl-6 sm:pl-10',
      render: (row) => <ResourceNameCell name={row.name} />,
    },
    { key: 'category', label: 'Current Affair Category' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleToggleItemStatus(row)}
          disabled={statusLoadingId === row.id}
          className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/50 disabled:opacity-60"
          aria-label={`Toggle status for ${row.name}, currently ${row.status}`}
        >
          <StatusBadge status={row.status} />
        </button>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      headerClassName: 'min-w-[220px] whitespace-nowrap pr-4 sm:pr-6',
      cellClassName: 'min-w-[220px] whitespace-nowrap align-middle pr-4 sm:pr-6',
      render: (row) => (
        <CurrentAffairsTableActions
          row={row}
          onView={() => setViewItem(row)}
          onEdit={() => modal.openEdit(row)}
          onStatusToggle={() => handleToggleItemStatus(row)}
          onDelete={() => setDeleteTarget({ ids: [row.id], name: row.name })}
          statusLoading={statusLoadingId === row.id}
        />
      ),
    },
  ]

  const deleteMessage =
    deleteTarget?.ids?.length > 1
      ? `Delete ${deleteTarget.ids.length} selected current affairs entries? This cannot be undone.`
      : `Delete "${deleteTarget?.name || 'this entry'}"? This cannot be undone.`

  const hasActiveFilters =
    Boolean(search.trim()) ||
    categoryFilter !== 'all' ||
    resourceFilter !== 'all' ||
    statusFilter !== 'all'

  const emptyMessage = loadError
    ? 'Unable to load current affairs.'
    : hasActiveFilters
      ? 'No current affairs match your filters.'
      : 'No current affairs found.'

  const emptyState = loadError ? (
    <div className="flex flex-col items-center gap-3 px-6 py-10">
      <p className="text-sm font-semibold text-slate-600">{loadError}</p>
      <button
        type="button"
        onClick={() => refreshItems()}
        className="rounded-lg border border-[#55ace7]/25 bg-white px-4 py-2 text-sm font-semibold text-[#246392] shadow-sm transition hover:bg-[#eef2fc]"
      >
        Try again
      </button>
    </div>
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

        <CourseFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder="Search Current Affairs"
          category={categoryFilter}
          onCategoryChange={(e) => setCategoryFilter(e.target.value)}
          resource={resourceFilter}
          onResourceChange={(e) => setResourceFilter(e.target.value)}
          resourceOptions={resourceOptions}
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
          categoryOptions={categoryOptions}
        />

        <CurrentAffairsBulkActionsBar
          count={selectedIds.length}
          disableCount={disableableCount}
          onClearSelection={() => setSelectedIds([])}
          onDisable={handleBulkDisable}
          onDelete={() => setDeleteTarget({ ids: [...selectedIds], name: null })}
        />

        <PaginatedFigmaTable
          columns={columns}
          data={items}
          loading={loading || bulkDisableLoading}
          emptyMessage={emptyMessage}
          emptyState={emptyState}
          itemLabel="entries"
          resetDeps={[search, categoryFilter, resourceFilter, statusFilter]}
          rowClassName="hover:bg-slate-50/90"
          selection={{
            selectedIds,
            onToggle: toggleSelect,
            onTogglePage: toggleSelectPage,
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
        title={deleteTarget?.ids?.length > 1 ? 'Delete selected entries?' : 'Delete entry?'}
        message={deleteMessage}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleteLoading) setDeleteTarget(null)
        }}
        loading={deleteLoading}
      />
    </div>
  )
}
