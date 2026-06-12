import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users } from 'lucide-react'
import { toast } from '@/utils/toast'
import ManageUsersFilterToolbar from '../../components/manage-users/ManageUsersFilterToolbar'
import ManageUsersBulkActionsBar from '../../components/manage-users/ManageUsersBulkActionsBar'
import ManageUsersTable from '../../components/manage-users/ManageUsersTable'
import ManageUsersTableActions from '../../components/manage-users/ManageUsersTableActions'
import ConfirmManageUserDeleteModal from '../../components/manage-users/ConfirmManageUserDeleteModal'
import ConfirmManageUserStatusModal from '../../components/manage-users/ConfirmManageUserStatusModal'
import UserFormModal from '../../components/manage-users/UserFormModal'
import ViewUserModal from '../../components/manage-users/ViewUserModal'
import {
  MANAGE_USERS_STATIC_CENTERS,
  MANAGE_USERS_STATIC_DATA,
  buildUserFromCreateForm,
  formatManageUserJoinDate,
} from '../../components/manage-users/manageUsersStaticData'
import { useTableRowSelection } from '../../hooks/useTableRowSelection'
import { roleLabel } from '../../data/manageUsersConfig'
import { cn } from '../../utils/cn'

const ROLE_BADGE_STYLES = {
  student: 'bg-[#EEF5FF] text-[#1D72B8] ring-[#4CA6E8]/30',
  admin: 'bg-violet-50 text-violet-700 ring-violet-200/60',
  faculty: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
  counselor: 'bg-orange-50 text-orange-700 ring-orange-200/60',
  employee: 'bg-[#F5F7FB] text-[#667085] ring-[#E7ECF5]',
  support_staff: 'bg-[#F5F7FB] text-[#667085] ring-[#E7ECF5]',
}

function roleDisplayLabel(role) {
  if (role === 'faculty') return 'Teacher'
  if (role === 'counselor') return 'Parent'
  return roleLabel(role)
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

function UserRoleBadge({ role }) {
  const style = ROLE_BADGE_STYLES[role] || ROLE_BADGE_STYLES.employee
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        style,
      )}
    >
      {roleDisplayLabel(role)}
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
  const [users, setUsers] = useState(MANAGE_USERS_STATIC_DATA)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [centerFilter, setCenterFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [viewingUser, setViewingUser] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [actionUserId, setActionUserId] = useState(null)

  const { selectedIds, selection, clearSelection } = useTableRowSelection((row) => row.id)

  const centerOptions = useMemo(() => [...MANAGE_USERS_STATIC_CENTERS], [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (centerFilter !== 'all' && u.assignedCenter !== centerFilter) return false
      if (statusFilter !== 'all' && u.status !== statusFilter) return false
      if (!q) return true
      const hay = [
        u.fullName,
        u.email,
        u.phone,
        u.parentName,
        u.parentPhone,
        u.userId,
        roleDisplayLabel(u.role),
        u.assignedCenter,
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [users, search, roleFilter, centerFilter, statusFilter])

  const selectedActiveCount = useMemo(
    () => users.filter((u) => selectedIds.includes(u.id) && u.status === 'Active').length,
    [users, selectedIds],
  )

  const handleBulkDisable = () => {
    const targets = users.filter(
      (user) => selectedIds.includes(user.id) && user.status === 'Active',
    )
    if (!targets.length) return

    setUsers((prev) =>
      prev.map((user) =>
        selectedIds.includes(user.id) && user.status === 'Active'
          ? { ...user, status: 'In Active' }
          : user,
      ),
    )
    toast.success(
      targets.length === 1 ? 'User disabled' : `${targets.length} users disabled`,
    )
    clearSelection()
  }

  const handleBulkDelete = () => {
    if (!selectedIds.length) return
    if (!window.confirm(`Delete ${selectedIds.length} selected user(s)? This cannot be undone.`)) {
      return
    }

    setUsers((prev) => prev.filter((user) => !selectedIds.includes(user.id)))
    toast.success(
      selectedIds.length === 1 ? 'User deleted' : `${selectedIds.length} users deleted`,
    )
    clearSelection()
  }

  const handleCreateUser = (formData) => {
    const user = buildUserFromCreateForm(formData, { nextIndex: users.length + 1 })
    setUsers((prev) => [user, ...prev])
    toast.success('User added successfully')
  }

  const handleUpdateUser = (id, patch) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, ...patch, email: patch.email?.toLowerCase?.() ?? user.email } : user)),
    )
  }

  const openCreate = () => {
    setEditingUser(null)
    setFormOpen(true)
  }

  const openEdit = (user) => {
    setEditingUser(user)
    setFormOpen(true)
  }

  const openStudent360 = (user) => {
    navigate(`/users/manage/students/${user.id}`)
  }

  const isStudent = (row) => row.role === 'student'

  const handleView = (row) => {
    try {
      if (isStudent(row)) {
        openStudent360(row)
        return
      }
      setViewingUser(row)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error('Unable to open user details')
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

    setUsers((prev) =>
      prev.map((user) =>
        user.id === statusTarget.id ? { ...user, status: nextStatus } : user,
      ),
    )
    toast.success(enabling ? 'User enabled successfully' : 'User disabled successfully')
    setStatusTarget(null)
    setStatusLoading(false)
    setActionUserId(null)
  }

  const confirmDelete = async () => {
    if (!deleteTarget || deleteLoading) return

    setDeleteLoading(true)
    setActionUserId(deleteTarget.id)

    setUsers((prev) => prev.filter((user) => user.id !== deleteTarget.id))
    toast.success('User deleted successfully')
    setDeleteTarget(null)
    setDeleteLoading(false)
    setActionUserId(null)
  }

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
        if (isStudent(row)) {
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
      render: (row) => <UserRoleBadge role={row.role} />,
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
          disabled={actionUserId === row.id && (statusLoading || deleteLoading)}
          onView={() => handleView(row)}
          onEdit={() => openEdit(row)}
          onStatusToggle={() => handleStatusToggleRequest(row)}
          onDelete={() => setDeleteTarget(row)}
        />
      ),
    },
  ]

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
          data={filtered}
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
        onUpdate={handleUpdateUser}
        editingUser={editingUser}
        centerOptions={centerOptions}
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
