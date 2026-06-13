import { useEffect, useState } from 'react'
import { Layers } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import BatchFormStickyFooter from '../../courses/batch-form/BatchFormStickyFooter'
import { CourseFormField, CourseInput, CourseSelect } from '../../courses/CourseFormField'
import { useModalForm } from '../../../hooks/useModalForm'
import { validateDuplicateName, validateName } from '../../../utils/testConfigurationValidation'

function emptyForm() {
  return {
    sectionName: '',
    status: 'Active',
  }
}

function rowToForm(row) {
  return {
    ...emptyForm(),
    sectionName: row?.sectionName || row?.configurationName || '',
    status: row?.status || 'Active',
  }
}

function validate(form, existingRows, currentId) {
  const errors = {}
  const nameErr = validateName(form.sectionName, 'Section name')
  if (nameErr) errors.sectionName = nameErr
  else {
    const dup = validateDuplicateName(form.sectionName, existingRows, 'sectionName', currentId)
    if (dup) errors.sectionName = dup
    const legacyDup = validateDuplicateName(form.sectionName, existingRows, 'configurationName', currentId)
    if (legacyDup) errors.sectionName = legacyDup
  }
  return errors
}

export default function SectionConfigFormModal({ open, onClose, item, existingRows = [], onSubmit }) {
  const { form, setForm, isEditMode, reset } = useModalForm(open, item, rowToForm, emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setErrors({})
  }, [open])

  const close = () => onClose?.()

  const submit = async (e) => {
    e.preventDefault()
    const nextErrors = validate(form, existingRows, item?.id)
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      toast.error('Please fix the highlighted fields')
      return
    }

    setSaving(true)
    try {
      await onSubmit?.(
        {
          sectionName: String(form.sectionName).trim(),
          status: form.status,
        },
        { isEdit: isEditMode, id: item?.id },
      )
      toast.success(isEditMode ? 'Section updated' : 'Section added')
      close()
    } catch (err) {
      toast.error(err?.message || 'Failed to save section')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={close} size="lg" title={isEditMode ? 'Edit Section' : 'Add Section'} showCloseButton={false}>
      <form
        onSubmit={submit}
        className="flex max-h-[min(88vh,640px)] flex-col overflow-hidden rounded-2xl bg-[#eef2f7] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader
          title={isEditMode ? 'Edit Section' : 'Add Section'}
          onClose={close}
          closeVariant="icon"
          plainCloseIcon
          icon={Layers}
        />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="grid gap-5">
              <CourseFormField label="Section Name" required>
                <CourseInput
                  value={form.sectionName}
                  onChange={(e) => setForm((f) => ({ ...f, sectionName: e.target.value }))}
                  className={errors.sectionName ? 'ring-2 ring-red-400' : undefined}
                  placeholder="e.g., GS Paper 1"
                />
                {errors.sectionName && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{errors.sectionName}</p>
                )}
              </CourseFormField>

              <CourseFormField label="Status">
                <CourseSelect
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </CourseSelect>
              </CourseFormField>
            </div>
          </div>
        </div>
        <BatchFormStickyFooter
          isEditMode={isEditMode}
          saving={saving}
          onReset={() => {
            reset()
            setErrors({})
            toast.message('Form reset')
          }}
          createLabel="Save Section"
          updateLabel="Update Section"
        />
      </form>
    </Modal>
  )
}
