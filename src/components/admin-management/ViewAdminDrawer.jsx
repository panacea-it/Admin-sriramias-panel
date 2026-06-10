import { useEffect, useState } from 'react'
import { Loader2, Mail, Phone, Shield, User, Hash } from 'lucide-react'
import { toast } from '@/utils/toast'
import ErrorState from '../feedback/ErrorState'
import Modal from '../ui/Modal'
import { StatusBadge } from '../academics/AcademicsUi'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { getApiErrorMessage } from '../../utils/apiError'
import {
  getAdminUserById,
  mapApiAdminToRow,
  mapSessionTimeoutFromApi,
  unwrapAdminUserResponse,
} from '../../services/adminAccessService'
import { SESSION_TIMEOUTS } from '../../data/adminManagementConfig'

function formatSessionTimeout(value) {
  const uiValue = mapSessionTimeoutFromApi(value)
  const match = (SESSION_TIMEOUTS || []).find((o) => o.value === uiValue)
  return match?.label || '—'
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" strokeWidth={2.4} />
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <p className="mt-1 whitespace-pre-wrap text-[14px] font-semibold text-slate-900">
          {value || '—'}
        </p>
      </div>
    </div>
  )
}

export default function ViewAdminDrawer({ open, adminAccessId, onClose }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!open || !adminAccessId) {
      setUser(null)
      setLoadError(null)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const data = await getAdminUserById(adminAccessId)
        const mapped = mapApiAdminToRow(unwrapAdminUserResponse(data))
        if (!cancelled) {
          setUser(mapped)
        }
      } catch (error) {
        if (!cancelled) {
          if (import.meta.env.DEV) {
            console.error(error)
          }
          const message = getApiErrorMessage(error, 'Failed to load user access details')
          setLoadError(message)
          setUser(null)
          toast.error(message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [open, adminAccessId, reloadKey])

  if (!open || !adminAccessId) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="User Access Details"
      className="w-[95%] sm:w-[85%] max-w-[700px]"
    >
      <div className="flex max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <header className="flex shrink-0 items-start gap-3 border-b border-slate-100 px-6 py-5 pr-14">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 text-white shadow-md">
            <Shield className="h-5 w-5" strokeWidth={2.3} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900">User Access Details</h2>
            <p className="mt-0.5 truncate text-sm text-slate-500">
              {loading ? 'Loading…' : user?.employeeName || 'Read-only view'}
            </p>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" aria-label="Loading" />
          </div>
        ) : loadError ? (
          <div className="flex flex-1 flex-col px-6 py-8">
            <ErrorState
              title="Unable to load user details"
              message={loadError}
              onRetry={() => setReloadKey((key) => key + 1)}
            />
          </div>
        ) : user ? (
          <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Row icon={User} label="Full name" value={user.employeeName} />
              <Row icon={Mail} label="Official email" value={user.officialEmail} />
              <Row icon={Phone} label="Mobile number" value={user.contactNumber} />
              <Row icon={Hash} label="Employee ID" value={user.employeeId} />
              <Row icon={Shield} label="Role" value={user.roleTitle} />
              {user.centerName ? (
                <Row icon={Shield} label="Assigned center" value={user.centerName} />
              ) : null}
              <Row
                icon={Shield}
                label="Two-factor authentication"
                value={user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              />
              <Row
                icon={Shield}
                label="Login alert"
                value={user.loginAlertEnabled ? 'Enabled' : 'Disabled'}
              />
              <Row
                icon={Shield}
                label="Session timeout"
                value={formatSessionTimeout(user.sessionTimeout)}
              />
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
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
