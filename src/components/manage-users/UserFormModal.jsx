import { useMemo, useRef, useState } from 'react'
import { getModalEditKey, useInitOnModalOpen } from '../../hooks/modalFormSync'
import { UserPlus } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import FormModalSubmitBar from '../common/FormModalSubmitBar'
import {
  CourseFormField,
  CourseInput,
  CourseSelect,
} from '../courses/CourseFormField'
import { USER_STATUS_OPTIONS } from '../../data/manageUsersConfig'
import { useUserCreateRoles } from '../../hooks/user/useUserCreateRoles'
import { useUserCenterFormDropdown } from '../../hooks/user/useUserCenterFormDropdown'
import { validateCreateStudent, validateUpdateStudent } from '../../utils/userValidation'
import { cn } from '../../utils/cn'

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  parentName: '',
  parentPhone: '',
  assignedCenter: '',
  status: 'Active',
}

function FormSection({ title, description, children, className }) {
  return (
    <section className={cn('space-y-4', className)}>
      <div className="border-b border-[#e8eef5] pb-2">
        <h3 className="text-sm font-bold tracking-wide text-[#246392]">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs text-[#686868]">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function userRowToForm(row) {
  return {
    fullName: row.fullName || '',
    email: row.email || '',
    phone: row.phoneNumber || row.phone || '',
    parentName: row.parentName || row.studentDetails?.parentName || '',
    parentPhone: row.parentMobile || row.parentPhone || row.studentDetails?.parentMobile || '',
    assignedCenter: row.centerId || row.assignedCenter || '',
    status: row.status || 'Active',
  }
}

export default function UserFormModal({
  open,
  onClose,
  onCreate,
  onUpdate,
  editingUser = null,
  createLabel = 'Create Student',
  createPending = false,
  updatePending = false,
}) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const editingRef = useRef(editingUser)
  editingRef.current = editingUser
  const editKey = getModalEditKey(editingUser)
  const isEdit = Boolean(editingUser)

  const { data: createRoleOptions = [] } = useUserCreateRoles({ enabled: open && !isEdit })
  const { data: centerFormOptions = [], isLoading: centersLoading } = useUserCenterFormDropdown({
    enabled: open,
  })

  const lockedRole = createRoleOptions[0]

  useInitOnModalOpen(open, editKey, () => {
    const row = editingRef.current
    if (row) {
      setForm(userRowToForm(row))
    } else {
      setForm({ ...emptyForm })
    }
    setErrors({})
  })

  const centerOptions = useMemo(
    () =>
      (centerFormOptions || []).map((opt) => ({
        value: opt.value,
        label: opt.label,
      })),
    [centerFormOptions],
  )

  const validate = () => {
    const next = isEdit
      ? validateUpdateStudent({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          parentPhone: form.parentPhone,
        })
      : validateCreateStudent({
          fullName: form.fullName,
          email: form.email,
          mobile: form.phone,
          centerId: form.assignedCenter,
          parentName: form.parentName,
          parentMobile: form.parentPhone,
        })

    if (!form.assignedCenter?.trim()) {
      next.assignedCenter = 'Assigned center is required'
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

    if (!isEdit) {
      const result = await onCreate?.({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: form.phone.trim(),
        parentName: form.parentName.trim() || undefined,
        parentMobile: form.parentPhone.trim() || undefined,
        centerId: form.assignedCenter.trim(),
        status:
          form.status === 'Active' ||
          form.status === 'ACTIVE' ||
          form.status === true,
      })

      if (result && typeof result === 'object' && result.fieldErrors) {
        setErrors((prev) => ({ ...prev, ...result.fieldErrors }))
        return
      }

      if (result !== false) {
        onClose()
      }
      return
    }

    const updated = await onUpdate?.(editingUser.id, {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      mobile: form.phone.trim(),
      parentName: form.parentName.trim(),
      parentMobile: form.parentPhone.trim(),
      centerId: form.assignedCenter.trim(),
      status: form.status === 'Active' || form.status === true,
      isActive: form.status === 'Active' || form.status === true,
    })

    if (updated !== false) {
      onClose()
    }
  }

  const modalTitle = isEdit ? 'Edit Student' : createLabel
  const subtitle = isEdit
    ? `Update account for ${editingUser?.fullName || 'this student'}`
    : 'Add a new student account to the platform'

  const handleReset = () => {
    if (isEdit && editingRef.current) {
      setForm(userRowToForm(editingRef.current))
    } else {
      setForm({ ...emptyForm })
    }
    setErrors({})
  }

  const clearError = (key) => {
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const assignedCenterField = (
    <CourseFormField
      label="Center"
      required
      className={isEdit ? undefined : 'w-full'}
    >
      <CourseSelect
        value={form.assignedCenter}
        onChange={(e) => {
          setForm((f) => ({ ...f, assignedCenter: e.target.value }))
          clearError('assignedCenter')
          clearError('centerId')
        }}
        disabled={centersLoading}
      >
        <option value="">{centersLoading ? 'Loading centers…' : 'Select center'}</option>
        {centerOptions.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </CourseSelect>
      {(errors.assignedCenter || errors.centerId) && (
        <p className="text-xs font-medium text-red-600">
          {errors.assignedCenter || errors.centerId}
        </p>
      )}
    </CourseFormField>
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={modalTitle}
      showCloseButton={false}
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[min(90vh,760px)] flex-col overflow-hidden rounded-2xl bg-[#f0f4f8]"
      >
        <ModalPanelHeader
          title={modalTitle}
          subtitle={subtitle}
          icon={UserPlus}
          iconClassName="text-[#246392]"
          onClose={onClose}
          closeVariant="icon"
          plainCloseIcon
        />

        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto overscroll-contain',
            'px-5 py-6 sm:px-8',
            '[scrollbar-gutter:stable]',
            '[scrollbar-width:thin]',
            '[scrollbar-color:#c5d9eb_#f4f7fb]',
          )}
        >
          <div className="space-y-8 pb-2">
            <FormSection
              title="Basic information"
              description="Primary identity and contact details for this account."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <CourseFormField label="Full Name" required className="sm:col-span-2">
                  <CourseInput
                    value={form.fullName}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, fullName: e.target.value }))
                      clearError('fullName')
                    }}
                    placeholder="e.g. Arjun Mehta"
                  />
                  {errors.fullName && (
                    <p className="text-xs font-medium text-red-600">{errors.fullName}</p>
                  )}
                </CourseFormField>

                <CourseFormField label="Email (Gmail)" required>
                  <CourseInput
                    type="email"
                    value={form.email}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, email: e.target.value }))
                      clearError('email')
                    }}
                    placeholder="name@gmail.com"
                    disabled={isEdit}
                  />
                  {errors.email && (
                    <p className="text-xs font-medium text-red-600">{errors.email}</p>
                  )}
                </CourseFormField>

                <CourseFormField label="Phone Number" required>
                  <CourseInput
                    inputMode="numeric"
                    value={form.phone}
                    onChange={(e) => {
                      setForm((f) => ({
                        ...f,
                        phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                      }))
                      clearError('phone')
                      clearError('mobile')
                    }}
                    placeholder="10-digit mobile"
                  />
                  {(errors.phone || errors.mobile) && (
                    <p className="text-xs font-medium text-red-600">
                      {errors.phone || errors.mobile}
                    </p>
                  )}
                </CourseFormField>
              </div>
            </FormSection>

            <FormSection
              title="Family details"
              description="Optional — parent contact information."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <CourseFormField label="Parent Name">
                  <CourseInput
                    value={form.parentName}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, parentName: e.target.value }))
                      clearError('parentName')
                    }}
                    placeholder="e.g. Rajesh Mehta"
                  />
                  {errors.parentName && (
                    <p className="text-xs font-medium text-red-600">{errors.parentName}</p>
                  )}
                </CourseFormField>

                <CourseFormField label="Parent Phone Number">
                  <CourseInput
                    inputMode="numeric"
                    value={form.parentPhone}
                    onChange={(e) => {
                      setForm((f) => ({
                        ...f,
                        parentPhone: e.target.value.replace(/\D/g, '').slice(0, 10),
                      }))
                      clearError('parentPhone')
                      clearError('parentMobile')
                    }}
                    placeholder="10-digit parent mobile"
                  />
                  {(errors.parentPhone || errors.parentMobile) && (
                    <p className="text-xs font-medium text-red-600">
                      {errors.parentPhone || errors.parentMobile}
                    </p>
                  )}
                </CourseFormField>
              </div>
            </FormSection>

            <FormSection
              title="Access & status"
              description="Center assignment and account state."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {!isEdit && lockedRole ? (
                  <CourseFormField label="Role">
                    <CourseInput
                      value={lockedRole.label || 'Student'}
                      readOnly
                      disabled
                      className="bg-[#f5f7fb] text-[#667085]"
                    />
                  </CourseFormField>
                ) : null}
                {assignedCenterField}
                <CourseFormField label="Status">
                  <CourseSelect
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    {USER_STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </CourseSelect>
                </CourseFormField>
              </div>
            </FormSection>
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-slate-200/80 bg-[#f0f4f8] px-5 pb-5 pt-4 sm:px-6">
          <FormModalSubmitBar
            isEditMode={isEdit}
            onReset={handleReset}
            createLabel={createLabel}
            updateLabel="Update Student"
            resetLabel="Reset"
            isSubmitting={createPending || updatePending}
          />
        </div>
      </form>
    </Modal>
  )
}
