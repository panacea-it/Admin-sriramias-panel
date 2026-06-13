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
import ExamSubCategoryTableSkeleton from '../../../../components/categories/ExamSubCategoryTableSkeleton'
import ProgramsBulkActionsBar from '../../../../components/categories/ProgramsBulkActionsBar'
import PaginatedFigmaTable from '../../../../components/figma/PaginatedFigmaTable'
import ConfirmDeleteDialog from '../../../../components/subjects/ConfirmDeleteDialog'
import { useEditModal } from '../../../../hooks/useEditModal'
import { useExamSubCategoryManagement } from '../../../../hooks/useExamSubCategoryManagement'
import { useCentersDropdownOptions } from '../../../../hooks/useCentersDropdownOptions'
import { useTableRowSelection } from '../../../../hooks/useTableRowSelection'
import { formatCategoryDateTime } from '../../../../utils/formatDateTime'
import { getApiErrorMessage } from '../../../../utils/apiError'
import { toast } from '../../../../utils/toast'
import { cn } from '../../../../utils/cn'
import {
  buildExamSubCategoryApiPayload,
  mapApiExamSubCategoryToLocal,
} from '../../../../utils/examSubCategoryApiHelpers'
import { mapUiStatusToApi } from '../../../../utils/programHelpers'
import {
  createSubCategory,
  deleteSubCategory,
  getSubCategoryById,
  updateSubCategory,
  updateSubCategoryStatus,
} from '../../../../services/examSubCategoryService'

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Status' },
  { value: 'Active', label: 'Active' },
  { value: 'In Active', label: 'Inactive' },
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
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    centerFilter,
    setCenterFilter,
    refreshSubCategories,
    patchSubCategoryLocally,
    removeSubCategoryLocally,
  } = useExamSubCategoryManagement()

  const { options: centreDropdownOptions, loading: centresLoading } = useCentersDropdownOptions()

  const [programFilter, setProgramFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const { isOpen, isEditMode, openEdit, openCreate, close, selectedItem } = useEditModal()
  const { selectedIds, selection, clearSelection } = useTableRowSelection((row) => row.id)
  const [viewItem, setViewItem] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [editDetail, setEditDetail] = useState(null)
  const [editDetailLoading, setEditDetailLoading] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [statusTarget, setStatusTarget] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [bulkDisableLoading, setBulkDisableLoading] = useState(false)

  const centreOptions = useMemo(
    () => [{ value: 'all', label: 'Center' }, ...centreDropdownOptions],
    [centreDropdownOptions],
  )

  const centreFormOptions = useMemo(() => centreDropdownOptions, [centreDropdownOptions])

  const programFilterOptions = useMemo(() => {
    const programs = [...new Set(subCategories.map((row) => row.program).filter(Boolean))].sort()
    return [{ value: 'all', label: 'Program' }, ...programs.map((p) => ({ value: p, label: p }))]
  }, [subCategories])

  const categoryFilterOptions = useMemo(() => {
    const scoped =
      programFilter === 'all'
        ? subCategories
        : subCategories.filter((row) => row.program === programFilter)
    const categories = [...new Set(scoped.map((row) => row.examCategory).filter(Boolean))].sort()
    return [
      { value: 'all', label: 'Exam Category' },
      ...categories.map((c) => ({ value: c, label: c })),
    ]
  }, [subCategories, programFilter])

  const displayedSubCategories = useMemo(() => {
    return subCategories.filter((row) => {
      if (programFilter !== 'all' && row.program !== programFilter) return false
      if (categoryFilter !== 'all' && row.examCategory !== categoryFilter) return false
      return true
    })
  }, [subCategories, programFilter, categoryFilter])

  useEffect(() => {
    setProgramFilter('all')
    setCategoryFilter('all')
  }, [centerFilter])

  useEffect(() => {
    setCategoryFilter('all')
  }, [programFilter])

  const subCategoriesById = useMemo(
    () => new Map(subCategories.map((row) => [String(row.id), row])),
    [subCategories],
  )

  const disableableCount = useMemo(
    () => selectedIds.filter((id) => subCategoriesById.get(String(id))?.status === 'Active').length,
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
      setEditDetailLoading(true)
      try {
        const detail = await loadSubCategoryDetail(row)
        setEditDetail(detail)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load sub-category for edit'))
        close()
      } finally {
        setEditDetailLoading(false)
      }
    },
    [loadSubCategoryDetail, openEdit, close],
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
          await updateSubCategory(id, payload)
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
    [refreshSubCategories],
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
      clearSelection()
      setDeleteLoading(false)
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
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete sub-category'))
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, removeSubCategoryLocally, clearSelection])

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

  const handleBulkDisable = useCallback(async () => {
    const ids = selectedIds.filter((id) => subCategoriesById.get(String(id))?.status === 'Active')
    if (!ids.length) return

    setBulkDisableLoading(true)
    const apiStatus = mapUiStatusToApi('In Active')

    try {
      await Promise.all(ids.map((id) => updateSubCategoryStatus(id, apiStatus)))
      ids.forEach((id) => patchSubCategoryLocally(id, { status: 'In Active' }))
      toast.success(ids.length > 1 ? `${ids.length} sub-categories disabled` : 'Sub-category disabled')
      clearSelection()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(getApiErrorMessage(error, 'Failed to disable selected sub-categories'))
      await refreshSubCategories()
    } finally {
      setBulkDisableLoading(false)
    }
  }, [selectedIds, subCategoriesById, patchSubCategoryLocally, clearSelection, refreshSubCategories])

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
    programFilter !== 'all' ||
    categoryFilter !== 'all'

  const showEmpty = !loading && subCategories.length === 0 && !hasActiveFilters
  const showNoResults = !loading && displayedSubCategories.length === 0 && !showEmpty

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setCenterFilter('all')
    setProgramFilter('all')
    setCategoryFilter('all')
  }

  const deleteMessage =
    deleteTarget?.ids?.length > 1
      ? `Delete ${deleteTarget.ids.length} selected exam sub-categories? This cannot be undone.`
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
          disableCount={disableableCount}
          onClearSelection={clearSelection}
          onDisable={handleBulkDisable}
          onDelete={() => setDeleteTarget({ ids: [...selectedIds], name: null })}
        />

        {loading ? (
          <div className="overflow-hidden rounded-2xl bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80 sm:p-5">
            <ExamSubCategoryTableSkeleton />
          </div>
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
          <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80">
            <PaginatedFigmaTable
              columns={columns}
              data={displayedSubCategories}
              itemLabel="exam sub-categories"
              resetDeps={[search, statusFilter, centerFilter, programFilter, categoryFilter]}
              selection={selection}
              density="comfortable"
              loading={bulkDisableLoading}
              rowClassName="hover:bg-[#eef6fc]/70"
              tableClassName="rounded-none border-0 shadow-none"
              tableMinWidth={960}
              paginationClassName={cn(
                '[&>div:last-child]:items-center',
                '[&_nav]:items-center',
                '[&_form]:flex [&_form]:items-center [&_form]:gap-2',
                '[&_form_input]:h-9 [&_form_input]:leading-none',
                '[&_form_button]:inline-flex [&_form_button]:h-9 [&_form_button]:items-center [&_form_button]:justify-center',
              )}
            />
          </div>
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
          submitting={formSubmitting}
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

        <ConfirmExamSubCategoryStatusModal
          open={Boolean(statusTarget)}
          subCategoryName={statusTarget?.name || 'this sub-category'}
          enabling={statusTarget?.status !== 'Active'}
          loading={statusLoading}
          onCancel={() => setStatusTarget(null)}
          onConfirm={confirmStatusChange}
        />

        <ConfirmDeleteDialog
          open={Boolean(deleteTarget)}
          title={
            deleteTarget?.ids?.length > 1
              ? 'Delete selected sub-categories?'
              : 'Delete exam sub-category?'
          }
          message={deleteMessage}
          confirmLabel={deleteLoading ? 'Deleting…' : 'Confirm Delete'}
          onCancel={() => !deleteLoading && setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      </motion.div>
    </AnimatePresence>
  )
}
