import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getModalEditKey, useInitOnModalOpen } from '../../hooks/modalFormSync'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Loader2, Mail, Phone, User, Hash, X } from 'lucide-react'
import { toast } from '@/utils/toast'
import { cn } from '../../utils/cn'
import { useQuery } from '@tanstack/react-query'
import { useRolePreview } from '../../hooks/useRolePreview'
import { useCreateAdmin } from '../../hooks/admin/useCreateAdmin'
import { useUpdateAdmin } from '../../hooks/admin/useUpdateAdmin'
import { useAdmin } from '../../hooks/admin/useAdmin'
import { useAdminRolesDropdown } from '../../hooks/admin/useAdminRoles'
import adminManagementService from '../../services/adminManagementService'
import { adminKeys } from '../../hooks/admin/adminKeys'
import FloatingInput from './ui/FloatingInput'
import PasswordField from './ui/PasswordField'
import RoleOverviewCard from './RoleOverviewCard'
import ErrorState from '../feedback/ErrorState'
import { handleApiError } from '../../utils/errorHandler'
import { validateAdminAccessForm } from '../../utils/adminAccessValidation'
import { mapManageUserRowToAdminForm } from '../manage-users/mapManageUserToAdminForm'
import {
  buildCreateAdminPayload,
  buildUpdateAdminPayload,
  mapAdminUserToForm,
  mapCentersDropdownResponse,
  mapRolesDropdownResponse,
  mapJoiErrorsToForm,
} from '../../utils/adminManagementHelpers'

const INITIAL = {
  fullName: '',
  email: '',
  mobile: '',
  employeeId: '',
  roleId: '',
  centerId: '',
  password: '',
  confirmPassword: '',
}

const selectClassName = cn(
  'h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3.5 pr-10 text-[14px] font-medium text-slate-900 shadow-sm outline-none transition',
  'focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15',
  'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
)

const fieldLabelClass = cn('mb-1.5 block text-[13px] font-medium text-slate-700')

const formGridClass = cn('grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-5 md:gap-y-4')

function SectionCard({ id, title, description, children, className }) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        'rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
        className,
      )}
    >
      <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3.5 sm:px-5">
        <h3 id={id} className="text-[13px] font-semibold text-slate-900">
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-[12px] leading-snug text-slate-500">{description}</p>
        )}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

function SelectField({ id, label, required, error, disabled, className, children, ...selectProps }) {
  return (
    <div className={className}>
      <label htmlFor={id} className={fieldLabelClass}>
        {label}
        {required && (
          <span className="ml-0.5 text-rose-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="relative">
        <select
          id={id}
          disabled={disabled}
          aria-required={required || undefined}
          className={cn(selectClassName, error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15')}
          {...selectProps}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
      </div>
      {error && <p className="mt-1.5 text-[12px] font-medium text-rose-600">{error}</p>}
    </div>
  )
}

export default function CreateAdminModal({
  open,
  onClose,
  onSuccess,
  editingId = null,
  prefillRow = null,
  frontendOnly = false,
}) {
  const { data: rolesData, isLoading: rolesLoading, error: rolesError, refetch: refreshRoles } =
    useAdminRolesDropdown({ enabled: open })

  const {
    data: centersData,
    isLoading: centersLoading,
    error: centersError,
    refetch: refreshCenters,
  } = useQuery({
    queryKey: adminKeys.centersDropdown(),
    queryFn: () => adminManagementService.getCentersDropdown(),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  })

  const safeRoleOptions = useMemo(() => mapRolesDropdownResponse(rolesData), [rolesData])
  const safeCenterOptions = useMemo(() => mapCentersDropdownResponse(centersData), [centersData])

  const createMutation = useCreateAdmin()
  const updateMutation = useUpdateAdmin()

  const [form, setForm] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const editingIdRef = useRef(editingId)
  editingIdRef.current = editingId
  const isUserListEdit = Boolean(prefillRow && frontendOnly)
  const editKey = getModalEditKey(isUserListEdit ? prefillRow?.id : editingId)
  const isEdit = Boolean(editingId) || isUserListEdit

  const {
    data: adminDetail,
    isLoading: detailLoading,
    error: detailError,
    refetch: refetchDetail,
  } = useAdmin(editingId, { enabled: open && Boolean(editingId) && !isUserListEdit })

  const selectedRoleLabel = useMemo(
    () => safeRoleOptions.find((r) => r.value === form.roleId)?.label || '',
    [safeRoleOptions, form.roleId],
  )

  const { preview: overviewRole, loading: rolePreviewLoading } = useRolePreview(
    form.roleId,
    selectedRoleLabel,
  )

  useInitOnModalOpen(open, editKey, () => {
    setErrors({})
    if (!editingIdRef.current && !isUserListEdit) {
      setForm({
        ...INITIAL,
        roleId: safeRoleOptions[0]?.value || '',
        centerId: safeCenterOptions[0]?.value || '',
      })
    }
  })

  useEffect(() => {
    if (!open || !prefillRow || editingId) return
    if (!safeRoleOptions.length || !safeCenterOptions.length) return

    setForm(
      mapManageUserRowToAdminForm(prefillRow, {
        roleOptions: safeRoleOptions,
        centerOptions: safeCenterOptions,
      }),
    )
    setErrors({})
  }, [open, prefillRow, editingId, safeRoleOptions, safeCenterOptions])

  useEffect(() => {
    if (!open || !editingId || isUserListEdit || !adminDetail) return

    setForm(
      mapAdminUserToForm(adminDetail, {
        roleId: safeRoleOptions[0]?.value || '',
        centerId: safeCenterOptions[0]?.value || '',
      }),
    )
    setErrors({})
  }, [open, editingId, isUserListEdit, adminDetail, safeRoleOptions, safeCenterOptions])

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

    if (frontendOnly) {
      onClose()
      return
    }

    try {
      if (isEdit) {
        const payload = buildUpdateAdminPayload(form, {
          includePassword: Boolean(form.password),
        })
        await updateMutation.mutateAsync({ id: editingId, payload })
        toast.success('Admin access updated successfully', {
          description: `${form.fullName} has been updated.`,
        })
      } else {
        const payload = buildCreateAdminPayload(form)
        await createMutation.mutateAsync(payload)
        toast.success('Admin access created successfully', {
          description: `${form.fullName} can now sign in as ${selectedRoleLabel || 'admin'}.`,
        })
      }

      onSuccess?.()
      resetAll()
      onClose()
    } catch (error) {
      const joiErrors = mapJoiErrorsToForm(error?.response?.data || error)
      if (Object.keys(joiErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...joiErrors }))
      }
      handleApiError(error, {
        fallback: isEdit ? 'Failed to update admin access' : 'Failed to create admin access',
      })
    }
  }

  const handleCancel = () => {
    resetAll()
    onClose()
  }

  const mutationLoading = createMutation.isPending || updateMutation.isPending
  const formDisabled = mutationLoading || detailLoading || rolesLoading || centersLoading
  const dropdownsReady = safeRoleOptions.length > 0 && safeCenterOptions.length > 0
  const dropdownLoadError = rolesError || centersError
  const dropdownsLoading = rolesLoading || centersLoading
  const detailLoadError = detailError
    ? handleApiError(detailError, { silent: true, fallback: 'Failed to load admin details' }).message
    : null

  const retryDropdowns = () => {
    refreshRoles()
    refreshCenters()
  }

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
              'relative z-[101] flex w-full flex-col overflow-hidden border border-slate-200/80 bg-white shadow-2xl',
              'h-[100dvh] max-h-[100dvh] rounded-none',
              'sm:h-auto sm:max-h-[min(90vh,880px)] sm:w-[min(92vw,1150px)] sm:min-w-0 sm:max-w-[1150px] sm:rounded-2xl',
            )}
            initial={{ opacity: 0, scale: 0.97, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-20 flex shrink-0 items-start justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-6">
              <div className="min-w-0 pr-2">
                <h2
                  id="create-admin-modal-title"
                  className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl"
                >
                  {isUserListEdit ? 'Edit Admin' : isEdit ? 'Edit User Access' : 'Create Admin Access'}
                </h2>
                <p className="mt-1 text-[13px] leading-snug text-slate-500">
                  Manage and assign secure administrative access across departments.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {detailLoadError ? (
              <div className="flex min-h-0 flex-1 flex-col px-6 py-8 sm:px-8">
                <ErrorState
                  title="Unable to load user details"
                  message={detailLoadError}
                  onRetry={refetchDetail}
                />
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : detailLoading || dropdownsLoading ? (
              <div className="flex flex-1 items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" aria-label="Loading form data" />
              </div>
            ) : dropdownLoadError && !dropdownsReady ? (
              <div className="px-6 py-8 sm:px-8">
                <ErrorState
                  title="Unable to load form options"
                  message={handleApiError(dropdownLoadError, {
                    silent: true,
                    fallback: 'Failed to load dropdown options',
                  }).message}
                  onRetry={retryDropdowns}
                />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
                <div className="custom-scrollbar min-h-0 flex-1 scroll-smooth overflow-y-auto bg-slate-50/40 px-4 py-4 sm:px-5 sm:py-5">
                  <div className="space-y-4">
                    <SectionCard
                      id="section-profile"
                      title="Personal Information"
                      description="Basic identity details for the admin account."
                    >
                      <div className={formGridClass}>
                        <FloatingInput
                          id="modal-fullName"
                          label="Full Name"
                          labelVariant="static"
                          required
                          value={form.fullName}
                          onChange={set('fullName')}
                          error={errors.fullName}
                          icon={User}
                        />
                        <FloatingInput
                          id="modal-email"
                          label="Official Email"
                          type="email"
                          labelVariant="static"
                          required
                          value={form.email}
                          onChange={set('email')}
                          error={errors.email}
                          icon={Mail}
                          helper="Use your organization domain"
                        />
                        <FloatingInput
                          id="modal-mobile"
                          label="Contact Number"
                          labelVariant="static"
                          required
                          value={form.mobile}
                          onChange={set('mobile')}
                          error={errors.mobile}
                          icon={Phone}
                          helper="10-digit Indian mobile"
                        />
                        <FloatingInput
                          id="modal-employeeId"
                          label="Employee ID"
                          labelVariant="static"
                          required
                          value={form.employeeId}
                          onChange={set('employeeId')}
                          error={errors.employeeId}
                          icon={Hash}
                        />
                      </div>
                    </SectionCard>

                    <SectionCard
                      id="section-role"
                      title="Access Configuration"
                      description="Define the admin role and organizational scope."
                    >
                      <div className={formGridClass}>
                        <SelectField
                          id="modal-roleId"
                          label="Role"
                          required
                          value={form.roleId}
                          onChange={set('roleId')}
                          disabled={safeRoleOptions.length === 0 || formDisabled}
                          error={errors.roleId}
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
                        </SelectField>

                        <SelectField
                          id="modal-centerId"
                          label="Center"
                          required
                          value={form.centerId}
                          onChange={set('centerId')}
                          disabled={safeCenterOptions.length === 0 || formDisabled}
                          error={errors.centerId}
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
                        </SelectField>
                      </div>
                    </SectionCard>

                    <SectionCard
                      id="section-permissions"
                      title="Permissions"
                      description="Preview role permissions and module access before creating the account."
                    >
                      {overviewRole ? (
                        <RoleOverviewCard role={overviewRole} />
                      ) : rolePreviewLoading ? (
                        <div className="flex min-h-[7rem] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6">
                          <Loader2 className="h-6 w-6 animate-spin text-violet-600" aria-label="Loading role preview" />
                        </div>
                      ) : (
                        <div className="flex min-h-[7rem] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center">
                          <p className="text-[13px] text-slate-500">
                            Select a role to preview permissions.
                          </p>
                        </div>
                      )}
                    </SectionCard>

                    <SectionCard
                      id="section-security"
                      title="Security"
                      description="Set login credentials."
                    >
                      <div className={formGridClass}>
                        <PasswordField
                          id="modal-password"
                          label={isEdit ? 'New password (optional)' : 'Password'}
                          labelVariant="static"
                          required={!isEdit}
                          value={form.password}
                          onChange={set('password')}
                          error={errors.password}
                          inputSize="comfortable"
                        />
                        <PasswordField
                          id="modal-confirmPassword"
                          label={isEdit ? 'Confirm new password' : 'Confirm Password'}
                          labelVariant="static"
                          required={!isEdit}
                          value={form.confirmPassword}
                          onChange={set('confirmPassword')}
                          error={errors.confirmPassword}
                          inputSize="comfortable"
                        />
                      </div>
                    </SectionCard>
                  </div>
                </div>

                <div
                  className={cn(
                    'sticky bottom-0 z-20 flex shrink-0 flex-col-reverse gap-2.5 border-t border-slate-200/90 bg-white/95 px-4 py-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-5',
                    'pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4',
                  )}
                >
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-[14px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto sm:min-w-[7.5rem]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formDisabled || !dropdownsReady}
                    className={cn(
                      'w-full rounded-lg bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 px-6 py-2.5 text-[14px] font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-70 sm:w-auto sm:min-w-[10.5rem]',
                    )}
                  >
                    {mutationLoading ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {isEdit ? 'Saving…' : 'Creating…'}
                      </span>
                    ) : isUserListEdit ? (
                      'Update Admin'
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
