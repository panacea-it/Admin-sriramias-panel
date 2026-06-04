import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapPin, PlusCircle } from 'lucide-react'
import CategoryPageHeader from '../../../components/categories/CategoryPageHeader'
import CategoryFilterBar from '../../../components/categories/CategoryFilterBar'
import CategoryEmptyState from '../../../components/categories/CategoryEmptyState'
import PaginatedFigmaTable from '../../../components/figma/PaginatedFigmaTable'
import AddCityModal from '../../../components/cities/AddCityModal'
import ViewCityModal from '../../../components/cities/ViewCityModal'
import ConfirmCityStatusModal from '../../../components/cities/ConfirmCityStatusModal'
import ConfirmDeleteDialog from '../../../components/subjects/ConfirmDeleteDialog'
import { buildCityTableColumns } from '../../../components/cities/CityTable'
import { useCityManagement } from '../../../hooks/useCityManagement'
import { useCentersDropdownOptions } from '../../../hooks/useCentersDropdownOptions'
import { getApiErrorMessage } from '../../../utils/apiError'
import { toast } from '../../../utils/toast'
import {
  buildCreateCityPayload,
  buildUpdateCityPayload,
  mapApiCityToLocal,
} from '../../../utils/cityApiHelpers'
import {
  createCity,
  deleteCity,
  getCityById,
  updateCity,
  updateCityStatus,
} from '../../../services/cityService'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
]

export default function CityPage() {
  const {
    cities,
    loading: tableLoading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    centerFilter,
    setCenterFilter,
    controlledPagination,
    refreshCities,
  } = useCityManagement()

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

  const loadCityDetail = useCallback(async (row) => {
    const data = await getCityById(row.id)
    return mapApiCityToLocal(data) || row
  }, [])

  const handleView = useCallback(
    async (row) => {
      setViewRow(row)
      setViewLoading(true)
      try {
        const detail = await loadCityDetail(row)
        if (detail) setViewRow(detail)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load city details'))
        setViewRow(null)
      } finally {
        setViewLoading(false)
      }
    },
    [loadCityDetail],
  )

  const handleEdit = useCallback(
    async (row) => {
      setEditRow(row)
      setEditDetail(row)
      setEditDetailLoading(true)
      setModalOpen(true)
      try {
        const detail = await loadCityDetail(row)
        setEditDetail(detail || row)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load city for editing'))
        setModalOpen(false)
        setEditRow(null)
        setEditDetail(null)
      } finally {
        setEditDetailLoading(false)
      }
    },
    [loadCityDetail],
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
        await updateCity(editRow.id, buildUpdateCityPayload(form))
        toast.success('City updated')
      } else {
        await createCity(buildCreateCityPayload(form))
        toast.success('City added successfully')
      }
      setModalOpen(false)
      setEditRow(null)
      setEditDetail(null)
      await refreshCities()
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, isEdit ? 'Failed to update city' : 'Failed to create city'),
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
      await deleteCity(deleteTarget.id)
      toast.success('City deleted')
      setDeleteTarget(null)
      await refreshCities()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete city'))
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, refreshCities])

  const confirmStatusChange = useCallback(async () => {
    if (!statusTarget) return
    const activating = statusTarget.status !== 'Active'
    const nextApiStatus = activating ? 'ACTIVE' : 'INACTIVE'

    setStatusLoading(true)
    try {
      await updateCityStatus(statusTarget.id, nextApiStatus)
      toast.success(activating ? 'City activated' : 'City deactivated')
      setStatusTarget(null)
      await refreshCities()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update city status'))
    } finally {
      setStatusLoading(false)
    }
  }, [statusTarget, refreshCities])

  const handleDelete = useCallback((row) => {
    setDeleteTarget(row)
  }, [])

  const handleToggle = useCallback((row) => {
    setStatusTarget(row)
  }, [])

  const columns = useMemo(
    () =>
      buildCityTableColumns({
        onView: handleView,
        onEdit: handleEdit,
        onToggle: handleToggle,
        onDelete: handleDelete,
      }),
    [handleView, handleEdit, handleToggle, handleDelete],
  )

  const showEmpty =
    !tableLoading &&
    cities.length === 0 &&
    !search &&
    statusFilter === 'all' &&
    centerFilter === 'all'
  const showNoResults = !tableLoading && cities.length === 0 && !showEmpty

  const saving = createLoading || updateLoading

  return (
    <div className="space-y-5 sm:space-y-6">
      <CategoryPageHeader icon={MapPin} hideTitle>
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
          Add City
        </button>
      </CategoryPageHeader>

      <CategoryFilterBar
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        searchPlaceholder="Search city..."
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
          title="No Cities Found"
          description="Add cities and branch places linked to your centres before assigning classrooms."
          ctaLabel="Add City"
          onCta={() => {
            setEditRow(null)
            setEditDetail(null)
            setModalOpen(true)
          }}
        />
      ) : showNoResults ? (
        <CategoryEmptyState
          title="No matching cities"
          description="Try clearing search or filters to see all cities."
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
            data={cities}
            columns={columns}
            itemLabel="cities"
            controlledPagination={controlledPagination}
            tableClassName="min-w-[720px]"
          />
        </div>
      )}

      <AddCityModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditRow(null)
          setEditDetail(null)
        }}
        city={editDetail}
        loading={editDetailLoading}
        onSave={handleSave}
        saving={saving}
      />

      <ViewCityModal
        open={Boolean(viewRow)}
        onClose={() => setViewRow(null)}
        city={viewRow}
        loading={viewLoading}
      />

      <ConfirmCityStatusModal
        open={Boolean(statusTarget)}
        activating={statusTarget?.status !== 'Active'}
        loading={statusLoading}
        onCancel={() => setStatusTarget(null)}
        onConfirm={confirmStatusChange}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete City?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
      />
    </div>
  )
}
