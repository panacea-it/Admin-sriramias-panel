import { useCallback, useEffect, useMemo, useState } from 'react'
import { DoorOpen, PlusCircle } from 'lucide-react'
import CategoryPageHeader from '../../../components/categories/CategoryPageHeader'
import CategoryFilterBar from '../../../components/categories/CategoryFilterBar'
import CategoryEmptyState from '../../../components/categories/CategoryEmptyState'
import PaginatedFigmaTable from '../../../components/figma/PaginatedFigmaTable'
import ClassroomFormModal from '../../../components/classrooms/ClassroomFormModal'
import ViewClassroomModal from '../../../components/classrooms/ViewClassroomModal'
import ConfirmClassroomStatusModal from '../../../components/classrooms/ConfirmClassroomStatusModal'
import ConfirmDeleteDialog from '../../../components/subjects/ConfirmDeleteDialog'
import { buildClassroomTableColumns } from '../../../components/classrooms/ClassroomTable'
import { useClassroomManagement } from '../../../hooks/useClassroomManagement'
import { useCentersDropdownOptions } from '../../../hooks/useCentersDropdownOptions'
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

  const centerOptions = useMemo(
    () => [{ value: 'all', label: 'Center' }, ...centreDropdownOptions],
    [centreDropdownOptions],
  )

  const loadClassroomDetail = useCallback(async (row) => {
    const data = await getClassroomById(row.id)
    return mapApiClassroomToLocal(data) || row
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
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteClassroom(deleteTarget.id)
      toast.success('Classroom deleted')
      setDeleteTarget(null)
      await refreshClassrooms()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete classroom'))
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, refreshClassrooms])

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

  const handleDelete = useCallback((row) => {
    setDeleteTarget(row)
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

  const showEmpty =
    !tableLoading &&
    classrooms.length === 0 &&
    !search &&
    statusFilter === 'all' &&
    centerFilter === 'all'
  const showNoResults = !tableLoading && classrooms.length === 0 && !showEmpty

  const saving = createLoading || updateLoading

  return (
    <div className="space-y-5 sm:space-y-6">
      <CategoryPageHeader icon={DoorOpen} hideTitle>
        <button
          type="button"
          onClick={() => {
            setEditRow(null)
            setEditDetail(null)
            setModalOpen(true)
          }}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-4 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:scale-[1.02]"
        >
          <PlusCircle className="h-4 w-4" />
          Add Classroom
        </button>
      </CategoryPageHeader>

      <CategoryFilterBar
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        searchPlaceholder="Search classrooms..."
        status={statusFilter}
        onStatusChange={(e) => setStatusFilter(e.target.value)}
        statusOptions={STATUS_OPTIONS}
        centerFilter={centerFilter}
        onCenterFilterChange={(e) => setCenterFilter(e.target.value)}
        centerOptions={centerOptions}
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
          ctaLabel="Add Classroom"
          onCta={() => {
            setEditRow(null)
            setEditDetail(null)
            setModalOpen(true)
          }}
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
          }}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80">
          <PaginatedFigmaTable
            data={classrooms}
            columns={columns}
            itemLabel="classrooms"
            controlledPagination={controlledPagination}
            density="comfortable"
            tableClassName="min-w-[1080px]"
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
        title="Delete Classroom?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
      />
    </div>
  )
}
