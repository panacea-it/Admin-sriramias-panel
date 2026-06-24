import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PlusCircle } from 'lucide-react'
import CategoryPageHeader from '../../../../components/categories/CategoryPageHeader'
import ExamCategoryFilterBar from '../../../../components/categories/ExamCategoryFilterBar'
import CategoryStatusBadge from '../../../../components/categories/CategoryStatusBadge'
import CategoryEmptyState from '../../../../components/categories/CategoryEmptyState'
import ExamCategoryFormModal from '../../../../components/categories/ExamCategoryFormModal'
import ViewExamCategoryModal from '../../../../components/categories/ViewExamCategoryModal'
import ConfirmExamCategoryStatusModal from '../../../../components/categories/ConfirmExamCategoryStatusModal'
import CategoryTableLoadingShell from '../../../../components/categories/CategoryTableLoadingShell'
import CategoryStandardTable from '../../../../components/categories/CategoryStandardTable'
import ExamCategoryBulkActionsBar from '../../../../components/categories/ExamCategoryBulkActionsBar'
import ExamCategoryTableActions from '../../../../components/categories/ExamCategoryTableActions'
import MasterBulkConfirmModal from '../../../../components/categories/MasterBulkConfirmModal'
import ConfirmDeleteDialog from '../../../../components/subjects/ConfirmDeleteDialog'
import ErrorState from '../../../../components/feedback/ErrorState'
import { useEditModal } from '../../../../hooks/useEditModal'
import { useExamCategoryManagement } from '../../../../hooks/useExamCategoryManagement'
import { useCreateExamCategory } from '../../../../hooks/useCreateExamCategory'
import { useUpdateExamCategory } from '../../../../hooks/useUpdateExamCategory'
import { useDeleteExamCategory } from '../../../../hooks/useDeleteExamCategory'
import { useCentersDropdownOptions } from '../../../../hooks/useCentersDropdownOptions'
import { useProgramsByCenter } from '../../../../hooks/useProgramsByCenter'
import { useTableRowSelection } from '../../../../hooks/useTableRowSelection'
import { formatCategoryDateTime } from '../../../../utils/formatDateTime'
import { getApiErrorMessage } from '../../../../utils/apiError'
import { toast, TOAST_DURATION } from '../../../../utils/toast'
import {
  bulkUpdateMasterStatus,
  getMasterBulkErrorMessage,
} from '../../../../services/masterBulkStatusService'
import {
  MASTER_BULK_TOAST,
  countDisableableSelected,
  countEnableableSelected,
  filterDisableableIds,
  filterEnableableIds,
} from '../../../../utils/masterBulkActions'
import {
  buildExamCategoryApiPayload,
  mapApiExamCategoryToLocal,
} from '../../../../utils/examCategoryApiHelpers'
import { mapUiStatusToApi } from '../../../../utils/programHelpers'
import {
  getExamCategoryById,
  updateExamCategoryStatus,
} from '../../../../services/examCategoryService'

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Status' },
  { value: 'Active', label: 'Active' },
  { value: 'In Active', label: 'Deactivated' },
]

function hasCategoryFormFields(row) {
  return Boolean(row?.centerId && row?.programId && row?.name)
}

function CreateButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
    >
      <PlusCircle className="h-4 w-4 shrink-0" strokeWidth={2.2} />
      Add Exam Category
    </button>
  )
}

export default function ExamCategorySection({ section }) {
  const {
    categories,
    totalCategories,
    loading,
    listError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    centerFilter,
    setCenterFilter,
    programFilter,
    setProgramFilter,
    controlledPagination,
    refreshCategories,
    patchCategoryLocally,
    removeCategoryLocally,
  } = useExamCategoryManagement()

  const { mutateAsync: createCategory, isPending: createPending } = useCreateExamCategory()
  const { mutateAsync: updateCategory, isPending: updatePending } = useUpdateExamCategory()
  const { mutateAsync: deleteCategory, isPending: deleteMutationPending } = useDeleteExamCategory()

  const { options: centreDropdownOptions, loading: centresLoading } = useCentersDropdownOptions()
  const { programOptions: centerProgramOptions } = useProgramsByCenter(
    centerFilter !== 'all' ? centerFilter : null,
  )

  const { isOpen, openEdit, openCreate, close, selectedItem } = useEditModal()
  const { selectedIds, selection, clearSelection } = useTableRowSelection((row) => row.id)
  const [viewItem, setViewItem] = useState(null)
  const [editDetail, setEditDetail] = useState(null)
  const [editDetailLoading, setEditDetailLoading] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [statusTarget, setStatusTarget] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [bulkConfirm, setBulkConfirm] = useState(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const centreOptions = useMemo(
    () => [{ value: 'all', label: 'Center' }, ...centreDropdownOptions],
    [centreDropdownOptions],
  )

  const centreFormOptions = useMemo(() => centreDropdownOptions, [centreDropdownOptions])

  const programFilterOptions = useMemo(() => {
    if (centerFilter === 'all') {
      return [{ value: 'all', label: 'Program' }]
    }
    return [{ value: 'all', label: 'Program' }, ...centerProgramOptions]
  }, [centerFilter, centerProgramOptions])

  const formSubmittingBusy = formSubmitting || createPending || updatePending

  const categoriesById = useMemo(
    () => new Map(categories.map((row) => [String(row.id), row])),
    [categories],
  )

  const disableableCount = useMemo(
    () => countDisableableSelected(selectedIds, categoriesById),
    [selectedIds, categoriesById],
  )

  const enableableCount = useMemo(
    () => countEnableableSelected(selectedIds, categoriesById),
    [selectedIds, categoriesById],
  )

  const loadCategoryDetail = useCallback(async (row) => {
    const data = await getExamCategoryById(row.id)
    return mapApiExamCategoryToLocal(data) || row
  }, [])

  const handleView = useCallback((row) => {
    setViewItem(row)
  }, [])

  const handleEditOpen = useCallback(
    async (row) => {
      openEdit(row)
      setEditDetail(row)
      setEditDetailLoading(!hasCategoryFormFields(row))

      if (hasCategoryFormFields(row)) return

      try {
        const detail = await loadCategoryDetail(row)
        setEditDetail(detail || row)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load category for edit'))
        close()
      } finally {
        setEditDetailLoading(false)
      }
    },
    [loadCategoryDetail, openEdit, close],
  )

  useEffect(() => {
    if (!isOpen) {
      setEditDetail(null)
      setEditDetailLoading(false)
    }
  }, [isOpen])

  const handleFormSubmit = useCallback(
    async (form, { isEdit, id }) => {
      setFormSubmitting(true)
      try {
        const payload = buildExamCategoryApiPayload(form)
        if (isEdit && id != null) {
          await updateCategory({ id, payload })
          toast.success('Category updated')
        } else {
          await createCategory(payload)
          toast.success('Category created')
        }
        await refreshCategories()
      } catch (error) {
        toast.error(getApiErrorMessage(error, isEdit ? 'Failed to update category' : 'Failed to create category'))
        throw error
      } finally {
        setFormSubmitting(false)
      }
    },
    [createCategory, updateCategory, refreshCategories],
  )

  const confirmDelete = useCallback(async () => {
    if (deleteTarget?.ids?.length) {
      setDeleteLoading(true)
      let successCount = 0
      let failCount = 0

      for (const id of deleteTarget.ids) {
        try {
          await deleteCategory(id)
          removeCategoryLocally(id)
          successCount += 1
        } catch (error) {
          failCount += 1
          if (import.meta.env.DEV) {
            console.error(error)
          }
        }
      }

      if (successCount > 0) {
        toast.success(
          successCount === 1 ? 'Category deleted' : `${successCount} categories deleted`,
        )
      }
      if (failCount > 0) {
        toast.error(
          failCount === 1
            ? 'Failed to delete 1 category'
            : `Failed to delete ${failCount} categories`,
        )
      }

      setDeleteTarget(null)
      clearSelection()
      setDeleteLoading(false)
      await refreshCategories()
      return
    }

    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteCategory(deleteTarget.id)
      removeCategoryLocally(deleteTarget.id)
      clearSelection()
      toast.success('Category deleted')
      setDeleteTarget(null)
      await refreshCategories()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete category'))
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, deleteCategory, removeCategoryLocally, clearSelection, refreshCategories])

  const confirmStatusChange = useCallback(async () => {
    if (!statusTarget) return
    const enabling = statusTarget.status !== 'Active'
    const nextUi = enabling ? 'Active' : 'In Active'
    const nextApi = mapUiStatusToApi(nextUi)
    const previousStatus = statusTarget.status

    patchCategoryLocally(statusTarget.id, { status: nextUi })
    setStatusLoading(true)

    try {
      await updateExamCategoryStatus(statusTarget.id, nextApi)
      toast.success(enabling ? 'Category enabled' : 'Category disabled')
      setStatusTarget(null)
    } catch (error) {
      patchCategoryLocally(statusTarget.id, { status: previousStatus })
      toast.error(getApiErrorMessage(error, 'Failed to update status'))
    } finally {
      setStatusLoading(false)
    }
  }, [statusTarget, patchCategoryLocally])

  const handleBulkEnableRequest = () => {
    if (!enableableCount) return
    setBulkConfirm({ type: 'enable' })
  }

  const handleBulkDisableRequest = () => {
    if (!disableableCount) return
    setBulkConfirm({ type: 'disable' })
  }

  const confirmBulkAction = async () => {
    if (!bulkConfirm) return
    setBulkActionLoading(true)

    try {
      if (bulkConfirm.type === 'enable') {
        const ids = filterEnableableIds(selectedIds, categoriesById)
        const apiStatus = mapUiStatusToApi('Active')
        await bulkUpdateMasterStatus('categories', ids, apiStatus, {
          updateSingle: updateExamCategoryStatus,
        })
        ids.forEach((id) => patchCategoryLocally(id, { status: 'Active' }))
        clearSelection()
        toast.success(MASTER_BULK_TOAST.enabled, { duration: TOAST_DURATION.short })
      } else if (bulkConfirm.type === 'disable') {
        const ids = filterDisableableIds(selectedIds, categoriesById)
        const apiStatus = mapUiStatusToApi('In Active')
        await bulkUpdateMasterStatus('categories', ids, apiStatus, {
          updateSingle: updateExamCategoryStatus,
        })
        ids.forEach((id) => patchCategoryLocally(id, { status: 'In Active' }))
        clearSelection()
        toast.success(MASTER_BULK_TOAST.disabled, { duration: TOAST_DURATION.short })
      }
      setBulkConfirm(null)
      await refreshCategories()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(getMasterBulkErrorMessage(error, bulkConfirm.type))
      await refreshCategories()
    } finally {
      setBulkActionLoading(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'categoryId',
        label: 'Category ID',
        headerClassName: 'min-w-[7.5rem] whitespace-nowrap',
        cellClassName: 'min-w-[7.5rem] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-mono text-sm font-semibold text-[#111]">
            {row.categoryId || row.id}
          </span>
        ),
      },
      {
        key: 'name',
        label: 'Category Name',
        headerClassName: 'min-w-[10rem]',
        cellClassName: 'min-w-[10rem] max-w-[220px] align-middle',
        render: (row) => (
          <span className="block truncate font-semibold text-[#111]" title={row.name}>
            {row.name}
          </span>
        ),
      },
      {
        key: 'program',
        label: 'Program Name',
        headerClassName: 'min-w-[9rem]',
        cellClassName: 'min-w-[9rem] max-w-[180px] align-middle',
        render: (row) => (
          <span className="block truncate text-sm font-medium text-[#444]" title={row.program}>
            {row.program || '—'}
          </span>
        ),
      },
      {
        key: 'centerName',
        label: 'Centre Name',
        headerClassName: 'min-w-[9rem]',
        cellClassName: 'min-w-[9rem] max-w-[180px] align-middle',
        render: (row) => (
          <span
            className="block truncate text-sm font-medium text-[#1a3a5c]"
            title={row.centerName}
          >
            {row.centerName || '—'}
          </span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created On',
        headerClassName: 'min-w-[9rem] whitespace-nowrap',
        cellClassName: 'min-w-[9rem] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="text-sm font-medium text-[#686868]">
            {formatCategoryDateTime(row.createdAt)}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        headerClassName: 'min-w-[6.5rem] whitespace-nowrap',
        cellClassName: 'min-w-[6.5rem] align-middle',
        render: (row) => <CategoryStatusBadge status={row.status} />,
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        headerClassName: 'min-w-[220px] whitespace-nowrap pr-4 sm:pr-6',
        cellClassName: 'min-w-[220px] whitespace-nowrap align-middle pr-4 sm:pr-6',
        render: (row) => (
          <ExamCategoryTableActions
            row={row}
            onView={() => handleView(row)}
            onEdit={() => handleEditOpen(row)}
            onDelete={() => setDeleteTarget(row)}
            onStatusToggle={() => setStatusTarget(row)}
          />
        ),
      },
    ],
    [handleView, handleEditOpen],
  )

  const hasActiveFilters =
    Boolean(search.trim()) ||
    statusFilter !== 'all' ||
    centerFilter !== 'all' ||
    programFilter !== 'all'
  const showEmpty = !loading && !listError && totalCategories === 0 && !hasActiveFilters
  const showNoResults = !loading && !listError && categories.length === 0 && !showEmpty

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setCenterFilter('all')
    setProgramFilter('all')
  }

  const deleteMessage =
    deleteTarget?.ids?.length > 1
      ? `Delete ${deleteTarget.ids.length} selected exam categories? This cannot be undone.`
      : `Are you sure you want to delete "${deleteTarget?.name || 'this category'}"? This action cannot be undone.`

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="exam-category"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22 }}
        className="space-y-5 sm:space-y-6"
      >
        <CategoryPageHeader title="Exam Categories">
          <CreateButton onClick={openCreate} />
        </CategoryPageHeader>

        <ExamCategoryFilterBar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder={section.searchPlaceholder}
          program={programFilter}
          onProgramChange={(e) => setProgramFilter(e.target.value)}
          programOptions={programFilterOptions}
          centerFilter={centerFilter}
          onCenterFilterChange={(e) => setCenterFilter(e.target.value)}
          centerOptions={centreOptions}
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
          statusOptions={STATUS_FILTER_OPTIONS}
        />

        <ExamCategoryBulkActionsBar
          count={selectedIds.length}
          enableCount={enableableCount}
          disableCount={disableableCount}
          onEnable={handleBulkEnableRequest}
          onDisable={handleBulkDisableRequest}
        />

        {listError && !loading ? (
          <ErrorState
            title="Unable to load exam categories"
            message={listError}
            onRetry={refreshCategories}
          />
        ) : loading ? (
          <CategoryTableLoadingShell />
        ) : showEmpty ? (
          <CategoryEmptyState
            title={section.emptyTitle}
            description={section.emptyDescription}
            ctaLabel={section.emptyCta}
            onCta={openCreate}
          />
        ) : showNoResults ? (
          <CategoryEmptyState
            title="No matching records"
            description="Try adjusting your search or filters."
            ctaLabel="Clear filters"
            onCta={clearFilters}
          />
        ) : (
          <CategoryStandardTable
            columns={columns}
            data={categories}
            itemLabel="exam categories"
            controlledPagination={controlledPagination}
            resetDeps={[search, statusFilter, centerFilter, programFilter]}
            selection={selection}
            loading={bulkActionLoading || deleteMutationPending}
          />
        )}

        <ExamCategoryFormModal
          open={isOpen}
          onClose={close}
          item={editDetail ?? selectedItem}
          onSubmit={handleFormSubmit}
          centreOptions={centreFormOptions}
          centresLoading={centresLoading}
          detailLoading={editDetailLoading}
          submitting={formSubmittingBusy}
        />

        <ViewExamCategoryModal
          open={Boolean(viewItem)}
          onClose={() => setViewItem(null)}
          item={viewItem}
        />

        <ConfirmDeleteDialog
          open={Boolean(deleteTarget)}
          title="Delete exam category?"
          message={deleteMessage}
          loading={deleteLoading}
          onCancel={() => !deleteLoading && setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />

        <ConfirmExamCategoryStatusModal
          open={Boolean(statusTarget)}
          categoryName={statusTarget?.name || 'this category'}
          enabling={statusTarget?.status !== 'Active'}
          loading={statusLoading}
          onCancel={() => setStatusTarget(null)}
          onConfirm={confirmStatusChange}
        />

        

        <MasterBulkConfirmModal
          open={Boolean(bulkConfirm)}
          type={bulkConfirm?.type}
          loading={bulkActionLoading}
          onConfirm={confirmBulkAction}
          onCancel={() => !bulkActionLoading && setBulkConfirm(null)}
        />
      </motion.div>
    </AnimatePresence>
  )
}
