import { useCallback, useMemo, useState } from 'react'
import { Eye, Plus, Shield, Trash2 } from 'lucide-react'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import CourseFilterToolbar from '../../components/courses/CourseFilterToolbar'
import CreateAdminModal from '../../components/admin-management/CreateAdminModal'
import ViewAdminDrawer from '../../components/admin-management/ViewAdminDrawer'
import ConfirmAdminDeleteModal from '../../components/admin-management/ConfirmAdminDeleteModal'
import ConfirmAdminStatusModal from '../../components/admin-management/ConfirmAdminStatusModal'
import EditButton from '../../components/common/EditButton'
import { useTableRowSelection } from '../../hooks/useTableRowSelection'
import { StatusBadge } from '../../components/academics/AcademicsUi'
import { useAdminManagement } from '../../hooks/useAdminManagement'
import { useRolesDropdown } from '../../hooks/useRolesDropdown'
import { useCentersDropdownOptions } from '../../hooks/useCentersDropdownOptions'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { getApiErrorMessage } from '../../utils/apiError'
import {
  deleteAdminUser,
  updateAdminStatus,
} from '../../services/adminAccessService'
import { cn } from '../../utils/cn'

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
    resetFilters,
    refreshUsers,
    patchUserLocally,
    removeUserLocally,
  } = useAdminManagement()

  const { options: roleDropdownOptions = [] } = useRolesDropdown()
  const { options: centerDropdownOptions = [] } = useCentersDropdownOptions()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [viewingId, setViewingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [statusTarget, setStatusTarget] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)

  const { selection, clearSelection } = useTableRowSelection((row) => row.id)

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

  const handleResetFilters = () => {
    resetFilters()
    clearSelection()
  }

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

  const columns = useMemo(
    () => [
      {
        key: 'employeeName',
        label: 'Employee Name',
        headerClassName: 'pl-6 sm:pl-10',
        cellClassName: 'pl-6 sm:pl-10 font-medium',
      },
      {
        key: 'employeeId',
        label: 'Employee Number / Employee ID',
      },
      {
        key: 'roleTitle',
        label: 'Role Title',
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => (
          <button
            type="button"
            onClick={() => handleStatusToggleRequest(row)}
            className={cn('rounded-md transition hover:opacity-90')}
            title="Click to change status"
          >
            <StatusBadge status={row.status} />
          </button>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created Date',
        render: (row) => (
          <span className="text-[#686868]">{formatCategoryDateTime(row.createdAt)}</span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (row) => (
          <div className="flex flex-nowrap items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setViewingId(row.id)}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#686868] transition hover:text-[#246392] sm:text-base"
            >
              <Eye className="h-4 w-4" strokeWidth={2.2} />
              View
            </button>
            <EditButton onClick={() => openEdit(row)} />
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#c96565] transition hover:text-[#b94b4b] sm:text-base"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2.1} />
              Delete
            </button>
          </div>
        ),
      },
    ],
    [],
  )

  const emptyMessage = loadError
    ? 'Unable to load admin users.'
    : search.trim() || roleFilter !== 'all' || centerFilter !== 'all' || statusFilter !== 'all'
      ? 'No employees match your filters.'
      : 'No employees found'

  const emptyState = loadError ? (
    <div className="flex flex-col items-center gap-3 px-6 py-10">
      <p className="text-sm font-semibold text-slate-600">{loadError}</p>
      <button
        type="button"
        onClick={() => refreshUsers()}
        className="rounded-lg border border-[#55ace7]/25 bg-white px-4 py-2 text-sm font-semibold text-[#246392] shadow-sm transition hover:bg-[#eef2fc]"
      >
        Retry
      </button>
    </div>
  ) : undefined

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
          open={!!deleteTarget}
          employeeName={deleteTarget?.employeeName}
          loading={deleteLoading}
          onCancel={() => !deleteLoading && setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />

        <ConfirmAdminStatusModal
          open={!!statusTarget}
          employeeName={statusTarget?.employeeName}
          enabling={statusTarget?.status !== 'Active'}
          loading={statusLoading}
          onCancel={() => !statusLoading && setStatusTarget(null)}
          onConfirm={confirmStatusChange}
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
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
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="h-10 min-h-[38px] shrink-0 rounded-lg border border-[#55ace7]/25 bg-white px-4 text-sm font-semibold text-[#246392] shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition hover:bg-[#eef2fc] sm:text-base"
          >
            Reset
          </button>
        </div>

        <PaginatedFigmaTable
          columns={columns}
          data={users}
          emptyMessage={emptyMessage}
          emptyState={emptyState}
          itemLabel="employees"
          loading={loading}
          skeletonRowCount={8}
          controlledPagination={pagination}
          resetDeps={[search, roleFilter, centerFilter, statusFilter]}
          rowClassName="hover:bg-slate-50/90"
          selection={selection}
        />
      </section>
    </div>
  )
}
