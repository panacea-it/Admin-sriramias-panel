import { useEffect, useState } from 'react'
import { Layers } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import BatchFormStickyFooter from '../../courses/batch-form/BatchFormStickyFooter'
import { CourseFormField, CourseInput, CourseSelect } from '../../courses/CourseFormField'
import { useModalForm } from '../../../hooks/useModalForm'
import { validateName } from '../../../utils/testConfigurationValidation'
import { getApiErrorMessage } from '../../../utils/apiError'

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

function validate(form) {
  const errors = {}
  const nameErr = validateName(form.sectionName, 'Section name')
  if (nameErr) errors.sectionName = nameErr
  return errors
}

export default function SectionConfigFormModal({
  open,
  onClose,
  item,
  loading = false,
  onSubmit,
  saving = false,
}) {
  const { form, setForm, isEditMode, reset } = useModalForm(open, item, rowToForm, emptyForm)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) setErrors({})
  }, [open])

  const close = () => onClose?.()

  const submit = async (e) => {
    e.preventDefault()
    const nextErrors = validate(form)
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      toast.error('Please fix the highlighted fields')
      return
    }

    try {
      await onSubmit?.({
        sectionName: String(form.sectionName).trim(),
        status: form.status,
      })
      close()
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to save section')
      if (/already exists/i.test(message)) {
        setErrors({ sectionName: message })
        return
      }
      if (/section name/i.test(message)) {
        setErrors({ sectionName: message })
      }
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
          {loading ? (
            <div className="rounded-2xl bg-white p-8 text-center text-sm text-[#6b7280]">Loading section…</div>
          ) : (
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="grid gap-5">
                <CourseFormField label="Section Name" required>
                  <CourseInput
                    value={form.sectionName}
                    onChange={(e) => setForm((f) => ({ ...f, sectionName: e.target.value }))}
                    className={errors.sectionName ? 'ring-2 ring-red-400' : undefined}
                    placeholder="e.g., GS Paper 1"
                    disabled={saving}
                  />
                  {errors.sectionName && (
                    <p className="mt-1 text-xs font-semibold text-red-600">{errors.sectionName}</p>
                  )}
                </CourseFormField>

                <CourseFormField label="Status">
                  <CourseSelect
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    disabled={saving}
                  >
                    <option value="Active">Active</option>
                    <option value="Deactivated">Inactive</option>
                  </CourseSelect>
                </CourseFormField>
              </div>
            </div>
          )}
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
