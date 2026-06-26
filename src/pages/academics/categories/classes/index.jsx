import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PlusCircle, Search } from 'lucide-react'
import CategoryPageHeader from '../../../../components/categories/CategoryPageHeader'
import { CategoryFilterSelect } from '../../../../components/categories/CategoryFilterBar'
import ProgramsBulkActionsBar from '../../../../components/categories/ProgramsBulkActionsBar'
import MasterBulkConfirmModal from '../../../../components/categories/MasterBulkConfirmModal'
import CategoryEmptyState from '../../../../components/categories/CategoryEmptyState'
import CategoryTableLoadingShell from '../../../../components/categories/CategoryTableLoadingShell'
import ErrorState from '../../../../components/feedback/ErrorState'
import { useEditModal } from '../../../../hooks/useEditModal'
import { useClassManagement } from '../../../../hooks/useClassManagement'
import { useSubjectsDropdown } from '../../../../hooks/useSubjectsDropdown'
import {
  useClassSection,
  useClassSectionsDropdown,
  useCreateClassSection,
  useUpdateClassSection,
  useUpdateClassSectionStatus,
} from '../../../../hooks/useClassSections'
import { useTableRowSelection } from '../../../../hooks/useTableRowSelection'
import { getApiErrorMessage } from '../../../../utils/apiError'
import { toast, TOAST_DURATION } from '../../../../utils/toast'
import { isRecordStatusActive } from '../../../../constants/recordStatus'
import {
  countDisableableSelected,
  countEnableableSelected,
  filterDisableableIds,
  filterEnableableIds,
  MASTER_BULK_TOAST,
} from '../../../../utils/masterBulkActions'
import { getMasterBulkErrorMessage } from '../../../../services/masterBulkStatusService'
import { classSectionService } from '../../../../services/classSectionService'
import { mapUiStatusToApi } from '../../../../utils/programHelpers'
import {
  CATEGORY_FILTER_BAR_SHELL,
  CATEGORY_SEARCH_INPUT_CLASS,
  categoryFilterGridClass,
} from '../../../../utils/categoryUiStandards'
import AddEditClassModal from './AddEditClassModal'
import ViewClassModal from './ViewClassModal'
import ConfirmClassStatusModal from './ConfirmClassStatusModal'
import ClassTable from './ClassTable'
import {
  buildCreateClassPayload,
  buildUpdateClassPayload,
  mapClassDetailFromQuery,
  normalizeClassSectionsDropdownResponse,
} from './classApiHelpers'

function AddButton({ onClick, children, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
    >
      <PlusCircle className="h-4 w-4 shrink-0" strokeWidth={2.2} />
      {children}
    </button>
  )
}

export default function ClassesPage() {
  const {
    classes,
    loading: tableLoading,
    isFetching,
    listError,
    search,
    setSearch,
    subjectFilter,
    setSubjectFilter,
    classFilter,
    setClassFilter,
    sortBy,
    sortOrder,
    handleSort,
    controlledPagination,
    refreshClasses,
  } = useClassManagement()

  const { options: subjectDropdownOptions, loading: subjectsLoading } = useSubjectsDropdown()
  const createMutation = useCreateClassSection()
  const updateMutation = useUpdateClassSection()
  const statusMutation = useUpdateClassSectionStatus()
  const { selectedIds, selection, clearSelection } = useTableRowSelection()

  const filterSubjectId = subjectFilter !== 'all' ? subjectFilter : undefined
  const { data: classSectionsDropdownData } = useClassSectionsDropdown(filterSubjectId, {
    enabled: Boolean(filterSubjectId),
  })

  const subjectFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'All Subjects' },
      ...subjectDropdownOptions.map((opt) => ({ value: opt.value, label: opt.label })),
    ],
    [subjectDropdownOptions],
  )

  const classFilterOptions = useMemo(() => {
    const rows = normalizeClassSectionsDropdownResponse(classSectionsDropdownData)
    const names = [...new Set(rows.map((row) => row.className).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    )
    return [
      { value: 'all', label: 'All Classes' },
      ...names.map((name) => ({ value: name, label: name })),
    ]
  }, [classSectionsDropdownData])

  const { isOpen, openEdit, openCreate, close, selectedItem } = useEditModal()
  const [editId, setEditId] = useState(null)
  const [viewId, setViewId] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [bulkConfirm, setBulkConfirm] = useState(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const { data: editQuery, isLoading: editDetailLoading } = useClassSection(editId, {
    enabled: Boolean(editId) && isOpen,
  })

  const editDetail = useMemo(() => {
    if (!editId) return selectedItem
    return mapClassDetailFromQuery(editQuery) || selectedItem
  }, [editId, editQuery, selectedItem])

  const { data: viewQuery, isLoading: viewLoading } = useClassSection(viewId, {
    enabled: Boolean(viewId),
  })

  const viewItem = useMemo(() => {
    if (!viewId) return null
    return mapClassDetailFromQuery(viewQuery)
  }, [viewId, viewQuery])

  const classesById = useMemo(
    () => new Map(classes.map((row) => [String(row.id), row])),
    [classes],
  )

  const enableableCount = useMemo(
    () => countEnableableSelected(selectedIds, classesById),
    [selectedIds, classesById],
  )

  const disableableCount = useMemo(
    () => countDisableableSelected(selectedIds, classesById),
    [selectedIds, classesById],
  )

  useEffect(() => {
    setClassFilter('all')
    clearSelection()
  }, [subjectFilter, clearSelection])

  const handleEdit = useCallback(
    (row) => {
      setEditId(row.id)
      openEdit(row)
    },
    [openEdit],
  )

  const handleCreate = useCallback(() => {
    setEditId(null)
    openCreate()
  }, [openCreate])

  const handleCloseModal = useCallback(() => {
    close()
    setEditId(null)
  }, [close])

  const handleFormSubmit = useCallback(
    async (form, { isEdit, id }) => {
      try {
        if (isEdit && id != null) {
          const result = await updateMutation.mutateAsync({
            id: String(id),
            payload: buildUpdateClassPayload(form),
          })
          if (result?.success) {
            toast.success(result.message || 'Class updated successfully')
          }
        } else {
          const result = await createMutation.mutateAsync(buildCreateClassPayload(form))
          if (result?.success) {
            toast.success(result.message || 'Class created successfully')
          }
        }
        handleCloseModal()
      } catch (error) {
        throw error
      }
    },
    [createMutation, updateMutation, handleCloseModal],
  )

  const confirmStatusChange = useCallback(async () => {
    if (!statusTarget) return
    const enabling = !isRecordStatusActive(statusTarget.status)
    const nextApiStatus = mapUiStatusToApi(enabling ? 'Active' : 'In Active')

    try {
      const result = await statusMutation.mutateAsync({
        id: statusTarget.id,
        status: nextApiStatus,
      })
      toast.success(result?.message || (enabling ? 'Class activated' : 'Class deactivated'))
      setStatusTarget(null)
    } catch {
      // useUpdateClassSectionStatus handles error toast
    }
  }, [statusTarget, statusMutation])

  const confirmBulkAction = useCallback(async () => {
    if (!bulkConfirm) return
    setBulkActionLoading(true)

    const apiStatus = mapUiStatusToApi(bulkConfirm.type === 'enable' ? 'Active' : 'In Active')

    try {
      const ids =
        bulkConfirm.type === 'enable'
          ? filterEnableableIds(selectedIds, classesById)
          : filterDisableableIds(selectedIds, classesById)

      await Promise.all(
        ids.map((id) => classSectionService.updateClassSectionStatus(id, apiStatus)),
      )

      clearSelection()
      toast.success(
        bulkConfirm.type === 'enable'
          ? MASTER_BULK_TOAST.activated
          : MASTER_BULK_TOAST.deactivated,
        { duration: TOAST_DURATION.short },
      )
      setBulkConfirm(null)
      await refreshClasses()
    } catch (error) {
      toast.error(getMasterBulkErrorMessage(error, bulkConfirm.type))
      await refreshClasses()
    } finally {
      setBulkActionLoading(false)
    }
  }, [bulkConfirm, selectedIds, classesById, refreshClasses, clearSelection])

  const hasActiveFilters =
    Boolean(search.trim()) || subjectFilter !== 'all' || classFilter !== 'all'

  const showEmpty = !tableLoading && !listError && classes.length === 0 && !hasActiveFilters
  const showNoResults = !tableLoading && !listError && classes.length === 0 && !showEmpty

  const submitting = createMutation.isPending || updateMutation.isPending

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="classes"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22 }}
        className="space-y-5 sm:space-y-6"
      >
        <CategoryPageHeader title="Classes">
          <AddButton onClick={handleCreate} disabled={tableLoading}>
            Add Class
          </AddButton>
        </CategoryPageHeader>

        <div className={CATEGORY_FILTER_BAR_SHELL}>
          <div className={categoryFilterGridClass(2)}>
            <div className="relative min-w-0 w-full sm:col-span-2 lg:col-span-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Class Name"
                className={CATEGORY_SEARCH_INPUT_CLASS}
              />
            </div>

            <CategoryFilterSelect
              label="Subject"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              options={subjectFilterOptions}
            />

            <CategoryFilterSelect
              label="Class"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              options={classFilterOptions}
            />
          </div>
        </div>

        <ProgramsBulkActionsBar
          count={selectedIds.length}
          enableCount={enableableCount}
          disableCount={disableableCount}
          onClearSelection={clearSelection}
          onEnable={() => enableableCount > 0 && setBulkConfirm({ type: 'enable' })}
          onDisable={() => disableableCount > 0 && setBulkConfirm({ type: 'disable' })}
        />

        {tableLoading ? (
          <CategoryTableLoadingShell />
        ) : listError ? (
          <ErrorState
            message={getApiErrorMessage(listError, 'Failed to load classes')}
            onRetry={() => refreshClasses()}
          />
        ) : showEmpty ? (
          <CategoryEmptyState
            title="No Classes Found"
            description="Add your first class and link it to a subject."
            ctaLabel="Add Class"
            onCta={handleCreate}
          />
        ) : showNoResults ? (
          <CategoryEmptyState
            title="No matching records"
            description="Try adjusting your search or filters."
          />
        ) : (
          <ClassTable
            classes={classes}
            loading={bulkActionLoading || isFetching}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onView={(row) => setViewId(row.id)}
            onEdit={handleEdit}
            onToggleStatus={setStatusTarget}
            resetDeps={[search, subjectFilter, classFilter, sortBy, sortOrder]}
            selection={selection}
            controlledPagination={controlledPagination}
          />
        )}

        <AddEditClassModal
          open={isOpen}
          onClose={handleCloseModal}
          item={editDetail}
          loading={editDetailLoading}
          onSubmit={handleFormSubmit}
          submitting={submitting}
          subjectOptions={subjectDropdownOptions}
          subjectsLoading={subjectsLoading}
        />

        <ViewClassModal
          open={Boolean(viewId)}
          onClose={() => setViewId(null)}
          item={viewItem}
          loading={viewLoading}
        />

        <ConfirmClassStatusModal
          open={Boolean(statusTarget)}
          className={statusTarget?.name}
          enabling={statusTarget ? !isRecordStatusActive(statusTarget.status) : false}
          loading={statusMutation.isPending}
          onCancel={() => !statusMutation.isPending && setStatusTarget(null)}
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
