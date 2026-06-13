import { useRef, useState } from 'react'
import { getModalEditKey, useInitOnModalOpen } from '../../hooks/modalFormSync'
import { ImagePlus, UserPlus, X } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import {
  CourseFormField,
  CourseInput,
  CourseSelect,
} from '../courses/CourseFormField'
import { USER_ROLES, USER_STATUS_OPTIONS } from '../../data/manageUsersConfig'
import { isStudentRecord } from './isStudentRecord'
import { cn } from '../../utils/cn'
import { UploadFieldHint, UploadValidationMessage } from '../common/UploadFieldHint'
import { validateUploadFile } from '../../utils/uploadValidation'

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRe = /^[6-9]\d{9}$/

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  parentName: '',
  parentPhone: '',
  role: 'student',
  assignedCenter: '',
  status: 'Active',
  profileImage: '',
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

function resolveCenterValue(row, centerOptions = []) {
  if (row?.centerId) return row.centerId
  const label = String(row?.assignedCenter || '').trim().toLowerCase()
  const match = centerOptions.find(
    (c) =>
      String(typeof c === 'string' ? c : c.label)
        .trim()
        .toLowerCase() === label,
  )
  if (match && typeof match !== 'string') return match.value
  return row?.assignedCenter || ''
}

function userRowToForm(row, centerOptions = []) {
  return {
    fullName: row.fullName || '',
    email: row.email || '',
    phone: row.phone || '',
    parentName: row.parentName || '',
    parentPhone: row.parentPhone || '',
    role: row.role || 'student',
    assignedCenter: resolveCenterValue(row, centerOptions),
    status: row.status || 'Active',
    profileImage: row.profileImage || '',
  }
}

function getDefaultCenterValue(centerOptions = []) {
  const first = centerOptions[0]
  if (!first) return ''
  return typeof first === 'string' ? first : first.value
}

export default function UserFormModal({
  open,
  onClose,
  onCreate,
  onUpdate,
  editingUser = null,
  centerOptions = [],
  saving = false,
  detailLoading = false,
}) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [uploadError, setUploadError] = useState(null)
  const fileRef = useRef(null)
  const editingRef = useRef(editingUser)
  editingRef.current = editingUser
  const editKey = getModalEditKey(editingUser)
  const isEdit = Boolean(editingUser)
  const showProfilePhoto = isEdit && !isStudentRecord(editingUser)
  const showRoleField = isEdit && !isStudentRecord(editingUser)

  useInitOnModalOpen(open, editKey, () => {
    const row = editingRef.current
    if (row) {
      setForm(userRowToForm(row, centerOptions))
    } else {
      setForm({
        ...emptyForm,
        assignedCenter: getDefaultCenterValue(centerOptions),
      })
    }
    setErrors({})
  })

  const validate = () => {
    const next = {}
    if (!form.fullName?.trim()) next.fullName = 'Full name is required'
    if (!form.email?.trim()) next.email = 'Email is required'
    else if (!emailRe.test(form.email.trim())) next.email = 'Enter a valid email'
    if (!form.phone?.trim()) next.phone = 'Phone number is required'
    else if (!phoneRe.test(form.phone.trim())) next.phone = 'Enter a valid 10-digit mobile number'
    if (editingUser && !form.role) next.role = 'Role is required'
    if (!form.assignedCenter?.trim()) next.assignedCenter = 'Assigned center is required'
    if (form.parentPhone?.trim() && !phoneRe.test(form.parentPhone.trim())) {
      next.parentPhone = 'Enter a valid 10-digit parent mobile number'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await validateUploadFile(file, 'IMAGE_PROFILE')
    if (!result.valid) {
      setUploadError(result.message)
      e.target.value = ''
      return
    }
    setUploadError(null)
    const reader = new FileReader()
    reader.onload = () => {
      setForm((f) => ({ ...f, profileImage: String(reader.result || '') }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving || detailLoading) return
    if (!validate()) {
      toast.error('Please fix the highlighted fields')
      return
    }

    if (!isEdit) {
      onCreate?.({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        parentName: form.parentName.trim(),
        parentPhone: form.parentPhone.trim(),
        assignedCenter: form.assignedCenter,
        status: form.status,
      })
      onClose()
      return
    }

    const result = await onUpdate?.(editingUser, {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      parentName: form.parentName.trim(),
      parentPhone: form.parentPhone.trim(),
      role: form.role,
      assignedCenter: form.assignedCenter,
      status: form.status,
      profileImage: form.profileImage,
    })

    if (result === false) return
    onClose()
  }
  const modalTitle = isEdit ? 'Edit User' : 'Create User'
  const subtitle = isEdit
    ? `Update account for ${editingUser?.fullName || 'this user'}`
    : 'Add a student, employee, or staff member to the platform'

  const handleReset = () => {
    if (isEdit && editingRef.current) {
      setForm(userRowToForm(editingRef.current, centerOptions))
    } else {
      setForm({ ...emptyForm, assignedCenter: getDefaultCenterValue(centerOptions) })
    }
    setErrors({})
  }

  const resolvedCenterOptions = centerOptions.map((c) =>
    typeof c === 'string' ? { value: c, label: c } : c,
  )

  const clearError = (key) => {
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" title={modalTitle}>
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[min(90vh,760px)] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader
          title={modalTitle}
          subtitle={subtitle}
          icon={UserPlus}
          iconClassName="text-[#246392]"
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
          {detailLoading ? (
            <p className="py-12 text-center text-sm font-medium text-[#667085]">Loading user details…</p>
          ) : (
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

                <CourseFormField label="Email" required>
                  <CourseInput
                    type="email"
                    value={form.email}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, email: e.target.value }))
                      clearError('email')
                    }}
                    placeholder="user@sriramias.in"
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
                    }}
                    placeholder="10-digit mobile"
                  />
                  {errors.phone && (
                    <p className="text-xs font-medium text-red-600">{errors.phone}</p>
                  )}
                </CourseFormField>
              </div>
            </FormSection>

            <FormSection
              title="Family details"
              description="Optional — used for student accounts."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <CourseFormField label="Parent Name">
                  <CourseInput
                    value={form.parentName}
                    onChange={(e) => setForm((f) => ({ ...f, parentName: e.target.value }))}
                    placeholder="e.g. Rajesh Mehta"
                  />
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
                    }}
                    placeholder="10-digit parent mobile"
                  />
                  {errors.parentPhone && (
                    <p className="text-xs font-medium text-red-600">{errors.parentPhone}</p>
                  )}
                </CourseFormField>
              </div>
            </FormSection>

            <FormSection
              title="Access & status"
              description={
                showRoleField
                  ? 'Role, center assignment, and account state.'
                  : 'Center assignment and account state.'
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {showRoleField ? (
                  <CourseFormField label="Role" required>
                    <CourseSelect
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    >
                      {USER_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </CourseSelect>
                  </CourseFormField>
                ) : null}

                <CourseFormField label="Assigned Center" required>
                  <CourseSelect
                    value={form.assignedCenter}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, assignedCenter: e.target.value }))
                      clearError('assignedCenter')
                    }}
                  >
                    <option value="">Select center</option>
                    {resolvedCenterOptions.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </CourseSelect>
                  {errors.assignedCenter && (
                    <p className="text-xs font-medium text-red-600">{errors.assignedCenter}</p>
                  )}
                </CourseFormField>

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

            {showProfilePhoto ? (
              <FormSection title="Profile photo" description="Optional — JPG or PNG, shown in user lists.">
                <div className="flex flex-col gap-4 rounded-xl border border-[#e5eaf2] bg-[#f8fbff] p-4 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className={cn(
                      'mx-auto flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#b8d4eb] bg-white shadow-sm transition',
                      'hover:border-[#55ace7] hover:bg-[#eef6fc] sm:mx-0',
                    )}
                  >
                    {form.profileImage ? (
                      <img
                        src={form.profileImage}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImagePlus className="h-9 w-9 text-[#246392]" strokeWidth={1.75} />
                    )}
                  </button>
                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="text-sm font-semibold text-[#246392] underline-offset-2 hover:underline"
                    >
                      {form.profileImage ? 'Change photo' : 'Upload photo'}
                    </button>
                    <UploadFieldHint profile="IMAGE_PROFILE" className="mt-1" />
                    <p className="mt-1 text-[11px] leading-relaxed text-[#686868]">
                      Max display size 96×96 px in user lists.
                    </p>
                    <UploadValidationMessage message={uploadError} />
                    {form.profileImage ? (
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, profileImage: '' }))}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#c96565] transition hover:text-[#b94b4b]"
                      >
                        <X className="h-3.5 w-3.5" />
                        Remove image
                      </button>
                    ) : null}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleImage}
                  />
                </div>
              </FormSection>
            ) : null}
          </div>
          )}
        </div>

        <div className="shrink-0 border-t border-[#e5eaf2] bg-[#f8fafc] px-5 py-4 sm:px-8">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="h-11 rounded-xl border border-[#55ace7]/30 bg-white px-6 text-sm font-semibold text-[#246392] shadow-sm transition hover:bg-[#eef6fc]"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving || detailLoading}
              className="h-11 min-w-[160px] rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-8 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:opacity-95 disabled:opacity-60"
            >
              {saving ? 'Saving…' : isEdit ? 'Update User' : 'Create User'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
