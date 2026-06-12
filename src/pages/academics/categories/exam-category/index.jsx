import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import CategoryFilterBar from '../../../../components/categories/CategoryFilterBar'
import CategoryStatusBadge from '../../../../components/categories/CategoryStatusBadge'
import CategoryEmptyState from '../../../../components/categories/CategoryEmptyState'
import ExamCategoryFormModal from '../../../../components/categories/ExamCategoryFormModal'
import ViewExamCategoryModal from '../../../../components/categories/ViewExamCategoryModal'
import ConfirmExamCategoryStatusModal from '../../../../components/categories/ConfirmExamCategoryStatusModal'
import ExamCategoryTableSkeleton from '../../../../components/categories/ExamCategoryTableSkeleton'
import ExamCategoryBulkActionsBar from '../../../../components/categories/ExamCategoryBulkActionsBar'
import ExamCategoryTableActions from '../../../../components/categories/ExamCategoryTableActions'
import PaginatedFigmaTable from '../../../../components/figma/PaginatedFigmaTable'
import ConfirmDeleteDialog from '../../../../components/subjects/ConfirmDeleteDialog'
import { useEditModal } from '../../../../hooks/useEditModal'
import { useExamCategoryManagement } from '../../../../hooks/useExamCategoryManagement'
import { useCentersDropdownOptions } from '../../../../hooks/useCentersDropdownOptions'
import { useTableRowSelection } from '../../../../hooks/useTableRowSelection'
import { formatCategoryDateTime } from '../../../../utils/formatDateTime'
import { getApiErrorMessage } from '../../../../utils/apiError'
import { toast } from '../../../../utils/toast'
import { cn } from '../../../../utils/cn'
import {
  buildExamCategoryApiPayload,
  mapApiExamCategoryToLocal,
} from '../../../../utils/examCategoryApiHelpers'
import { mapUiStatusToApi } from '../../../../utils/programHelpers'
import {
  createExamCategory,
  deleteExamCategory,
  getExamCategoryById,
  updateExamCategory,
  updateExamCategoryStatus,
} from '../../../../services/examCategoryService'

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Status' },
  { value: 'Active', label: 'Active' },
  { value: 'In Active', label: 'Inactive' },
]

function hasCategoryFormFields(row) {
  return Boolean(row?.centerId && row?.programId && row?.name)
}

export default function ExamCategorySection({ section }) {
  const {
    categories,
    totalCategories,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    centerFilter,
    setCenterFilter,
    refreshCategories,
    patchCategoryLocally,
    removeCategoryLocally,
  } = useExamCategoryManagement()

  const { options: centreDropdownOptions, loading: centresLoading } = useCentersDropdownOptions()

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
  const [bulkDisableLoading, setBulkDisableLoading] = useState(false)

  const centreOptions = useMemo(
    () => [{ value: 'all', label: 'Center' }, ...centreDropdownOptions],
    [centreDropdownOptions],
  )

  const centreFormOptions = useMemo(() => centreDropdownOptions, [centreDropdownOptions])

  const categoriesById = useMemo(
    () => new Map(categories.map((row) => [String(row.id), row])),
    [categories],
  )

  const disableableCount = useMemo(
    () => selectedIds.filter((id) => categoriesById.get(String(id))?.status === 'Active').length,
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
          await updateExamCategory(id, payload)
          toast.success('Category updated')
        } else {
          await createExamCategory(payload)
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
    [refreshCategories],
  )

  const confirmDelete = useCallback(async () => {
    if (deleteTarget?.ids?.length) {
      setDeleteLoading(true)
      let successCount = 0
      let failCount = 0

      for (const id of deleteTarget.ids) {
        try {
          await deleteExamCategory(id)
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
      return
    }

    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteExamCategory(deleteTarget.id)
      removeCategoryLocally(deleteTarget.id)
      clearSelection()
      toast.success('Category deleted')
      setDeleteTarget(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete category'))
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, removeCategoryLocally, clearSelection])

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

  const handleBulkDisable = useCallback(async () => {
    const ids = selectedIds.filter((id) => categoriesById.get(String(id))?.status === 'Active')
    if (!ids.length) return

    setBulkDisableLoading(true)
    const apiStatus = mapUiStatusToApi('In Active')

    try {
      await Promise.all(ids.map((id) => updateExamCategoryStatus(id, apiStatus)))
      ids.forEach((id) => patchCategoryLocally(id, { status: 'In Active' }))
      toast.success(ids.length > 1 ? `${ids.length} categories disabled` : 'Category disabled')
      clearSelection()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(getApiErrorMessage(error, 'Failed to disable selected categories'))
      await refreshCategories()
    } finally {
      setBulkDisableLoading(false)
    }
  }, [selectedIds, categoriesById, patchCategoryLocally, clearSelection, refreshCategories])

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

  const hasActiveFilters = Boolean(search.trim()) || statusFilter !== 'all' || centerFilter !== 'all'
  const showEmpty = !loading && totalCategories === 0 && !hasActiveFilters
  const showNoResults = !loading && categories.length === 0 && !showEmpty

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setCenterFilter('all')
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
        <h1 className="text-xl font-bold tracking-tight text-[#111] sm:text-2xl">Exam Categories</h1>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
          <CategoryFilterBar
            search={search}
            onSearchChange={(e) => setSearch(e.target.value)}
            searchPlaceholder={section.searchPlaceholder}
            status={statusFilter}
            onStatusChange={(e) => setStatusFilter(e.target.value)}
            statusOptions={STATUS_FILTER_OPTIONS}
            centerFilter={centerFilter}
            onCenterFilterChange={(e) => setCenterFilter(e.target.value)}
            centerOptions={centreOptions}
          />

          {selectedIds.length > 0 && (
            <ExamCategoryBulkActionsBar
              className="mt-4"
              count={selectedIds.length}
              disableCount={disableableCount}
              onDisable={handleBulkDisable}
              onDelete={() => setDeleteTarget({ ids: [...selectedIds], name: null })}
            />
          )}

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
            {loading ? (
              <div className="p-4">
                <ExamCategoryTableSkeleton />
              </div>
            ) : showEmpty ? (
              <div className="p-4 sm:p-6">
                <CategoryEmptyState
                  title={section.emptyTitle}
                  description={section.emptyDescription}
                  ctaLabel={section.emptyCta}
                  onCta={openCreate}
                />
              </div>
            ) : showNoResults ? (
              <div className="p-4 sm:p-6">
                <CategoryEmptyState
                  title="No matching records"
                  description="Try adjusting your search or filters."
                  ctaLabel="Clear filters"
                  onCta={clearFilters}
                />
              </div>
            ) : (
              <PaginatedFigmaTable
                columns={columns}
                data={categories}
                itemLabel="exam categories"
                resetDeps={[search, statusFilter, centerFilter]}
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
            )}
          </div>
        </div>

        <ExamCategoryFormModal
          open={isOpen}
          onClose={close}
          item={editDetail ?? selectedItem}
          onSubmit={handleFormSubmit}
          centreOptions={centreFormOptions}
          centresLoading={centresLoading}
          detailLoading={editDetailLoading}
          submitting={formSubmitting}
        />

        <ViewExamCategoryModal
          open={Boolean(viewItem)}
          onClose={() => setViewItem(null)}
          item={viewItem}
        />

        <ConfirmExamCategoryStatusModal
          open={Boolean(statusTarget)}
          categoryName={statusTarget?.name || 'this category'}
          enabling={statusTarget?.status !== 'Active'}
          loading={statusLoading}
          onCancel={() => setStatusTarget(null)}
          onConfirm={confirmStatusChange}
        />

        <ConfirmDeleteDialog
          open={Boolean(deleteTarget)}
          title={deleteTarget?.ids?.length > 1 ? 'Delete selected categories?' : 'Delete exam category?'}
          message={deleteMessage}
          confirmLabel={deleteLoading ? 'Deleting…' : 'Confirm Delete'}
          onCancel={() => !deleteLoading && setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      </motion.div>
    </AnimatePresence>
  )
}
