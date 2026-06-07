import { useCallback, useMemo, useState } from 'react'
import { Eye, LayoutGrid, Loader2, Pencil, Trash2 } from 'lucide-react'
import { toast } from '@/utils/toast'
import ErrorState from '../../components/feedback/ErrorState'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import CategoryBreadcrumb from '../../components/categories/CategoryBreadcrumb'
import CourseFilterToolbar from '../../components/courses/CourseFilterToolbar'
import { BannerButton, StatusBadge } from '../../components/academics/AcademicsUi'
import AdminRoleFormModal from '../../components/admin-management/roles/AdminRoleFormModal'
import AdminRoleViewModal from '../../components/admin-management/roles/AdminRoleViewModal'
import ConfirmRoleDeleteModal from '../../components/admin-management/roles/ConfirmRoleDeleteModal'
import ConfirmRoleStatusModal from '../../components/admin-management/roles/ConfirmRoleStatusModal'
import { useRoleManagement } from '../../hooks/useRoleManagement'
import { useApiRolesCatalogSync, syncApiRolesCatalog } from '../../hooks/useApiRolesCatalogSync'
import { useAdminRolesSafe } from '../../contexts/AdminRolesContext'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { getApiErrorMessage } from '../../utils/apiError'
import { deleteRole as deleteRoleApi, updateRole as updateRoleApi } from '../../services/roleService'
import { cn } from '../../utils/cn'

const BREADCRUMB = [
  { label: 'Admin Management' },
  { label: 'Role Access' },
]

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Status' },
  { value: 'Active', label: 'Active' },
  { value: 'In Active', label: 'In Active' },
]

function roleStatus(role) {
  return role.enabled ? 'Active' : 'In Active'
}

function canToggleRoleStatus(role) {
  return role && !role.systemProtected && !role.fullAccess
}

function RoleAccessTableActions({ onView, onEdit, onDelete, canDelete }) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <button
        type="button"
        onClick={onView}
        title="View"
        aria-label="View"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#246392]"
      >
        <Eye className="h-4 w-4" strokeWidth={2.2} />
      </button>
      <button
        type="button"
        onClick={onEdit}
        title="Edit"
        aria-label="Edit"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#246392]"
      >
        <Pencil className="h-4 w-4" strokeWidth={2.2} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={!canDelete}
        title="Delete"
        aria-label="Delete"
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50 hover:text-rose-700',
          !canDelete && 'cursor-not-allowed opacity-40 hover:bg-transparent',
        )}
      >
        <Trash2 className="h-4 w-4" strokeWidth={2.1} />
      </button>
    </div>
  )
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

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewingId, setViewingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [statusTarget, setStatusTarget] = useState(null)
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

  const handleStatusToggleRequest = useCallback((row) => {
    if (!canToggleRoleStatus(row) || statusUpdatingId) return
    setStatusTarget(row)
  }, [statusUpdatingId])

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

  const confirmDelete = useCallback(async () => {
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
  }, [deleteTarget, removeRoleLocally, refreshRolesAndCatalog])

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

  const columns = useMemo(
    () => [
      {
        key: 'num',
        label: '#',
        headerClassName: 'w-14 pl-6 sm:pl-8',
        cellClassName: 'pl-6 sm:pl-8 text-slate-500 tabular-nums',
        render: (row) => {
          const index = roles.findIndex((r) => r.id === row.id)
          return index >= 0 ? pagination.startIndex + index + 1 : '—'
        },
      },
      {
        key: 'label',
        label: 'Role Title (Display)',
        render: (row) => (
          <span className="font-semibold text-slate-900">{row.label}</span>
        ),
      },
      {
        key: 'code',
        label: 'Role Code',
        render: (row) => (
          <span className="font-mono text-sm tracking-wide text-[#246392]">
            {row.roleCode || '—'}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => {
          const isUpdating = statusUpdatingId === row.id
          const toggleable = canToggleRoleStatus(row)

          if (isUpdating) {
            return (
              <span className="inline-flex min-w-[88px] items-center justify-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Updating
              </span>
            )
          }

          if (!toggleable) {
            return <StatusBadge status={roleStatus(row)} />
          }

          return (
            <button
              type="button"
              onClick={() => handleStatusToggleRequest(row)}
              className="rounded-md transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
              title="Click to change status"
            >
              <StatusBadge status={roleStatus(row)} />
            </button>
          )
        },
      },
      {
        key: 'createdAt',
        label: 'Created On',
        render: (row) => (
          <span className="whitespace-nowrap text-slate-500">
            {row.createdAt ? formatCategoryDateTime(row.createdAt) : '—'}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        headerClassName: 'pr-6 sm:pr-8',
        cellClassName: 'pr-6 sm:pr-8',
        render: (row) => (
          <RoleAccessTableActions
            onView={() => setViewingId(row.id)}
            onEdit={() => openEdit(row)}
            onDelete={() => setDeleteTarget(row)}
            canDelete={!row.systemProtected && !row.fullAccess}
          />
        ),
      },
    ],
    [roles, pagination.startIndex, openEdit, handleStatusToggleRequest, statusUpdatingId],
  )

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

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
            <PaginatedFigmaTable
              columns={columns}
              data={roles}
              emptyMessage={emptyMessage}
              emptyState={emptyState}
              itemLabel="roles"
              loading={loading}
              skeletonRowCount={pageSize}
              rowClassName="hover:bg-slate-50/90"
              controlledPagination={controlledPagination}
              tableClassName="rounded-none border-0 shadow-none"
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
        open={!!deleteTarget}
        roleLabel={deleteTarget?.label}
        loading={deleteLoading}
        onCancel={() => !deleteLoading && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
      <ConfirmRoleStatusModal
        open={!!statusTarget}
        roleLabel={statusTarget?.label || 'this role'}
        enabling={!statusTarget?.enabled}
        loading={statusLoading}
        onCancel={() => !statusLoading && setStatusTarget(null)}
        onConfirm={confirmStatusChange}
      />
    </div>
  )
}
