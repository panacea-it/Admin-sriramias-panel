import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getModalEditKey, useInitOnModalOpen } from '../../hooks/modalFormSync'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Mail, Phone, User, Hash, X } from 'lucide-react'
import { toast } from '@/utils/toast'
import { cn } from '../../utils/cn'
import { SESSION_TIMEOUTS } from '../../data/adminManagementConfig'
import { useAdminRoles } from '../../contexts/AdminRolesContext'
import { useRolesDropdown } from '../../hooks/useRolesDropdown'
import { useCentersDropdownOptions } from '../../hooks/useCentersDropdownOptions'
import FloatingInput from './ui/FloatingInput'
import PasswordField from './ui/PasswordField'
import Switch from './ui/Switch'
import RoleOverviewCard from './RoleOverviewCard'
import ErrorState from '../feedback/ErrorState'
import { getApiErrorMessage } from '../../utils/apiError'
import { validateAdminAccessForm } from '../../utils/adminAccessValidation'
import {
  buildAdminAccessPayload,
  createAdminUser,
  getAdminUserById,
  mapAdminUserToForm,
  updateAdminUser,
} from '../../services/adminAccessService'

const INITIAL = {
  fullName: '',
  email: '',
  mobile: '',
  employeeId: '',
  roleId: '',
  centerId: '',
  password: '',
  confirmPassword: '',
  active: true,
  twoFactor: false,
  sessionTimeout: '60',
  loginAlert: true,
}

const selectClassName = cn(
  'w-full min-h-[3.25rem] rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 text-[15px] font-medium text-slate-900 shadow-sm outline-none transition',
  'focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15',
)

const fieldLabelClass = cn(
  'mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500',
)

export default function CreateAdminModal({ open, onClose, onSuccess, editingId = null }) {
  const { roles: contextRoles = [] } = useAdminRoles()
  const {
    options: roleOptions = [],
    loading: rolesLoading,
    error: rolesError,
    refresh: refreshRoles,
  } = useRolesDropdown({ enabled: open })
  const {
    options: centerOptions = [],
    loading: centersLoading,
    error: centersError,
  } = useCentersDropdownOptions()

  const safeRoleOptions = Array.isArray(roleOptions) ? roleOptions : []
  const safeCenterOptions = Array.isArray(centerOptions) ? centerOptions : []
  const safeContextRoles = Array.isArray(contextRoles) ? contextRoles : []

  const [form, setForm] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const editingIdRef = useRef(editingId)
  editingIdRef.current = editingId
  const editKey = getModalEditKey(editingId)

  const isEdit = Boolean(editingId)

  const selectedRoleMeta = useMemo(
    () => safeContextRoles.find((r) => r.id === form.roleId),
    [safeContextRoles, form.roleId],
  )

  const selectedRoleLabel = useMemo(
    () => safeRoleOptions.find((r) => r.value === form.roleId)?.label || '',
    [safeRoleOptions, form.roleId],
  )

  const overviewRole = useMemo(() => {
    if (selectedRoleMeta) {
      return {
        ...selectedRoleMeta,
        modules: Array.isArray(selectedRoleMeta.modules) ? selectedRoleMeta.modules : [],
      }
    }
    if (!form.roleId) return null
    return {
      id: form.roleId,
      label: selectedRoleLabel || 'Selected role',
      securityLevel: 'medium',
      enabled: true,
      modules: [],
      permissionCount: 0,
    }
  }, [selectedRoleMeta, form.roleId, selectedRoleLabel])

  useInitOnModalOpen(open, editKey, () => {
    setErrors({})
    if (!editingIdRef.current) {
      setForm({
        ...INITIAL,
        roleId: safeRoleOptions[0]?.value || '',
        centerId: safeCenterOptions[0]?.value || '',
      })
    }
  })

  useEffect(() => {
    if (!open || !editingId) return

    let cancelled = false

    async function loadDetail() {
      setDetailLoading(true)
      try {
        const data = await getAdminUserById(editingId)
        if (cancelled) return
        setForm(
          mapAdminUserToForm(data, {
            roleId: safeRoleOptions[0]?.value || '',
            centerId: safeCenterOptions[0]?.value || '',
          }),
        )
        setErrors({})
      } catch (error) {
        if (!cancelled) {
          if (import.meta.env.DEV) {
            console.error(error)
          }
          toast.error(getApiErrorMessage(error, 'Failed to load user access'))
          onClose()
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false)
        }
      }
    }

    loadDetail()
    return () => {
      cancelled = true
    }
  }, [open, editingId, onClose, safeRoleOptions, safeCenterOptions])

  useEffect(() => {
    if (!open || isEdit) return
    setForm((prev) => ({
      ...prev,
      roleId: prev.roleId || safeRoleOptions[0]?.value || '',
      centerId: prev.centerId || safeCenterOptions[0]?.value || '',
    }))
  }, [open, isEdit, safeRoleOptions, safeCenterOptions])

  const resetAll = useCallback(() => {
    setForm({
      ...INITIAL,
      roleId: safeRoleOptions[0]?.value || '',
      centerId: safeCenterOptions[0]?.value || '',
    })
    setErrors({})
  }, [safeRoleOptions, safeCenterOptions])

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

  const set = (key) => (e) => {
    const value = e?.target ? e.target.value : e
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((err) => ({ ...err, [key]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { errors: nextErrors, isValid } = validateAdminAccessForm(form, { isEdit })
    setErrors(nextErrors)
    if (!isValid) return

    setLoading(true)
    try {
      const payload = buildAdminAccessPayload(form, {
        isEdit,
        includePassword: !isEdit || Boolean(form.password),
      })

      if (isEdit) {
        await updateAdminUser(editingId, payload)
        toast.success('User access updated successfully', {
          description: `${form.fullName} has been updated.`,
        })
      } else {
        await createAdminUser(payload)
        toast.success('Admin access created successfully', {
          description: `${form.fullName} can now sign in as ${selectedRoleLabel || 'admin'}.`,
        })
      }

      onSuccess?.()
      resetAll()
      onClose()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(
        getApiErrorMessage(error, isEdit ? 'Failed to update user access' : 'Failed to create user access'),
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    resetAll()
    onClose()
  }

  const formDisabled = loading || detailLoading || rolesLoading || centersLoading
  const dropdownsReady = safeRoleOptions.length > 0 && safeCenterOptions.length > 0
  const dropdownLoadError = rolesError || centersError
  const dropdownsLoading = rolesLoading || centersLoading

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
            onClick={handleCancel}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-admin-modal-title"
            className={cn(
              'relative z-[101] flex w-full flex-col overflow-hidden border border-slate-200/80 bg-white shadow-2xl transition-shadow',
              'h-[100dvh] max-h-[100dvh] rounded-none sm:h-auto sm:max-h-[min(92vh,960px)] sm:w-[90vw] sm:max-w-[1024px] sm:rounded-2xl xl:max-w-[1100px]',
            )}
            initial={{ opacity: 0, scale: 0.97, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-8 sm:py-6">
              <div className="min-w-0 pr-2">
                <h2
                  id="create-admin-modal-title"
                  className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
                >
                  {isEdit ? 'Edit User Access' : 'Create Admin Access'}
                </h2>
                <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-500">
                  Manage and assign secure administrative access across departments.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {detailLoading || dropdownsLoading ? (
              <div className="flex flex-1 items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" aria-label="Loading form data" />
              </div>
            ) : dropdownLoadError && !dropdownsReady ? (
              <div className="px-6 py-8 sm:px-8">
                <ErrorState
                  title="Unable to load form options"
                  message={dropdownLoadError}
                  onRetry={refreshRoles}
                />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
                <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
                  <div className="space-y-10 sm:space-y-12">
                    <section aria-labelledby="section-profile">
                      <h3
                        id="section-profile"
                        className="mb-5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 sm:mb-6"
                      >
                        Profile & credentials
                      </h3>
                      <div className="grid gap-5 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-6 lg:gap-x-10">
                        <FloatingInput
                          id="modal-fullName"
                          label="Full Name"
                          size="comfortable"
                          value={form.fullName}
                          onChange={set('fullName')}
                          error={errors.fullName}
                          icon={User}
                        />
                        <FloatingInput
                          id="modal-email"
                          label="Official Email"
                          type="email"
                          size="comfortable"
                          value={form.email}
                          onChange={set('email')}
                          error={errors.email}
                          icon={Mail}
                          helper="Use your organization domain"
                        />
                        <FloatingInput
                          id="modal-mobile"
                          label="Mobile Number"
                          size="comfortable"
                          value={form.mobile}
                          onChange={set('mobile')}
                          error={errors.mobile}
                          icon={Phone}
                          helper="10-digit Indian mobile"
                        />
                        <FloatingInput
                          id="modal-employeeId"
                          label="Employee ID / Admin ID"
                          size="comfortable"
                          value={form.employeeId}
                          onChange={set('employeeId')}
                          error={errors.employeeId}
                          icon={Hash}
                        />
                      </div>
                    </section>

                    <section
                      className="border-t border-slate-100 pt-10 sm:pt-12"
                      aria-labelledby="section-role"
                    >
                      <h3
                        id="section-role"
                        className="mb-5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 sm:mb-6"
                      >
                        Access scope
                      </h3>
                      <div className="grid gap-5 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-6 lg:gap-x-10">
                        <div>
                          <label htmlFor="modal-roleId" className={fieldLabelClass}>
                            Admin Access
                          </label>
                          <select
                            id="modal-roleId"
                            value={form.roleId}
                            onChange={set('roleId')}
                            disabled={safeRoleOptions.length === 0 || formDisabled}
                            className={selectClassName}
                          >
                            {safeRoleOptions.length === 0 ? (
                              <option value="">No roles available</option>
                            ) : (
                              safeRoleOptions.map((t) => (
                                <option key={t.value} value={t.value}>
                                  {t.label}
                                </option>
                              ))
                            )}
                          </select>
                          {errors.roleId && (
                            <p className="mt-2 text-[12px] font-semibold text-rose-600">
                              {errors.roleId}
                            </p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="modal-centerId" className={fieldLabelClass}>
                            Assigned Center
                          </label>
                          <select
                            id="modal-centerId"
                            value={form.centerId}
                            onChange={set('centerId')}
                            className={selectClassName}
                            disabled={safeCenterOptions.length === 0 || formDisabled}
                          >
                            {safeCenterOptions.length === 0 ? (
                              <option value="">No centers available</option>
                            ) : (
                              safeCenterOptions.map((c) => (
                                <option key={c.value} value={c.value}>
                                  {c.label}
                                </option>
                              ))
                            )}
                          </select>
                          {errors.centerId && (
                            <p className="mt-2 text-[12px] font-semibold text-rose-600">
                              {errors.centerId}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-8 sm:mt-10">
                        {overviewRole ? (
                          <RoleOverviewCard role={overviewRole} />
                        ) : (
                          <p className="rounded-xl border border-dashed border-slate-200 px-6 py-8 text-center text-sm text-slate-500">
                            Select an admin access role to preview permissions.
                          </p>
                        )}
                      </div>
                    </section>

                    <section
                      className="border-t border-slate-100 pt-10 sm:pt-12"
                      aria-labelledby="section-security"
                    >
                      <h3
                        id="section-security"
                        className="mb-5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 sm:mb-6"
                      >
                        Security
                      </h3>
                      <div className="grid gap-5 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-6 lg:gap-x-10">
                        <PasswordField
                          id="modal-password"
                          label={isEdit ? 'New password (optional)' : 'Password'}
                          value={form.password}
                          onChange={set('password')}
                          error={errors.password}
                          inputSize="comfortable"
                        />
                        <PasswordField
                          id="modal-confirmPassword"
                          label={isEdit ? 'Confirm new password' : 'Confirm Password'}
                          value={form.confirmPassword}
                          onChange={set('confirmPassword')}
                          error={errors.confirmPassword}
                          inputSize="comfortable"
                        />
                      </div>
                    </section>

                    <section
                      className="border-t border-slate-100 pt-10 sm:pt-12"
                      aria-labelledby="section-preferences"
                    >
                      <h3
                        id="section-preferences"
                        className="mb-5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 sm:mb-6"
                      >
                        Session & alerts
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-4 lg:gap-x-8">
                        <Switch
                          id="modal-active"
                          relaxed
                          label="Account status"
                          description={
                            form.active ? 'Active — can sign in' : 'Inactive — access blocked'
                          }
                          checked={form.active}
                          onChange={(v) => setForm((f) => ({ ...f, active: v }))}
                        />
                        <Switch
                          id="modal-twoFactor"
                          relaxed
                          label="Two-factor authentication"
                          description="Require OTP on each login"
                          checked={form.twoFactor}
                          onChange={(v) => setForm((f) => ({ ...f, twoFactor: v }))}
                        />
                        <Switch
                          id="modal-loginAlert"
                          relaxed
                          label="Login alert"
                          description="Email when this admin signs in"
                          checked={form.loginAlert}
                          onChange={(v) => setForm((f) => ({ ...f, loginAlert: v }))}
                        />
                        <div className="flex flex-col justify-center rounded-xl border border-slate-200/80 bg-white/60 px-5 py-4">
                          <label htmlFor="modal-sessionTimeout" className={fieldLabelClass}>
                            Session timeout
                          </label>
                          <select
                            id="modal-sessionTimeout"
                            value={form.sessionTimeout}
                            onChange={set('sessionTimeout')}
                            className={cn(selectClassName, 'mt-1')}
                          >
                            {(SESSION_TIMEOUTS || []).map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-10 flex justify-end border-t border-slate-100 pt-6">
                        <button
                          type="button"
                          onClick={resetAll}
                          className="text-[15px] font-semibold text-slate-500 transition hover:text-violet-600"
                        >
                          Reset form
                        </button>
                      </div>
                    </section>
                  </div>
                </div>

                <div
                  className={cn(
                    'flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200/90 bg-white/95 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5',
                    'pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-5',
                  )}
                >
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full rounded-xl border border-slate-200/80 bg-white px-6 py-3.5 text-[15px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto sm:min-w-[8.5rem]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formDisabled || !dropdownsReady}
                    className={cn(
                      'w-full rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 px-8 py-3.5 text-[15px] font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:translate-y-0 disabled:opacity-70 sm:w-auto sm:min-w-[12rem]',
                    )}
                  >
                    {loading ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {isEdit ? 'Saving…' : 'Creating…'}
                      </span>
                    ) : isEdit ? (
                      'Save changes'
                    ) : (
                      'Create Admin'
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
