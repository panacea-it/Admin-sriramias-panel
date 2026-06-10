import { useCallback, useMemo, useState } from 'react'
import { LayoutGrid } from 'lucide-react'
import { toast } from '@/utils/toast'
import ErrorState from '../../components/feedback/ErrorState'
import PageBanner from '../../components/figma/PageBanner'
import CategoryBreadcrumb from '../../components/categories/CategoryBreadcrumb'
import CourseFilterToolbar from '../../components/courses/CourseFilterToolbar'
import { BannerButton } from '../../components/academics/AcademicsUi'
import AdminRoleFormModal from '../../components/admin-management/roles/AdminRoleFormModal'
import AdminRoleViewModal from '../../components/admin-management/roles/AdminRoleViewModal'
import ConfirmRoleDeleteModal from '../../components/admin-management/roles/ConfirmRoleDeleteModal'
import ConfirmRoleStatusModal from '../../components/admin-management/roles/ConfirmRoleStatusModal'
import RoleBulkActionsBar from '../../components/admin-management/roles/RoleBulkActionsBar'
import RoleManagementTable from '../../components/admin-management/roles/RoleManagementTable'
import RoleTableActions from '../../components/admin-management/roles/RoleTableActions'
import { useRoleManagement } from '../../hooks/useRoleManagement'
import { useApiRolesCatalogSync, syncApiRolesCatalog } from '../../hooks/useApiRolesCatalogSync'
import { useTableRowSelection } from '../../hooks/useTableRowSelection'
import { useAdminRolesSafe } from '../../contexts/AdminRolesContext'
import { getApiErrorMessage } from '../../utils/apiError'
import { deleteRole as deleteRoleApi, updateRole as updateRoleApi } from '../../services/roleService'

const BREADCRUMB = [
  { label: 'Admin Management' },
  { label: 'Role Access' },
]

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Status' },
  { value: 'Active', label: 'Active' },
  { value: 'In Active', label: 'In Active' },
]

function canToggleRoleStatus(role) {
  return role && !role.systemProtected && !role.fullAccess
}

function canDeleteRole(role) {
  return role && !role.systemProtected && !role.fullAccess
}

export default function RoleAccessPage() {
  useApiRolesCatalogSync()
  const adminRoles = useAdminRolesSafe()

  const {
    roles,
    loading,
    loadError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    refreshRoles,
    removeRoleLocally,
    patchRoleLocally,
  } = useRoleManagement()

  const { selectedIds, selection, clearSelection } = useTableRowSelection((row) => row.id)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewingId, setViewingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [bulkDeleteIds, setBulkDeleteIds] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [statusTarget, setStatusTarget] = useState(null)
  const [bulkDisableIds, setBulkDisableIds] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)
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
    () =>
      selectedRoles.filter((role) => role.enabled && canToggleRoleStatus(role)).length,
    [selectedRoles],
  )

  const bulkDeleteCount = useMemo(
    () => selectedRoles.filter((role) => canDeleteRole(role)).length,
    [selectedRoles],
  )

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

  const refreshRolesAndCatalog = useCallback(async () => {
    await refreshRoles()
    await syncApiRolesCatalog(adminRoles?.mergeApiRoles)
  }, [refreshRoles, adminRoles?.mergeApiRoles])

  const handleStatusToggleRequest = useCallback(
    (row) => {
      if (!canToggleRoleStatus(row) || statusUpdatingId) return
      setStatusTarget(row)
    },
    [statusUpdatingId],
  )

  const confirmStatusChange = useCallback(async () => {
    if (!statusTarget) return

    const enabling = !statusTarget.enabled
    const nextEnabled = enabling
    const previousEnabled = statusTarget.enabled
    const roleId = statusTarget.id

    setStatusLoading(true)
    setStatusUpdatingId(roleId)
    patchRoleLocally(roleId, { enabled: nextEnabled, status: enabling ? 'ACTIVE' : 'INACTIVE' })

    try {
      await updateRoleApi(roleId, {
        roleTitle: statusTarget.label,
        roleCode: statusTarget.roleCode,
        status: enabling ? 'ACTIVE' : 'INACTIVE',
      })
      toast.success(enabling ? 'Role activated' : 'Role deactivated')
      setStatusTarget(null)
      await refreshRolesAndCatalog()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      patchRoleLocally(roleId, { enabled: previousEnabled, status: previousEnabled ? 'ACTIVE' : 'INACTIVE' })
      toast.error(getApiErrorMessage(error, 'Failed to update role status'))
    } finally {
      setStatusLoading(false)
      setStatusUpdatingId(null)
    }
  }, [statusTarget, patchRoleLocally, refreshRolesAndCatalog])

  const confirmBulkDisable = useCallback(async () => {
    if (!bulkDisableIds?.length) return

    const targets = roles.filter(
      (role) =>
        bulkDisableIds.includes(role.id) && role.enabled && canToggleRoleStatus(role),
    )

    if (!targets.length) {
      setBulkDisableIds(null)
      return
    }

    setStatusLoading(true)
    let successCount = 0
    let failCount = 0

    for (const role of targets) {
      setStatusUpdatingId(role.id)
      patchRoleLocally(role.id, { enabled: false, status: 'INACTIVE' })
      try {
        await updateRoleApi(role.id, {
          roleTitle: role.label,
          roleCode: role.roleCode,
          status: 'INACTIVE',
        })
        successCount += 1
      } catch (error) {
        failCount += 1
        patchRoleLocally(role.id, { enabled: role.enabled, status: role.enabled ? 'ACTIVE' : 'INACTIVE' })
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
    setStatusLoading(false)
  }, [bulkDisableIds, roles, patchRoleLocally, clearSelection, refreshRolesAndCatalog])

  const confirmDelete = useCallback(async () => {
    if (bulkDeleteIds?.length) {
      const targets = roles.filter(
        (role) => bulkDeleteIds.includes(role.id) && canDeleteRole(role),
      )

      if (!targets.length) {
        setBulkDeleteIds(null)
        return
      }

      setDeleteLoading(true)
      let successCount = 0
      let failCount = 0

      for (const role of targets) {
        try {
          await deleteRoleApi(role.id)
          removeRoleLocally(role.id)
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
      setDeleteLoading(false)
      return
    }

    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteRoleApi(deleteTarget.id)
      removeRoleLocally(deleteTarget.id)
      toast.success('Role deleted')
      setDeleteTarget(null)
      await refreshRolesAndCatalog()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(getApiErrorMessage(error, 'Unable to delete role'))
    } finally {
      setDeleteLoading(false)
    }
  }, [bulkDeleteIds, roles, deleteTarget, removeRoleLocally, clearSelection, refreshRolesAndCatalog])

  const renderRowActions = useCallback(
    (row) => (
      <RoleTableActions
        row={row}
        onView={() => setViewingId(row.id)}
        onEdit={() => openEdit(row)}
        onStatusToggle={() => handleStatusToggleRequest(row)}
        onDelete={() => setDeleteTarget(row)}
        canToggle={canToggleRoleStatus(row)}
        canDelete={canDeleteRole(row)}
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
    const ids = selectedRoles
      .filter((role) => role.enabled && canToggleRoleStatus(role))
      .map((role) => role.id)
    if (ids.length) setBulkDisableIds(ids)
  }, [selectedRoles])

  const handleBulkDelete = useCallback(() => {
    const ids = selectedRoles.filter((role) => canDeleteRole(role)).map((role) => role.id)
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
          <CourseFilterToolbar
            search={search}
            onSearchChange={(e) => setSearch(e.target.value)}
            searchPlaceholder="Search roles by title or code"
            status={statusFilter}
            onStatusChange={(e) => setStatusFilter(e.target.value)}
            statusOptions={STATUS_FILTER_OPTIONS}
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
              loading={loading}
              controlledPagination={controlledPagination}
              selection={selection}
              resetDeps={[search, statusFilter]}
              emptyMessage={emptyMessage}
              emptyState={emptyState}
              paginationStartIndex={pagination.startIndex}
              statusUpdatingId={statusUpdatingId}
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
      <ConfirmRoleDeleteModal
        open={!!deleteTarget || !!bulkDeleteIds?.length}
        roleLabel={deleteTarget?.label}
        bulkCount={bulkDeleteIds?.length || 0}
        loading={deleteLoading}
        onCancel={() => {
          if (!deleteLoading) {
            setDeleteTarget(null)
            setBulkDeleteIds(null)
          }
        }}
        onConfirm={confirmDelete}
      />
      <ConfirmRoleStatusModal
        open={!!statusTarget || !!bulkDisableIds?.length}
        roleLabel={statusTarget?.label || 'this role'}
        bulkCount={bulkDisableIds?.length || 0}
        enabling={bulkDisableIds?.length ? false : !statusTarget?.enabled}
        loading={statusLoading}
        onCancel={() => {
          if (!statusLoading) {
            setStatusTarget(null)
            setBulkDisableIds(null)
          }
        }}
        onConfirm={bulkDisableIds?.length ? confirmBulkDisable : confirmStatusChange}
      />
    </div>
  )
}
