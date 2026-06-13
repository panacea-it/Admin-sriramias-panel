import { useCallback, useEffect, useMemo, useState } from 'react'
import { PlusCircle } from 'lucide-react'
import CategoryPageHeader from '../../../components/categories/CategoryPageHeader'
import ClassRoomsFilterBar from '../../../components/classrooms/ClassRoomsFilterBar'
import ProgramsBulkActionsBar from '../../../components/categories/ProgramsBulkActionsBar'
import CategoryEmptyState from '../../../components/categories/CategoryEmptyState'
import PaginatedFigmaTable from '../../../components/figma/PaginatedFigmaTable'
import ClassroomFormModal from '../../../components/classrooms/ClassroomFormModal'
import ViewClassroomModal from '../../../components/classrooms/ViewClassroomModal'
import ConfirmClassroomStatusModal from '../../../components/classrooms/ConfirmClassroomStatusModal'
import ConfirmDeleteDialog from '../../../components/subjects/ConfirmDeleteDialog'
import { buildClassroomTableColumns } from '../../../components/classrooms/ClassroomTable'
import { useClassroomManagement } from '../../../hooks/useClassroomManagement'
import { useCentersDropdownOptions } from '../../../hooks/useCentersDropdownOptions'
import { useTableRowSelection } from '../../../hooks/useTableRowSelection'
import { getApiErrorMessage } from '../../../utils/apiError'
import { toast } from '../../../utils/toast'
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
  { value: 'Inactive', label: 'Inactive' },
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
  const [bulkDisableLoading, setBulkDisableLoading] = useState(false)

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

  const filteredClassrooms = useMemo(() => {
    if (cityFilter === 'all') return classrooms
    return classrooms.filter((row) => {
      const key = resolveCityFilterKey(row)
      return key === cityFilter || String(row.cityPlaceId || '') === cityFilter
    })
  }, [classrooms, cityFilter])

  const classroomsById = useMemo(
    () => new Map(filteredClassrooms.map((row) => [String(row.id), row])),
    [filteredClassrooms],
  )

  const disableableCount = useMemo(
    () =>
      selectedIds.filter((id) => classroomsById.get(String(id))?.status === 'Active').length,
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

  const handleBulkDisable = useCallback(async () => {
    const ids = selectedIds.filter((id) => classroomsById.get(String(id))?.status === 'Active')
    if (!ids.length) return

    setBulkDisableLoading(true)
    try {
      await Promise.all(ids.map((id) => updateClassroomStatus(id, 'INACTIVE')))
      toast.success(
        ids.length > 1 ? `${ids.length} classrooms disabled` : 'Classroom disabled',
      )
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to disable selected classrooms'))
      await refreshClassrooms()
    } finally {
      setBulkDisableLoading(false)
    }
  }, [selectedIds, classroomsById, refreshClassrooms])

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
        disableCount={disableableCount}
        onClearSelection={clearSelection}
        onDisable={handleBulkDisable}
        onDelete={() => setDeleteTarget({ ids: [...selectedIds], name: null })}
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
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80">
          <PaginatedFigmaTable
            data={filteredClassrooms}
            columns={columns}
            itemLabel="classrooms"
            controlledPagination={controlledPagination}
            density="comfortable"
            loading={bulkDisableLoading}
            selection={selection}
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

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.ids?.length > 1 ? 'Delete selected classrooms?' : 'Delete Classroom?'}
        message={deleteMessage}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
      />
    </div>
  )
}
