import { useCallback, useMemo, useState } from 'react'
import { LayoutGrid } from 'lucide-react'
import { toast } from '@/utils/toast'
import ErrorState from '../../components/feedback/ErrorState'
import PageBanner from '../../components/figma/PageBanner'
import CategoryBreadcrumb from '../../components/categories/CategoryBreadcrumb'
import { BannerButton } from '../../components/academics/AcademicsUi'
import AdminRoleFormModal from '../../components/admin-management/roles/AdminRoleFormModal'
import AdminRoleViewModal from '../../components/admin-management/roles/AdminRoleViewModal'
import ConfirmRoleStatusModal from '../../components/admin-management/roles/ConfirmRoleStatusModal'
import ConfirmRoleDeleteModal from '../../components/admin-management/roles/ConfirmRoleDeleteModal'
import RoleBulkActionsBar from '../../components/admin-management/roles/RoleBulkActionsBar'
import RoleManagementTable from '../../components/admin-management/roles/RoleManagementTable'
import RoleTableActions from '../../components/admin-management/roles/RoleTableActions'
import RoleAccessFilterToolbar from '../../components/role-access/RoleAccessFilterToolbar'
import { useRoleAccessManagement } from '../../hooks/useRoleAccessManagement'
import { useApiRolesCatalogSync, syncApiRolesCatalog } from '../../hooks/useApiRolesCatalogSync'
import { useTableRowSelection } from '../../hooks/useTableRowSelection'
import { useAdminRolesSafe } from '../../contexts/AdminRolesContext'
import { useUpdateRoleAccessStatus } from '../../hooks/roleAccess/useUpdateRoleAccess'
import { useDeleteRoleAccess } from '../../hooks/roleAccess/useDeleteRoleAccess'
import { getApiErrorMessage } from '../../utils/apiError'

const BREADCRUMB = [
  { label: 'Admin Management' },
  { label: 'Role Access' },
]

export default function RoleAccessPage() {
  useApiRolesCatalogSync()
  const adminRoles = useAdminRolesSafe()

  const {
    roles,
    loading,
    fetching,
    loadError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortPreset,
    setSortPreset,
    sortBy,
    sortOrder,
    handleSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    refreshRoles,
  } = useRoleAccessManagement()

  const statusMutation = useUpdateRoleAccessStatus()
  const deleteMutation = useDeleteRoleAccess()

  const { selectedIds, selection, clearSelection } = useTableRowSelection((row) => row.id)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewingId, setViewingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [bulkDeleteIds, setBulkDeleteIds] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [bulkDisableIds, setBulkDisableIds] = useState(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState(null)

  const controlledPagination = useMemo(
    () => ({
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems: pagination.totalItems,
      totalPages: pagination.totalPages,
      startIndex: pagination.startIndex,
      endIndex: pagination.endIndex,
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
    }),
    [pagination, setPage, setPageSize],
  )

  const selectedRoles = useMemo(
    () => roles.filter((role) => selectedIds.includes(role.id)),
    [roles, selectedIds],
  )

  const bulkDisableCount = useMemo(
    () => selectedRoles.filter((role) => role.enabled).length,
    [selectedRoles],
  )

  const bulkDeleteCount = useMemo(() => selectedRoles.length, [selectedRoles])

  const refreshRolesAndCatalog = useCallback(async () => {
    await refreshRoles()
    await syncApiRolesCatalog(adminRoles?.mergeApiRoles)
  }, [refreshRoles, adminRoles?.mergeApiRoles])

  const openCreate = useCallback(() => {
    setEditing(null)
    setFormOpen(true)
  }, [])

  const openEdit = useCallback((role) => {
    setEditing(role)
    setFormOpen(true)
  }, [])

  const handleCloseForm = useCallback(() => {
    setFormOpen(false)
    setEditing(null)
  }, [])

  const handleStatusToggleRequest = useCallback((row) => {
    if (statusUpdatingId || statusMutation.isPending) return
    setStatusTarget(row)
  }, [statusUpdatingId, statusMutation.isPending])

  const confirmStatusChange = useCallback(async () => {
    if (!statusTarget) return

    const enabling = statusTarget.status === 'INACTIVE'
    const nextStatus = enabling ? 'ACTIVE' : 'INACTIVE'
    const roleId = statusTarget.id

    setStatusUpdatingId(roleId)
    try {
      await statusMutation.mutateAsync({ id: roleId, status: nextStatus })
      toast.success(enabling ? 'Role activated' : 'Role deactivated')
      setStatusTarget(null)
      await refreshRolesAndCatalog()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(getApiErrorMessage(error, 'Failed to update role status'))
    } finally {
      setStatusUpdatingId(null)
    }
  }, [statusTarget, statusMutation, refreshRolesAndCatalog])

  const confirmBulkDisable = useCallback(async () => {
    if (!bulkDisableIds?.length) return

    const targets = roles.filter(
      (role) => bulkDisableIds.includes(role.id) && role.enabled,
    )

    if (!targets.length) {
      setBulkDisableIds(null)
      return
    }

    let successCount = 0
    let failCount = 0

    for (const role of targets) {
      setStatusUpdatingId(role.id)
      try {
        await statusMutation.mutateAsync({ id: role.id, status: 'INACTIVE' })
        successCount += 1
      } catch (error) {
        failCount += 1
        if (import.meta.env.DEV) {
          console.error(error)
        }
      } finally {
        setStatusUpdatingId(null)
      }
    }

    if (successCount > 0) {
      toast.success(successCount === 1 ? 'Role deactivated' : `${successCount} roles deactivated`)
    }
    if (failCount > 0) {
      toast.error(
        failCount === 1
          ? 'Failed to deactivate 1 role'
          : `Failed to deactivate ${failCount} roles`,
      )
    }

    setBulkDisableIds(null)
    clearSelection()
    await refreshRolesAndCatalog()
  }, [bulkDisableIds, roles, statusMutation, clearSelection, refreshRolesAndCatalog])

  const confirmDelete = useCallback(async () => {
    if (bulkDeleteIds?.length) {
      const targets = roles.filter((role) => bulkDeleteIds.includes(role.id))

      if (!targets.length) {
        setBulkDeleteIds(null)
        return
      }

      let successCount = 0
      let failCount = 0

      for (const role of targets) {
        try {
          await deleteMutation.mutateAsync(role.id)
          successCount += 1
        } catch (error) {
          failCount += 1
          if (import.meta.env.DEV) {
            console.error(error)
          }
        }
      }

      if (successCount > 0) {
        toast.success(successCount === 1 ? 'Role deleted' : `${successCount} roles deleted`)
      }
      if (failCount > 0) {
        toast.error(
          failCount === 1 ? 'Unable to delete 1 role' : `Unable to delete ${failCount} roles`,
        )
      }

      setBulkDeleteIds(null)
      clearSelection()
      await refreshRolesAndCatalog()
      return
    }

    if (!deleteTarget) return

    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success('Role deleted')
      setDeleteTarget(null)
      await refreshRolesAndCatalog()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(getApiErrorMessage(error, 'Unable to delete role'))
    }
  }, [bulkDeleteIds, roles, deleteTarget, deleteMutation, clearSelection, refreshRolesAndCatalog])

  const renderRowActions = useCallback(
    (row) => (
      <RoleTableActions
        row={row}
        onView={() => setViewingId(row.id)}
        onEdit={() => openEdit(row)}
        onStatusToggle={() => handleStatusToggleRequest(row)}
        onDelete={() => setDeleteTarget(row)}
      />
    ),
    [openEdit, handleStatusToggleRequest],
  )

  const emptyMessage = useMemo(() => {
    if (loading) return null
    if (loadError) return 'Unable to load roles.'
    if (search.trim() || statusFilter !== 'all') {
      return 'No roles match your filters.'
    }
    return 'No roles found. Create your first role access to get started.'
  }, [loading, loadError, search, statusFilter])

  const emptyState = loadError ? (
    <div className="px-4 py-6 sm:px-6">
      <ErrorState
        title="Unable to load roles"
        message={loadError}
        onRetry={refreshRolesAndCatalog}
      />
    </div>
  ) : undefined

  const handleBulkDisable = useCallback(() => {
    const ids = selectedRoles.filter((role) => role.enabled).map((role) => role.id)
    if (ids.length) setBulkDisableIds(ids)
  }, [selectedRoles])

  const handleBulkDelete = useCallback(() => {
    const ids = selectedRoles.map((role) => role.id)
    if (ids.length) setBulkDeleteIds(ids)
  }, [selectedRoles])

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-10 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <CategoryBreadcrumb items={BREADCRUMB} />

        <PageBanner
          icon={LayoutGrid}
          iconClassName="text-[#246392]"
          title="Role Access"
          className="from-[#55ace7] via-[#8b98bb] to-[#df8284]"
        >
          <BannerButton onClick={openCreate}>Create Role Access</BannerButton>
        </PageBanner>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
          <RoleAccessFilterToolbar
            search={search}
            onSearchChange={(e) => setSearch(e.target.value)}
            statusFilter={statusFilter}
            onStatusFilterChange={(e) => setStatusFilter(e.target.value)}
            sortPreset={sortPreset}
            onSortPresetChange={(e) => setSortPreset(e.target.value)}
            disabled={loading && roles.length === 0}
          />

          {selectedIds.length > 0 && (
            <RoleBulkActionsBar
              className="mt-4"
              count={selectedIds.length}
              disableCount={bulkDisableCount}
              deleteCount={bulkDeleteCount}
              onDisable={handleBulkDisable}
              onDelete={handleBulkDelete}
            />
          )}

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
            <RoleManagementTable
              roles={roles}
              loading={loading || fetching}
              controlledPagination={controlledPagination}
              selection={selection}
              resetDeps={[search, statusFilter, sortPreset]}
              emptyMessage={emptyMessage}
              emptyState={emptyState}
              paginationStartIndex={pagination.startIndex}
              statusUpdatingId={statusUpdatingId}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              renderActions={renderRowActions}
            />
          </div>
        </div>
      </section>

      <AdminRoleFormModal
        open={formOpen}
        initialRole={editing}
        onClose={handleCloseForm}
        onSuccess={refreshRolesAndCatalog}
      />
      <AdminRoleViewModal
        open={!!viewingId}
        roleId={viewingId}
        onClose={() => setViewingId(null)}
      />

      <ConfirmRoleStatusModal
        open={!!statusTarget || !!bulkDisableIds?.length}
        roleLabel={statusTarget?.label || 'this role'}
        bulkCount={bulkDisableIds?.length || 0}
        enabling={bulkDisableIds?.length ? false : statusTarget?.status === 'INACTIVE'}
        loading={statusMutation.isPending}
        onCancel={() => {
          if (!statusMutation.isPending) {
            setStatusTarget(null)
            setBulkDisableIds(null)
          }
        }}
        onConfirm={bulkDisableIds?.length ? confirmBulkDisable : confirmStatusChange}
      />

      <ConfirmRoleDeleteModal
        open={!!deleteTarget || !!bulkDeleteIds?.length}
        roleLabel={deleteTarget?.label || 'this role'}
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
    </div>
  )
}
