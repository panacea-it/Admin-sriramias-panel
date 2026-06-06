import { useCallback, useMemo, useState } from 'react'
import { Eye, LayoutGrid, Pencil, Trash2 } from 'lucide-react'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import CategoryBreadcrumb from '../../components/categories/CategoryBreadcrumb'
import CourseFilterToolbar from '../../components/courses/CourseFilterToolbar'
import { BannerButton, StatusBadge } from '../../components/academics/AcademicsUi'
import AdminRoleFormModal from '../../components/admin-management/roles/AdminRoleFormModal'
import AdminRoleViewModal from '../../components/admin-management/roles/AdminRoleViewModal'
import ConfirmRoleDeleteModal from '../../components/admin-management/roles/ConfirmRoleDeleteModal'
import { useRoleManagement } from '../../hooks/useRoleManagement'
import { useApiRolesCatalogSync, syncApiRolesCatalog } from '../../hooks/useApiRolesCatalogSync'
import { useAdminRolesSafe } from '../../contexts/AdminRolesContext'
import { useTableRowSelection } from '../../hooks/useTableRowSelection'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { getApiErrorMessage } from '../../utils/apiError'
import { deleteRole as deleteRoleApi } from '../../services/roleService'
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

function RoleAccessTableActions({ onView, onEdit, onDelete, canDelete }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <button
        type="button"
        onClick={onView}
        title="View"
        aria-label="View"
        className="inline-flex items-center justify-center rounded-md p-1.5 text-[#686868] transition hover:bg-slate-100 hover:text-[#246392]"
      >
        <Eye className="h-4 w-4" strokeWidth={2.2} />
      </button>
      <button
        type="button"
        onClick={onEdit}
        title="Edit"
        aria-label="Edit"
        className="inline-flex items-center justify-center rounded-md p-1.5 text-[#686868] transition hover:bg-slate-100 hover:text-[#246392]"
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
          'inline-flex items-center justify-center rounded-md p-1.5 text-[#c96565] transition hover:bg-red-50 hover:text-[#b94b4b]',
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
    resetFilters,
  } = useRoleManagement()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewingId, setViewingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { selection, clearSelection } = useTableRowSelection((row) => row.id)

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

  const handleResetFilters = useCallback(() => {
    resetFilters()
    clearSelection()
  }, [resetFilters, clearSelection])

  const emptyMessage = useMemo(() => {
    if (loading) return null
    if (loadError) return 'Unable to load roles.'
    if (search.trim() || statusFilter !== 'all') {
      return 'No roles match your filters.'
    }
    return 'No roles found. Create your first role access to get started.'
  }, [loading, loadError, search, statusFilter])

  const emptyState = loadError ? (
    <div className="flex flex-col items-center gap-3 px-6 py-10">
      <p className="text-sm font-semibold text-slate-600">{loadError}</p>
      <button
        type="button"
        onClick={() => refreshRolesAndCatalog()}
        className="rounded-lg border border-[#55ace7]/25 bg-white px-4 py-2 text-sm font-semibold text-[#246392] shadow-sm transition hover:bg-[#eef2fc]"
      >
        Retry
      </button>
    </div>
  ) : undefined

  const columns = useMemo(
    () => [
      {
        key: 'num',
        label: '#',
        headerClassName: 'w-14 pl-6 sm:pl-10',
        cellClassName: 'pl-6 sm:pl-10 text-[#686868]',
        render: (row) => {
          const index = roles.findIndex((r) => r.id === row.id)
          return index >= 0 ? pagination.startIndex + index + 1 : '—'
        },
      },
      {
        key: 'label',
        label: 'Role Title (Display)',
        render: (row) => <span className="font-medium">{row.label}</span>,
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
        render: (row) => <StatusBadge status={roleStatus(row)} />,
      },
      {
        key: 'createdAt',
        label: 'Created On',
        render: (row) => (
          <span className="whitespace-nowrap text-[#686868]">
            {row.createdAt ? formatCategoryDateTime(row.createdAt) : '—'}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
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
    [roles, pagination.startIndex, openEdit],
  )

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
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

        <div className="flex min-h-14 flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <CourseFilterToolbar
              search={search}
              onSearchChange={(e) => setSearch(e.target.value)}
              searchPlaceholder="Search roles"
              status={statusFilter}
              onStatusChange={(e) => setStatusFilter(e.target.value)}
              statusOptions={STATUS_FILTER_OPTIONS}
            />
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            disabled={loading && roles.length === 0}
            className="h-10 shrink-0 rounded-lg border border-[#d5dae8] bg-white px-4 text-sm font-semibold text-[#246392] shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition hover:bg-[#eef2fc] disabled:opacity-60 sm:text-base"
          >
            Reset filter
          </button>
        </div>

        <PaginatedFigmaTable
          columns={columns}
          data={roles}
          emptyMessage={emptyMessage}
          emptyState={emptyState}
          itemLabel="roles"
          loading={loading}
          skeletonRowCount={pageSize}
          rowClassName="hover:bg-slate-50/90"
          selection={selection}
          controlledPagination={controlledPagination}
        />
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
    </div>
  )
}
