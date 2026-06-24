import { useCallback, useEffect, useMemo, useState } from 'react'
import { PlusCircle, RefreshCw } from 'lucide-react'
import CategoryPageHeader from '../../../components/categories/CategoryPageHeader'
import ClassRoomsFilterBar from '../../../components/classrooms/ClassRoomsFilterBar'
import ProgramsBulkActionsBar from '../../../components/categories/ProgramsBulkActionsBar'
import CategoryEmptyState from '../../../components/categories/CategoryEmptyState'
import CategoryStandardTable from '../../../components/categories/CategoryStandardTable'
import CategoryTableLoadingShell from '../../../components/categories/CategoryTableLoadingShell'
import { buildClassroomTableColumns } from '../../../components/classrooms/ClassroomTable'
import ClassroomFormModal from '../../../components/classrooms/ClassroomFormModal'
import ViewClassroomModal from '../../../components/classrooms/ViewClassroomModal'
import ConfirmClassroomStatusModal from '../../../components/classrooms/ConfirmClassroomStatusModal'
import MasterBulkConfirmModal from '../../../components/categories/MasterBulkConfirmModal'
import ConfirmDeleteDialog from '../../../components/subjects/ConfirmDeleteDialog'
import ErrorState from '../../../components/feedback/ErrorState'
import { useClassroomManagement } from '../../../hooks/useClassroomManagement'
import { useCentersDropdownOptions } from '../../../hooks/useCentersDropdownOptions'
import { useCitiesByCenter } from '../../../hooks/useCities'
import {
  useClassroom,
  useCreateClassroom,
  useUpdateClassroom,
  useUpdateClassroomStatus,
  useDeleteClassroom,
} from '../../../hooks/useClassrooms'
import { useTableRowSelection } from '../../../hooks/useTableRowSelection'
import { getApiErrorMessage } from '../../../utils/apiError'
import { toast, TOAST_DURATION } from '../../../utils/toast'
import {
  bulkUpdateMasterStatus,
  getMasterBulkErrorMessage,
} from '../../../services/masterBulkStatusService'
import { updateClassroomStatus } from '../../../services/classroomService'
import {
  MASTER_BULK_TOAST,
  countDisableableSelected,
  countEnableableSelected,
  filterDisableableIds,
  filterEnableableIds,
} from '../../../utils/masterBulkActions'
import {
  buildCreateClassroomPayload,
  buildUpdateClassroomPayload,
  mapApiClassroomToLocal,
  mapUiClassroomStatusToApi,
  normalizeCitiesByCenter,
} from '../../../utils/classroomApiHelpers'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Deactivated', label: 'Deactivated' },
]

function CreateButton({ onClick, disabled, children }) {
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

function RefreshButton({ onClick, disabled, fetching }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#1a3a5c] shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
    >
      <RefreshCw className={`h-4 w-4 ${fetching ? 'animate-spin' : ''}`} />
      {fetching ? 'Refreshing…' : 'Refresh'}
    </button>
  )
}

export default function ClassRoomsPage() {
  const {
    classrooms,
    loading: tableLoading,
    isFetching,
    listError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    centerFilter,
    setCenterFilter,
    cityFilter,
    setCityFilter,
    sortBy,
    sortOrder,
    handleSort,
    controlledPagination,
    refreshClassrooms,
  } = useClassroomManagement()

  const { options: centreDropdownOptions } = useCentersDropdownOptions()
  const createMutation = useCreateClassroom()
  const updateMutation = useUpdateClassroom()
  const deleteMutation = useDeleteClassroom()
  const statusMutation = useUpdateClassroomStatus()
  const { selectedIds, selection, clearSelection } = useTableRowSelection()

  const [modalOpen, setModalOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [editId, setEditId] = useState(null)
  const [viewId, setViewId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [bulkConfirm, setBulkConfirm] = useState(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const centerOptions = useMemo(
    () => [{ value: 'all', label: 'Center' }, ...centreDropdownOptions],
    [centreDropdownOptions],
  )

  const filterCenterId = centerFilter !== 'all' ? centerFilter : undefined
  const { data: filterCitiesData } = useCitiesByCenter(
    filterCenterId,
    { enabled: Boolean(filterCenterId) },
  )

  const cityOptions = useMemo(() => {
    const cities = filterCenterId ? normalizeCitiesByCenter(filterCitiesData) : []
    return [{ value: 'all', label: 'City' }, ...cities]
  }, [filterCenterId, filterCitiesData])

  useEffect(() => {
    setCityFilter('all')
    clearSelection()
  }, [centerFilter, clearSelection])

  const { data: viewQuery, isLoading: viewLoading } = useClassroom(viewId, {
    enabled: Boolean(viewId),
  })
  const viewRow = useMemo(() => {
    if (!viewId) return null
    return mapApiClassroomToLocal(viewQuery) || null
  }, [viewId, viewQuery])

  const { data: editQuery, isLoading: editDetailLoading } = useClassroom(editId, {
    enabled: Boolean(editId) && modalOpen,
  })
  const editDetail = useMemo(() => {
    if (!editId) return editRow
    return mapApiClassroomToLocal(editQuery) || editRow
  }, [editId, editQuery, editRow])

  const classroomsById = useMemo(
    () => new Map(classrooms.map((row) => [String(row.id), row])),
    [classrooms],
  )

  const disableableCount = useMemo(
    () => countDisableableSelected(selectedIds, classroomsById),
    [selectedIds, classroomsById],
  )

  const enableableCount = useMemo(
    () => countEnableableSelected(selectedIds, classroomsById),
    [selectedIds, classroomsById],
  )

  const openCreate = useCallback(() => {
    setEditRow(null)
    setEditId(null)
    setModalOpen(true)
  }, [])

  const handleView = useCallback((row) => {
    setViewId(row.id)
  }, [])

  const handleEdit = useCallback((row) => {
    setEditRow(row)
    setEditId(row.id)
    setModalOpen(true)
  }, [])

  useEffect(() => {
    if (!modalOpen) {
      setEditRow(null)
      setEditId(null)
    }
  }, [modalOpen])

  const handleSave = async (form) => {
    const isEdit = Boolean(editRow?.id)

    try {
      if (isEdit) {
        const result = await updateMutation.mutateAsync({
          id: editRow.id,
          payload: buildUpdateClassroomPayload(form),
        })
        if (result?.success) {
          toast.success(result.message || 'Classroom updated successfully')
        }
      } else {
        const result = await createMutation.mutateAsync(buildCreateClassroomPayload(form))
        if (result?.success && result?.data?._id) {
          toast.success(result.message || 'Classroom created successfully')
        }
      }
      setModalOpen(false)
      setEditRow(null)
      setEditId(null)
    } catch (error) {
      throw error
    }
  }

  const handleDelete = useCallback((row) => {
    setDeleteTarget({ ids: [row.id], name: row.name })
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget?.ids?.length) return

    try {
      for (const id of deleteTarget.ids) {
        const result = await deleteMutation.mutateAsync(id)
        if (result?.success) {
          toast.success(result.message || 'Classroom deleted successfully')
        }
      }
      clearSelection()
      setDeleteTarget(null)
    } catch {
      // useDeleteClassroom handles error toast
    }
  }, [deleteTarget, deleteMutation, clearSelection])

  const confirmStatusChange = useCallback(async () => {
    if (!statusTarget) return
    const activating = statusTarget.status !== 'Active'
    const nextApiStatus = mapUiClassroomStatusToApi(activating ? 'Active' : 'Deactivated')

    try {
      const result = await statusMutation.mutateAsync({
        id: statusTarget.id,
        status: nextApiStatus,
      })
      toast.success(
        result?.message || (activating ? 'Classroom activated' : 'Classroom deactivated'),
      )
      setStatusTarget(null)
    } catch {
      // useUpdateClassroomStatus handles error toast
    }
  }, [statusTarget, statusMutation])

  const handleToggle = useCallback((row) => {
    setStatusTarget(row)
  }, [])

  const handleBulkEnableRequest = useCallback(() => {
    if (!enableableCount) return
    setBulkConfirm({ type: 'enable' })
  }, [enableableCount])

  const handleBulkDisableRequest = useCallback(() => {
    if (!disableableCount) return
    setBulkConfirm({ type: 'disable' })
  }, [disableableCount])

  const confirmBulkAction = useCallback(async () => {
    if (!bulkConfirm) return
    setBulkActionLoading(true)

    try {
      if (bulkConfirm.type === 'enable') {
        const ids = filterEnableableIds(selectedIds, classroomsById)
        await bulkUpdateMasterStatus('classrooms', ids, 'ACTIVE', {
          updateSingle: updateClassroomStatus,
        })
        clearSelection()
        toast.success(MASTER_BULK_TOAST.enabled, { duration: TOAST_DURATION.short })
      } else if (bulkConfirm.type === 'disable') {
        const ids = filterDisableableIds(selectedIds, classroomsById)
        await bulkUpdateMasterStatus('classrooms', ids, 'INACTIVE', {
          updateSingle: updateClassroomStatus,
        })
        clearSelection()
        toast.success(MASTER_BULK_TOAST.disabled, { duration: TOAST_DURATION.short })
      }
      setBulkConfirm(null)
      await refreshClassrooms()
    } catch (error) {
      toast.error(getMasterBulkErrorMessage(error, bulkConfirm.type))
      await refreshClassrooms()
    } finally {
      setBulkActionLoading(false)
    }
  }, [bulkConfirm, selectedIds, classroomsById, refreshClassrooms, clearSelection])

  const columns = useMemo(
    () =>
      buildClassroomTableColumns({
        onView: handleView,
        onEdit: handleEdit,
        onToggle: handleToggle,
        onDelete: handleDelete,
        sortBy,
        sortOrder,
        onSort: handleSort,
      }),
    [handleView, handleEdit, handleToggle, handleDelete, sortBy, sortOrder, handleSort],
  )

  const hasActiveFilters =
    Boolean(search.trim()) ||
    statusFilter !== 'all' ||
    centerFilter !== 'all' ||
    cityFilter !== 'all'

  const showEmpty =
    !tableLoading && !listError && classrooms.length === 0 && !hasActiveFilters
  const showNoResults = !tableLoading && !listError && classrooms.length === 0 && !showEmpty

  const saving = createMutation.isPending || updateMutation.isPending

  const deleteMessage =
    deleteTarget?.ids?.length > 1
      ? `Delete ${deleteTarget.ids.length} selected classrooms? This cannot be undone.`
      : `Are you sure you want to delete "${deleteTarget?.name || 'this classroom'}"? This action cannot be undone.`

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setCenterFilter('all')
    setCityFilter('all')
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <CategoryPageHeader title="Class Room">
        <div className="flex flex-wrap items-center gap-2">
          <RefreshButton
            onClick={() => refreshClassrooms()}
            disabled={tableLoading || isFetching}
            fetching={isFetching}
          />
          <CreateButton onClick={openCreate} disabled={tableLoading}>
            Add Class Room
          </CreateButton>
        </div>
      </CategoryPageHeader>

      <ClassRoomsFilterBar
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        searchPlaceholder="Search classrooms..."
        cityFilter={cityFilter}
        onCityFilterChange={(e) => setCityFilter(e.target.value)}
        cityOptions={cityOptions}
        status={statusFilter}
        onStatusChange={(e) => setStatusFilter(e.target.value)}
        statusOptions={STATUS_OPTIONS}
        centerFilter={centerFilter}
        onCenterFilterChange={(e) => setCenterFilter(e.target.value)}
        centerOptions={centerOptions}
      />

      <ProgramsBulkActionsBar
        count={selectedIds.length}
        enableCount={enableableCount}
        disableCount={disableableCount}
        onClearSelection={clearSelection}
        onEnable={handleBulkEnableRequest}
        onDisable={handleBulkDisableRequest}
      />

      {tableLoading ? (
        <CategoryTableLoadingShell />
      ) : listError ? (
        <ErrorState
          message={getApiErrorMessage(listError, 'Failed to load classrooms')}
          onRetry={() => refreshClassrooms()}
        />
      ) : showEmpty ? (
        <CategoryEmptyState
          title="No Classrooms Found"
          description="Add classrooms to assign to live sessions."
          ctaLabel="Add Class Room"
          onCta={openCreate}
        />
      ) : showNoResults ? (
        <CategoryEmptyState
          title="No matching classrooms"
          description="Adjust search or filters to find classrooms."
          ctaLabel="Clear filters"
          onCta={clearFilters}
        />
      ) : (
        <CategoryStandardTable
          data={classrooms}
          columns={columns}
          itemLabel="classrooms"
          controlledPagination={controlledPagination}
          loading={bulkActionLoading || isFetching}
          selection={selection}
          resetDeps={[search, statusFilter, centerFilter, cityFilter, sortBy, sortOrder]}
          tableMinWidth={1280}
        />
      )}

      <ClassroomFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditRow(null)
          setEditId(null)
        }}
        classroom={editDetail}
        loading={editDetailLoading}
        onSave={handleSave}
        saving={saving}
      />

      <ViewClassroomModal
        open={Boolean(viewId)}
        onClose={() => setViewId(null)}
        classroom={viewRow}
        loading={viewLoading}
      />

      <ConfirmClassroomStatusModal
        open={Boolean(statusTarget)}
        activating={statusTarget?.status !== 'Active'}
        loading={statusMutation.isPending}
        onCancel={() => setStatusTarget(null)}
        onConfirm={confirmStatusChange}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete classroom?"
        message={deleteMessage}
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => !deleteMutation.isPending && setDeleteTarget(null)}
      />

      <MasterBulkConfirmModal
        open={Boolean(bulkConfirm)}
        type={bulkConfirm?.type}
        loading={bulkActionLoading}
        onConfirm={confirmBulkAction}
        onCancel={() => !bulkActionLoading && setBulkConfirm(null)}
      />
    </div>
  )
}
