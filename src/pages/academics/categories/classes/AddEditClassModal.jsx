import { useEffect, useRef, useState } from 'react'
import { School } from 'lucide-react'
import Modal from '../../../../components/ui/Modal'
import ModalPanelHeader from '../../../../components/courses/ModalPanelHeader'
import { getModalEditKey, useInitOnModalOpen } from '../../../../hooks/modalFormSync'
import { getApiErrorMessage } from '../../../../utils/apiError'
import { toast } from '../../../../utils/toast'
import { mapClassSectionApiErrors } from './classApiHelpers'

function buildForm(item) {
  if (item) {
    return {
      subjectId: item.subjectId || '',
      name: item.name || '',
      status: item.status || 'Active',
    }
  }
  return {
    subjectId: '',
    name: '',
    status: 'Active',
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

export default function AddEditClassModal({
  open,
  onClose,
  item,
  loading = false,
  onSubmit,
  submitting = false,
  subjectOptions = [],
  subjectsLoading = false,
}) {
  const isEdit = Boolean(item)
  const [form, setForm] = useState(buildForm(null))
  const [errors, setErrors] = useState({})
  const closingRef = useRef(false)
  const itemRef = useRef(item)
  itemRef.current = item
  const editKey = getModalEditKey(item)

  useInitOnModalOpen(open, editKey, () => {
    closingRef.current = false
    setForm(buildForm(itemRef.current))
    setErrors({})
  })

  useEffect(() => {
    if (!open || !item || loading) return
    setForm(buildForm(item))
  }, [open, item, loading])

  const title = isEdit ? 'Edit Class' : 'Add Class'

  const handleClose = () => {
    if (closingRef.current || submitting) return
    closingRef.current = true
    setErrors({})
    onClose()
  }

  const validate = () => {
    const next = {}
    if (!form.subjectId) next.subjectId = 'Select a subject'
    const className = form.name.trim()
    if (!className) next.name = 'This field is required'
    else if (className.length > 100) next.name = 'Class name must be at most 100 characters'
    if (!form.status) next.status = 'Status is required'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Please fix the highlighted fields')
      return
    }

    try {
      await onSubmit?.(form, { isEdit, id: item?.id })
      handleClose()
    } catch (error) {
      const fieldErrors = mapClassSectionApiErrors(error)
      if (Object.keys(fieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }))
      }
      const message = getApiErrorMessage(error, 'Failed to save class')
      if (Object.keys(fieldErrors).length === 0) {
        toast.error(message)
      }
    }
  }

  if (!open) return null

  const formDisabled = submitting || loading

  return (
    <Modal open={open} onClose={handleClose} size="lg" title={title} showCloseButton={false}>
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader
          title={title}
          onClose={handleClose}
          closeVariant="icon"
          plainCloseIcon
          icon={School}
          iconClassName="text-[#246392]"
        />

        <div className="mx-4 rounded-xl bg-white px-4 py-3 text-center shadow-[0_6px_20px_rgba(15,23,42,0.08)] sm:mx-6">
          <p className="text-sm font-semibold text-[#246392]">Class Details</p>
        </div>

        <div className="space-y-4 px-5 py-6 sm:px-6 sm:py-7">
          {loading ? (
            <p className="text-center text-sm text-[#686868]">Loading class details…</p>
          ) : (
            <>
              <Field label="Subject" required error={errors.subjectId}>
                <select
                  value={form.subjectId}
                  disabled={formDisabled || subjectsLoading}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, subjectId: e.target.value }))
                    if (errors.subjectId) setErrors((p) => ({ ...p, subjectId: undefined }))
                  }}
                  className={inputClass}
                >
                  <option value="">
                    {subjectsLoading ? 'Loading subjects…' : 'Select Subject'}
                  </option>
                  {subjectOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Class Name" required error={errors.name}>
                <input
                  type="text"
                  value={form.name}
                  disabled={formDisabled}
                  placeholder="Enter Class Name"
                  maxLength={100}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name: e.target.value }))
                    if (errors.name) setErrors((p) => ({ ...p, name: undefined }))
                  }}
                  className={inputClass}
                />
              </Field>

              <Field label="Status" required error={errors.status}>
                <select
                  value={form.status}
                  disabled={formDisabled}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className={inputClass}
                >
                  <option value="Active">Active</option>
                  <option value="In Active">Inactive</option>
                </select>
              </Field>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 px-5 py-5 sm:gap-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={formDisabled}
            className="min-w-[120px] rounded-lg border border-slate-200 bg-white px-8 py-2.5 text-sm font-semibold text-[#444] shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={formDisabled || loading}
            className="min-w-[120px] rounded-lg bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-8 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(3,4,94,0.35)] transition hover:scale-[1.03] active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? 'Saving…' : isEdit ? 'Update Class' : 'Save Class'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
