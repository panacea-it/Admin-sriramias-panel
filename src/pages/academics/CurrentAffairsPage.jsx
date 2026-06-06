import { useCallback, useMemo, useState } from 'react'
import { Layers, Trash2 } from 'lucide-react'
import EditButton from '../../components/common/EditButton'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import CourseFilterToolbar from '../../components/courses/CourseFilterToolbar'
import AddCurrentAffairsModal from '../../components/current-affairs/AddCurrentAffairsModal'
import ModifyCurrentAffairsCategoryModal from '../../components/current-affairs/ModifyCurrentAffairsCategoryModal'
import ConfirmDeleteDialog from '../../components/subjects/ConfirmDeleteDialog'
import { BannerButton, ResourceNameCell, StatusBadge } from '../../components/academics/AcademicsUi'
import { CURRENT_AFFAIRS_CATEGORIES } from '../../data/currentAffairsData'
import { useEditModal } from '../../hooks/useEditModal'
import { useCurrentAffairs } from '../../hooks/useCurrentAffairs'
import { getApiErrorMessage } from '../../utils/apiError'
import { mapUiStatusToApi } from '../../utils/currentAffairsApiHelpers'
import {
  deleteCurrentAffair,
  updateCurrentAffairStatus,
} from '../../services/currentAffairsService'
import { cn } from '../../utils/cn'

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
    statusFilter,
    setStatusFilter,
    refreshItems,
    removeItemsLocally,
    patchItemLocally,
  } = useCurrentAffairs()

  const [categories, setCategories] = useState(CURRENT_AFFAIRS_CATEGORIES)
  const modal = useEditModal()
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [statusLoadingId, setStatusLoadingId] = useState(null)

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: 'Category' },
      ...categories.map((c) => ({ value: c.name, label: c.name })),
    ],
    [categories],
  )

  const handleAddCategory = ({ name }) => {
    setCategories((prev) => [...prev, { id: Date.now(), name, status: 'Active' }])
  }

  const handleUpdateCategory = ({ id, name, status }) => {
    const prevCat = categories.find((c) => c.id === id)
    if (!prevCat) return
    const trimmed = String(name || '').trim()
    if (!trimmed) {
      toast.error('Category name is required')
      return
    }
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: trimmed, status: status || c.status } : c)),
    )
    toast.success('Category updated')
  }

  const handleDeleteCategory = (id) => {
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

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
      label: 'Action',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <EditButton onClick={() => modal.openEdit(row)} />
          <button
            type="button"
            onClick={() => setDeleteTarget({ ids: [row.id], name: row.name })}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#c96565] transition hover:text-[#b94b4b] sm:text-base"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2.1} />
            Delete
          </button>
        </div>
      ),
    },
  ]

  const deleteMessage =
    deleteTarget?.ids?.length > 1
      ? `Delete ${deleteTarget.ids.length} selected current affairs entries? This cannot be undone.`
      : `Delete "${deleteTarget?.name || 'this entry'}"? This cannot be undone.`

  const emptyMessage = loadError
    ? 'Unable to load current affairs.'
    : search.trim() || categoryFilter !== 'all' || statusFilter !== 'all'
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
          <BannerButton onClick={() => setCategoryOpen(true)}>Add Current Category</BannerButton>
        </PageBanner>

        <CourseFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder="Search Current Affairs"
          category={categoryFilter}
          onCategoryChange={(e) => setCategoryFilter(e.target.value)}
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
          categoryOptions={categoryOptions}
        />

        {selectedIds.length > 0 && (
          <div
            className={cn(
              'flex flex-wrap items-center gap-3 rounded-xl border border-[#55ace7]/20 bg-white px-4 py-3',
              'shadow-[0_2px_8px_rgba(15,23,42,0.06)]',
            )}
          >
            <span className="text-sm font-semibold text-[#246392]">
              {selectedIds.length} selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-sm font-medium text-[#686868] underline-offset-2 hover:underline"
            >
              Clear selection
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget({ ids: [...selectedIds], name: null })}
              className="ml-auto inline-flex items-center gap-2 rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b91c1c]"
            >
              <Trash2 className="h-4 w-4" />
              Delete selected
            </button>
          </div>
        )}

        <PaginatedFigmaTable
          columns={columns}
          data={items}
          loading={loading}
          emptyMessage={emptyMessage}
          emptyState={emptyState}
          itemLabel="entries"
          resetDeps={[search, categoryFilter, statusFilter]}
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

      <ModifyCurrentAffairsCategoryModal
        open={categoryOpen}
        onClose={() => setCategoryOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
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
