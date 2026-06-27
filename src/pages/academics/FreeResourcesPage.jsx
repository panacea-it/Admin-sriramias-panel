import { useCallback, useMemo, useState } from 'react'
import { Layers, RefreshCw } from 'lucide-react'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import CourseFilterToolbar from '../../components/courses/CourseFilterToolbar'
import AddFreeResourceModal from '../../components/content-library/AddFreeResourceModal'
import ConfirmFreeResourceStatusModal from '../../components/content-library/free-resources/ConfirmFreeResourceStatusModal'
import FreeResourcesBulkActionsBar from '../../components/content-library/free-resources/FreeResourcesBulkActionsBar'
import FreeResourcesBulkConfirmDialog from '../../components/content-library/free-resources/FreeResourcesBulkConfirmDialog'
import ConfirmDeleteDialog from '../../components/subjects/ConfirmDeleteDialog'
import CourseTableActions from '../../components/categories/CourseTableActions'
import ErrorState from '../../components/feedback/ErrorState'
import { BannerButton, StatusBadge } from '../../components/academics/AcademicsUi'
import { cn } from '../../utils/cn'
import { useEditModal } from '../../hooks/useEditModal'
import { useFreeResourceManagement } from '../../hooks/useFreeResourceManagement'
import {
  useDeleteFreeResource,
  useUpdateFreeResourceStatus,
} from '../../hooks/useFreeResources'
import { FREE_RESOURCE_CATEGORY_LIST } from '../../utils/freeResourceFormConstants'
import {
  getFreeResourceApiErrorMessage,
  getMockTestApiErrorMessage,
  getNcertBookApiErrorMessage,
  getPreviousYearPaperApiErrorMessage,
  getStudyMaterialApiErrorMessage,
} from '../../utils/freeResourceApiHelpers'
import { mapUiStatusToApi } from '../../utils/programHelpers'
import handleApiError from '../../utils/errorHandler'
import { getApiErrorMessage } from '../../utils/apiError'

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Status' },
  { value: 'Active', label: 'Active' },
  { value: 'In Active', label: 'Deactivated' },
]

const CELL = 'min-w-0 align-middle'

function FreeResourceNameCell({ name }) {
  return (
    <span className="block truncate text-sm font-semibold text-[#111]" title={name}>
      {name}
    </span>
  )
}

function CategoryCell({ label }) {
  return (
    <span
      className="block truncate text-[13px] font-medium text-[#686868]"
      title={label || undefined}
    >
      {label || '—'}
    </span>
  )
}

function PaperCell({ value }) {
  const label = String(value || '').trim()
  return (
    <span className="block truncate text-[13px] font-medium text-[#686868]" title={label || undefined}>
      {label || '—'}
    </span>
  )
}

function QuestionsCell({ count }) {
  const value = Number(count)
  if (!Number.isFinite(value) || value <= 0) return <span className="text-[#686868]">—</span>
  return <span className="text-[13px] font-medium text-[#686868]">{value}</span>
}

function resolveDeleteErrorMessage(row, error) {
  const category = String(row?.resourceCategory || '').toUpperCase()
  if (category === 'NCERT_BOOKS' || row?.isApiNcertBook) {
    return getNcertBookApiErrorMessage(error, 'Failed to delete resource.')
  }
  if (category === 'PREVIOUS_YEAR_QUESTIONS' || row?.isApiPreviousYearPaper) {
    return getPreviousYearPaperApiErrorMessage(error, 'Failed to delete resource.')
  }
  if (category === 'STUDY_MATERIAL' || row?.isApiStudyMaterial) {
    return getStudyMaterialApiErrorMessage(error, 'Failed to delete resource.')
  }
  if (category === 'FREE_MOCK_TEST' || row?.isApiMockTest) {
    return getMockTestApiErrorMessage(error, 'Failed to delete resource.')
  }
  return getFreeResourceApiErrorMessage(error, 'Failed to delete resource.')
}

export default function FreeResourcesPage() {
  const {
    resources,
    loading,
    isFetching,
    listError,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    controlledPagination,
    refreshResources,
  } = useFreeResourceManagement()

  const deleteMutation = useDeleteFreeResource()
  const statusMutation = useUpdateFreeResourceStatus()

  const modal = useEditModal()
  const [selectedIds, setSelectedIds] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewItem, setViewItem] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [bulkConfirm, setBulkConfirm] = useState(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const resourcesById = useMemo(() => {
    const map = new Map()
    for (const row of resources) {
      map.set(row.id, row)
    }
    return map
  }, [resources])

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: 'Category' },
      ...FREE_RESOURCE_CATEGORY_LIST.map((name) => ({ value: name, label: name })),
    ],
    [],
  )

  const resolveRowById = useCallback((id) => resourcesById.get(id), [resourcesById])

  const disableableCount = useMemo(
    () => selectedIds.filter((id) => resolveRowById(id)?.status === 'Active').length,
    [selectedIds, resolveRowById],
  )

  const enableableCount = useMemo(
    () => selectedIds.filter((id) => resolveRowById(id)?.status === 'In Active').length,
    [selectedIds, resolveRowById],
  )

  const handleSaveResource = useCallback(() => {
    refreshResources()
  }, [refreshResources])

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return

    try {
      await Promise.all(
        deleteTarget.ids.map(async (id) => {
          const row = resourcesById.get(id)
          if (!row?.resourceCategory) {
            throw new Error('Resource not found')
          }
          await deleteMutation.mutateAsync({
            category: row.resourceCategory,
            id,
          })
        }),
      )

      toast.success(
        deleteTarget.ids.length > 1
          ? `${deleteTarget.ids.length} resources deleted`
          : 'Resource deleted',
      )
      setDeleteTarget(null)
      setSelectedIds((prev) => prev.filter((id) => !deleteTarget.ids.includes(id)))
    } catch (error) {
      const firstId = deleteTarget.ids[0]
      const row = resourcesById.get(firstId)
      toast.error(resolveDeleteErrorMessage(row, error))
    }
  }, [deleteTarget, deleteMutation, resourcesById])

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

  const toggleSelectPage = useCallback((pageIds, select) => {
    setSelectedIds((prev) => {
      if (!select) return prev.filter((id) => !pageIds.includes(id))
      return [...new Set([...prev, ...pageIds])]
    })
  }, [])

  const handleView = useCallback((row) => {
    setViewItem(row)
  }, [])

  const applyBulkStatusChange = useCallback(
    async (ids, nextUi) => {
      const nextApi = mapUiStatusToApi(nextUi)
      let successCount = 0

      await Promise.all(
        ids.map(async (id) => {
          const row = resolveRowById(id)
          if (!row || row.status === nextUi) return
          await statusMutation.mutateAsync({ id, status: nextApi })
          successCount += 1
        }),
      )

      return successCount
    },
    [resolveRowById, statusMutation],
  )

  const confirmStatusChange = useCallback(async () => {
    if (!statusTarget) return

    const enabling = statusTarget.status !== 'Active'
    const nextApi = mapUiStatusToApi(enabling ? 'Active' : 'In Active')

    try {
      await statusMutation.mutateAsync({ id: statusTarget.id, status: nextApi })
      toast.success(enabling ? 'Resource enabled' : 'Resource disabled')
      setStatusTarget(null)
    } catch (error) {
      handleApiError(error, { fallback: 'Failed to update status' })
    }
  }, [statusTarget, statusMutation])

  const handleBulkEnable = useCallback(async () => {
    const ids = selectedIds.filter((id) => resolveRowById(id)?.status === 'In Active')
    if (!ids.length) return

    setBulkActionLoading(true)
    try {
      const successCount = await applyBulkStatusChange(ids, 'Active')
      if (successCount > 0) {
        toast.success(
          successCount === 1 ? 'Resource enabled' : `${successCount} resources enabled`,
        )
      }
      setSelectedIds([])
    } catch (error) {
      handleApiError(error, { fallback: 'Failed to enable selected resources' })
    } finally {
      setBulkActionLoading(false)
      setBulkConfirm(null)
    }
  }, [selectedIds, resolveRowById, applyBulkStatusChange])

  const handleBulkDisable = useCallback(async () => {
    const ids = selectedIds.filter((id) => resolveRowById(id)?.status === 'Active')
    if (!ids.length) return

    setBulkActionLoading(true)
    try {
      const successCount = await applyBulkStatusChange(ids, 'In Active')
      if (successCount > 0) {
        toast.success(
          successCount === 1 ? 'Resource disabled' : `${successCount} resources disabled`,
        )
      }
      setSelectedIds([])
    } catch (error) {
      handleApiError(error, { fallback: 'Failed to disable selected resources' })
    } finally {
      setBulkActionLoading(false)
      setBulkConfirm(null)
    }
  }, [selectedIds, resolveRowById, applyBulkStatusChange])

  const handleBulkDelete = useCallback(async () => {
    const ids = [...selectedIds]
    if (!ids.length) return

    setBulkActionLoading(true)
    try {
      await Promise.all(
        ids.map(async (id) => {
          const row = resourcesById.get(id)
          if (!row?.resourceCategory) return
          await deleteMutation.mutateAsync({ category: row.resourceCategory, id })
        }),
      )

      toast.success(ids.length > 1 ? `${ids.length} resources deleted` : 'Resource deleted')
      setSelectedIds([])
      setBulkConfirm(null)
    } catch (error) {
      const firstId = ids[0]
      toast.error(resolveDeleteErrorMessage(resourcesById.get(firstId), error))
    } finally {
      setBulkActionLoading(false)
    }
  }, [selectedIds, deleteMutation, resourcesById])

  const handleConfirmBulkAction = useCallback(async () => {
    if (!bulkConfirm) return
    if (bulkConfirm.type === 'enable') {
      await handleBulkEnable()
    } else if (bulkConfirm.type === 'disable') {
      await handleBulkDisable()
    } else if (bulkConfirm.type === 'delete') {
      await handleBulkDelete()
    }
  }, [bulkConfirm, handleBulkEnable, handleBulkDisable, handleBulkDelete])

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Resource Name',
        width: '24%',
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => <FreeResourceNameCell name={row.name} />,
      },
      {
        key: 'category',
        label: 'Resource Category',
        width: '18%',
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => (
          <CategoryCell label={row.resourceCategoryLabel || row.category} />
        ),
      },
      {
        key: 'paper',
        label: 'Paper',
        width: '12%',
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => (
          <PaperCell value={row.paper || row.formData?.paper} />
        ),
      },
      {
        key: 'questions',
        label: 'Questions',
        width: '10%',
        align: 'center',
        headerClassName: cn(CELL, 'text-center'),
        cellClassName: cn(CELL, 'text-center'),
        render: (row) => (
          <QuestionsCell count={row.questionCount ?? row.formData?.numberOfQuestions} />
        ),
      },
      {
        key: 'status',
        label: 'Status',
        width: '12%',
        align: 'center',
        headerClassName: cn(CELL, 'text-center whitespace-nowrap'),
        cellClassName: cn(CELL, 'text-center'),
        headerTruncate: false,
        render: (row) => (
          <div className="flex items-center justify-center">
            <StatusBadge status={row.status} />
          </div>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        headerClassName: 'min-w-[200px] whitespace-nowrap pr-4 sm:pr-6',
        cellClassName: 'min-w-[200px] whitespace-nowrap align-middle pr-4 sm:pr-6',
        render: (row) => (
          <CourseTableActions
            row={row}
            status={row.status}
            onView={() => handleView(row)}
            onEdit={() => modal.openEdit(row)}
            onDelete={() => setDeleteTarget({ ids: [row.id], name: row.name })}
            onToggleStatus={() => setStatusTarget(row)}
          />
        ),
      },
    ],
    [handleView, modal],
  )

  const deleteMessage =
    deleteTarget?.ids?.length > 1
      ? `Delete ${deleteTarget.ids.length} selected free resources? This cannot be undone.`
      : `Delete "${deleteTarget?.name || 'this resource'}"? This cannot be undone.`

  const emptyMessage = loading ? 'Loading resources…' : 'No free resources match your filters.'

  const listErrorMessage = listError
    ? getApiErrorMessage(listError, 'Failed to load free resources.')
    : null

  const actionLoading =
    deleteMutation.isPending ||
    statusMutation.isPending ||
    bulkActionLoading

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5">
        <PageBanner
          icon={Layers}
          iconClassName="text-[#dc2626]"
          title="Free Resources"
          className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
        >
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => refreshResources()}
              disabled={isFetching}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 disabled:opacity-60"
            >
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
              Refresh
            </button>
            <BannerButton onClick={modal.openCreate}>Add Free Resource</BannerButton>
          </div>
        </PageBanner>

        <CourseFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder="Search Free Resources"
          category={categoryFilter}
          onCategoryChange={(e) => setCategoryFilter(e.target.value)}
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
          categoryOptions={categoryOptions}
          statusOptions={STATUS_FILTER_OPTIONS}
        />

        <FreeResourcesBulkActionsBar
          count={selectedIds.length}
          enableCount={enableableCount}
          disableCount={disableableCount}
          onClearSelection={() => setSelectedIds([])}
          onEnable={() => setBulkConfirm({ type: 'enable' })}
          onDisable={() => setBulkConfirm({ type: 'disable' })}
          onDelete={() => setBulkConfirm({ type: 'delete' })}
        />

        {listErrorMessage ? (
          <ErrorState
            title="Could not load free resources"
            message={listErrorMessage}
            onRetry={() => refreshResources()}
          />
        ) : (
          <PaginatedFigmaTable
            columns={columns}
            data={resources}
            emptyMessage={emptyMessage}
            itemLabel="resources"
            resetDeps={[search, categoryFilter, statusFilter]}
            loading={loading || actionLoading}
            controlledPagination={controlledPagination}
            rowClassName="hover:bg-[#eef6fc]/70"
            density="comfortable"
            skeletonRowCount={8}
            tableMinWidth={960}
            tableLayoutFixed
            className="min-w-0 rounded-xl border border-slate-100 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)]"
            tableClassName={cn(
              'rounded-none border-0 shadow-none',
              '[&_thead_tr]:!bg-gradient-to-r [&_thead_tr]:!from-[#7eb8e8] [&_thead_tr]:!to-[#55ace7]',
              '[&_thead_tr]:shadow-[0_2px_8px_rgba(85,172,231,0.25)]',
              '[&_thead_th]:align-middle [&_thead_th]:whitespace-nowrap [&_thead_th]:!bg-transparent',
              '[&_tbody_td]:align-middle',
            )}
            selection={{
              selectedIds,
              onToggle: toggleSelect,
              onTogglePage: toggleSelectPage,
              getRowId: (row) => String(row.id),
              allItemIds: resources.map((row) => String(row.id)),
              columnWidth: '4%',
            }}
          />
        )}
      </section>

      <AddFreeResourceModal
        open={modal.isOpen}
        onClose={modal.close}
        item={modal.selectedItem}
        onSubmit={handleSaveResource}
        onMockTestSaved={refreshResources}
        onStudyMaterialSaved={refreshResources}
        onNcertBookSaved={refreshResources}
        onPreviousYearPaperSaved={refreshResources}
      />

      <AddFreeResourceModal
        open={Boolean(viewItem)}
        onClose={() => setViewItem(null)}
        item={viewItem}
        viewMode
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete resource?"
        message={deleteMessage}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleteMutation.isPending) setDeleteTarget(null)
        }}
        loading={deleteMutation.isPending}
      />

      <ConfirmFreeResourceStatusModal
        open={Boolean(statusTarget)}
        resourceName={statusTarget?.name || 'this resource'}
        enabling={statusTarget?.status !== 'Active'}
        loading={statusMutation.isPending}
        onCancel={() => {
          if (!statusMutation.isPending) setStatusTarget(null)
        }}
        onConfirm={confirmStatusChange}
      />

      <FreeResourcesBulkConfirmDialog
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
