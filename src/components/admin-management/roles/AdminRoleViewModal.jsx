import { Loader2 } from 'lucide-react'
import ErrorState from '../../feedback/ErrorState'
import Modal from '../../ui/Modal'
import { StatusBadge } from '../../academics/AcademicsUi'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { useRoleAccess } from '../../../hooks/roleAccess/useRoleAccess'
import { getApiErrorMessage } from '../../../utils/apiError'

function roleStatusLabel(status) {
  return status === 'INACTIVE' ? 'In Active' : 'Active'
}

function DetailRow({ label, children }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <div className="mt-1.5 text-[15px] font-semibold text-slate-900">{children}</div>
    </div>
  )
}

export default function AdminRoleViewModal({ open, roleId, onClose }) {
  const { data: role, isLoading, error, refetch } = useRoleAccess(roleId, {
    enabled: open && Boolean(roleId),
  })

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} size="md" title="View Role Access">
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl">
        <header className="border-b border-slate-100 px-6 py-5 pr-14">
          <h2 className="text-xl font-bold text-slate-900">Role access details</h2>
          <p className="mt-1 text-sm text-slate-500">Read-only view from server</p>
        </header>
        <div className="space-y-4 px-6 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm font-medium text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#246392]" />
              Loading role details…
            </div>
          ) : error ? (
            <ErrorState
              title="Unable to load role details"
              message={getApiErrorMessage(error, 'Failed to load role details')}
              onRetry={refetch}
            />
          ) : role ? (
            <>
              <DetailRow label="Role Title (Display)">{role.label}</DetailRow>
              <DetailRow label="Role Code">
                <span className="font-mono text-sm tracking-wide text-[#246392]">
                  {role.roleCode || '—'}
                </span>
              </DetailRow>
              <DetailRow label="Status">
                <StatusBadge status={roleStatusLabel(role.status)} />
              </DetailRow>
              <DetailRow label="Created On">
                <span className="text-[14px] font-medium text-slate-700">
                  {role.createdAt ? formatCategoryDateTime(role.createdAt) : '—'}
                </span>
              </DetailRow>
              <DetailRow label="Updated On">
                <span className="text-[14px] font-medium text-slate-700">
                  {role.updatedAt ? formatCategoryDateTime(role.updatedAt) : '—'}
                </span>
              </DetailRow>
            </>
          ) : null}
        </div>
        <div className="flex justify-end border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl border border-slate-200/80 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
