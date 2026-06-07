import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getModalEditKey, useInitOnModalOpen } from '../../../hooks/modalFormSync'
import { LayoutGrid, Loader2, X } from 'lucide-react'
import { toast } from '@/utils/toast'
import FloatingInput from '../ui/FloatingInput'
import { cn } from '../../../utils/cn'
import { getApiErrorMessage } from '../../../utils/apiError'
import {
  createRole as createRoleApi,
  updateRole as updateRoleApi,
} from '../../../services/roleService'
import { normalizeRoleCodeInput, validateRoleForm } from '../../../utils/roleValidation'

const fieldLabelClass = cn('mb-1.5 block text-[13px] font-medium text-slate-700')

export default function AdminRoleFormModal({ open, onClose, initialRole, onSuccess }) {
  const isEdit = !!initialRole
  const isSystemRole = !!(initialRole?.fullAccess || initialRole?.systemProtected)

  const [loading, setLoading] = useState(false)
  const [label, setLabel] = useState('')
  const [roleCode, setRoleCode] = useState('')
  const [errors, setErrors] = useState({})
  const initialRoleRef = useRef(initialRole)
  initialRoleRef.current = initialRole
  const editKey = getModalEditKey(initialRole)
  const savingRef = useRef(false)

  useInitOnModalOpen(open, editKey, () => {
    const role = initialRoleRef.current
    setErrors({})
    if (role) {
      setLabel(role.label || '')
      setRoleCode(role.roleCode || '')
    } else {
      setLabel('')
      setRoleCode('')
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (savingRef.current) return

    const role = initialRoleRef.current
    if (isEdit && role && isSystemRole) {
      toast.error('This system role cannot be edited')
      return
    }

    const { isValid, errors: nextErrors, payload } = validateRoleForm({
      roleTitle: label,
      roleCode,
      isEdit,
    })

    setErrors(nextErrors)
    if (!isValid) return

    savingRef.current = true
    setLoading(true)

    try {
      if (isEdit && role) {
        await updateRoleApi(role.id, {
          roleTitle: payload.roleTitle,
          roleCode: role.roleCode || roleCode.trim(),
        })
        toast.success('Role access updated')
      } else {
        await createRoleApi(payload)
        toast.success('Role access created')
      }
      await onSuccess?.()
      onClose()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(getApiErrorMessage(error, 'Could not save role'))
    } finally {
      savingRef.current = false
      setLoading(false)
    }
  }

  const modalTitle = isEdit ? 'Edit Role Access' : 'Create Role Access'
  const modalDescription = isEdit
    ? 'Update the display title for this role. Role code cannot be changed.'
    : 'Define a new role with a display title and unique code for permission assignment.'

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4 md:p-6">
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-access-modal-title"
            className={cn(
              'relative z-[101] flex w-full flex-col overflow-hidden border border-slate-200/80 bg-white shadow-2xl',
              'max-h-[100dvh] rounded-none sm:max-h-[min(90vh,640px)] sm:w-[min(92vw,520px)] sm:rounded-2xl',
            )}
            initial={{ opacity: 0, scale: 0.97, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200/80 bg-white px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#55ace7] to-[#246392] text-white shadow-sm">
                  <LayoutGrid className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <h2
                    id="role-access-modal-title"
                    className="text-lg font-semibold tracking-tight text-slate-900"
                  >
                    {modalTitle}
                  </h2>
                  <p className="mt-0.5 text-[13px] leading-snug text-slate-500">{modalDescription}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-60"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
              <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-slate-50/40 px-5 py-5 sm:px-6">
                <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5">
                  <h3 className="text-[13px] font-semibold text-slate-900">Role details</h3>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    These fields identify the role across admin management.
                  </p>
                  <div className="mt-4 space-y-4">
                    <FloatingInput
                      id="role-access-label"
                      label="Role Title (Display)"
                      labelVariant="static"
                      required
                      value={label}
                      onChange={(e) => {
                        setLabel(e.target.value)
                        setErrors((prev) => ({ ...prev, roleTitle: undefined }))
                      }}
                      disabled={isSystemRole && isEdit}
                      error={errors.roleTitle}
                    />

                    {isEdit ? (
                      <div>
                        <label className={fieldLabelClass}>Role Code</label>
                        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-sm font-semibold tracking-wide text-slate-700">
                          {roleCode}
                        </p>
                        <p className="mt-1.5 text-[12px] text-slate-500">
                          Role codes are permanent identifiers and cannot be edited.
                        </p>
                      </div>
                    ) : (
                      <FloatingInput
                        id="role-access-code"
                        label="Role Code"
                        labelVariant="static"
                        required
                        value={roleCode}
                        onChange={(e) => {
                          setRoleCode(normalizeRoleCodeInput(e.target.value))
                          setErrors((prev) => ({ ...prev, roleCode: undefined }))
                        }}
                        placeholder="e.g. SUPER_ADMIN"
                        error={errors.roleCode}
                        helper="Uppercase letters, numbers, and underscores only"
                      />
                    )}
                  </div>
                </section>
              </div>

              <div
                className={cn(
                  'flex shrink-0 flex-col-reverse gap-2.5 border-t border-slate-200/90 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-6',
                  'pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4',
                )}
              >
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-[14px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 sm:w-auto sm:min-w-[7rem]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || (isSystemRole && isEdit) || !label.trim()}
                  className="inline-flex w-full min-w-[8.5rem] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#1a3a5c] to-[#246392] px-6 py-2.5 text-[14px] font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-60 sm:w-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isEdit ? 'Saving…' : 'Creating…'}
                    </>
                  ) : isEdit ? (
                    'Save changes'
                  ) : (
                    'Create role'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
