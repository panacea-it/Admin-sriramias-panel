import { useEffect, useRef, useState } from 'react'
import { Layers } from 'lucide-react'
import Modal from '../../../../components/ui/Modal'
import ModalPanelHeader from '../../../../components/courses/ModalPanelHeader'
import { getModalEditKey, useInitOnModalOpen } from '../../../../hooks/modalFormSync'
import { cn } from '../../../../utils/cn'
import { toast } from '../../../../utils/toast'
import { mapApiSubjectToLocal } from './subjectHelpers'

function buildForm(item) {
  if (item) {
    const mapped = mapApiSubjectToLocal(item) || item
    return {
      name: mapped.name || '',
      description: mapped.description || '',
      status: mapped.status || 'Active',
    }
  }
  return { name: '', description: '', status: 'Active' }
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

export default function AddEditSubjectModal({
  open,
  onClose,
  item,
  onSubmit,
  detailLoading = false,
  submitting = false,
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
    if (!open || !item || detailLoading) return
    setForm(buildForm(item))
  }, [open, item, detailLoading])

  const title = isEdit ? 'Edit Subjects' : 'Add Subjects'

  const handleClose = () => {
    if (closingRef.current || submitting) return
    closingRef.current = true
    setErrors({})
    onClose()
  }

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'This field is required'
    if (!form.status) next.status = 'Status is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleReset = () => {
    setForm(buildForm(isEdit ? item : null))
    setErrors({})
    toast.message('Form reset')
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
    } catch {
      // Parent shows toast; keep modal open
    }
  }

  if (!open) return null

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
          icon={Layers}
          iconClassName="text-[#246392]"
        />

        <div className="mx-4 rounded-xl bg-white px-4 py-3 text-center shadow-[0_6px_20px_rgba(15,23,42,0.08)] sm:mx-6">
          <p className="text-sm font-semibold text-[#246392]">Subjects Details</p>
        </div>

        {detailLoading ? (
          <div className="flex min-h-[200px] items-center justify-center px-6 py-10 text-sm font-medium text-[#686868]">
            Loading subject details…
          </div>
        ) : (
          <div className="space-y-4 px-5 py-6 sm:px-6 sm:py-7">
            {isEdit && (item?.subjectId || item?.displayId) ? (
              <Field label="Subject ID">
                <input
                  type="text"
                  value={item.subjectId || item.displayId}
                  readOnly
                  disabled
                  className={cn(inputClass, 'cursor-not-allowed opacity-70')}
                />
              </Field>
            ) : null}

            <Field label="Subject Name" required error={errors.name}>
              <input
                type="text"
                value={form.name}
                disabled={submitting}
                onChange={(e) => {
                  setForm((f) => ({ ...f, name: e.target.value }))
                  if (errors.name) setErrors((p) => ({ ...p, name: undefined }))
                }}
                className={inputClass}
              />
            </Field>

            <Field label="Description">
              <textarea
                value={form.description}
                disabled={submitting}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className={cn(inputClass, 'min-h-[88px] resize-y py-3')}
              />
            </Field>

            <Field label="Status" required error={errors.status}>
              <select
                value={form.status}
                disabled={submitting}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className={inputClass}
              >
                <option value="Active">Active</option>
                <option value="In Active">In Active</option>
              </select>
            </Field>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 px-5 py-5 sm:gap-4">
          <button
            type="button"
            onClick={handleReset}
            disabled={submitting || detailLoading}
            className="min-w-[120px] rounded-lg bg-gradient-to-r from-[#55ace7] to-[#4a9ad4] px-8 py-2.5 text-sm font-semibold text-white shadow-md transition hover:scale-[1.03] active:scale-[0.98] disabled:opacity-60"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={submitting || detailLoading}
            className="min-w-[120px] rounded-lg bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-8 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(3,4,94,0.35)] transition hover:scale-[1.03] active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
