import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PlusCircle } from 'lucide-react'
import CategoryPageHeader from '../../../../components/categories/CategoryPageHeader'
import CategoryFilterBar from '../../../../components/categories/CategoryFilterBar'
import CategoryStatusBadge from '../../../../components/categories/CategoryStatusBadge'
import CategoryTableActions from '../../../../components/categories/CategoryTableActions'
import CategoryEmptyState from '../../../../components/categories/CategoryEmptyState'
import ExamCategoryFormModal from '../../../../components/categories/ExamCategoryFormModal'
import ViewExamCategoryModal from '../../../../components/categories/ViewExamCategoryModal'
import ConfirmExamCategoryStatusModal from '../../../../components/categories/ConfirmExamCategoryStatusModal'
import ExamCategoryTableSkeleton from '../../../../components/categories/ExamCategoryTableSkeleton'
import PaginatedFigmaTable from '../../../../components/figma/PaginatedFigmaTable'
import ConfirmDeleteDialog from '../../../../components/subjects/ConfirmDeleteDialog'
import { useEditModal } from '../../../../hooks/useEditModal'
import { useExamCategoryManagement } from '../../../../hooks/useExamCategoryManagement'
import { useCentersDropdownOptions } from '../../../../hooks/useCentersDropdownOptions'
import { useProgramsByCenter } from '../../../../hooks/useProgramsByCenter'
import { formatCategoryDateTime } from '../../../../utils/formatDateTime'
import { getApiErrorMessage } from '../../../../utils/apiError'
import { toast } from '../../../../utils/toast'
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

export default function ExamCategorySection({ section, Icon }) {
  const {
    categories,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    centerFilter,
    setCenterFilter,
    programFilter,
    setProgramFilter,
    refreshCategories,
    patchCategoryLocally,
    removeCategoryLocally,
  } = useExamCategoryManagement()

  const { options: centreDropdownOptions, loading: centresLoading } = useCentersDropdownOptions()
  const filterCenterId = centerFilter === 'all' ? '' : centerFilter
  const { programOptions: filterProgramOptions, loading: filterProgramsLoading } =
    useProgramsByCenter(filterCenterId)

  const { isOpen, openEdit, openCreate, close, selectedItem } = useEditModal()
  const [selectedIds, setSelectedIds] = useState([])
  const [viewItem, setViewItem] = useState(null)
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

  const programFilterOptions = useMemo(() => {
    const base = [{ value: 'all', label: 'All Programs' }]
    if (centerFilter === 'all') return base
    return [
      ...base,
      ...filterProgramOptions.map((o) => ({ value: o.value, label: o.label })),
    ]
  }, [centerFilter, filterProgramOptions])

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
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteExamCategory(deleteTarget.id)
      removeCategoryLocally(deleteTarget.id)
      setSelectedIds((prev) => prev.filter((sid) => sid !== deleteTarget.id))
      toast.success('Category deleted')
      setDeleteTarget(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete category'))
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, removeCategoryLocally])

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

  const toggleSelectAll = () => {
    if (selectedIds.length === categories.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(categories.map((r) => r.id))
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'select',
        label: '',
        headerClassName: 'w-12 pl-6 sm:pl-8',
        cellClassName: 'pl-6 sm:pl-8',
        render: (row) => (
          <input
            type="checkbox"
            checked={selectedIds.includes(row.id)}
            onChange={() => {
              setSelectedIds((prev) =>
                prev.includes(row.id) ? prev.filter((x) => x !== row.id) : [...prev, row.id],
              )
            }}
            className="h-4 w-4 rounded accent-[#246392]"
            aria-label={`Select ${row.name}`}
          />
        ),
      },
      {
        key: 'categoryId',
        label: 'Category ID',
        render: (row) => (
          <span className="font-mono text-sm font-medium text-[#111]">
            {row.categoryId || row.id}
          </span>
        ),
      },
      {
        key: 'name',
        label: 'Category Name',
        render: (row) => <span className="font-semibold text-[#111]">{row.name}</span>,
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
    [selectedIds, handleView, handleEditOpen],
  )

  const showEmpty = !loading && categories.length === 0 && !search && statusFilter === 'all' && centerFilter === 'all' && programFilter === 'all'
  const showNoResults = !loading && categories.length === 0 && !showEmpty

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setCenterFilter('all')
    setProgramFilter('all')
  }

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
          onCenterFilterChange={(e) => {
            setCenterFilter(e.target.value)
            setProgramFilter('all')
          }}
          centerOptions={centreOptions}
        />

        <div className="flex justify-end">
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            disabled={centerFilter === 'all' || filterProgramsLoading}
            className="h-10 rounded-lg bg-[#55ace7] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4a9ad4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {programFilterOptions.map((o) => (
              <option key={o.value} value={o.value} className="text-[#222]">
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {!loading && categories.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-[#686868]">
            <input
              type="checkbox"
              checked={selectedIds.length === categories.length && categories.length > 0}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded accent-[#246392]"
            />
            <span>Select all on this page</span>
          </div>
        )}

        {loading ? (
          <ExamCategoryTableSkeleton />
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
              data={categories}
              itemLabel={section.bannerTitle.toLowerCase()}
              resetDeps={[search, statusFilter, centerFilter, programFilter]}
              rowClassName="transition-colors hover:bg-[#f8fbff]"
              tableClassName="[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10"
            />
          </div>
        )}

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
          title="Delete exam category?"
          message={`Are you sure you want to delete "${deleteTarget?.name || 'this category'}"? This action cannot be undone.`}
          confirmLabel={deleteLoading ? 'Deleting…' : 'Confirm Delete'}
          onCancel={() => !deleteLoading && setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      </motion.div>
    </AnimatePresence>
  )
}
