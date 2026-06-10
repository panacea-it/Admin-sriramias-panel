import { useEffect, useState } from 'react'
import { Scale } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import BatchFormStickyFooter from '../../courses/batch-form/BatchFormStickyFooter'
import { CourseFormField, CourseInput, CourseSelect, CourseTextarea } from '../../courses/CourseFormField'
import { useModalForm } from '../../../hooks/useModalForm'
import { APPLICABLE_TEST_TYPES } from '../../../data/testConfigurationSeed'
import {
  validateDuplicateName,
  validateName,
  validateNonNegativeNumber,
  validatePositiveNumber,
} from '../../../utils/testConfigurationValidation'

function emptyForm() {
  return {
    ruleName: '',
    positiveMarks: 2,
    negativeMarks: 0.66,
    partialMarking: false,
    partialMarksValue: 0,
    description: '',
    applicableTests: ['Prelims'],
    status: 'Active',
  }
}

function rowToForm(row) {
  return {
    ...emptyForm(),
    ...row,
    applicableTests: Array.isArray(row?.applicableTests) ? row.applicableTests : ['Prelims'],
  }
}

function validate(form, existingRows, currentId) {
  const errors = {}
  const nameErr = validateName(form.ruleName, 'Rule name')
  if (nameErr) errors.ruleName = nameErr
  else {
    const dup = validateDuplicateName(form.ruleName, existingRows, 'ruleName', currentId)
    if (dup) errors.ruleName = dup
  }
  const posErr = validatePositiveNumber(form.positiveMarks, 'Positive marks', { allowZero: false })
  if (posErr) errors.positiveMarks = posErr
  const negErr = validateNonNegativeNumber(form.negativeMarks, 'Negative marks')
  if (negErr) errors.negativeMarks = negErr
  if (form.partialMarking) {
    const partialErr = validateNonNegativeNumber(form.partialMarksValue, 'Partial marks value')
    if (partialErr) errors.partialMarksValue = partialErr
  }
  if (!form.applicableTests?.length) errors.applicableTests = 'Select at least one applicable test type'
  return errors
}

export default function MarkingRuleFormModal({ open, onClose, item, existingRows = [], onSubmit }) {
  const { form, setForm, isEditMode, reset } = useModalForm(open, item, rowToForm, emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setErrors({})
  }, [open])

  const close = () => onClose?.()

  const toggleApplicableTest = (testType) => {
    setForm((f) => {
      const current = f.applicableTests || []
      const next = current.includes(testType)
        ? current.filter((t) => t !== testType)
        : [...current, testType]
      return { ...f, applicableTests: next }
    })
  }

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
          ...form,
          ruleName: String(form.ruleName).trim(),
          description: String(form.description || '').trim(),
          partialMarksValue: form.partialMarking ? Number(form.partialMarksValue) : 0,
        },
        { isEdit: isEditMode, id: item?.id },
      )
      toast.success(isEditMode ? 'Marking rule updated' : 'Marking rule created')
      close()
    } catch (err) {
      toast.error(err?.message || 'Failed to save marking rule')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={close} size="lg" title={isEditMode ? 'Edit Marking Rule' : 'Add Marking Rule'}>
      <form
        onSubmit={submit}
        className="flex max-h-[min(88vh,760px)] flex-col overflow-hidden rounded-2xl bg-[#eef2f7] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader
          title={isEditMode ? 'Edit Marking Rule' : 'Add Marking Rule'}
          onBack={close}
          icon={Scale}
        />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="grid gap-5 sm:grid-cols-2">
              <CourseFormField label="Rule Name" required className="sm:col-span-2">
                <CourseInput
                  value={form.ruleName}
                  onChange={(e) => setForm((f) => ({ ...f, ruleName: e.target.value }))}
                  className={errors.ruleName ? 'ring-2 ring-red-400' : undefined}
                  placeholder="e.g., Standard UPSC Rule"
                />
                {errors.ruleName && <p className="mt-1 text-xs font-semibold text-red-600">{errors.ruleName}</p>}
              </CourseFormField>

              <CourseFormField label="Positive Marks" required>
                <CourseInput
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.positiveMarks}
                  onChange={(e) => setForm((f) => ({ ...f, positiveMarks: Number(e.target.value) }))}
                  className={errors.positiveMarks ? 'ring-2 ring-red-400' : undefined}
                />
              </CourseFormField>

              <CourseFormField label="Negative Marks">
                <CourseInput
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.negativeMarks}
                  onChange={(e) => setForm((f) => ({ ...f, negativeMarks: Number(e.target.value) }))}
                  className={errors.negativeMarks ? 'ring-2 ring-red-400' : undefined}
                />
              </CourseFormField>

              <CourseFormField label="Partial Marking">
                <CourseSelect
                  value={form.partialMarking ? 'yes' : 'no'}
                  onChange={(e) => setForm((f) => ({ ...f, partialMarking: e.target.value === 'yes' }))}
                >
                  <option value="no">Disabled</option>
                  <option value="yes">Enabled</option>
                </CourseSelect>
              </CourseFormField>

              {form.partialMarking && (
                <CourseFormField label="Partial Marks Value">
                  <CourseInput
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.partialMarksValue}
                    onChange={(e) => setForm((f) => ({ ...f, partialMarksValue: Number(e.target.value) }))}
                    className={errors.partialMarksValue ? 'ring-2 ring-red-400' : undefined}
                  />
                </CourseFormField>
              )}

              <CourseFormField label="Status">
                <CourseSelect value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </CourseSelect>
              </CourseFormField>

              <CourseFormField label="Rule Description" className="sm:col-span-2">
                <CourseTextarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Describe when this marking rule applies…"
                />
              </CourseFormField>

              <CourseFormField label="Applicable Test Types" required className="sm:col-span-2">
                <div className="flex flex-wrap gap-2">
                  {APPLICABLE_TEST_TYPES.map((t) => {
                    const selected = (form.applicableTests || []).includes(t)
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleApplicableTest(t)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                          selected
                            ? 'bg-[#1a3a5c] text-white'
                            : 'bg-[#eef2fc] text-[#555] hover:bg-[#dbeafe]'
                        }`}
                      >
                        {t}
                      </button>
                    )
                  })}
                </div>
                {errors.applicableTests && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{errors.applicableTests}</p>
                )}
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
          createLabel="Save Rule"
          updateLabel="Update Rule"
        />
      </form>
    </Modal>
  )
}
