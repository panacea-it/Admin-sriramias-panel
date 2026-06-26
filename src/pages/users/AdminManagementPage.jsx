import { useCallback, useMemo, useState } from 'react'
import { Plus, Shield } from 'lucide-react'
import { getApiErrorMessage } from '../../utils/apiError'
import { handleApiError } from '../../utils/errorHandler'
import { isRecordStatusActive } from '../../constants/recordStatus'
import ErrorState from '../../components/feedback/ErrorState'
import PageBanner from '../../components/figma/PageBanner'
import CreateAdminModal from '../../components/admin-management/CreateAdminModal'
import ViewAdminDrawer from '../../components/admin-management/ViewAdminDrawer'
import ConfirmAdminDeleteModal from '../../components/admin-management/ConfirmAdminDeleteModal'
import ConfirmAdminStatusModal from '../../components/admin-management/ConfirmAdminStatusModal'
import AdminBulkActionsBar from '../../components/admin-management/AdminBulkActionsBar'
import AdminManagementTable from '../../components/admin-management/AdminManagementTable'
import AdminTableActions from '../../components/admin-management/AdminTableActions'
import AdminManagementFilterToolbar from '../../components/admin-management/AdminManagementFilterToolbar'
import { useAdminsManagement } from '../../hooks/useAdminsManagement'
import { useQuery } from '@tanstack/react-query'
import adminManagementService from '../../services/adminManagementService'
import { adminKeys } from '../../hooks/admin/adminKeys'
import { mapCentersDropdownResponse } from '../../utils/adminManagementHelpers'
import { useTableRowSelection } from '../../hooks/useTableRowSelection'
import { useDeleteAdmin } from '../../hooks/admin/useDeleteAdmin'
import { useAdminStatus } from '../../hooks/admin/useAdminStatus'

export default function AdminManagementPage() {
  const {
    users,
    loading,
    loadError,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    centerFilter,
    setCenterFilter,
    statusFilter,
    setStatusFilter,
    sortPreset,
    setSortPreset,
    roleFilterOptions,
    pagination,
    refreshUsers,
  } = useAdminsManagement()

  const {
    data: centersData,
    error: centersDropdownError,
    refetch: refreshCentersDropdown,
  } = useQuery({
    queryKey: adminKeys.centersDropdown(),
    queryFn: () => adminManagementService.getCentersDropdown(),
    staleTime: 5 * 60 * 1000,
  })

  const centerDropdownOptions = useMemo(
    () => mapCentersDropdownResponse(centersData),
    [centersData],
  )

  const deleteMutation = useDeleteAdmin()
  const statusMutation = useAdminStatus()

  const { selectedIds, selection, clearSelection } = useTableRowSelection((row) => row.id)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [viewingId, setViewingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [bulkDeleteIds, setBulkDeleteIds] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [bulkDisableIds, setBulkDisableIds] = useState(null)

  const selectedActiveCount = useMemo(
    () => users.filter((u) => selectedIds.includes(u.id) && isRecordStatusActive(u.status)).length,
    [users, selectedIds],
  )

  const openCreate = () => {
    setEditingId(null)
    setCreateModalOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setCreateModalOpen(true)
  }

  const handleCloseModal = () => {
    setCreateModalOpen(false)
    setEditingId(null)
  }

  const confirmDelete = async () => {
    if (bulkDeleteIds?.length) {
      let successCount = 0
      let failCount = 0

      for (const id of bulkDeleteIds) {
        try {
          await deleteMutation.mutateAsync(id)
          successCount += 1
        } catch (error) {
          failCount += 1
          if (import.meta.env.DEV) {
            console.error(error)
          }
        }
      }

      if (failCount > 0) {
        handleApiError(new Error('Some deletions failed'), {
          fallback: `Failed to delete ${failCount} admin account(s)`,
        })
      } else if (successCount > 0) {
        const { toast } = await import('../../utils/toast')
        toast.success(
          successCount === 1
            ? 'Admin account permanently deleted'
            : `${successCount} admin accounts permanently deleted`,
        )
      }

      setBulkDeleteIds(null)
      clearSelection()
      return
    }

    if (!deleteTarget) return

    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      const { toast } = await import('../../utils/toast')
      toast.success('Admin account permanently deleted')
      setDeleteTarget(null)
    } catch (error) {
      handleApiError(error, { fallback: 'Failed to delete admin account' })
    }
  }

  const confirmStatusChange = async () => {
    if (!statusTarget) return
    const enabling = !isRecordStatusActive(statusTarget.status)

    try {
      await statusMutation.mutateAsync({ id: statusTarget.id, status: enabling })
      const { toast } = await import('../../utils/toast')
      toast.success(enabling ? 'Admin account enabled' : 'Admin account disabled')
      setStatusTarget(null)
    } catch (error) {
      handleApiError(error, { fallback: 'Failed to update account status' })
    }
  }

  const confirmBulkDisable = async () => {
    if (!bulkDisableIds?.length) return

    const targets = users.filter(
      (row) => bulkDisableIds.includes(row.id) && isRecordStatusActive(row.status),
    )

    if (!targets.length) {
      setBulkDisableIds(null)
      return
    }

    let successCount = 0
    let failCount = 0

    for (const row of targets) {
      try {
        await statusMutation.mutateAsync({ id: row.id, status: false })
        successCount += 1
      } catch (error) {
        failCount += 1
        if (import.meta.env.DEV) {
          console.error(error)
        }
      }
    }

    const { toast } = await import('../../utils/toast')
    if (successCount > 0) {
      toast.success(successCount === 1 ? 'Account disabled' : `${successCount} accounts disabled`)
    }
    if (failCount > 0) {
      toast.error(
        failCount === 1
          ? 'Failed to disable 1 account'
          : `Failed to disable ${failCount} accounts`,
      )
    }

    setBulkDisableIds(null)
    clearSelection()
  }

  const renderRowActions = useCallback(
    (row) => (
      <AdminTableActions
        row={row}
        onView={() => setViewingId(row.id)}
        onEdit={() => openEdit(row)}
        onStatusToggle={() => setStatusTarget(row)}
        onDelete={() => setDeleteTarget(row)}
      />
    ),
    [],
  )

  const loadErrorMessage = loadError
    ? getApiErrorMessage(loadError, 'Failed to load admin users')
    : null

  const emptyMessage = loadErrorMessage
    ? 'Unable to load admin users.'
    : search.trim() || roleFilter !== 'all' || centerFilter !== 'all' || statusFilter !== 'all'
      ? 'No admins match your filters.'
      : 'No admin accounts found'

  const emptyState = loadErrorMessage ? (
    <div className="px-4 py-6 sm:px-6">
      <ErrorState
        title="Unable to load admin users"
        message={loadErrorMessage}
        onRetry={refreshUsers}
      />
    </div>
  ) : undefined

  const centersDropdownErrorMessage = centersDropdownError
    ? getApiErrorMessage(centersDropdownError, 'Failed to load centers')
    : null

  const filterDropdownWarning = centersDropdownErrorMessage
    ? 'Center filter unavailable'
    : null

  const actionLoading = deleteMutation.isPending || statusMutation.isPending

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-10 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <PageBanner icon={Shield} title="Admin Management">
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:w-auto sm:py-2.5"
          >
            <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            Create User Access
          </button>
        </PageBanner>

        <CreateAdminModal
          open={createModalOpen}
          onClose={handleCloseModal}
          onSuccess={refreshUsers}
          editingId={editingId}
        />

        <ViewAdminDrawer open={!!viewingId} adminAccessId={viewingId} onClose={() => setViewingId(null)} />

        <ConfirmAdminDeleteModal
          open={!!deleteTarget || !!bulkDeleteIds?.length}
          employeeName={deleteTarget?.fullName || deleteTarget?.employeeName}
          bulkCount={bulkDeleteIds?.length || 0}
          loading={deleteMutation.isPending}
          onCancel={() => {
            if (!deleteMutation.isPending) {
              setDeleteTarget(null)
              setBulkDeleteIds(null)
            }
          }}
          onConfirm={confirmDelete}
        />

        <ConfirmAdminStatusModal
          open={!!statusTarget || !!bulkDisableIds?.length}
          employeeName={statusTarget?.fullName || statusTarget?.employeeName}
          bulkCount={bulkDisableIds?.length || 0}
          enabling={bulkDisableIds?.length ? false : !isRecordStatusActive(statusTarget?.status)}
          loading={statusMutation.isPending}
          onCancel={() => {
            if (!statusMutation.isPending) {
              setStatusTarget(null)
              setBulkDisableIds(null)
            }
          }}
          onConfirm={bulkDisableIds?.length ? confirmBulkDisable : confirmStatusChange}
        />

        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
          <AdminManagementFilterToolbar
            search={search}
            onSearchChange={(e) => setSearch(e.target.value)}
            roleFilter={roleFilter}
            onRoleFilterChange={(e) => setRoleFilter(e.target.value)}
            roleOptions={roleFilterOptions}
            centerFilter={centerFilter}
            onCenterFilterChange={(e) => setCenterFilter(e.target.value)}
            centerOptions={centerDropdownOptions}
            statusFilter={statusFilter}
            onStatusFilterChange={(e) => setStatusFilter(e.target.value)}
            sortPreset={sortPreset}
            onSortPresetChange={(e) => setSortPreset(e.target.value)}
            disabled={loading && users.length === 0}
            onRefresh={refreshUsers}
          />

          {filterDropdownWarning && (
            <div
              className="mt-3 flex flex-col gap-2 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
              role="status"
            >
              <p className="font-medium">{filterDropdownWarning}</p>
              <button
                type="button"
                onClick={() => {
                  if (centersDropdownErrorMessage) refreshCentersDropdown()
                }}
                className="shrink-0 self-start rounded-lg border border-amber-300/80 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100/60 sm:self-center"
              >
                Retry filters
              </button>
            </div>
          )}

          {selectedIds.length > 0 && (
            <AdminBulkActionsBar
              className="mt-4"
              count={selectedIds.length}
              disableCount={selectedActiveCount}
              onDisable={() => setBulkDisableIds([...selectedIds])}
              onDelete={() => setBulkDeleteIds([...selectedIds])}
            />
          )}

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
            <AdminManagementTable
              users={users}
              loading={loading || actionLoading}
              controlledPagination={pagination}
              selection={selection}
              resetDeps={[search, roleFilter, centerFilter, statusFilter, sortPreset]}
              emptyMessage={emptyMessage}
              emptyState={emptyState}
              renderActions={renderRowActions}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
