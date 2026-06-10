import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PlusCircle } from 'lucide-react'
import CategoryPageHeader from '../../../../components/categories/CategoryPageHeader'
import CategoryFilterBar from '../../../../components/categories/CategoryFilterBar'
import CategoryStatusBadge from '../../../../components/categories/CategoryStatusBadge'
import CategoryTableActions from '../../../../components/categories/CategoryTableActions'
import CategoryEmptyState from '../../../../components/categories/CategoryEmptyState'
import ExamSubCategoryFormModal from '../../../../components/categories/ExamSubCategoryFormModal'
import ViewExamSubCategoryModal from '../../../../components/categories/ViewExamSubCategoryModal'
import ConfirmExamSubCategoryStatusModal from '../../../../components/categories/ConfirmExamSubCategoryStatusModal'
import ExamSubCategoryTableSkeleton from '../../../../components/categories/ExamSubCategoryTableSkeleton'
import PaginatedFigmaTable from '../../../../components/figma/PaginatedFigmaTable'
import ConfirmDeleteDialog from '../../../../components/subjects/ConfirmDeleteDialog'
import { useEditModal } from '../../../../hooks/useEditModal'
import { useExamSubCategoryManagement } from '../../../../hooks/useExamSubCategoryManagement'
import { useCentersDropdownOptions } from '../../../../hooks/useCentersDropdownOptions'
import { formatCategoryDateTime } from '../../../../utils/formatDateTime'
import { getApiErrorMessage } from '../../../../utils/apiError'
import { toast } from '../../../../utils/toast'
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

function AddButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-4 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:scale-[1.02]"
    >
      <PlusCircle className="h-4 w-4" />
      {children}
    </button>
  )
}

export default function ExamSubCategorySection({ section, Icon }) {
  const {
    subCategories,
    loading,
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
    refreshSubCategories,
    patchSubCategoryLocally,
    removeSubCategoryLocally,
  } = useExamSubCategoryManagement()

  const { options: centreDropdownOptions, loading: centresLoading } = useCentersDropdownOptions()

  const { isOpen, isEditMode, openEdit, openCreate, close, selectedItem } = useEditModal()
  const [viewItem, setViewItem] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [editDetail, setEditDetail] = useState(null)
  const [editDetailLoading, setEditDetailLoading] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [statusTarget, setStatusTarget] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)

  const centreOptions = useMemo(
    () => [{ value: 'all', label: 'Center' }, ...centreDropdownOptions],
    [centreDropdownOptions],
  )

  const centreFormOptions = useMemo(() => centreDropdownOptions, [centreDropdownOptions])

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
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteSubCategory(deleteTarget.id)
      removeSubCategoryLocally(deleteTarget.id)
      toast.success('Sub-category deleted')
      setDeleteTarget(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete sub-category'))
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, removeSubCategoryLocally])

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

  const columns = useMemo(
    () => [
      {
        key: 'subcategoryId',
        label: 'ID',
        render: (row) => (
          <span className="font-mono text-sm font-medium text-[#111]">
            {row.subcategoryId || row.id}
          </span>
        ),
      },
      {
        key: 'name',
        label: 'Subcategory',
        render: (row) => <span className="font-semibold text-[#111]">{row.name}</span>,
      },
      {
        key: 'examCategory',
        label: 'Category Name',
        render: (row) => (
          <span className="text-sm font-medium text-[#444]">{row.examCategory || '—'}</span>
        ),
      },
      {
        key: 'program',
        label: 'Program Name',
        render: (row) => (
          <span className="text-sm font-medium text-[#444]">{row.program || '—'}</span>
        ),
      },
      {
        key: 'centerName',
        label: 'Centre Name',
        render: (row) => (
          <span className="text-sm font-medium text-[#1a3a5c]">{row.centerName || '—'}</span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created On',
        render: (row) => (
          <span className="whitespace-nowrap text-sm">
            {formatCategoryDateTime(row.createdAt)}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => <CategoryStatusBadge status={row.status} />,
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        headerClassName: 'min-w-[11rem] text-right',
        cellClassName: 'min-w-[11rem] text-right',
        render: (row) => (
          <CategoryTableActions
            status={row.status}
            onView={() => handleView(row)}
            onEdit={() => handleEditOpen(row)}
            onDelete={() => setDeleteTarget(row)}
            onToggleStatus={() => setStatusTarget(row)}
          />
        ),
      },
    ],
    [handleView, handleEditOpen],
  )

  const hasActiveFilters =
    search.trim() ||
    statusFilter !== 'all' ||
    centerFilter !== 'all' ||
    programFilter !== 'all' ||
    categoryFilter !== 'all'

  const showEmpty = !loading && subCategories.length === 0 && !hasActiveFilters
  const showNoResults = !loading && subCategories.length === 0 && !showEmpty

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setCenterFilter('all')
    setProgramFilter('all')
    setCategoryFilter('all')
  }

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
        <CategoryPageHeader icon={Icon} hideTitle>
          <AddButton onClick={openCreate}>{section.addLabel}</AddButton>
        </CategoryPageHeader>

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

        {loading ? (
          <ExamSubCategoryTableSkeleton />
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
              data={subCategories}
              itemLabel={section.bannerTitle.toLowerCase()}
              resetDeps={[search, statusFilter, centerFilter, programFilter, categoryFilter]}
              rowClassName="transition-colors hover:bg-[#f8fbff]"
              tableClassName="[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10"
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
          title="Delete exam sub-category?"
          message={`Are you sure you want to delete "${deleteTarget?.name || 'this sub-category'}"? This action cannot be undone.`}
          confirmLabel={deleteLoading ? 'Deleting…' : 'Confirm Delete'}
          onCancel={() => !deleteLoading && setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      </motion.div>
    </AnimatePresence>
  )
}
