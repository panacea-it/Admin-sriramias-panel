import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Building2, Loader2, Mail, MapPin, Phone, Users, X } from 'lucide-react'
import { toast } from '@/utils/toast'
import { getCenterById, mapApiCenterToLocal } from '../../services/centerService'
import { getApiErrorMessage } from '../../utils/apiError'
import { cn } from '../../utils/cn'

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

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (typeof document === 'undefined') return null

  const admins =
    center?.assignedAdmins?.length > 0 ? center.assignedAdmins.join(', ') : 'None assigned'

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.button
            type="button"
            aria-label="Close panel"
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="center-view-title"
            initial={{ x: '100%', opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.6 }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className={cn(
              'relative z-[101] flex h-full w-full max-w-[min(100%,420px)] flex-col border-l border-slate-200/80 bg-white shadow-[0_0_48px_rgba(15,23,42,0.18)]',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 text-white shadow-md">
                  <Building2 className="h-5 w-5" strokeWidth={2.3} />
                </div>
                <div className="min-w-0">
                  <h2
                    id="center-view-title"
                    className="truncate text-lg font-bold tracking-tight text-slate-900"
                  >
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
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto px-6 py-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                  <p className="text-[14px] font-semibold">Loading center details…</p>
                </div>
              ) : center ? (
                <>
                  <Row
                    icon={MapPin}
                    label="Address"
                    value={[center.address, center.city, center.state].filter(Boolean).join(', ')}
                  />
                  <Row icon={Phone} label="Contact" value={center.contactNumber} />
                  <Row icon={Mail} label="Email" value={center.email} />
                  <Row icon={Users} label="Assigned admins" value={admins} />
                  {(center.linkedStudentCount || 0) > 0 && (
                    <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-[13px] font-semibold text-amber-900">
                      Linked students (guard): {center.linkedStudentCount}
                    </div>
                  )}
                  <p className="pt-2 text-[12px] font-medium text-slate-500">
                    Created{' '}
                    {center.createdAt
                      ? new Date(center.createdAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : '—'}
                  </p>
                </>
              ) : null}
            </div>

            <div className="border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl border border-slate-200/80 bg-white px-5 py-3 text-[14px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
