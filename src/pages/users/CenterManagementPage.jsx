import { useCallback, useState } from 'react'
import {
  Ban,
  Building2,
  ChevronDown,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCheck,
} from 'lucide-react'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import TablePagination from '../../components/figma/TablePagination'
import CenterFormDrawer from '../../components/center-management/CenterFormDrawer'
import ViewCenterDrawer from '../../components/center-management/ViewCenterDrawer'
import ConfirmCenterDeleteModal from '../../components/center-management/ConfirmCenterDeleteModal'
import ConfirmCenterStatusModal from '../../components/center-management/ConfirmCenterStatusModal'
import CenterTableSkeleton from '../../components/center-management/CenterTableSkeleton'
import { useCenters } from '../../contexts/CentersContext'
import { useCenterManagement } from '../../hooks/useCenterManagement'
import AdminCheckbox from '../../components/admin-management/ui/AdminCheckbox'
import { useTableRowSelection } from '../../hooks/useTableRowSelection'
import { getApiErrorMessage } from '../../utils/apiError'
import {
  buildUpdateCenterPayloadFromPatch,
  deleteCenter as deleteCenterApi,
  updateCenter as updateCenterApi,
  updateCenterStatus,
} from '../../services/centerService'
import { cn } from '../../utils/cn'

const CENTER_STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
]

function CenterStatusFilter({ value, onChange, disabled }) {
  return (
    <div className="relative w-full sm:w-auto sm:min-w-[150px]">
      <select
        id="center-status-filter"
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-label="Status"
        className="h-10 w-full min-h-[38px] appearance-none rounded-lg border-0 bg-[#55ace7] pl-4 pr-9 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#246392]/50 disabled:opacity-60 sm:text-base"
      >
        {CENTER_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white text-[#222]">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
    </div>
  )
}

function StatusPill({ status }) {
  const active = status === 'active'
  return (
    <span
      className={cn(
        'inline-flex min-w-[92px] items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset',
        active
          ? 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25'
          : 'bg-amber-500/15 text-amber-900 ring-amber-500/25',
      )}
    >
      {active ? 'Active' : 'Disabled'}
    </span>
  )
}

export default function CenterManagementPage() {
  const { createCenter } = useCenters()
  const {
    centers,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    refreshCenters,
    patchCenterLocally,
    removeCenterLocally,
  } = useCenterManagement()

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('create')
  const [editing, setEditing] = useState(null)
  const [viewingId, setViewingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [statusTarget, setStatusTarget] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)

  const { selectedIds, selection } = useTableRowSelection((row) => row.centerId)

  const openCreate = () => {
    setFormMode('create')
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (row) => {
    setFormMode('edit')
    setEditing(row)
    setFormOpen(true)
  }

  const handleCreateSuccess = useCallback(
    (mapped) => {
      createCenter(mapped)
      refreshCenters()
    },
    [createCenter, refreshCenters],
  )

  const handleUpdateCenter = useCallback(
    async (centerId, patch) => {
      const payload = buildUpdateCenterPayloadFromPatch(patch)
      await updateCenterApi(centerId, payload)
      toast.success('Center updated successfully')
      await refreshCenters()
    },
    [refreshCenters],
  )

  const handleStatusToggleRequest = (row) => {
    setStatusTarget(row)
  }

  const confirmStatusChange = async () => {
    if (!statusTarget) return
    const enabling = statusTarget.status !== 'active'
    const nextStatus = enabling ? 'active' : 'disabled'
    const apiStatus = enabling ? 'ACTIVE' : 'DISABLED'

    setStatusLoading(true)
    patchCenterLocally(statusTarget.centerId, { status: nextStatus })

    try {
      await updateCenterStatus(statusTarget.centerId, apiStatus)
      toast.success(enabling ? 'Center enabled' : 'Center disabled')
      setStatusTarget(null)
      await refreshCenters()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      patchCenterLocally(statusTarget.centerId, { status: statusTarget.status })
      toast.error(getApiErrorMessage(error, 'Failed to update center status'))
    } finally {
      setStatusLoading(false)
    }
  }

  const toggleSelectAllFiltered = () => {
    const ids = centers.map((c) => c.centerId)
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id))
    selection.onTogglePage(ids, !allSelected)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteCenterApi(deleteTarget.centerId)
      removeCenterLocally(deleteTarget.centerId)
      toast.success('Center deleted')
      setDeleteTarget(null)
      await refreshCenters()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(getApiErrorMessage(error, 'Unable to delete center'))
    } finally {
      setDeleteLoading(false)
    }
  }

  const emptyMessage = loading
    ? null
    : search.trim() || statusFilter !== 'all'
      ? 'No centers match your filters.'
      : 'No centers found. Create your first center to get started.'

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-10 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-6 sm:space-y-8">
        <PageBanner icon={Building2} title="Center Management">
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:w-auto sm:py-2.5"
          >
            <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            Create Center
          </button>
        </PageBanner>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search centers by name, code, city, admin…"
                disabled={loading && centers.length === 0}
                className="w-full rounded-xl border border-slate-200/90 bg-slate-50/80 py-2.5 pl-10 pr-3 text-[13px] font-medium text-slate-900 outline-none ring-violet-500/0 transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/15 disabled:opacity-60"
              />
            </div>
            <CenterStatusFilter
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              disabled={loading && centers.length === 0}
            />
          </div>

          {loading && centers.length === 0 ? (
            <CenterTableSkeleton />
          ) : (
            <>
              <div
                className={cn(
                  'mt-6 overflow-x-auto rounded-xl border border-slate-100',
                  loading && 'pointer-events-none opacity-60',
                )}
              >
                <table className="min-w-[880px] w-full border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/90 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      <th className="w-12 whitespace-nowrap px-4 py-3">
                        <AdminCheckbox
                          id="center-select-all"
                          checked={
                            centers.length > 0 &&
                            centers.every((c) => selectedIds.includes(c.centerId))
                          }
                          aria-label="Select all centers on this page"
                          onChange={toggleSelectAllFiltered}
                        />
                      </th>
                      <th className="whitespace-nowrap px-4 py-3">Center</th>
                      <th className="whitespace-nowrap px-4 py-3">City</th>
                      <th className="whitespace-nowrap px-4 py-3">State</th>
                      <th className="whitespace-nowrap px-4 py-3">Status</th>
                      <th className="whitespace-nowrap px-4 py-3">Assigned admins</th>
                      <th className="whitespace-nowrap px-4 py-3">Created</th>
                      <th className="whitespace-nowrap px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {centers.map((row) => (
                      <tr
                        key={row.centerId}
                        className="bg-white transition hover:bg-violet-50/40"
                      >
                        <td className="px-4 py-3">
                          <AdminCheckbox
                            id={`center-select-${row.centerId}`}
                            checked={selectedIds.includes(row.centerId)}
                            aria-label={`Select ${row.centerName}`}
                            onChange={() => selection.onToggle(row.centerId)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{row.centerName}</div>
                          <div className="text-[12px] font-medium text-slate-500">
                            Code: {row.centerCode}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {row.city || '—'}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {row.state || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill status={row.status} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1 text-[12px] font-semibold text-violet-800 ring-1 ring-violet-500/15">
                            <UserCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                            {row.assignedAdmins?.length ?? 0}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                          {row.createdAt
                            ? new Date(row.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-nowrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setViewingId(row.centerId)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 shadow-sm transition hover:border-violet-300 hover:text-violet-700"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(row)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 shadow-sm transition hover:border-violet-300 hover:text-violet-700"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusToggleRequest(row)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 shadow-sm transition hover:border-amber-300 hover:text-amber-800"
                            >
                              <Ban className="h-3.5 w-3.5" />
                              {row.status === 'active' ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(row)}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200/90 bg-rose-50 px-2.5 py-1.5 text-[12px] font-semibold text-rose-800 shadow-sm transition hover:bg-rose-100"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!loading && centers.length === 0 && emptyMessage && (
                  <div className="px-6 py-14 text-center text-[14px] font-semibold text-slate-500">
                    {emptyMessage}
                  </div>
                )}
              </div>

              {pagination.totalItems > 0 && (
                <TablePagination
                  page={pagination.page}
                  pageSize={pagination.pageSize}
                  totalItems={pagination.totalItems}
                  totalPages={pagination.totalPages}
                  startIndex={pagination.startIndex}
                  endIndex={pagination.endIndex}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  itemLabel="centers"
                  className="mt-0 rounded-b-xl"
                />
              )}
            </>
          )}
        </div>
      </section>

      <CenterFormDrawer
        open={formOpen}
        mode={formMode}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onCreate={handleCreateSuccess}
        onUpdate={handleUpdateCenter}
      />

      <ViewCenterDrawer
        open={!!viewingId}
        centerId={viewingId}
        onClose={() => setViewingId(null)}
      />

      <ConfirmCenterDeleteModal
        open={!!deleteTarget}
        centerName={deleteTarget?.centerName}
        loading={deleteLoading}
        onCancel={() => !deleteLoading && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <ConfirmCenterStatusModal
        open={!!statusTarget}
        centerName={statusTarget?.centerName}
        enabling={statusTarget?.status !== 'active'}
        loading={statusLoading}
        onCancel={() => !statusLoading && setStatusTarget(null)}
        onConfirm={confirmStatusChange}
      />
    </div>
  )
}
