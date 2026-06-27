import { Mail, Phone, Shield, User, Hash, Loader2 } from 'lucide-react'
import ErrorState from '../feedback/ErrorState'
import Modal from '../ui/Modal'
import { StatusBadge } from '../academics/AcademicsUi'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { getApiErrorMessage } from '../../utils/apiError'
import { useAdmin } from '../../hooks/admin/useAdmin'
import AdminRoleBadge from './AdminRoleBadge'

function Row({ icon: Icon, label, value, children }) {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" strokeWidth={2.4} />
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        {children || (
          <p className="mt-1 whitespace-pre-wrap text-[14px] font-semibold text-slate-900">
            {value || '—'}
          </p>
        )}
      </div>
    </div>
  )
}

export default function ViewAdminDrawer({ open, adminAccessId, onClose }) {
  const { data: user, isLoading, error, refetch } = useAdmin(adminAccessId, {
    enabled: open && Boolean(adminAccessId),
  })

  if (!open || !adminAccessId) return null

  const loadError = error ? getApiErrorMessage(error, 'Failed to load admin details') : null
  const centerDisplay = [user?.centerName, user?.centerCode].filter((v) => v && v !== '—').join(' · ')

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Admin Account Details"
      className="w-[95%] sm:w-[85%] max-w-[700px]"
    >
      <div className="flex max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <header className="flex shrink-0 items-start gap-3 border-b border-slate-100 px-6 py-5 pr-14">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 text-white shadow-md">
            <Shield className="h-5 w-5" strokeWidth={2.3} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900">Admin Account Details</h2>
            <p className="mt-0.5 truncate text-sm text-slate-500">
              {isLoading ? 'Loading…' : user?.fullName || 'Read-only view'}
            </p>
          </div>
        </header>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" aria-label="Loading" />
          </div>
        ) : loadError ? (
          <div className="flex flex-1 flex-col px-6 py-8">
            <ErrorState
              title="Unable to load admin details"
              message={loadError}
              onRetry={refetch}
            />
          </div>
        ) : user ? (
          <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Row icon={User} label="Full name" value={user.fullName} />
              <Row icon={Mail} label="Official email" value={user.officialEmail} />
              <Row icon={Phone} label="Contact number" value={user.contactNumber} />
              <Row icon={Hash} label="Employee ID" value={user.employeeId} />
              <Row icon={Shield} label="Role">
                <div className="mt-2">
                  <AdminRoleBadge roleTitle={user.roleTitle} roleCode={user.roleCode} />
                  {user.roleCode ? (
                    <p className="mt-1 text-xs font-medium text-slate-500">{user.roleCode}</p>
                  ) : null}
                </div>
              </Row>
              <Row icon={Shield} label="Center" value={centerDisplay || '—'} />
              <Row icon={Shield} label="Last login">
                <p className="mt-1 text-[14px] font-semibold text-slate-900">
                  {user.lastLoginAt ? formatCategoryDateTime(user.lastLoginAt) : '—'}
                </p>
              </Row>
              <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" strokeWidth={2.4} />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    Status
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={user.status} />
                  </div>
                </div>
              </div>
              <Row icon={Shield} label="Created" value={formatCategoryDateTime(user.createdAt)} />
              <Row icon={Shield} label="Updated" value={formatCategoryDateTime(user.updatedAt)} />
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
