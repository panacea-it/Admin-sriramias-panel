import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PlusCircle } from 'lucide-react'
import CategoryPageHeader from '../../../../components/categories/CategoryPageHeader'
import ExamSubCategoryFilterBar from '../../../../components/categories/ExamSubCategoryFilterBar'
import CategoryStatusBadge from '../../../../components/categories/CategoryStatusBadge'
import ExamCategoryTableActions from '../../../../components/categories/ExamCategoryTableActions'
import CategoryEmptyState from '../../../../components/categories/CategoryEmptyState'
import ExamSubCategoryFormModal from '../../../../components/categories/ExamSubCategoryFormModal'
import ViewExamSubCategoryModal from '../../../../components/categories/ViewExamSubCategoryModal'
import ConfirmExamSubCategoryStatusModal from '../../../../components/categories/ConfirmExamSubCategoryStatusModal'
import CategoryTableLoadingShell from '../../../../components/categories/CategoryTableLoadingShell'
import CategoryStandardTable from '../../../../components/categories/CategoryStandardTable'
import ProgramsBulkActionsBar from '../../../../components/categories/ProgramsBulkActionsBar'
import MasterBulkConfirmModal from '../../../../components/categories/MasterBulkConfirmModal'
import ConfirmDeleteDialog from '../../../../components/subjects/ConfirmDeleteDialog'
import ErrorState from '../../../../components/feedback/ErrorState'
import { useEditModal } from '../../../../hooks/useEditModal'
import { useExamSubCategoryManagement } from '../../../../hooks/useExamSubCategoryManagement'
import { useCreateExamSubCategory } from '../../../../hooks/useCreateExamSubCategory'
import { useUpdateExamSubCategory } from '../../../../hooks/useUpdateExamSubCategory'
import { useDeleteExamSubCategory } from '../../../../hooks/useDeleteExamSubCategory'
import { useCentersDropdownOptions } from '../../../../hooks/useCentersDropdownOptions'
import { useProgramsByCenter } from '../../../../hooks/useProgramsByCenter'
import { useCategoriesByCenterAndProgram } from '../../../../hooks/useCategoriesByCenterAndProgram'
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
  buildExamSubCategoryApiPayload,
  hasCompleteSubCategoryRecord,
  mapApiExamSubCategoryToLocal,
} from '../../../../utils/examSubCategoryApiHelpers'
import { mapUiStatusToApi } from '../../../../utils/programHelpers'
import {
  getSubCategoryById,
  updateSubCategoryStatus,
} from '../../../../services/examSubCategoryService'

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Status' },
  { value: 'Active', label: 'Active' },
  { value: 'In Active', label: 'Deactivated' },
]

function CreateButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
    >
      <PlusCircle className="h-4 w-4 shrink-0" strokeWidth={2.2} />
      Add Sub Category
    </button>
  )
}

export default function ExamSubCategorySection({ section }) {
  const {
    subCategories,
    totalSubCategories,
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
    categoryFilter,
    setCategoryFilter,
    controlledPagination,
    refreshSubCategories,
    patchSubCategoryLocally,
    removeSubCategoryLocally,
  } = useExamSubCategoryManagement()

  const { mutateAsync: createSubCategory, isPending: createPending } = useCreateExamSubCategory()
  const { mutateAsync: updateSubCategory, isPending: updatePending } = useUpdateExamSubCategory()
  const { mutateAsync: deleteSubCategory, isPending: deleteMutationPending } =
    useDeleteExamSubCategory()

  const { options: centreDropdownOptions, loading: centresLoading } = useCentersDropdownOptions()
  const { programOptions: centerProgramOptions } = useProgramsByCenter(
    centerFilter !== 'all' ? centerFilter : null,
  )
  const { categoryOptions: centerCategoryOptions } = useCategoriesByCenterAndProgram(
    centerFilter !== 'all' ? centerFilter : null,
    programFilter !== 'all' ? programFilter : null,
  )

  const { isOpen, isEditMode, openEdit, openCreate, close, selectedItem } = useEditModal()
  const { selectedIds, selection, clearSelection } = useTableRowSelection((row) => row.id)
  const [viewItem, setViewItem] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [editDetail, setEditDetail] = useState(null)
  const [editDetailLoading, setEditDetailLoading] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteDetail, setDeleteDetail] = useState(null)
  const [deleteDetailLoading, setDeleteDetailLoading] = useState(false)
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

  const categoryFilterOptions = useMemo(() => {
    if (centerFilter === 'all' || programFilter === 'all') {
      return [{ value: 'all', label: 'Exam Category' }]
    }
    return [{ value: 'all', label: 'Exam Category' }, ...centerCategoryOptions]
  }, [centerFilter, programFilter, centerCategoryOptions])

  const formSubmittingBusy = formSubmitting || createPending || updatePending

  const subCategoriesById = useMemo(
    () => new Map(subCategories.map((row) => [String(row.id), row])),
    [subCategories],
  )

  const disableableCount = useMemo(
    () => countDisableableSelected(selectedIds, subCategoriesById),
    [selectedIds, subCategoriesById],
  )

  const enableableCount = useMemo(
    () => countEnableableSelected(selectedIds, subCategoriesById),
    [selectedIds, subCategoriesById],
  )

  const loadSubCategoryDetail = useCallback(async (row) => {
    const data = await getSubCategoryById(row.id)
    return mapApiExamSubCategoryToLocal(data) || row
  }, [])

  const handleView = useCallback(
    async (row) => {
      setViewItem(row)
      setViewLoading(true)
      try {
        const detail = await loadSubCategoryDetail(row)
        if (detail) setViewItem(detail)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load sub-category details'))
        setViewItem(null)
      } finally {
        setViewLoading(false)
      }
    },
    [loadSubCategoryDetail],
  )

  const handleEditOpen = useCallback(
    async (row) => {
      openEdit(row)
      setEditDetail(row)
      setEditDetailLoading(!hasCompleteSubCategoryRecord(row))

      if (hasCompleteSubCategoryRecord(row)) return

      try {
        const detail = await loadSubCategoryDetail(row)
        setEditDetail(detail || row)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load sub-category for edit'))
        close()
      } finally {
        setEditDetailLoading(false)
      }
    },
    [loadSubCategoryDetail, openEdit, close],
  )

  const handleDeleteRequest = useCallback(
    async (row) => {
      setDeleteTarget(row)
      setDeleteDetail(row)
      setDeleteDetailLoading(true)
      try {
        const detail = await loadSubCategoryDetail(row)
        setDeleteDetail(detail || row)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load sub-category details'))
        setDeleteTarget(null)
        setDeleteDetail(null)
      } finally {
        setDeleteDetailLoading(false)
      }
    },
    [loadSubCategoryDetail],
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
        const payload = buildExamSubCategoryApiPayload(form)
        if (isEdit && id != null) {
          await updateSubCategory({ id, payload })
          toast.success('Sub-category updated')
        } else {
          await createSubCategory(payload)
          toast.success('Sub-category created')
        }
        await refreshSubCategories()
      } catch (error) {
        toast.error(
          getApiErrorMessage(
            error,
            isEdit ? 'Failed to update sub-category' : 'Failed to create sub-category',
          ),
        )
        throw error
      } finally {
        setFormSubmitting(false)
      }
    },
    [createSubCategory, updateSubCategory, refreshSubCategories],
  )

  const confirmDelete = useCallback(async () => {
    if (deleteTarget?.ids?.length) {
      setDeleteLoading(true)
      let successCount = 0
      let failCount = 0

      for (const id of deleteTarget.ids) {
        try {
          await deleteSubCategory(id)
          removeSubCategoryLocally(id)
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
          successCount === 1 ? 'Sub-category deleted' : `${successCount} sub-categories deleted`,
        )
      }
      if (failCount > 0) {
        toast.error(
          failCount === 1
            ? 'Failed to delete 1 sub-category'
            : `Failed to delete ${failCount} sub-categories`,
        )
      }

      setDeleteTarget(null)
      setDeleteDetail(null)
      clearSelection()
      setDeleteLoading(false)
      await refreshSubCategories()
      return
    }

    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteSubCategory(deleteTarget.id)
      removeSubCategoryLocally(deleteTarget.id)
      clearSelection()
      toast.success('Sub-category deleted')
      setDeleteTarget(null)
      setDeleteDetail(null)
      await refreshSubCategories()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete sub-category'))
    } finally {
      setDeleteLoading(false)
    }
  }, [
    deleteTarget,
    deleteSubCategory,
    removeSubCategoryLocally,
    clearSelection,
    refreshSubCategories,
  ])

  const confirmStatusChange = useCallback(async () => {
    if (!statusTarget) return
    const enabling = statusTarget.status !== 'Active'
    const nextUi = enabling ? 'Active' : 'In Active'
    const nextApi = mapUiStatusToApi(nextUi)
    const previousStatus = statusTarget.status

    patchSubCategoryLocally(statusTarget.id, { status: nextUi })
    setStatusLoading(true)

    try {
      await updateSubCategoryStatus(statusTarget.id, nextApi)
      toast.success(enabling ? 'Sub-category enabled' : 'Sub-category disabled')
      setStatusTarget(null)
    } catch (error) {
      patchSubCategoryLocally(statusTarget.id, { status: previousStatus })
      toast.error(getApiErrorMessage(error, 'Failed to update status'))
    } finally {
      setStatusLoading(false)
    }
  }, [statusTarget, patchSubCategoryLocally])

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
        const ids = filterEnableableIds(selectedIds, subCategoriesById)
        const apiStatus = mapUiStatusToApi('Active')
        await bulkUpdateMasterStatus('sub-categories', ids, apiStatus, {
          updateSingle: updateSubCategoryStatus,
        })
        ids.forEach((id) => patchSubCategoryLocally(id, { status: 'Active' }))
        clearSelection()
        toast.success(MASTER_BULK_TOAST.enabled, { duration: TOAST_DURATION.short })
      } else if (bulkConfirm.type === 'disable') {
        const ids = filterDisableableIds(selectedIds, subCategoriesById)
        const apiStatus = mapUiStatusToApi('In Active')
        await bulkUpdateMasterStatus('sub-categories', ids, apiStatus, {
          updateSingle: updateSubCategoryStatus,
        })
        ids.forEach((id) => patchSubCategoryLocally(id, { status: 'In Active' }))
        clearSelection()
        toast.success(MASTER_BULK_TOAST.disabled, { duration: TOAST_DURATION.short })
      }
      setBulkConfirm(null)
      await refreshSubCategories()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(getMasterBulkErrorMessage(error, bulkConfirm.type))
      await refreshSubCategories()
    } finally {
      setBulkActionLoading(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'subcategoryId',
        label: 'ID',
        headerClassName: 'min-w-[7rem] whitespace-nowrap',
        cellClassName: 'min-w-[7rem] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-mono text-sm font-semibold text-[#111]">
            {row.subcategoryId || row.id}
          </span>
        ),
      },
      {
        key: 'name',
        label: 'Subcategory',
        headerClassName: 'min-w-[9rem]',
        cellClassName: 'min-w-[9rem] align-middle',
        render: (row) => <span className="font-semibold text-[#111]">{row.name}</span>,
      },
      {
        key: 'examCategory',
        label: 'Category Name',
        headerClassName: 'min-w-[9rem]',
        cellClassName: 'min-w-[9rem] max-w-[180px] align-middle',
        render: (row) => (
          <span className="block truncate text-sm font-medium text-[#444]" title={row.examCategory}>
            {row.examCategory || '—'}
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
            onDelete={() => handleDeleteRequest(row)}
            onStatusToggle={() => setStatusTarget(row)}
          />
        ),
      },
    ],
    [handleView, handleEditOpen, handleDeleteRequest],
  )

  const hasActiveFilters =
    Boolean(search.trim()) ||
    statusFilter !== 'all' ||
    centerFilter !== 'all' ||
    programFilter !== 'all' ||
    categoryFilter !== 'all'

  const showEmpty = !loading && !listError && totalSubCategories === 0 && !hasActiveFilters
  const showNoResults = !loading && !listError && subCategories.length === 0 && !showEmpty

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setCenterFilter('all')
    setProgramFilter('all')
    setCategoryFilter('all')
  }

  const linkedCoursesCount = deleteDetail?.linkedCourses ?? 0
  const deleteMessage =
    deleteTarget?.ids?.length > 1
      ? `Delete ${deleteTarget.ids.length} selected exam sub-categories? This cannot be undone.`
      : linkedCoursesCount > 0
        ? `"${deleteTarget?.name || 'This sub-category'}" has ${linkedCoursesCount} linked course${linkedCoursesCount === 1 ? '' : 's'}. Deleting it may affect those courses. This action cannot be undone.`
        : `Are you sure you want to delete "${deleteTarget?.name || 'this sub-category'}"? This action cannot be undone.`

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="exam-sub-category"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22 }}
        className="space-y-5 sm:space-y-6"
      >
        <CategoryPageHeader title="Exam Sub Categories">
          <CreateButton onClick={openCreate} />
        </CategoryPageHeader>

        <ExamSubCategoryFilterBar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder={section.searchPlaceholder}
          program={programFilter}
          onProgramChange={(e) => setProgramFilter(e.target.value)}
          programOptions={programFilterOptions}
          category={categoryFilter}
          onCategoryChange={(e) => setCategoryFilter(e.target.value)}
          categoryOptions={categoryFilterOptions}
          centerFilter={centerFilter}
          onCenterFilterChange={(e) => setCenterFilter(e.target.value)}
          centerOptions={centreOptions}
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
          statusOptions={STATUS_FILTER_OPTIONS}
        />

        <ProgramsBulkActionsBar
          count={selectedIds.length}
          enableCount={enableableCount}
          disableCount={disableableCount}
          onClearSelection={clearSelection}
          onEnable={handleBulkEnableRequest}
          onDisable={handleBulkDisableRequest}
        />

        {listError && !loading ? (
          <ErrorState
            title="Unable to load exam sub-categories"
            message={listError}
            onRetry={refreshSubCategories}
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
            data={subCategories}
            itemLabel="exam sub-categories"
            controlledPagination={controlledPagination}
            resetDeps={[search, statusFilter, centerFilter, programFilter, categoryFilter]}
            selection={selection}
            loading={bulkActionLoading || deleteMutationPending}
          />
        )}

        <ExamSubCategoryFormModal
          open={isOpen}
          onClose={close}
          isEditMode={isEditMode}
          item={editDetail ?? selectedItem}
          onSubmit={handleFormSubmit}
          centreOptions={centreFormOptions}
          centresLoading={centresLoading}
          detailLoading={editDetailLoading}
          submitting={formSubmittingBusy}
        />

        <ViewExamSubCategoryModal
          open={Boolean(viewItem) || viewLoading}
          onClose={() => {
            setViewItem(null)
            setViewLoading(false)
          }}
          item={viewItem}
          loading={viewLoading}
        />

        <ConfirmDeleteDialog
          open={Boolean(deleteTarget)}
          title="Delete exam sub-category?"
          message={deleteMessage}
          loading={deleteLoading || deleteDetailLoading}
          onCancel={() => {
            if (!deleteLoading && !deleteDetailLoading) {
              setDeleteTarget(null)
              setDeleteDetail(null)
            }
          }}
          onConfirm={confirmDelete}
        />

        <ConfirmExamSubCategoryStatusModal
          open={Boolean(statusTarget)}
          subCategoryName={statusTarget?.name || 'this sub-category'}
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
