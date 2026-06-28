import { useEffect, useState } from 'react'
import { Languages } from 'lucide-react'
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
    languageName: '',
    status: 'Active',
  }
}

function rowToForm(row) {
  return {
    ...emptyForm(),
    languageName: row?.languageName || '',
    status: row?.status || 'Active',
  }
}

function validate(form) {
  const errors = {}
  const nameErr = validateName(form.languageName, 'Language')
  if (nameErr) errors.languageName = nameErr
  return errors
}

export default function LanguageFormModal({
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
        languageName: String(form.languageName).trim(),
        status: form.status,
      })
      close()
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to save language')
      if (/already exists/i.test(message)) {
        setErrors({ languageName: message })
        return
      }
      if (/language name/i.test(message)) {
        setErrors({ languageName: message })
      }
    }
  }

  return (
    <Modal open={open} onClose={close} size="lg" title={isEditMode ? 'Edit Language' : 'Add Language'} showCloseButton={false}>
      <form
        onSubmit={submit}
        className="flex max-h-[min(88vh,640px)] flex-col overflow-hidden rounded-2xl bg-[#eef2f7] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader
          title={isEditMode ? 'Edit Language' : 'Add Language'}
          onClose={close}
          closeVariant="icon"
          plainCloseIcon
          icon={Languages}
        />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
          {loading ? (
            <div className="rounded-2xl bg-white p-8 text-center text-sm text-[#6b7280]">Loading language…</div>
          ) : (
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="grid gap-5">
                <CourseFormField label="Enter Language" required>
                  <CourseInput
                    value={form.languageName}
                    onChange={(e) => setForm((f) => ({ ...f, languageName: e.target.value }))}
                    className={errors.languageName ? 'ring-2 ring-red-400' : undefined}
                    placeholder="e.g., English"
                    disabled={saving}
                  />
                  {errors.languageName && (
                    <p className="mt-1 text-xs font-semibold text-red-600">{errors.languageName}</p>
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
          createLabel="Save Language"
          updateLabel="Update Language"
        />
      </form>
    </Modal>
  )
}
