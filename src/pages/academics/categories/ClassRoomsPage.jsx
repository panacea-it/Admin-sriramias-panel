import { useCallback, useEffect, useMemo, useState } from 'react'
import { PlusCircle } from 'lucide-react'
import CategoryPageHeader from '../../../components/categories/CategoryPageHeader'
import ClassRoomsFilterBar from '../../../components/classrooms/ClassRoomsFilterBar'
import ProgramsBulkActionsBar from '../../../components/categories/ProgramsBulkActionsBar'
import CategoryEmptyState from '../../../components/categories/CategoryEmptyState'
import PaginatedFigmaTable from '../../../components/figma/PaginatedFigmaTable'
import { buildClassroomTableColumns } from '../../../components/classrooms/ClassroomTable'
import ClassroomFormModal from '../../../components/classrooms/ClassroomFormModal'
import ViewClassroomModal from '../../../components/classrooms/ViewClassroomModal'
import ConfirmClassroomStatusModal from '../../../components/classrooms/ConfirmClassroomStatusModal'
import MasterBulkConfirmModal from '../../../components/categories/MasterBulkConfirmModal'
import { useClassroomManagement } from '../../../hooks/useClassroomManagement'
import { useCentersDropdownOptions } from '../../../hooks/useCentersDropdownOptions'
import { useTableRowSelection } from '../../../hooks/useTableRowSelection'
import { getApiErrorMessage } from '../../../utils/apiError'
import { toast, TOAST_DURATION } from '../../../utils/toast'
import {
  bulkUpdateMasterStatus,
  getMasterBulkErrorMessage,
} from '../../../services/masterBulkStatusService'
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
} from '../../../utils/classroomApiHelpers'
import {
  createClassroom,
  deleteClassroom,
  getClassroomById,
  updateClassroom,
  updateClassroomStatus,
} from '../../../services/classroomService'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Deactivated', label: 'Deactivated' },
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
      Add Class Room
    </button>
  )
}

function resolveCityFilterKey(row) {
  const placeName = String(row.placeName || '').trim()
  if (placeName) return placeName
  const cityId = String(row.cityPlaceId || '').trim()
  return cityId || ''
}

function matchesClassroomSearch(row, query) {
  const fields = [row.code, row.centerName, row.placeName]
  return fields.some((value) => String(value || '').toLowerCase().includes(query))
}

export default function ClassRoomsPage() {
  const {
    classrooms,
    loading: tableLoading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    centerFilter,
    setCenterFilter,
    controlledPagination,
    refreshClassrooms,
  } = useClassroomManagement()

  const { options: centreDropdownOptions } = useCentersDropdownOptions()
  const { selectedIds, selection, clearSelection } = useTableRowSelection()

  const [cityFilter, setCityFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [editDetail, setEditDetail] = useState(null)
  const [editDetailLoading, setEditDetailLoading] = useState(false)
  const [viewRow, setViewRow] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [statusTarget, setStatusTarget] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [bulkConfirm, setBulkConfirm] = useState(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const centerOptions = useMemo(
    () => [{ value: 'all', label: 'Center' }, ...centreDropdownOptions],
    [centreDropdownOptions],
  )

  const cityOptions = useMemo(() => {
    const seen = new Map()
    classrooms.forEach((row) => {
      const key = resolveCityFilterKey(row)
      if (!key || seen.has(key)) return
      seen.set(key, row.placeName?.trim() || key)
    })
    return [
      { value: 'all', label: 'City' },
      ...[...seen.entries()]
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([value, label]) => ({ value, label })),
    ]
  }, [classrooms])

  const searchedClassrooms = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return classrooms
    return classrooms.filter((row) => matchesClassroomSearch(row, query))
  }, [classrooms, search])

  const filteredClassrooms = useMemo(() => {
    if (cityFilter === 'all') return searchedClassrooms
    return searchedClassrooms.filter((row) => {
      const key = resolveCityFilterKey(row)
      return key === cityFilter || String(row.cityPlaceId || '') === cityFilter
    })
  }, [searchedClassrooms, cityFilter])

  const classroomsById = useMemo(
    () => new Map(filteredClassrooms.map((row) => [String(row.id), row])),
    [filteredClassrooms],
  )

  const disableableCount = useMemo(
    () => countDisableableSelected(selectedIds, classroomsById),
    [selectedIds, classroomsById],
  )

  const enableableCount = useMemo(
    () => countEnableableSelected(selectedIds, classroomsById),
    [selectedIds, classroomsById],
  )

  useEffect(() => {
    if (cityFilter === 'all') return
    const stillValid = cityOptions.some((opt) => opt.value === cityFilter)
    if (!stillValid) setCityFilter('all')
  }, [cityFilter, cityOptions])

  useEffect(() => {
    setCityFilter('all')
    clearSelection()
  }, [centerFilter, clearSelection])

  const loadClassroomDetail = useCallback(async (row) => {
    const data = await getClassroomById(row.id)
    return mapApiClassroomToLocal(data) || row
  }, [])

  const openCreate = useCallback(() => {
    setEditRow(null)
    setEditDetail(null)
    setModalOpen(true)
  }, [])

  const handleView = useCallback(
    async (row) => {
      setViewRow(row)
      setViewLoading(true)
      try {
        const detail = await loadClassroomDetail(row)
        if (detail) setViewRow(detail)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load classroom details'))
        setViewRow(null)
      } finally {
        setViewLoading(false)
      }
    },
    [loadClassroomDetail],
  )

  const handleEdit = useCallback(
    async (row) => {
      setEditRow(row)
      setEditDetail(row)
      setEditDetailLoading(true)
      setModalOpen(true)
      try {
        const detail = await loadClassroomDetail(row)
        setEditDetail(detail || row)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load classroom for editing'))
        setModalOpen(false)
        setEditRow(null)
        setEditDetail(null)
      } finally {
        setEditDetailLoading(false)
      }
    },
    [loadClassroomDetail],
  )

  useEffect(() => {
    if (!modalOpen) {
      setEditRow(null)
      setEditDetail(null)
      setEditDetailLoading(false)
    }
  }, [modalOpen])

  const handleSave = async (form) => {
    const isEdit = Boolean(editRow?.id)
    if (isEdit) {
      setUpdateLoading(true)
    } else {
      setCreateLoading(true)
    }

    try {
      if (isEdit) {
        await updateClassroom(editRow.id, buildUpdateClassroomPayload(form))
        toast.success('Classroom updated')
      } else {
        await createClassroom(buildCreateClassroomPayload(form))
        toast.success('Classroom created')
      }
      setModalOpen(false)
      setEditRow(null)
      setEditDetail(null)
      await refreshClassrooms()
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          isEdit ? 'Failed to update classroom' : 'Failed to create classroom',
        ),
      )
      throw error
    } finally {
      setCreateLoading(false)
      setUpdateLoading(false)
    }
  }

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget?.ids?.length) return
    setDeleteLoading(true)
    const ids = deleteTarget.ids
    try {
      await Promise.all(ids.map((id) => deleteClassroom(id)))
      clearSelection()
      setDeleteTarget(null)
      toast.success(
        ids.length > 1 ? `${ids.length} classrooms deleted` : 'Classroom deleted',
      )
      await refreshClassrooms()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete classroom'))
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, refreshClassrooms, clearSelection])

  const confirmStatusChange = useCallback(async () => {
    if (!statusTarget) return
    const activating = statusTarget.status !== 'Active'
    const nextApiStatus = activating ? 'ACTIVE' : 'INACTIVE'

    setStatusLoading(true)
    try {
      await updateClassroomStatus(statusTarget.id, nextApiStatus)
      toast.success(activating ? 'Classroom activated' : 'Classroom deactivated')
      setStatusTarget(null)
      await refreshClassrooms()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update classroom status'))
    } finally {
      setStatusLoading(false)
    }
  }, [statusTarget, refreshClassrooms])

  const handleBulkEnableRequest = useCallback(() => {
    if (!enableableCount) return
    setBulkConfirm({ type: 'enable' })
  }, [enableableCount])

  const handleBulkDisableRequest = useCallback(() => {
    if (!disableableCount) return
    setBulkConfirm({ type: 'disable' })
  }, [disableableCount])

  const handleBulkDeleteRequest = useCallback(() => {
    if (!selectedIds.length) return
    setBulkConfirm({ type: 'deactivate' })
  }, [selectedIds.length])

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
        await refreshClassrooms()
      } else if (bulkConfirm.type === 'disable') {
        const ids = filterDisableableIds(selectedIds, classroomsById)
        await bulkUpdateMasterStatus('classrooms', ids, 'INACTIVE', {
          updateSingle: updateClassroomStatus,
        })
        clearSelection()
        toast.success(MASTER_BULK_TOAST.disabled, { duration: TOAST_DURATION.short })
        await refreshClassrooms()
      } else if (bulkConfirm.type === 'delete') {
        const ids = [...selectedIds]
        await Promise.all(ids.map((id) => deleteClassroom(id)))
        clearSelection()
        toast.success(MASTER_BULK_TOAST.deleted, { duration: TOAST_DURATION.short })
        await refreshClassrooms()
      }
      setBulkConfirm(null)
    } catch (error) {
      toast.error(
        bulkConfirm.type === 'delete'
          ? getApiErrorMessage(error, 'Failed to delete selected classrooms')
          : getMasterBulkErrorMessage(error, bulkConfirm.type),
      )
      await refreshClassrooms()
    } finally {
      setBulkActionLoading(false)
    }
  }, [bulkConfirm, selectedIds, classroomsById, refreshClassrooms, clearSelection])

  const handleDelete = useCallback((row) => {
    setDeleteTarget({ ids: [row.id], name: row.name })
  }, [])

  const handleToggle = useCallback((row) => {
    setStatusTarget(row)
  }, [])

  const columns = useMemo(
    () =>
      buildClassroomTableColumns({
        onView: handleView,
        onEdit: handleEdit,
        onToggle: handleToggle,
        onDelete: handleDelete,
      }),
    [handleView, handleEdit, handleToggle, handleDelete],
  )

  const hasActiveFilters =
    Boolean(search.trim()) ||
    statusFilter !== 'all' ||
    centerFilter !== 'all' ||
    cityFilter !== 'all'

  const showEmpty =
    !tableLoading &&
    filteredClassrooms.length === 0 &&
    !hasActiveFilters
  const showNoResults = !tableLoading && filteredClassrooms.length === 0 && !showEmpty

  const saving = createLoading || updateLoading

  const deleteMessage =
    deleteTarget?.ids?.length > 1
      ? `Delete ${deleteTarget.ids.length} selected classrooms? This cannot be undone.`
      : `Are you sure you want to delete "${deleteTarget?.name || 'this classroom'}"? This action cannot be undone.`

  return (
    <div className="space-y-5 sm:space-y-6">
      <CategoryPageHeader title="Class Room">
        <CreateButton onClick={openCreate} />
      </CategoryPageHeader>

      <ClassRoomsFilterBar
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        searchPlaceholder="Search by Code, Center or City / Place..."
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
        <div className="space-y-2 rounded-2xl border border-[#e8f4fc] bg-white p-4 shadow-sm">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg bg-gradient-to-r from-[#eef6fc] via-[#f8fafc] to-[#eef6fc]"
            />
          ))}
        </div>
      ) : showEmpty ? (
        <CategoryEmptyState
          title="No Classrooms Found"
          description="Add classrooms to assign them to live classes and prevent scheduling conflicts."
          ctaLabel="Add Class Room"
          onCta={openCreate}
        />
      ) : showNoResults ? (
        <CategoryEmptyState
          title="No matching classrooms"
          description="Adjust search or filters to find classrooms."
          ctaLabel="Clear filters"
          onCta={() => {
            setSearch('')
            setStatusFilter('all')
            setCenterFilter('all')
            setCityFilter('all')
          }}
        />
      ) : (
        <div className="min-w-0 rounded-2xl bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80">
          <PaginatedFigmaTable
            data={filteredClassrooms}
            columns={columns}
            itemLabel="classrooms"
            controlledPagination={controlledPagination}
            density="comfortable"
            loading={bulkActionLoading}
            selection={selection}
            resetDeps={[search, statusFilter, centerFilter, cityFilter]}
            tableClassName="min-w-[1120px]"
            stickyHeader
          />
        </div>
      )}

      <ClassroomFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditRow(null)
          setEditDetail(null)
        }}
        classroom={editDetail}
        loading={editDetailLoading}
        onSave={handleSave}
        saving={saving}
      />

      <ViewClassroomModal
        open={Boolean(viewRow)}
        onClose={() => setViewRow(null)}
        classroom={viewRow}
        loading={viewLoading}
      />

      <ConfirmClassroomStatusModal
        open={Boolean(statusTarget)}
        activating={statusTarget?.status !== 'Active'}
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
    </div>
  )
}
