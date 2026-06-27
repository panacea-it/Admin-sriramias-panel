import { useCallback, useEffect, useMemo, useState } from 'react'
import { PlusCircle, RefreshCw } from 'lucide-react'
import CategoryPageHeader from '../../../components/categories/CategoryPageHeader'
import CategoryFilterBar from '../../../components/categories/CategoryFilterBar'
import CategoryEmptyState from '../../../components/categories/CategoryEmptyState'
import CityTable, { buildCityTableColumns } from '../../../components/cities/CityTable'
import AddCityModal from '../../../components/cities/AddCityModal'
import ViewCityModal from '../../../components/cities/ViewCityModal'
import ConfirmCityStatusModal from '../../../components/cities/ConfirmCityStatusModal'
import CategoryTableLoadingShell from '../../../components/categories/CategoryTableLoadingShell'
import ConfirmDeleteDialog from '../../../components/subjects/ConfirmDeleteDialog'
import ErrorState from '../../../components/feedback/ErrorState'
import { useCityManagement } from '../../../hooks/useCityManagement'
import { useCentersDropdownOptions } from '../../../hooks/useCentersDropdownOptions'
import { useCity, useCreateCity, useUpdateCity, useDeleteCity, useUpdateCityStatus } from '../../../hooks/useCities'
import { getApiErrorMessage } from '../../../utils/apiError'
import { toast } from '../../../utils/toast'
import {
  buildCreateCityPayload,
  buildUpdateCityPayload,
  mapApiCityToLocal,
  mapUiCityStatusToApi,
} from '../../../utils/cityApiHelpers'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Status' },
  { value: 'Active', label: 'Active' },
  { value: 'In Active', label: 'Inactive' },
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

export default function CityPage() {
  const {
    cities,
    loading: tableLoading,
    isFetching,
    listError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    centerFilter,
    setCenterFilter,
    sortBy,
    sortOrder,
    handleSort,
    controlledPagination,
    refreshCities,
  } = useCityManagement()

  const { options: centreDropdownOptions } = useCentersDropdownOptions()
  const createMutation = useCreateCity()
  const updateMutation = useUpdateCity()
  const deleteMutation = useDeleteCity()
  const statusMutation = useUpdateCityStatus()

  const [modalOpen, setModalOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [editId, setEditId] = useState(null)
  const [viewId, setViewId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)

  const centerOptions = useMemo(
    () => [{ value: 'all', label: 'Center' }, ...centreDropdownOptions],
    [centreDropdownOptions],
  )

  const { data: viewQuery, isLoading: viewLoading } = useCity(viewId, {
    enabled: Boolean(viewId),
  })
  const viewRow = useMemo(() => {
    if (!viewId) return null
    return mapApiCityToLocal(viewQuery) || null
  }, [viewId, viewQuery])

  const { data: editQuery, isLoading: editDetailLoading } = useCity(editId, {
    enabled: Boolean(editId) && modalOpen,
  })
  const editDetail = useMemo(() => {
    if (!editId) return editRow
    return mapApiCityToLocal(editQuery) || editRow
  }, [editId, editQuery, editRow])

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
          payload: buildUpdateCityPayload(form),
        })
        if (result?.success) {
          toast.success(result.message || 'City updated successfully')
        }
      } else {
        const result = await createMutation.mutateAsync(buildCreateCityPayload(form))
        if (result?.success && result?.data?._id) {
          toast.success(result.message || 'City created successfully')
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
    setDeleteTarget({ ids: [row.id], name: row.cityAddress || row.placeName })
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return
    const ids = deleteTarget.ids ?? (deleteTarget.id ? [deleteTarget.id] : [])
    if (!ids.length) return

    try {
      for (const id of ids) {
        await deleteMutation.mutateAsync(id)
      }
      toast.success('City deleted successfully')
      setDeleteTarget(null)
    } catch {
      // useDeleteCity handles error toast
    }
  }, [deleteTarget, deleteMutation])

  const confirmStatusChange = useCallback(async () => {
    if (!statusTarget) return
    const activating = statusTarget.status !== 'Active'
    const nextApiStatus = mapUiCityStatusToApi(activating ? 'Active' : 'In Active')

    try {
      const result = await statusMutation.mutateAsync({
        id: statusTarget.id,
        status: nextApiStatus,
      })
      toast.success(result?.message || (activating ? 'City activated' : 'City deactivated'))
      setStatusTarget(null)
    } catch {
      // useUpdateCityStatus handles error toast
    }
  }, [statusTarget, statusMutation])

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
        sortBy,
        sortOrder,
        onSort: handleSort,
      }),
    [handleView, handleEdit, handleToggle, handleDelete, sortBy, sortOrder, handleSort],
  )

  const showEmpty =
    !tableLoading &&
    !listError &&
    cities.length === 0 &&
    !search &&
    statusFilter === 'all' &&
    centerFilter === 'all'
  const showNoResults = !tableLoading && !listError && cities.length === 0 && !showEmpty

  const saving = createMutation.isPending || updateMutation.isPending

  const deleteMessage = `Are you sure you want to delete "${deleteTarget?.name || 'this city'}"? This cannot be undone.`

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setCenterFilter('all')
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <CategoryPageHeader title="City">
        <div className="flex flex-wrap items-center gap-2">
          <RefreshButton
            onClick={() => refreshCities()}
            disabled={tableLoading || isFetching}
            fetching={isFetching}
          />
          <AddCityButton onClick={openCreate} disabled={tableLoading}>
            Add City
          </AddCityButton>
        </div>
      </CategoryPageHeader>

      <CategoryFilterBar
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        searchPlaceholder="Search by address or center..."
        status={statusFilter}
        onStatusChange={(e) => setStatusFilter(e.target.value)}
        statusOptions={STATUS_OPTIONS}
        centerFilter={centerFilter}
        onCenterFilterChange={(e) => setCenterFilter(e.target.value)}
        centerOptions={centerOptions}
      />

      {tableLoading ? (
        <CategoryTableLoadingShell />
      ) : listError ? (
        <ErrorState
          message={getApiErrorMessage(listError, 'Failed to load cities')}
          onRetry={() => refreshCities()}
        />
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
          onCta={clearFilters}
        />
      ) : (
        <CityTable
          cities={cities}
          columns={columns}
          loading={tableLoading || isFetching}
          controlledPagination={controlledPagination}
          resetDeps={[search, statusFilter, centerFilter, sortBy, sortOrder]}
        />
      )}

      <AddCityModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditRow(null)
          setEditId(null)
        }}
        city={editDetail}
        loading={editDetailLoading}
        onSave={handleSave}
        saving={saving}
      />

      <ViewCityModal
        open={Boolean(viewId)}
        onClose={() => setViewId(null)}
        city={viewRow}
        loading={viewLoading}
      />

      <ConfirmCityStatusModal
        open={Boolean(statusTarget)}
        activating={statusTarget?.status !== 'Active'}
        loading={statusMutation.isPending}
        onCancel={() => setStatusTarget(null)}
        onConfirm={confirmStatusChange}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete city?"
        message={deleteMessage}
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => !deleteMutation.isPending && setDeleteTarget(null)}
      />
    </div>
  )
}
