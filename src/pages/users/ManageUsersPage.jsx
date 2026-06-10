import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Users } from 'lucide-react'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import ManageUsersFilterToolbar from '../../components/manage-users/ManageUsersFilterToolbar'
import ManageUsersBulkActionsBar from '../../components/manage-users/ManageUsersBulkActionsBar'
import ManageUsersTableActions from '../../components/manage-users/ManageUsersTableActions'
import ConfirmManageUserDeleteModal from '../../components/manage-users/ConfirmManageUserDeleteModal'
import ConfirmManageUserStatusModal from '../../components/manage-users/ConfirmManageUserStatusModal'
import UserFormModal from '../../components/manage-users/UserFormModal'
import ViewUserModal from '../../components/manage-users/ViewUserModal'
import { StatusBadge } from '../../components/academics/AcademicsUi'
import { useCenters } from '../../contexts/CentersContext'
import { useTableRowSelection } from '../../hooks/useTableRowSelection'
import { DEFAULT_CENTER_NAMES, roleLabel } from '../../data/manageUsersConfig'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import {
  deleteManageUser,
  loadManageUsers,
  updateManageUser,
} from '../../utils/manageUsersStorage'

export default function ManageUsersPage() {
  const navigate = useNavigate()
  const { activeCenters } = useCenters()
  const [users, setUsers] = useState(() => loadManageUsers())
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

  const centerOptions = useMemo(() => {
    const fromCenters = activeCenters
      .map((c) => c.city || c.centerName)
      .filter(Boolean)
    const merged = [...new Set([...fromCenters, ...DEFAULT_CENTER_NAMES])]
    return merged.sort((a, b) => a.localeCompare(b))
  }, [activeCenters])

  const refresh = useCallback(() => {
    setUsers(loadManageUsers())
  }, [])

  useEffect(() => {
    const onUpdate = () => refresh()
    window.addEventListener('manage-users-updated', onUpdate)
    return () => window.removeEventListener('manage-users-updated', onUpdate)
  }, [refresh])

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
        roleLabel(u.role),
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

    let successCount = 0
    for (const user of targets) {
      const result = updateManageUser(user.id, { status: 'In Active' })
      if (result.ok) successCount += 1
    }

    if (successCount > 0) {
      toast.success(
        successCount === 1 ? 'User disabled' : `${successCount} users disabled`,
      )
      refresh()
    }
    clearSelection()
  }

  const handleBulkDelete = () => {
    if (!selectedIds.length) return
    if (!window.confirm(`Delete ${selectedIds.length} selected user(s)? This cannot be undone.`)) {
      return
    }

    let successCount = 0
    for (const id of selectedIds) {
      const result = deleteManageUser(id)
      if (result.ok) successCount += 1
    }

    if (successCount > 0) {
      toast.success(
        successCount === 1 ? 'User deleted' : `${successCount} users deleted`,
      )
      refresh()
    }
    clearSelection()
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

    try {
      const result = updateManageUser(statusTarget.id, { status: nextStatus })
      if (!result.ok) {
        toast.error(result.reason || 'Failed to update user status')
        return
      }
      toast.success(enabling ? 'User enabled successfully' : 'User disabled successfully')
      setStatusTarget(null)
      refresh()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error('Failed to update user status')
    } finally {
      setStatusLoading(false)
      setActionUserId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget || deleteLoading) return

    setDeleteLoading(true)
    setActionUserId(deleteTarget.id)

    try {
      const result = deleteManageUser(deleteTarget.id)
      if (!result.ok) {
        toast.error(result.reason || 'Failed to delete user')
        return
      }
      toast.success('User deleted successfully')
      setDeleteTarget(null)
      refresh()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error('Failed to delete user')
    } finally {
      setDeleteLoading(false)
      setActionUserId(null)
    }
  }

  const handleResetFilters = () => {
    setSearch('')
    setRoleFilter('all')
    setCenterFilter('all')
    setStatusFilter('all')
  }

  const columns = [
    {
      key: 'fullName',
      label: 'Full Name',
      headerClassName: 'pl-6 sm:pl-10',
      cellClassName: 'pl-6 sm:pl-10',
      render: (row) => {
        const inner = (
          <div className="min-w-0">
            <p className="truncate font-medium text-[#111]">{row.fullName}</p>
            <p className="font-mono text-xs text-[#686868]">{row.userId}</p>
          </div>
        )
        if (isStudent(row)) {
          return (
            <button
              type="button"
              onClick={() => openStudent360(row)}
              className="flex min-w-0 cursor-pointer items-center gap-3 text-left hover:opacity-80"
            >
              {inner}
            </button>
          )
        }
        return <div className="flex min-w-0 items-center gap-3">{inner}</div>
      },
    },
    {
      key: 'email',
      label: 'Email',
      render: (row) => <span className="truncate text-[#444]">{row.email}</span>,
    },
    {
      key: 'phone',
      label: 'Phone Number',
      render: (row) => row.phone,
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => (
        <span className="inline-flex rounded-md bg-[#eef6fc] px-2.5 py-1 text-xs font-semibold text-[#246392]">
          {roleLabel(row.role)}
        </span>
      ),
    },
    {
      key: 'assignedCenter',
      label: 'Assigned Center',
      render: (row) => row.assignedCenter || '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'joinedAt',
      label: 'Joined Date',
      render: (row) => (
        <span className="whitespace-nowrap text-[#686868]">
          {formatCategoryDateTime(row.joinedAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
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
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-10 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <PageBanner icon={Users} title="List Users">
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-10 min-h-[38px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
          >
            <PlusCircle className="h-4 w-4 shrink-0" strokeWidth={2.2} />
            Add User
          </button>
        </PageBanner>

        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
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
          <button
            type="button"
            onClick={handleResetFilters}
            className="h-10 min-h-[38px] shrink-0 rounded-lg border border-[#55ace7]/25 bg-white px-4 text-sm font-semibold text-[#246392] shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition hover:bg-[#eef2fc]"
          >
            Reset
          </button>
        </div>

        {selectedIds.length > 0 && (
          <ManageUsersBulkActionsBar
            count={selectedIds.length}
            disableCount={selectedActiveCount}
            onDisable={handleBulkDisable}
            onDelete={handleBulkDelete}
          />
        )}

        <PaginatedFigmaTable
          columns={columns}
          data={filtered}
          emptyMessage="No users match your search or filters."
          itemLabel="users"
          resetDeps={[search, roleFilter, centerFilter, statusFilter]}
          selection={selection}
          rowClassName="hover:bg-slate-50/90"
        />
      </section>

      <UserFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingUser(null)
        }}
        onSuccess={refresh}
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
