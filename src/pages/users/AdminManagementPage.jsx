import { useCallback, useMemo, useState } from 'react'
import { Plus, Shield } from 'lucide-react'
import { toast } from '@/utils/toast'
import ErrorState from '../../components/feedback/ErrorState'
import PageBanner from '../../components/figma/PageBanner'
import CourseFilterToolbar from '../../components/courses/CourseFilterToolbar'
import CreateAdminModal from '../../components/admin-management/CreateAdminModal'
import ViewAdminDrawer from '../../components/admin-management/ViewAdminDrawer'
import ConfirmAdminDeleteModal from '../../components/admin-management/ConfirmAdminDeleteModal'
import ConfirmAdminStatusModal from '../../components/admin-management/ConfirmAdminStatusModal'
import AdminBulkActionsBar from '../../components/admin-management/AdminBulkActionsBar'
import AdminManagementTable from '../../components/admin-management/AdminManagementTable'
import AdminTableActions from '../../components/admin-management/AdminTableActions'
import { useAdminManagement } from '../../hooks/useAdminManagement'
import { useRolesDropdown } from '../../hooks/useRolesDropdown'
import { useCentersDropdownOptions } from '../../hooks/useCentersDropdownOptions'
import { useTableRowSelection } from '../../hooks/useTableRowSelection'
import { getApiErrorMessage } from '../../utils/apiError'
import {
  deleteAdminUser,
  updateAdminStatus,
} from '../../services/adminAccessService'

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
    pagination,
    refreshUsers,
    patchUserLocally,
    removeUserLocally,
  } = useAdminManagement()

  const {
    options: roleDropdownOptions = [],
    error: rolesDropdownError,
    refresh: refreshRolesDropdown,
  } = useRolesDropdown({ adminManagement: true })
  const {
    options: centerDropdownOptions = [],
    error: centersDropdownError,
    refresh: refreshCentersDropdown,
  } = useCentersDropdownOptions({ adminManagement: true })

  const { selectedIds, selection, clearSelection } = useTableRowSelection((row) => row.id)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [viewingId, setViewingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [bulkDeleteIds, setBulkDeleteIds] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [statusTarget, setStatusTarget] = useState(null)
  const [bulkDisableIds, setBulkDisableIds] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)

  const roleFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'All Roles' },
      ...(Array.isArray(roleDropdownOptions) ? roleDropdownOptions : []),
    ],
    [roleDropdownOptions],
  )

  const centerFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'All Centers' },
      ...(Array.isArray(centerDropdownOptions) ? centerDropdownOptions : []),
    ],
    [centerDropdownOptions],
  )

  const selectedActiveCount = useMemo(
    () => users.filter((u) => selectedIds.includes(u.id) && u.status === 'Active').length,
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

  const handleSuccess = useCallback(() => {
    refreshUsers()
  }, [refreshUsers])

  const confirmDelete = async () => {
    if (bulkDeleteIds?.length) {
      setDeleteLoading(true)
      let successCount = 0
      let failCount = 0

      for (const id of bulkDeleteIds) {
        try {
          await deleteAdminUser(id)
          removeUserLocally(id)
          successCount += 1
        } catch (error) {
          failCount += 1
          if (import.meta.env.DEV) {
            console.error(error)
          }
        }
      }

      if (successCount > 0) {
        toast.success(
          successCount === 1 ? 'User access deleted' : `${successCount} user access records deleted`,
        )
      }
      if (failCount > 0) {
        toast.error(
          failCount === 1
            ? 'Failed to delete 1 user access record'
            : `Failed to delete ${failCount} user access records`,
        )
      }

      setBulkDeleteIds(null)
      clearSelection()
      await refreshUsers()
      setDeleteLoading(false)
      return
    }

    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteAdminUser(deleteTarget.id)
      removeUserLocally(deleteTarget.id)
      toast.success('User access deleted')
      setDeleteTarget(null)
      await refreshUsers()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(getApiErrorMessage(error, 'Failed to delete user access'))
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleStatusToggleRequest = (row) => {
    setStatusTarget(row)
  }

  const confirmStatusChange = async () => {
    if (!statusTarget) return
    const enabling = statusTarget.status !== 'Active'
    const nextStatus = enabling ? 'Active' : 'In Active'

    setStatusLoading(true)
    patchUserLocally(statusTarget.id, {
      status: nextStatus,
      accountStatus: enabling,
    })

    try {
      await updateAdminStatus(statusTarget.id, enabling)
      toast.success(enabling ? 'Account enabled' : 'Account disabled')
      setStatusTarget(null)
      await refreshUsers()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      patchUserLocally(statusTarget.id, {
        status: statusTarget.status,
        accountStatus: statusTarget.accountStatus,
      })
      toast.error(getApiErrorMessage(error, 'Failed to update account status'))
    } finally {
      setStatusLoading(false)
    }
  }

  const confirmBulkDisable = async () => {
    if (!bulkDisableIds?.length) return

    const targets = users.filter(
      (row) => bulkDisableIds.includes(row.id) && row.status === 'Active',
    )

    if (!targets.length) {
      setBulkDisableIds(null)
      return
    }

    setStatusLoading(true)
    let successCount = 0
    let failCount = 0

    for (const row of targets) {
      patchUserLocally(row.id, {
        status: 'In Active',
        accountStatus: false,
      })
      try {
        await updateAdminStatus(row.id, false)
        successCount += 1
      } catch (error) {
        failCount += 1
        patchUserLocally(row.id, {
          status: row.status,
          accountStatus: row.accountStatus,
        })
        if (import.meta.env.DEV) {
          console.error(error)
        }
      }
    }

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
    await refreshUsers()
    setStatusLoading(false)
  }

  const renderRowActions = useCallback(
    (row) => (
      <AdminTableActions
        row={row}
        onView={() => setViewingId(row.id)}
        onEdit={() => openEdit(row)}
        onStatusToggle={() => handleStatusToggleRequest(row)}
        onDelete={() => setDeleteTarget(row)}
      />
    ),
    [],
  )

  const emptyMessage = loadError
    ? 'Unable to load admin users.'
    : search.trim() || roleFilter !== 'all' || centerFilter !== 'all' || statusFilter !== 'all'
      ? 'No employees match your filters.'
      : 'No employees found'

  const emptyState = loadError ? (
    <div className="px-4 py-6 sm:px-6">
      <ErrorState
        title="Unable to load admin users"
        message={loadError}
        onRetry={refreshUsers}
      />
    </div>
  ) : undefined

  const filterDropdownWarning =
    rolesDropdownError || centersDropdownError
      ? [rolesDropdownError && 'Role filter unavailable', centersDropdownError && 'Center filter unavailable']
          .filter(Boolean)
          .join(' · ')
      : null

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
          onSuccess={handleSuccess}
          editingId={editingId}
        />

        <ViewAdminDrawer open={!!viewingId} adminAccessId={viewingId} onClose={() => setViewingId(null)} />

        <ConfirmAdminDeleteModal
          open={!!deleteTarget || !!bulkDeleteIds?.length}
          employeeName={deleteTarget?.employeeName}
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

        <ConfirmAdminStatusModal
          open={!!statusTarget || !!bulkDisableIds?.length}
          employeeName={statusTarget?.employeeName}
          bulkCount={bulkDisableIds?.length || 0}
          enabling={bulkDisableIds?.length ? false : statusTarget?.status !== 'Active'}
          loading={statusLoading}
          onCancel={() => {
            if (!statusLoading) {
              setStatusTarget(null)
              setBulkDisableIds(null)
            }
          }}
          onConfirm={bulkDisableIds?.length ? confirmBulkDisable : confirmStatusChange}
        />

        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
          <CourseFilterToolbar
            search={search}
            onSearchChange={(e) => setSearch(e.target.value)}
            searchPlaceholder="Search by employee name or employee ID"
            category={roleFilter}
            onCategoryChange={(e) => setRoleFilter(e.target.value)}
            categoryOptions={roleFilterOptions}
            categoryAriaLabel="Role Title"
            center={centerFilter}
            onCenterChange={(e) => setCenterFilter(e.target.value)}
            centerOptions={centerFilterOptions}
            centerAriaLabel="Center"
            status={statusFilter}
            onStatusChange={(e) => setStatusFilter(e.target.value)}
            disabled={loading && users.length === 0}
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
                  if (rolesDropdownError) refreshRolesDropdown()
                  if (centersDropdownError) refreshCentersDropdown()
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
              loading={loading}
              controlledPagination={pagination}
              selection={selection}
              resetDeps={[search, roleFilter, centerFilter, statusFilter]}
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
