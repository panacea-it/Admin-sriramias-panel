import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, PlusCircle, Users } from 'lucide-react'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import EditButton from '../../components/common/EditButton'
import ManageUsersFilterToolbar from '../../components/manage-users/ManageUsersFilterToolbar'
import UserFormModal from '../../components/manage-users/UserFormModal'
import ViewUserModal from '../../components/manage-users/ViewUserModal'
import { StatusBadge } from '../../components/academics/AcademicsUi'
import { useCenters } from '../../contexts/CentersContext'
import { DEFAULT_CENTER_NAMES, roleLabel } from '../../data/manageUsersConfig'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { loadManageUsers } from '../../utils/manageUsersStorage'

function UserAvatar({ user }) {
  if (user.profileImage) {
    return (
      <img
        src={user.profileImage}
        alt=""
        className="h-8 w-8 shrink-0 rounded-full border border-[#eef2fc] object-cover"
      />
    )
  }
  return <span className="h-8 w-8 shrink-0 rounded-full bg-[#cbeeff]" />
}

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
          <>
            <UserAvatar user={row} />
            <div className="min-w-0">
              <p className="truncate font-medium text-[#111]">{row.fullName}</p>
              <p className="font-mono text-xs text-[#686868]">{row.userId}</p>
            </div>
          </>
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
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => (isStudent(row) ? openStudent360(row) : setViewingUser(row))}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#686868] transition hover:text-[#246392]"
          >
            <Eye className="h-4 w-4" />
            View
          </button>
          <EditButton onClick={() => openEdit(row)} />
        </div>
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

        <PaginatedFigmaTable
          columns={columns}
          data={filtered}
          emptyMessage="No users match your search or filters."
          itemLabel="users"
          resetDeps={[search, roleFilter, centerFilter, statusFilter]}
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
    </div>
  )
}
