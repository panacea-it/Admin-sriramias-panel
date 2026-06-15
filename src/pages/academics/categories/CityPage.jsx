import { useCallback, useEffect, useMemo, useState } from 'react'
import { PlusCircle } from 'lucide-react'
import CategoryPageHeader from '../../../components/categories/CategoryPageHeader'
import CategoryFilterBar from '../../../components/categories/CategoryFilterBar'
import ProgramsBulkActionsBar from '../../../components/categories/ProgramsBulkActionsBar'
import CategoryEmptyState from '../../../components/categories/CategoryEmptyState'
import CityTable, { buildCityTableColumns } from '../../../components/cities/CityTable'
import AddCityModal from '../../../components/cities/AddCityModal'
import ViewCityModal from '../../../components/cities/ViewCityModal'
import ConfirmCityStatusModal from '../../../components/cities/ConfirmCityStatusModal'
import ConfirmDeleteDialog from '../../../components/subjects/ConfirmDeleteDialog'
import MasterBulkConfirmModal from '../../../components/categories/MasterBulkConfirmModal'
import { useCityManagement } from '../../../hooks/useCityManagement'
import { useCentersDropdownOptions } from '../../../hooks/useCentersDropdownOptions'
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
  buildCreateCityPayload,
  buildUpdateCityPayload,
  mapApiCityToLocal,
  mergeCityWithSource,
} from '../../../utils/cityApiHelpers'
import { setCachedCityCode } from '../../../utils/cityCodeCache'
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

function AddCityButton({ onClick, disabled, children }) {
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
    patchCityLocally,
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
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkConfirm, setBulkConfirm] = useState(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const centerOptions = useMemo(
    () => [{ value: 'all', label: 'Center' }, ...centreDropdownOptions],
    [centreDropdownOptions],
  )

  const citiesById = useMemo(
    () => new Map(cities.map((row) => [String(row.id), row])),
    [cities],
  )

  const disableableCount = useMemo(
    () => countDisableableSelected(selectedIds, citiesById),
    [selectedIds, citiesById],
  )

  const enableableCount = useMemo(
    () => countEnableableSelected(selectedIds, citiesById),
    [selectedIds, citiesById],
  )

  const openCreate = useCallback(() => {
    setEditRow(null)
    setEditDetail(null)
    setModalOpen(true)
  }, [])

  const loadCityDetail = useCallback(async (row) => {
    const data = await getCityById(row.id)
    const mapped = mapApiCityToLocal(data)
    return mergeCityWithSource(row, mapped || row)
  }, [])

  const handleView = useCallback(
    async (row) => {
      setViewRow(row)
      setViewLoading(true)
      try {
        const detail = await loadCityDetail(row)
        setViewRow(detail)
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
        setEditDetail(detail)
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
    const normalizedCode = String(form.code || '')
      .trim()
      .toUpperCase()

    if (isEdit) {
      setUpdateLoading(true)
    } else {
      setCreateLoading(true)
    }

    try {
      if (isEdit) {
        await updateCity(editRow.id, buildUpdateCityPayload(form))
        setCachedCityCode(editRow.id, normalizedCode, {
          centerId: form.centerId || editRow.centerId,
          placeName: form.placeName,
        })
        patchCityLocally(editRow.id, { code: normalizedCode, cityCode: normalizedCode })
        toast.success('City updated')
      } else {
        const data = await createCity(buildCreateCityPayload(form))
        const created = mapApiCityToLocal(data)
        setCachedCityCode(created?.id || '', normalizedCode, {
          centerId: form.centerId,
          placeName: form.placeName,
        })
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

  const handleDelete = useCallback((row) => {
    setDeleteTarget({ ids: [row.id], name: row.placeName })
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return
    const ids = deleteTarget.ids ?? (deleteTarget.id ? [deleteTarget.id] : [])
    if (!ids.length) return

    setDeleteLoading(true)
    try {
      await Promise.all(ids.map((id) => deleteCity(id)))
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)))
      setDeleteTarget(null)
      toast.success(ids.length > 1 ? `${ids.length} cities deleted` : 'City deleted')
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
    setBulkConfirm({ type: 'delete' })
  }, [selectedIds.length])

  const confirmBulkAction = useCallback(async () => {
    if (!bulkConfirm) return
    setBulkActionLoading(true)

    try {
      if (bulkConfirm.type === 'enable') {
        const ids = filterEnableableIds(selectedIds, citiesById)
        await bulkUpdateMasterStatus('cities', ids, 'ACTIVE', {
          updateSingle: updateCityStatus,
        })
        setSelectedIds([])
        toast.success(MASTER_BULK_TOAST.enabled, { duration: TOAST_DURATION.short })
        await refreshCities()
      } else if (bulkConfirm.type === 'disable') {
        const ids = filterDisableableIds(selectedIds, citiesById)
        await bulkUpdateMasterStatus('cities', ids, 'INACTIVE', {
          updateSingle: updateCityStatus,
        })
        setSelectedIds([])
        toast.success(MASTER_BULK_TOAST.disabled, { duration: TOAST_DURATION.short })
        await refreshCities()
      } else if (bulkConfirm.type === 'delete') {
        const ids = [...selectedIds]
        await Promise.all(ids.map((id) => deleteCity(id)))
        setSelectedIds([])
        toast.success(MASTER_BULK_TOAST.deleted, { duration: TOAST_DURATION.short })
        await refreshCities()
      }
      setBulkConfirm(null)
    } catch (error) {
      toast.error(
        bulkConfirm.type === 'delete'
          ? getApiErrorMessage(error, 'Failed to delete selected cities')
          : getMasterBulkErrorMessage(error, bulkConfirm.type),
      )
      await refreshCities()
    } finally {
      setBulkActionLoading(false)
    }
  }, [bulkConfirm, selectedIds, citiesById, refreshCities])

  const handleToggle = useCallback((row) => {
    setStatusTarget(row)
  }, [])

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

  const toggleSelectPage = useCallback((pageIds, select) => {
    setSelectedIds((prev) => {
      if (!select) return prev.filter((id) => !pageIds.includes(id))
      const merged = new Set([...prev, ...pageIds])
      return [...merged]
    })
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

  const deleteMessage =
    deleteTarget?.ids?.length > 1
      ? `Delete ${deleteTarget.ids.length} selected cities? This cannot be undone.`
      : 'This action cannot be undone.'

  return (
    <div className="space-y-5 sm:space-y-6">
      <CategoryPageHeader title="City">
        <AddCityButton onClick={openCreate} disabled={tableLoading}>
          Add City
        </AddCityButton>
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

      <ProgramsBulkActionsBar
        count={selectedIds.length}
        enableCount={enableableCount}
        disableCount={disableableCount}
        onClearSelection={() => setSelectedIds([])}
        onEnable={handleBulkEnableRequest}
        onDisable={handleBulkDisableRequest}
        onDelete={handleBulkDeleteRequest}
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
          onCta={openCreate}
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
        <CityTable
          cities={cities}
          columns={columns}
          loading={tableLoading || bulkActionLoading}
          controlledPagination={controlledPagination}
          resetDeps={[search, statusFilter, centerFilter]}
          selection={{
            selectedIds,
            onToggle: toggleSelect,
            onTogglePage: toggleSelectPage,
          }}
        />
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
        title={deleteTarget?.ids?.length > 1 ? 'Delete selected cities?' : 'Delete City?'}
        message={deleteMessage}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
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
