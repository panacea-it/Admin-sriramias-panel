import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users } from 'lucide-react'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import AdminDataPanel from '../../components/admin/AdminDataPanel'
import { ADMIN_CREATE_BTN, ADMIN_PAGE_SECTION, ADMIN_PAGE_INNER } from '../../utils/adminUiStandards'
import ManageUsersFilterToolbar from '../../components/manage-users/ManageUsersFilterToolbar'
import ManageUsersTable from '../../components/manage-users/ManageUsersTable'
import ManageUsersTableActions from '../../components/manage-users/ManageUsersTableActions'
import ConfirmManageUserDeleteModal from '../../components/manage-users/ConfirmManageUserDeleteModal'
import ConfirmManageUserStatusModal from '../../components/manage-users/ConfirmManageUserStatusModal'
import UserFormModal from '../../components/manage-users/UserFormModal'
import ViewUserModal from '../../components/manage-users/ViewUserModal'
import { useUserManagement } from '../../hooks/user/useUserManagement'
import { useCreateUser } from '../../hooks/user/useCreateUser'
import { useUpdateUser } from '../../hooks/user/useUpdateUser'
import { useDeleteUser } from '../../hooks/user/useDeleteUser'
import { useUpdateUserStatus } from '../../hooks/user/useUpdateUserStatus'
import { useUser } from '../../hooks/user/useUser'
import {
  formatManageUserJoinDate,
  getRecordTypeQuery,
  isStudentRow,
  mapApiErrorsToForm,
  roleBadgeClassName,
} from '../../utils/userHelpers'
import { getApiErrorMessage } from '../../utils/apiError'
import { cn } from '../../utils/cn'

function UserStatusBadge({ status }) {
  const isActive = status === 'Active'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        isActive
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/70'
          : 'bg-[#F5F7FB] text-[#667085] ring-[#E7ECF5]',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 shrink-0 rounded-full',
          isActive ? 'bg-emerald-500' : 'bg-[#667085]',
        )}
        aria-hidden
      />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

function UserRoleBadge({ role, roleType }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        roleBadgeClassName(roleType || role),
      )}
    >
      {role || '—'}
    </span>
  )
}

function RecordTypeBadge({ recordType }) {
  const labels = {
    USER: 'Portal',
    STUDENT: 'Batch',
    ADMIN: 'Admin',
  }
  const label = labels[recordType] || recordType || '—'
  return (
    <span className="inline-flex items-center rounded-md bg-[#F5F7FB] px-2 py-0.5 text-xs font-medium text-[#667085] ring-1 ring-inset ring-[#E7ECF5]">
      {label}
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
    fetching,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    centerFilter,
    setCenterFilter,
    statusFilter,
    setStatusFilter,
    recordTypeFilter,
    setRecordTypeFilter,
    roleOptions,
    centerOptions,
    moduleConfig,
    pagination,
    refreshUsers,
  } = useUserManagement()

  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()
  const deleteUserMutation = useDeleteUser()
  const updateStatusMutation = useUpdateUserStatus()

  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [viewingUser, setViewingUser] = useState(null)
  const [viewUserId, setViewUserId] = useState(null)
  const [viewUserType, setViewUserType] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [actionUserId, setActionUserId] = useState(null)

  const viewUserQuery = useUser(viewUserId, viewUserType, Boolean(viewUserId))

  const pageTitle = moduleConfig?.listUsersLabel || 'List Users'
  const createLabel = moduleConfig?.createFormLabel || 'Create Student'

  const openCreate = () => {
    setEditingUser(null)
    setFormOpen(true)
  }

  const openEdit = (user) => {
    if (!user.permissions?.canEdit) {
      toast.error(user.permissions?.editDisabledReason || 'Edit not allowed for this account')
      return
    }
    setEditingUser(user)
    setFormOpen(true)
  }

  const openStudent360 = (user) => {
    navigate(`/users/manage/students/${user.id}`)
  }

  const handleView = async (row) => {
    if (isStudentRow(row)) {
      openStudent360(row)
      return
    }

    setViewUserId(row.id)
    setViewUserType(getRecordTypeQuery(row))
    setViewingUser(row)
  }

  const handleCreateUser = async (formData) => {
    try {
      const response = await createUserMutation.mutateAsync(formData)
      toast.success(response?.message || 'Student created successfully')
      await refreshUsers()
      return true
    } catch (error) {
      const fieldErrors = mapApiErrorsToForm(error?.errors || error?.error?.errors)
      if (Object.keys(fieldErrors).length > 0) {
        return { fieldErrors }
      }
      toast.error(getApiErrorMessage(error, 'Failed to create student'))
      return false
    }
  }

  const handleUpdateUser = async (id, patch, row) => {
    try {
      const recordType = getRecordTypeQuery(row || editingUser)
      const response = await updateUserMutation.mutateAsync({
        id,
        payload: patch,
        type: recordType,
      })
      toast.success(response?.message || 'Student updated successfully')
      await refreshUsers()
      return true
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update student'))
      return false
    }
  }

  const confirmStatusChange = async () => {
    if (!statusTarget || updateStatusMutation.isPending) return

    try {
      const enabling = statusTarget.status !== 'Active'
      setActionUserId(statusTarget.id)

      const recordType = getRecordTypeQuery(statusTarget)
      const targetId = statusTarget.id

      const response = await updateStatusMutation.mutateAsync({
        id: targetId,
        status: enabling,
        type: recordType,
        recordType,
      })

      await refreshUsers()
      toast.success(response?.message || (enabling ? 'User enabled successfully' : 'User disabled successfully'))
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update user status'))
    } finally {
      setStatusTarget(null)
      setActionUserId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget || deleteUserMutation.isPending) return

    try {
      setActionUserId(deleteTarget.id)
      const recordType = getRecordTypeQuery(deleteTarget)
      const targetId = deleteTarget.id

      const response = await deleteUserMutation.mutateAsync({
        id: targetId,
        type: recordType,
      })

      await refreshUsers()
      toast.success(response?.message || 'Student permanently deleted')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete user'))
    } finally {
      setDeleteTarget(null)
      setActionUserId(null)
    }
  }

  const resolvedViewUser = viewUserQuery.data?.summary || viewingUser

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
            {row.studentId ? (
              <p className="mt-1 truncate text-xs font-medium text-[#667085]">
                {row.studentId}
              </p>
            ) : null}
          </div>
        )
        if (isStudentRow(row)) {
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
      key: 'phoneNumber',
      label: 'Phone',
      align: 'center',
      headerClassName: 'min-w-[130px] text-center',
      cellClassName: 'text-center',
      render: (row) => (
        <span className="whitespace-nowrap text-sm font-medium text-[#14213D]">
          {row.phoneNumber || row.phone || '—'}
        </span>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      align: 'center',
      headerClassName: 'min-w-[110px] text-center',
      cellClassName: 'text-center',
      render: (row) => <UserRoleBadge role={row.role} roleType={row.roleType || row.roleKey} />,
    },
    {
      key: 'center',
      label: 'Center',
      align: 'center',
      headerClassName: 'min-w-[140px] text-center',
      cellClassName: 'text-center',
      render: (row) => <CenterPill label={row.center || row.assignedCenter} />,
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
      key: 'recordType',
      label: 'Type',
      align: 'center',
      headerClassName: 'min-w-[90px] text-center',
      cellClassName: 'text-center',
      render: (row) => <RecordTypeBadge recordType={row.recordType} />,
    },
    {
      key: 'joinedDate',
      label: 'Joined',
      align: 'center',
      headerClassName: 'min-w-[120px] text-center',
      cellClassName: 'text-center',
      render: (row) => (
        <span className="whitespace-nowrap text-sm font-medium text-[#667085]">
          {formatManageUserJoinDate(row.joinedDate || row.joinedAt)}
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
            actionUserId === row.id &&
            (updateStatusMutation.isPending || deleteUserMutation.isPending)
          }
          onView={() => handleView(row)}
          onEdit={() => openEdit(row)}
          onStatusToggle={() => setStatusTarget(row)}
          onDelete={() => setDeleteTarget(row)}
        />
      ),
    },
  ]

  return (
    <div className={ADMIN_PAGE_SECTION}>
      <section className={ADMIN_PAGE_INNER}>
        <PageBanner
          icon={Users}
          iconClassName="text-[#246392]"
          title={pageTitle}
          subtitle="Manage students and staff accounts across centers."
          className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
        >
          <button type="button" onClick={openCreate} className={ADMIN_CREATE_BTN}>
            {createLabel}
          </button>
        </PageBanner>

        <AdminDataPanel
          noTableWrap
          toolbar={
            <ManageUsersFilterToolbar
              search={search}
              onSearchChange={(e) => setSearch(e.target.value)}
              roleFilter={roleFilter}
              onRoleFilterChange={(e) => setRoleFilter(e.target.value)}
              centerFilter={centerFilter}
              onCenterFilterChange={(e) => setCenterFilter(e.target.value)}
              statusFilter={statusFilter}
              onStatusFilterChange={(e) => setStatusFilter(e.target.value)}
              recordTypeFilter={recordTypeFilter}
              onRecordTypeFilterChange={(e) => setRecordTypeFilter(e.target.value)}
              roleOptions={roleOptions}
              centerOptions={centerOptions}
            />
          }
        >
          {loading && !users.length ? (
            <div className="mt-5 rounded-xl border border-slate-100 bg-white p-6 text-sm text-slate-500">
              Loading users…
            </div>
          ) : (
            <div className="relative mt-5 overflow-hidden rounded-xl border border-slate-100">
              {fetching && users.length > 0 ? (
                <div className="absolute inset-x-0 top-0 z-10 h-0.5 animate-pulse bg-[#1D72B8]/40" />
              ) : null}
              <ManageUsersTable
                columns={columns}
                data={users}
                emptyMessage="No users match your search or filters."
                itemLabel="users"
                resetDeps={[search, roleFilter, centerFilter, statusFilter, recordTypeFilter]}
                serverPagination
                totalItems={pagination.totalItems}
                totalPages={pagination.totalPages}
                page={pagination.page}
                pageSize={pagination.pageSize}
                onPageChange={pagination.onPageChange}
                onPageSizeChange={pagination.onPageSizeChange}
              />
            </div>
          )}
        </AdminDataPanel>
      </section>

      <UserFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingUser(null)
        }}
        onCreate={handleCreateUser}
        onUpdate={(id, patch) => handleUpdateUser(id, patch, editingUser)}
        editingUser={editingUser}
        createLabel={createLabel}
        createPending={createUserMutation.isPending}
        updatePending={updateUserMutation.isPending}
      />

      <ViewUserModal
        open={Boolean(viewingUser)}
        onClose={() => {
          setViewingUser(null)
          setViewUserId(null)
          setViewUserType(null)
        }}
        user={resolvedViewUser}
      />

      <ConfirmManageUserStatusModal
        open={Boolean(statusTarget)}
        enabling={statusTarget?.status !== 'Active'}
        loading={updateStatusMutation.isPending}
        onCancel={() => {
          if (!updateStatusMutation.isPending) setStatusTarget(null)
        }}
        onConfirm={confirmStatusChange}
      />

      <ConfirmManageUserDeleteModal
        open={Boolean(deleteTarget)}
        user={deleteTarget}
        loading={deleteUserMutation.isPending}
        onCancel={() => {
          if (!deleteUserMutation.isPending) setDeleteTarget(null)
        }}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
