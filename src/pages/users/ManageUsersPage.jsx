import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users } from 'lucide-react'
import { toast } from '@/utils/toast'
import ErrorState from '../../components/feedback/ErrorState'
import ManageUsersFilterToolbar from '../../components/manage-users/ManageUsersFilterToolbar'
import ManageUsersBulkActionsBar from '../../components/manage-users/ManageUsersBulkActionsBar'
import ManageUsersTable from '../../components/manage-users/ManageUsersTable'
import ManageUsersTableActions from '../../components/manage-users/ManageUsersTableActions'
import ConfirmManageUserDeleteModal from '../../components/manage-users/ConfirmManageUserDeleteModal'
import ConfirmManageUserStatusModal from '../../components/manage-users/ConfirmManageUserStatusModal'
import UserFormModal from '../../components/manage-users/UserFormModal'
import ViewUserModal from '../../components/manage-users/ViewUserModal'
import CreateAdminModal from '../../components/admin-management/CreateAdminModal'
import { isStudentRecord } from '../../components/manage-users/isStudentRecord'
import {
  buildUserFromCreateForm,
  formatManageUserJoinDate,
} from '../../components/manage-users/manageUsersStaticData'
import { useManageUsers } from '../../hooks/useManageUsers'
import { useTableRowSelection } from '../../hooks/useTableRowSelection'
import { isFrontendOnly } from '../../config/appMode'
import { getApiErrorMessage } from '../../utils/apiError'
import {
  buildStudentUpdatePayload,
  deleteStudentUser,
  getStudentUserById,
  isStudentRow,
  mapAdminAccessToViewUser,
  mapApiManageUserToRow,
  unwrapStudentSummary,
  updateStudentUser,
  updateStudentUserStatus,
} from '../../services/manageUsersService'
import {
  deleteAdminUser,
  getAdminUserById,
  updateAdminStatus,
} from '../../services/adminAccessService'
import { cn } from '../../utils/cn'

const ROLE_BADGE_STYLES = {
  STUDENT: 'bg-[#EEF5FF] text-[#1D72B8] ring-[#4CA6E8]/30',
  ADMIN: 'bg-violet-50 text-violet-700 ring-violet-200/60',
  CONTENT_ADMIN: 'bg-violet-50 text-violet-700 ring-violet-200/60',
  SUPER_ADMIN: 'bg-violet-50 text-violet-700 ring-violet-200/60',
  TEACHER_ADMIN: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
  MENTOR_ADMIN: 'bg-orange-50 text-orange-700 ring-orange-200/60',
  CENTER_ADMIN: 'bg-orange-50 text-orange-700 ring-orange-200/60',
  student: 'bg-[#EEF5FF] text-[#1D72B8] ring-[#4CA6E8]/30',
  admin: 'bg-violet-50 text-violet-700 ring-violet-200/60',
  faculty: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
}

function roleBadgeStyle(row) {
  const roleType = String(row?.roleType || '').trim().toUpperCase()
  if (roleType && ROLE_BADGE_STYLES[roleType]) return ROLE_BADGE_STYLES[roleType]
  const role = String(row?.role || '').trim().toLowerCase()
  return ROLE_BADGE_STYLES[role] || 'bg-[#F5F7FB] text-[#667085] ring-[#E7ECF5]'
}

function roleDisplayLabel(row) {
  return row?.role || '—'
}

function UserStatusBadge({ status }) {
  const isActive = status === 'Active'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        isActive
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/70'
          : 'bg-red-50 text-[#D64B5F] ring-red-200/70',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 shrink-0 rounded-full',
          isActive ? 'bg-emerald-500' : 'bg-[#D64B5F]',
        )}
        aria-hidden
      />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

function UserRoleBadge({ row }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        roleBadgeStyle(row),
      )}
    >
      {roleDisplayLabel(row)}
    </span>
  )
}

function CenterPill({ label }) {
  return (
    <span className="inline-flex max-w-[180px] truncate rounded-md bg-[#F5F7FB] px-2.5 py-1 text-xs font-medium text-[#667085] ring-1 ring-inset ring-[#E7ECF5]">
      {label}
    </span>
  )
}

export default function ManageUsersPage() {
  const navigate = useNavigate()
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
    roleOptions,
    centerOptions,
    pagination,
    refreshUsers,
    patchUserLocally,
    removeUserLocally,
  } = useManageUsers()

  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [studentDetailLoading, setStudentDetailLoading] = useState(false)
  const [studentSaving, setStudentSaving] = useState(false)
  const [adminFormOpen, setAdminFormOpen] = useState(false)
  const [editingAdminId, setEditingAdminId] = useState(null)
  const [viewingUser, setViewingUser] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [statusTarget, setStatusTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [actionUserId, setActionUserId] = useState(null)
  const [localUsers, setLocalUsers] = useState([])

  const displayUsers = isFrontendOnly ? localUsers.length ? localUsers : users : users

  const { selectedIds, selection, clearSelection } = useTableRowSelection((row) => row.id)

  const selectedActiveCount = useMemo(
    () => displayUsers.filter((u) => selectedIds.includes(u.id) && u.status === 'Active').length,
    [displayUsers, selectedIds],
  )

  const handleBulkDisable = async () => {
    const targets = displayUsers.filter(
      (user) => selectedIds.includes(user.id) && user.status === 'Active',
    )
    if (!targets.length) return

    if (isFrontendOnly) {
      setLocalUsers((prev) => {
        const base = prev.length ? prev : users
        return base.map((user) =>
          selectedIds.includes(user.id) && user.status === 'Active'
            ? { ...user, status: 'In Active' }
            : user,
        )
      })
      toast.success(
        targets.length === 1 ? 'User disabled' : `${targets.length} users disabled`,
      )
      clearSelection()
      return
    }

    setStatusLoading(true)
    let successCount = 0
    let failCount = 0

    for (const row of targets) {
      try {
        if (isStudentRow(row)) {
          await updateStudentUserStatus(row.id, row, false)
        } else {
          await updateAdminStatus(row.id, false)
        }
        successCount += 1
      } catch (error) {
        failCount += 1
        if (import.meta.env.DEV) console.error(error)
      }
    }

    if (successCount > 0) {
      toast.success(successCount === 1 ? 'User disabled' : `${successCount} users disabled`)
    }
    if (failCount > 0) {
      toast.error(failCount === 1 ? 'Failed to disable 1 user' : `Failed to disable ${failCount} users`)
    }

    clearSelection()
    await refreshUsers()
    setStatusLoading(false)
  }

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return
    if (!window.confirm(`Delete ${selectedIds.length} selected user(s)? This cannot be undone.`)) {
      return
    }

    if (isFrontendOnly) {
      setLocalUsers((prev) => {
        const base = prev.length ? prev : users
        return base.filter((user) => !selectedIds.includes(user.id))
      })
      toast.success(
        selectedIds.length === 1 ? 'User deleted' : `${selectedIds.length} users deleted`,
      )
      clearSelection()
      return
    }

    setDeleteLoading(true)
    let successCount = 0
    let failCount = 0

    for (const row of displayUsers.filter((u) => selectedIds.includes(u.id))) {
      try {
        if (isStudentRow(row)) {
          if (!row.permissions?.canDelete) continue
          await deleteStudentUser(row.id, row)
        } else {
          await deleteAdminUser(row.id)
        }
        successCount += 1
      } catch (error) {
        failCount += 1
        if (import.meta.env.DEV) console.error(error)
      }
    }

    if (successCount > 0) {
      toast.success(successCount === 1 ? 'User deleted' : `${successCount} users deleted`)
    }
    if (failCount > 0) {
      toast.error(failCount === 1 ? 'Failed to delete 1 user' : `Failed to delete ${failCount} users`)
    }

    clearSelection()
    await refreshUsers()
    setDeleteLoading(false)
  }

  const handleCreateUser = (formData) => {
    const user = buildUserFromCreateForm(formData, { nextIndex: displayUsers.length + 1 })
    setLocalUsers((prev) => [user, ...(prev.length ? prev : users)])
    toast.success('User added successfully')
  }

  const handleUpdateStudent = async (row, form) => {
    if (isFrontendOnly) {
      setLocalUsers((prev) => {
        const base = prev.length ? prev : users
        return base.map((user) =>
          user.id === row.id
            ? {
                ...user,
                ...form,
                email: form.email?.toLowerCase?.() ?? user.email,
              }
            : user,
        )
      })
      toast.success('User updated')
      return true
    }

    setStudentSaving(true)
    try {
      const payload = buildStudentUpdatePayload(form, centerOptions)
      await updateStudentUser(row.id, row, payload)
      toast.success('User updated successfully')
      await refreshUsers()
      return true
    } catch (error) {
      if (import.meta.env.DEV) console.error(error)
      toast.error(getApiErrorMessage(error, 'Failed to update user'))
      return false
    } finally {
      setStudentSaving(false)
    }
  }

  const openCreate = () => {
    setEditingUser(null)
    setFormOpen(true)
  }

  const openEdit = async (row) => {
    if (isStudentRecord(row)) {
      if (!isFrontendOnly && !row.permissions?.canEdit) {
        toast.error(row.editDisabledReason || 'Edit is not allowed for this user')
        return
      }

      if (isFrontendOnly) {
        setEditingUser(row)
        setFormOpen(true)
        return
      }

      setStudentDetailLoading(true)
      try {
        const data = await getStudentUserById(row.id, row)
        const summary = unwrapStudentSummary(data)
        const mapped = mapApiManageUserToRow(summary)
        setEditingUser(mapped || row)
        setFormOpen(true)
      } catch (error) {
        if (import.meta.env.DEV) console.error(error)
        toast.error(getApiErrorMessage(error, 'Failed to load user details'))
      } finally {
        setStudentDetailLoading(false)
      }
      return
    }

    setEditingAdminId(row.id)
    setAdminFormOpen(true)
  }

  const openStudent360 = (user) => {
    navigate(`/users/manage/students/${user.id}`)
  }

  const handleView = async (row) => {
    if (isFrontendOnly) {
      if (isStudentRecord(row)) {
        openStudent360(row)
        return
      }
      setViewingUser(row)
      return
    }

    setViewLoading(true)
    setActionUserId(row.id)
    try {
      if (isStudentRow(row)) {
        const data = await getStudentUserById(row.id, row)
        const summary = unwrapStudentSummary(data)
        const mapped = mapApiManageUserToRow(summary)
        setViewingUser(mapped || row)
      } else {
        const data = await getAdminUserById(row.id)
        setViewingUser(mapAdminAccessToViewUser(data?.data ?? data))
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error(error)
      toast.error(getApiErrorMessage(error, 'Unable to open user details'))
    } finally {
      setViewLoading(false)
      setActionUserId(null)
    }
  }

  const handleStatusToggleRequest = (row) => {
    setStatusTarget(row)
  }

  const confirmStatusChange = async () => {
    if (!statusTarget || statusLoading) return

    const enabling = statusTarget.status !== 'Active'
    const nextStatus = enabling ? 'Active' : 'In Active'

    setStatusLoading(true)
    setActionUserId(statusTarget.id)

    if (isFrontendOnly) {
      setLocalUsers((prev) => {
        const base = prev.length ? prev : users
        return base.map((user) =>
          user.id === statusTarget.id ? { ...user, status: nextStatus } : user,
        )
      })
      toast.success(enabling ? 'User enabled successfully' : 'User disabled successfully')
      setStatusTarget(null)
      setStatusLoading(false)
      setActionUserId(null)
      return
    }

    patchUserLocally(statusTarget.id, { status: nextStatus })

    try {
      if (isStudentRow(statusTarget)) {
        await updateStudentUserStatus(statusTarget.id, statusTarget, enabling)
      } else {
        await updateAdminStatus(statusTarget.id, enabling)
      }
      toast.success(enabling ? 'User enabled successfully' : 'User disabled successfully')
      setStatusTarget(null)
      await refreshUsers()
    } catch (error) {
      if (import.meta.env.DEV) console.error(error)
      patchUserLocally(statusTarget.id, { status: statusTarget.status })
      toast.error(getApiErrorMessage(error, 'Failed to update user status'))
    } finally {
      setStatusLoading(false)
      setActionUserId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget || deleteLoading) return

    setDeleteLoading(true)
    setActionUserId(deleteTarget.id)

    if (isFrontendOnly) {
      setLocalUsers((prev) => {
        const base = prev.length ? prev : users
        return base.filter((user) => user.id !== deleteTarget.id)
      })
      toast.success('User deleted successfully')
      setDeleteTarget(null)
      setDeleteLoading(false)
      setActionUserId(null)
      return
    }

    try {
      if (isStudentRow(deleteTarget)) {
        if (!deleteTarget.permissions?.canDelete) {
          toast.error(deleteTarget.deleteDisabledReason || 'Delete is not allowed for this user')
          return
        }
        await deleteStudentUser(deleteTarget.id, deleteTarget)
      } else {
        await deleteAdminUser(deleteTarget.id)
      }
      removeUserLocally(deleteTarget.id)
      toast.success('User deleted successfully')
      setDeleteTarget(null)
      await refreshUsers()
    } catch (error) {
      if (import.meta.env.DEV) console.error(error)
      toast.error(getApiErrorMessage(error, 'Failed to delete user'))
    } finally {
      setDeleteLoading(false)
      setActionUserId(null)
    }
  }

  const handleAdminSuccess = useCallback(() => {
    refreshUsers()
  }, [refreshUsers])

  const columns = [
    {
      key: 'fullName',
      label: 'Full Name',
      headerClassName: 'min-w-[220px]',
      cellClassName: 'min-w-[220px]',
      render: (row) => {
        const inner = (
          <div className="min-w-0">
            <p className="truncate text-base font-semibold leading-snug text-[#14213D]">
              {row.fullName}
            </p>
            <p className="mt-1 truncate text-xs font-medium text-[#667085]">{row.userId}</p>
          </div>
        )
        if (isStudentRecord(row)) {
          return (
            <button
              type="button"
              onClick={() => openStudent360(row)}
              className="min-w-0 text-left transition hover:opacity-80"
            >
              {inner}
            </button>
          )
        }
        return inner
      },
    },
    {
      key: 'email',
      label: 'Email',
      headerClassName: 'min-w-[240px]',
      cellClassName: 'min-w-[240px]',
      render: (row) => (
        <span className="block truncate text-sm text-[#667085]" title={row.email}>
          {row.email}
        </span>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      align: 'center',
      headerClassName: 'min-w-[130px] text-center',
      cellClassName: 'text-center',
      render: (row) => (
        <span className="whitespace-nowrap text-sm font-medium text-[#14213D]">{row.phone}</span>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      align: 'center',
      headerClassName: 'min-w-[110px] text-center',
      cellClassName: 'text-center',
      render: (row) => <UserRoleBadge row={row} />,
    },
    {
      key: 'assignedCenter',
      label: 'Center',
      align: 'center',
      headerClassName: 'min-w-[140px] text-center',
      cellClassName: 'text-center',
      render: (row) => <CenterPill label={row.assignedCenter} />,
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      headerClassName: 'min-w-[110px] text-center',
      cellClassName: 'text-center',
      render: (row) => <UserStatusBadge status={row.status} />,
    },
    {
      key: 'joinedAt',
      label: 'Joined',
      align: 'center',
      headerClassName: 'min-w-[120px] text-center',
      cellClassName: 'text-center',
      render: (row) => (
        <span className="whitespace-nowrap text-sm font-medium text-[#667085]">
          {formatManageUserJoinDate(row.joinedAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      headerClassName: 'min-w-[200px] text-center',
      cellClassName: 'text-center',
      render: (row) => (
        <ManageUsersTableActions
          row={row}
          disabled={
            actionUserId === row.id && (statusLoading || deleteLoading || viewLoading)
          }
          onView={() => handleView(row)}
          onEdit={() => openEdit(row)}
          onStatusToggle={() => handleStatusToggleRequest(row)}
          onDelete={() => setDeleteTarget(row)}
        />
      ),
    },
  ]

  if (loadError && !loading && displayUsers.length === 0) {
    return (
      <div className="figma-admin-section min-h-screen bg-[#F5F7FB] px-4 pb-10 pt-6 sm:px-5 lg:px-6">
        <section className="mx-auto max-w-screen-2xl">
          <ErrorState title="Unable to load users" message={loadError} onRetry={refreshUsers} />
        </section>
      </div>
    )
  }

  return (
    <div className="figma-admin-section min-h-screen bg-[#F5F7FB] px-4 pb-10 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-6">
        <div className="flex flex-col gap-5 rounded-2xl border border-[#E7ECF5] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(7,19,63,0.06)] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EEF5FF] ring-1 ring-[#4CA6E8]/20">
              <Users className="h-6 w-6 text-[#1D72B8]" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-[#14213D] sm:text-2xl">
                Users Management
              </h1>
              <p className="mt-1 text-sm text-[#667085]">
                Manage users, permissions and assigned centers.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#1D72B8] to-[#07133F] px-5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(29,114,184,0.35)] transition hover:shadow-[0_6px_20px_rgba(7,19,63,0.35)] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add User
          </button>
        </div>

        <div className="rounded-2xl border border-[#E7ECF5] bg-white p-5 shadow-[0_8px_24px_rgba(7,19,63,0.05)] sm:p-6">
          <ManageUsersFilterToolbar
            search={search}
            onSearchChange={(e) => setSearch(e.target.value)}
            roleFilter={roleFilter}
            onRoleFilterChange={(e) => setRoleFilter(e.target.value)}
            centerFilter={centerFilter}
            onCenterFilterChange={(e) => setCenterFilter(e.target.value)}
            statusFilter={statusFilter}
            onStatusFilterChange={(e) => setStatusFilter(e.target.value)}
            roleOptions={roleOptions}
            centerOptions={centerOptions}
          />
        </div>

        {selectedIds.length > 0 && (
          <ManageUsersBulkActionsBar
            count={selectedIds.length}
            disableCount={selectedActiveCount}
            onDisable={handleBulkDisable}
            onDelete={handleBulkDelete}
          />
        )}

        <ManageUsersTable
          columns={columns}
          data={displayUsers}
          loading={loading}
          controlledPagination={isFrontendOnly ? undefined : pagination}
          emptyMessage="No users match your search or filters."
          itemLabel="users"
          resetDeps={[search, roleFilter, centerFilter, statusFilter]}
          selection={selection}
        />
      </section>

      <UserFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingUser(null)
        }}
        onCreate={handleCreateUser}
        onUpdate={handleUpdateStudent}
        editingUser={editingUser}
        centerOptions={centerOptions}
        saving={studentSaving}
        detailLoading={studentDetailLoading}
      />

      <CreateAdminModal
        open={adminFormOpen}
        onClose={() => {
          setAdminFormOpen(false)
          setEditingAdminId(null)
        }}
        editingId={editingAdminId}
        onSuccess={handleAdminSuccess}
      />

      <ViewUserModal
        open={Boolean(viewingUser)}
        onClose={() => setViewingUser(null)}
        user={viewingUser}
      />

      <ConfirmManageUserStatusModal
        open={Boolean(statusTarget)}
        enabling={statusTarget?.status !== 'Active'}
        loading={statusLoading}
        onCancel={() => {
          if (!statusLoading) setStatusTarget(null)
        }}
        onConfirm={confirmStatusChange}
      />

      <ConfirmManageUserDeleteModal
        open={Boolean(deleteTarget)}
        user={deleteTarget}
        loading={deleteLoading}
        onCancel={() => {
          if (!deleteLoading) setDeleteTarget(null)
        }}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
