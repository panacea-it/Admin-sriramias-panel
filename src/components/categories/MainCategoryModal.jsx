import { useRef, useState } from 'react'
import { Layers, X } from 'lucide-react'
import Modal from '../ui/Modal'
import { useModalForm } from '../../hooks/useModalForm'
import { cn } from '../../utils/cn'
import { toast } from '../../utils/toast'
import { UploadFieldHint, UploadValidationMessage } from '../common/UploadFieldHint'
import { validateUploadFile } from '../../utils/uploadValidation'

function createEmptyForm() {
  return {
    name: '',
    description: '',
    status: 'Active',
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

export default function MainCategoryModal({ open, onClose, item, onSubmit }) {
  const fileRef = useRef(null)
  const [uploadError, setUploadError] = useState(null)
  const { form, setForm, isEditMode, reset } = useModalForm(
    open,
    item,
    rowToForm,
    createEmptyForm,
  )
  const [errors, setErrors] = useState({})

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Category name is required'
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
    toast.success(
      isEditMode ? 'Category updated successfully' : 'Category created successfully',
    )
    handleClose()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await validateUploadFile(file, 'IMAGE_ICON')
    if (!result.valid) {
      setUploadError(result.message)
      e.target.value = ''
      return
    }
    setUploadError(null)
    const url = URL.createObjectURL(file)
    setForm((f) => ({
      ...f,
      iconUrl: url,
      iconFileName: file.name,
      iconLabel: f.iconLabel || file.name.slice(0, 2).toUpperCase(),
    }))
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="lg"
      title={isEditMode ? 'Edit Main Category' : 'Add Main Category'}
    >
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#55ace7] via-[#4a9ad4] to-[#246392] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <Layers className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <h2 className="text-lg font-bold text-white sm:text-xl">
              {isEditMode ? 'Edit Main Category' : 'Add Main Category'}
            </h2>
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
          <p className="text-sm font-semibold text-[#246392]">Category Details</p>
        </div>

        <div className="space-y-4 px-5 py-6 sm:px-6 sm:py-7">
          <Field label="Category Name" required error={errors.name}>
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
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
              }}
              className={inputClass}
            />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className={cn(inputClass, 'min-h-[88px] resize-y py-3')}
              placeholder="Brief description of this category"
            />
          </Field>

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

            <Field label="Upload Icon / Image">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={cn(
                  inputClass,
                  'text-left text-[#686868]',
                )}
              >
                <span className="truncate">
                  {form.iconFileName || 'Choose image'}
                </span>
              </button>
              <UploadFieldHint profile="IMAGE_ICON" />
              <UploadValidationMessage message={uploadError} />
              {(form.iconUrl || form.iconLabel) && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#cbeeff] text-sm font-bold text-[#246392]">
                    {form.iconUrl ? (
                      <img
                        src={form.iconUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      form.iconLabel
                    )}
                  </div>
                  <input
                    type="text"
                    value={form.iconLabel}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        iconLabel: e.target.value.toUpperCase().slice(0, 3),
                      }))
                    }
                    className={cn(inputClass, 'max-w-[120px]')}
                    placeholder="AB"
                    maxLength={3}
                  />
                </div>
              )}
            </Field>
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
