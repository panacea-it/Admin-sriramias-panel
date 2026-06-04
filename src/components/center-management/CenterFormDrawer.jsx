import { useEffect, useMemo, useRef, useState } from 'react'
import { getModalEditKey, useInitOnModalOpen } from '../../hooks/modalFormSync'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Building2, Loader2, X } from 'lucide-react'
import { toast } from '@/utils/toast'
import {
  buildCreateCenterPayload,
  createCenter as createCenterApi,
  getCreateCenterErrorMessage,
  mapApiCenterToLocal,
} from '../../services/centerService'
import { getApiErrorMessage } from '../../utils/apiError'
import { cn } from '../../utils/cn'

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const selectClassName = cn(
  'w-full min-h-[3rem] rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 text-[14px] font-medium text-slate-900 shadow-sm outline-none transition',
  'focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15',
  '',
)

const labelClass = cn(
  'mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500',
)

const inputClass = cn(
  'w-full rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 text-[14px] font-medium text-slate-900 shadow-sm outline-none transition',
  'focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15',
  '',
)

function parseAdmins(raw) {
  return String(raw || '')
    .split(/[,;\n]/g)
    .map((s) => s.trim())
    .filter(Boolean)
}

const emptyForm = {
  centerName: '',
  centerCode: '',
  address: '',
  state: '',
  city: '',
  contactNumber: '',
  email: '',
  status: 'active',
  assignedAdminsText: '',
}

export default function CenterFormDrawer({
  open,
  mode = 'create',
  initial,
  onClose,
  onCreate,
  onUpdate,
}) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const initialRef = useRef(initial)
  initialRef.current = initial
  const editKey = mode === 'edit' ? getModalEditKey(initial) : '__create__'

  useInitOnModalOpen(open, editKey, () => {
    const row = initialRef.current
    if (mode === 'edit' && row) {
      setForm({
        centerName: row.centerName || '',
        centerCode: row.centerCode || '',
        address: row.address || '',
        state: row.state || '',
        city: row.city || '',
        contactNumber: row.contactNumber || '',
        email: row.email || '',
        status: row.status === 'disabled' ? 'disabled' : 'active',
        assignedAdminsText: (row.assignedAdmins || []).join(', '),
      })
    } else {
      setForm(emptyForm)
    }
    setErrors({})
    setLoading(false)
  })

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

  const title = useMemo(() => (mode === 'edit' ? 'Edit Center' : 'Create Center'), [mode])

  const set =
    (key) =>
    (e) => {
      const value = e?.target ? e.target.value : e
      setForm((f) => ({ ...f, [key]: value }))
      setErrors((err) => ({ ...err, [key]: undefined }))
    }

  const validate = () => {
    const next = {}
    if (!form.centerName.trim()) next.centerName = 'Center name is required'
    if (!form.centerCode.trim()) next.centerCode = 'Center code is required'
    if (!form.address.trim()) next.address = 'Address is required'
    if (!form.city.trim()) next.city = 'City is required'
    if (!form.state.trim()) next.state = 'State is required'

    const email = form.email.trim()
    if (!email) {
      next.email = 'Email is required'
    } else if (!emailRe.test(email)) {
      next.email = 'Enter a valid email'
    }

    const digits = String(form.contactNumber || '').replace(/\D/g, '')
    if (!digits) {
      next.contactNumber = 'Contact number is required'
    } else if (digits.length !== 10) {
      next.contactNumber = 'Contact number must be exactly 10 digits'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Please fix the highlighted fields')
      return
    }

    if (mode === 'edit' && initial?.centerId) {
      const assignedAdmins = parseAdmins(form.assignedAdminsText)
      const payload = {
        centerName: form.centerName,
        centerCode: form.centerCode,
        address: form.address,
        state: form.state,
        city: form.city,
        contactNumber: form.contactNumber,
        email: form.email,
        status: form.status,
        assignedAdmins,
      }

      try {
        setLoading(true)
        await onUpdate?.(initial.centerId, payload)
        onClose()
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(error)
        }
        toast.error(getApiErrorMessage(error, 'Failed to update center'))
      } finally {
        setLoading(false)
      }
      return
    }

    try {
      setLoading(true)
      const apiPayload = buildCreateCenterPayload(form)
      const response = await createCenterApi(apiPayload)
      const mapped = mapApiCenterToLocal(response?.data ?? response) || {
        centerName: apiPayload.centerName,
        centerCode: apiPayload.centerCode,
        address: apiPayload.address,
        state: apiPayload.state,
        city: apiPayload.city,
        contactNumber: apiPayload.contactNumber,
        email: apiPayload.email,
        status: form.status,
        assignedAdmins: parseAdmins(form.assignedAdminsText),
      }
      onCreate?.(mapped)
      toast.success('Center created successfully')
      onClose()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(getCreateCenterErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  if (typeof document === 'undefined') return null

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
            aria-labelledby="center-form-title"
            initial={{ x: '100%', opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.6 }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className={cn(
              'relative z-[101] flex h-full w-full max-w-[min(100%,440px)] flex-col border-l border-slate-200/80 bg-white shadow-[0_0_48px_rgba(15,23,42,0.18)]',
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
                    id="center-form-title"
                    className="text-lg font-bold tracking-tight text-slate-900"
                  >
                    {title}
                  </h2>
                  <p className="mt-1 text-[13px] leading-snug text-slate-500">
                    Configure center profile, regional details, and assigned administrators.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
                <div>
                  <label htmlFor="cf-name" className={labelClass}>
                    Center Name
                  </label>
                  <input
                    id="cf-name"
                    className={cn(inputClass, errors.centerName && 'border-rose-400')}
                    value={form.centerName}
                    onChange={set('centerName')}
                    placeholder="e.g. Hyderabad Center"
                    autoComplete="organization"
                  />
                  {errors.centerName && (
                    <p className="mt-1.5 text-[12px] font-medium text-rose-600">
                      {errors.centerName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="cf-code" className={labelClass}>
                    Center Code
                  </label>
                  <input
                    id="cf-code"
                    className={cn(inputClass, errors.centerCode && 'border-rose-400')}
                    value={form.centerCode}
                    onChange={set('centerCode')}
                    placeholder="e.g. HYD"
                    autoCapitalize="characters"
                  />
                  {errors.centerCode && (
                    <p className="mt-1.5 text-[12px] font-medium text-rose-600">
                      {errors.centerCode}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="cf-address" className={labelClass}>
                    Address
                  </label>
                  <textarea
                    id="cf-address"
                    rows={2}
                    className={cn(inputClass, 'min-h-[80px] resize-y', errors.address && 'border-rose-400')}
                    value={form.address}
                    onChange={set('address')}
                    placeholder="Street, area, landmark"
                  />
                  {errors.address && (
                    <p className="mt-1.5 text-[12px] font-medium text-rose-600">{errors.address}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="cf-city" className={labelClass}>
                      City
                    </label>
                    <input
                      id="cf-city"
                      className={cn(inputClass, errors.city && 'border-rose-400')}
                      value={form.city}
                      onChange={set('city')}
                      placeholder="City"
                    />
                    {errors.city && (
                      <p className="mt-1.5 text-[12px] font-medium text-rose-600">{errors.city}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="cf-state" className={labelClass}>
                      State
                    </label>
                    <input
                      id="cf-state"
                      className={cn(inputClass, errors.state && 'border-rose-400')}
                      value={form.state}
                      onChange={set('state')}
                      placeholder="State"
                    />
                    {errors.state && (
                      <p className="mt-1.5 text-[12px] font-medium text-rose-600">{errors.state}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="cf-phone" className={labelClass}>
                    Contact Number
                  </label>
                  <input
                    id="cf-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    className={cn(inputClass, errors.contactNumber && 'border-rose-400')}
                    value={form.contactNumber}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                      setForm((f) => ({ ...f, contactNumber: digits }))
                      setErrors((err) => ({ ...err, contactNumber: undefined }))
                    }}
                    placeholder="10-digit mobile number"
                  />
                  {errors.contactNumber && (
                    <p className="mt-1.5 text-[12px] font-medium text-rose-600">
                      {errors.contactNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="cf-email" className={labelClass}>
                    Email
                  </label>
                  <input
                    id="cf-email"
                    type="email"
                    className={cn(inputClass, errors.email && 'border-rose-400')}
                    value={form.email}
                    onChange={set('email')}
                    placeholder="center@sriram.com"
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-[12px] font-medium text-rose-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="cf-status" className={labelClass}>
                    Status
                  </label>
                  <select id="cf-status" value={form.status} onChange={set('status')} className={selectClassName}>
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                  <p className="mt-2 text-[12px] font-medium text-slate-500">
                    Disabled centers stay out of operational dropdowns until re-enabled.
                  </p>
                </div>

                <div>
                  <label htmlFor="cf-admins" className={labelClass}>
                    Assigned admins
                  </label>
                  <textarea
                    id="cf-admins"
                    rows={3}
                    className={cn(inputClass, 'min-h-[96px] resize-y')}
                    value={form.assignedAdminsText}
                    onChange={set('assignedAdminsText')}
                    placeholder="Comma-separated names or IDs (e.g. Priya Sharma, RA102)"
                  />
                </div>
              </div>

              <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-white/95 px-6 py-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200/80 bg-white px-5 py-3 text-[14px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    'w-full rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 px-6 py-3 text-[14px] font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:translate-y-0 disabled:opacity-70 sm:w-auto',
                  )}
                >
                  {loading ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      {mode === 'edit' ? 'Saving…' : 'Creating…'}
                    </span>
                  ) : mode === 'edit' ? (
                    'Save changes'
                  ) : (
                    'Create center'
                  )}
                </button>
              </div>
            </form>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
