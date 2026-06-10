import { useEffect, useState } from 'react'
import { Building2, Calendar, Loader2, Mail, MapPin, Phone, Users } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../ui/Modal'
import { getCenterById, mapApiCenterToLocal } from '../../services/centerService'
import { getApiErrorMessage } from '../../utils/apiError'

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

function StatusRow({ status }) {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
      <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" strokeWidth={2.4} />
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Status</p>
        <p className="mt-1 text-[14px] font-semibold">
          {status === 'disabled' ? (
            <span className="text-amber-700">Disabled</span>
          ) : (
            <span className="text-emerald-700">Active</span>
          )}
        </p>
      </div>
    </div>
  )
}

function formatCreatedDate(createdAt) {
  if (!createdAt) return '—'
  return new Date(createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function ViewCenterDrawer({ open, centerId, onClose }) {
  const [center, setCenter] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !centerId) {
      setCenter(null)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const data = await getCenterById(centerId)
        const mapped = mapApiCenterToLocal(data?.data ?? data?.center ?? data)
        if (!cancelled) {
          setCenter(mapped)
        }
      } catch (error) {
        if (!cancelled) {
          if (import.meta.env.DEV) {
            console.error(error)
          }
          toast.error(getApiErrorMessage(error, 'Failed to load center details'))
          onClose()
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
  }, [open, centerId, onClose])

  if (!open) return null

  const admins =
    center?.assignedAdmins?.length > 0 ? center.assignedAdmins.join(', ') : 'None assigned'

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={center?.centerName || 'Center details'}
      className="w-[95%] sm:w-[85%] max-w-[740px]"
    >
      <div className="flex max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <header className="flex shrink-0 items-start gap-3 border-b border-slate-100 px-6 py-5 pr-14">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 text-white shadow-md">
            <Building2 className="h-5 w-5" strokeWidth={2.3} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold tracking-tight text-slate-900">
              {loading ? 'Loading center…' : center?.centerName || 'Center details'}
            </h2>
            {center && !loading && (
              <p className="mt-1 text-[13px] font-semibold text-violet-700">
                {center.centerCode}{' '}
                <span className="font-medium text-slate-500">
                  ·{' '}
                  {center.status === 'disabled' ? (
                    <span className="text-amber-700">Disabled</span>
                  ) : (
                    <span className="text-emerald-700">Active</span>
                  )}
                </span>
              </p>
            )}
          </div>
        </header>

        <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
              <p className="text-[14px] font-semibold">Loading center details…</p>
            </div>
          ) : center ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Row
                  icon={MapPin}
                  label="Address"
                  value={[center.address, center.city, center.state].filter(Boolean).join(', ')}
                />
              </div>
              <Row icon={Phone} label="Contact" value={center.contactNumber} />
              <Row icon={Mail} label="Email" value={center.email} />
              <Row icon={Users} label="Assigned admins" value={admins} />
              <StatusRow status={center.status} />
              <Row icon={Calendar} label="Created" value={formatCreatedDate(center.createdAt)} />
              {(center.linkedStudentCount || 0) > 0 && (
                <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-[13px] font-semibold text-amber-900 sm:col-span-2">
                  Linked students (guard): {center.linkedStudentCount}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <footer className="shrink-0 border-t border-slate-100 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-200/80 bg-white px-5 py-3 text-[14px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Close
          </button>
        </footer>
      </div>
    </Modal>
  )
}
