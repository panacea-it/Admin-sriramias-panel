import { useEffect, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import BatchFormStickyFooter from '../../courses/batch-form/BatchFormStickyFooter'
import { CourseFormField, CourseSelect, CourseTextarea } from '../../courses/CourseFormField'
import { useModalForm } from '../../../hooks/useModalForm'
import { INSTRUCTION_DESCRIPTION_MAX_LENGTH } from '../../../data/testConfigurationSeed'
import { validateInstructionDescription } from '../../../utils/testConfigurationValidation'

function emptyForm() {
  return {
    instructionDescription: '',
    status: 'Active',
  }
}

function rowToForm(row) {
  return {
    ...emptyForm(),
    instructionDescription: row?.instructionDescription || '',
    status: row?.status || 'Active',
  }
}

function validate(form) {
  const errors = {}
  const descErr = validateInstructionDescription(form.instructionDescription, INSTRUCTION_DESCRIPTION_MAX_LENGTH)
  if (descErr) errors.instructionDescription = descErr
  return errors
}

export default function ExamPatternFormModal({
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
  const charCount = String(form.instructionDescription || '').length

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
        instructionDescription: String(form.instructionDescription).trim(),
        status: form.status,
      })
      close()
    } catch {
      // Parent handles error toast
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title={isEditMode ? 'Edit Instruction' : 'Add Instruction'}
      showCloseButton={false}
    >
      <form
        onSubmit={submit}
        className="flex max-h-[min(88vh,720px)] flex-col overflow-hidden rounded-2xl bg-[#eef2f7] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader
          title={isEditMode ? 'Edit Instruction' : 'Add Instruction'}
          onClose={close}
          closeVariant="icon"
          plainCloseIcon
          icon={ClipboardList}
        />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
          {loading ? (
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-lg bg-gradient-to-r from-[#eef6fc] via-[#f8fafc] to-[#eef6fc]"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="grid gap-5">
                <CourseFormField label="Instruction Description" required>
                  <CourseTextarea
                    value={form.instructionDescription}
                    onChange={(e) => setForm((f) => ({ ...f, instructionDescription: e.target.value }))}
                    className={errors.instructionDescription ? 'ring-2 ring-red-400' : undefined}
                    rows={6}
                    maxLength={INSTRUCTION_DESCRIPTION_MAX_LENGTH}
                    placeholder="Enter exam instruction text…"
                    disabled={saving}
                  />
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                    {errors.instructionDescription ? (
                      <p className="text-xs font-semibold text-red-600">{errors.instructionDescription}</p>
                    ) : (
                      <span />
                    )}
                    <p className="text-xs text-[#6b7280]">
                      {charCount}/{INSTRUCTION_DESCRIPTION_MAX_LENGTH}
                    </p>
                  </div>
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
          createLabel="Save Instruction"
          updateLabel="Update Instruction"
        />
      </form>
    </Modal>
  )
}
