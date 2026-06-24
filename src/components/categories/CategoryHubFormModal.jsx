import { useRef, useState } from 'react'
import { Layers, X } from 'lucide-react'
import Modal from '../ui/Modal'
import { useModalForm } from '../../hooks/useModalForm'
import { cn } from '../../utils/cn'
import { toast } from '../../utils/toast'
import { UploadFieldHint, UploadValidationMessage } from '../common/UploadFieldHint'
import { validateUploadFile } from '../../utils/uploadValidation'
import CenterDropdown from '../academics/CenterDropdown'
import { useCenters } from '../../contexts/CentersContext'
import { PARENT_CATEGORY_OPTIONS, SUBJECT_OPTIONS } from '../../data/categoriesHubData'
import { formatProgramLabel, loadPrograms } from '../../utils/programsStorage'

function createEmptyForm() {
  return {
    name: '',
    description: '',
    status: 'Active',
    program: '',
    parentCategory: '',
    subject: '',
    centerId: '',
    centerName: '',
    iconUrl: '',
    iconFileName: '',
    iconLabel: '',
  }
}

function rowToForm(row) {
  return {
    name: row?.name || '',
    description: row?.description || '',
    status: row?.status || 'Active',
    program: row?.program || '',
    parentCategory: row?.parentCategory || '',
    subject: row?.subject || '',
    centerId: row?.centerId ? String(row.centerId) : '',
    centerName: row?.centerName || '',
    iconUrl: row?.iconUrl || '',
    iconFileName: row?.iconFileName || '',
    iconLabel: row?.iconLabel || row?.name?.slice(0, 2)?.toUpperCase() || '',
  }
}

function Field({ label, required, children, error }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-[#686868]">
        {label}
        {required && <span className="text-[#9ca0a8]"> *</span>}
      </label>
      {children}
      {error && <p className="text-xs font-medium text-[#dc2626]">{error}</p>}
    </div>
  )
}

const inputClass =
  'h-11 w-full rounded-lg bg-[#e8f4fc] px-4 text-sm font-medium text-[#222] outline-none transition focus:ring-2 focus:ring-[#55ace7]'

export default function CategoryHubFormModal({
  open,
  onClose,
  item,
  section,
  onSubmit,
}) {
  const fileRef = useRef(null)
  const { activeCenters } = useCenters()
  const programOptions = loadPrograms().map((p) => formatProgramLabel(p))
  const { form, setForm, isEditMode, reset } = useModalForm(
    open,
    item,
    rowToForm,
    createEmptyForm,
  )
  const [errors, setErrors] = useState({})
  const [uploadError, setUploadError] = useState(null)

  if (!section) return null

  const { bannerTitle, formFields } = section
  const title = isEditMode ? `Edit ${bannerTitle}` : `Add ${bannerTitle}`

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'This field is required'
    if (formFields.includes('parentCategory') && !form.parentCategory) {
      next.parentCategory = 'Select a category'
    }
    if (formFields.includes('subject') && !form.subject) {
      next.subject = 'Select a subject'
    }
    if (formFields.includes('center') && !form.centerId) {
      next.centerId = 'Center is required'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleClose = () => {
    setErrors({})
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Please fix the highlighted fields')
      return
    }
    onSubmit?.(form, { isEdit: isEditMode, id: item?.id })
    toast.success(isEditMode ? 'Saved successfully' : 'Created successfully')
    handleClose()
  }

  const nameLabel =
    section.id === 'teachers'
      ? 'Faculty Name'
      : section.id === 'exam-sub-category'
        ? 'Exam Sub-Category Name'
        : section.id === 'subject'
          ? 'Subject Name'
          : section.id === 'topic'
            ? 'Topic'
            : 'Exam Category Name'

  return (
    <Modal open={open} onClose={handleClose} size="lg" title={title}>
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#55ace7] via-[#4a9ad4] to-[#246392] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <Layers className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <h2 className="text-lg font-bold text-white sm:text-xl">{title}</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-4 rounded-xl bg-white px-4 py-3 text-center shadow-[0_6px_20px_rgba(15,23,42,0.08)] sm:mx-6">
          <p className="text-sm font-semibold text-[#246392]">
            {section.id === 'exam-sub-category' ? 'Sub-Category Details' : `${bannerTitle} Details`}
          </p>
        </div>

        <div className="space-y-4 px-5 py-6 sm:px-6 sm:py-7">
          {formFields.includes('center') && (
            <CenterDropdown
              value={form.centerId}
              onChange={(id) => {
                const centre = activeCenters.find((c) => String(c.centerId) === String(id))
                setForm((f) => ({
                  ...f,
                  centerId: id,
                  centerName: centre?.centerName || '',
                }))
                if (errors.centerId) setErrors((p) => ({ ...p, centerId: undefined }))
              }}
              error={errors.centerId}
              label="Center"
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {formFields.includes('program') && (
              <Field label="Program" required>
                <select
                  value={form.program}
                  onChange={(e) => setForm((f) => ({ ...f, program: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Select Program</option>
                  {programOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {formFields.includes('parentCategory') && (
              <Field label="Exam Category" required error={errors.parentCategory}>
                <select
                  value={form.parentCategory}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, parentCategory: e.target.value }))
                  }
                  className={inputClass}
                >
                  <option value="">Choose Category</option>
                  {PARENT_CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {formFields.includes('subject') && (
              <Field label="Subject" required error={errors.subject}>
                <select
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Choose Subject</option>
                  {SUBJECT_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field label={nameLabel} required error={errors.name}>
              <input
                type="text"
                value={form.name}
                onChange={(e) => {
                  setForm((f) => ({
                    ...f,
                    name: e.target.value,
                    iconLabel:
                      f.iconLabel || e.target.value.slice(0, 2).toUpperCase(),
                  }))
                  if (errors.name) setErrors((p) => ({ ...p, name: undefined }))
                }}
                className={inputClass}
              />
            </Field>
          </div>

          {formFields.includes('description') && (
            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className={cn(inputClass, 'min-h-[88px] resize-y py-3')}
              />
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status" required>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className={inputClass}
              >
                <option value="Active">Active</option>
                <option value="In Active">In Active</option>
              </select>
            </Field>

            {formFields.includes('icon') && (
              <Field label="Upload Icon / Image">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const result = await validateUploadFile(file, 'IMAGE_ICON')
                    if (!result.valid) {
                      setUploadError(result.message)
                      e.target.value = ''
                      return
                    }
                    setUploadError(null)
                    setForm((f) => ({
                      ...f,
                      iconUrl: URL.createObjectURL(file),
                      iconFileName: file.name,
                    }))
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className={cn(inputClass, 'text-left text-[#686868]')}
                >
                  {form.iconFileName || 'Choose image'}
                </button>
                <UploadFieldHint profile="IMAGE_ICON" />
                <UploadValidationMessage message={uploadError} />
              </Field>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 px-5 py-5 sm:gap-4">
          <button
            type="button"
            onClick={() => {
              reset()
              toast.message('Form reset')
            }}
            className="min-w-[120px] rounded-lg bg-gradient-to-r from-[#55ace7] to-[#4a9ad4] px-8 py-2.5 text-sm font-semibold text-white shadow-md transition hover:scale-[1.03] active:scale-[0.98]"
          >
            Reset
          </button>
          <button
            type="submit"
            className="min-w-[120px] rounded-lg bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-8 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(3,4,94,0.35)] transition hover:scale-[1.03] active:scale-[0.98]"
          >
            Save
          </button>
        </div>
      </form>
    </Modal>
  )
}

