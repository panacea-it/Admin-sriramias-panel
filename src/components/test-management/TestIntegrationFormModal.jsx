import { useEffect, useState } from 'react'
import { Plug } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import BatchFormStickyFooter from '../courses/batch-form/BatchFormStickyFooter'
import {
  CourseDateInput,
  CourseFormField,
  CourseInput,
  CourseSelect,
} from '../courses/CourseFormField'
import { useModalForm } from '../../hooks/useModalForm'
import { INTEGRATION_STATUSES } from '../../data/testManagementSeed'

function emptyForm() {
  return {
    id: '',
    testName: '',
    course: '',
    batch: '',
    faculty: '',
    subject: '',
    scheduleDate: '',
    durationMins: 60,
    status: 'Draft',
  }
}

function rowToForm(row) {
  return { ...emptyForm(), ...row }
}

function validate(form) {
  const errors = {}
  if (!String(form.testName || '').trim()) errors.testName = 'Test name is required'
  if (!String(form.course || '').trim()) errors.course = 'Course is required'
  if (!String(form.batch || '').trim()) errors.batch = 'Batch is required'
  if (!String(form.subject || '').trim()) errors.subject = 'Subject is required'
  return errors
}

export default function TestIntegrationFormModal({ open, onClose, item, onSubmit }) {
  const { form, setForm, isEditMode, reset } = useModalForm(open, item, rowToForm, emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

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
    setSaving(true)
    try {
      await onSubmit?.(
        {
          ...form,
          testName: String(form.testName || '').trim(),
          course: String(form.course || '').trim(),
          batch: String(form.batch || '').trim(),
          faculty: String(form.faculty || '').trim(),
          subject: String(form.subject || '').trim(),
        },
        { isEdit: isEditMode, id: item?.id },
      )
      toast.success(isEditMode ? 'Integration updated' : 'Integration created')
      close()
    } catch (err) {
      toast.error(err?.message || 'Failed to save integration')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={close} size="lg" title={isEditMode ? 'Edit Integration' : 'Create Integration'}>
      <form
        onSubmit={submit}
        className="flex max-h-[min(88vh,760px)] flex-col overflow-hidden rounded-2xl bg-[#eef2f7] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader title={isEditMode ? 'Edit Integration' : 'Create Integration'} onBack={close} icon={Plug} />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="grid gap-5 sm:grid-cols-2">
              <CourseFormField label="Integration ID">
                <CourseInput
                  value={form.id}
                  onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                  placeholder="Auto-generated if left blank"
                />
              </CourseFormField>
              <CourseFormField label="Status">
                <CourseSelect value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                  {INTEGRATION_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </CourseSelect>
              </CourseFormField>

              <CourseFormField label="Test Name" required className="sm:col-span-2">
                <CourseInput
                  value={form.testName}
                  onChange={(e) => setForm((f) => ({ ...f, testName: e.target.value }))}
                  className={errors.testName ? 'ring-2 ring-red-400' : undefined}
                />
                {errors.testName && <p className="mt-1 text-xs font-semibold text-red-600">{errors.testName}</p>}
              </CourseFormField>

              <CourseFormField label="Course" required>
                <CourseInput
                  value={form.course}
                  onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))}
                  className={errors.course ? 'ring-2 ring-red-400' : undefined}
                />
                {errors.course && <p className="mt-1 text-xs font-semibold text-red-600">{errors.course}</p>}
              </CourseFormField>

              <CourseFormField label="Batch" required>
                <CourseInput
                  value={form.batch}
                  onChange={(e) => setForm((f) => ({ ...f, batch: e.target.value }))}
                  className={errors.batch ? 'ring-2 ring-red-400' : undefined}
                />
                {errors.batch && <p className="mt-1 text-xs font-semibold text-red-600">{errors.batch}</p>}
              </CourseFormField>

              <CourseFormField label="Faculty">
                <CourseInput value={form.faculty} onChange={(e) => setForm((f) => ({ ...f, faculty: e.target.value }))} />
              </CourseFormField>

              <CourseFormField label="Subject" required>
                <CourseInput
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className={errors.subject ? 'ring-2 ring-red-400' : undefined}
                />
                {errors.subject && <p className="mt-1 text-xs font-semibold text-red-600">{errors.subject}</p>}
              </CourseFormField>

              <CourseFormField label="Schedule Date">
                <CourseDateInput
                  value={form.scheduleDate || ''}
                  onChange={(e) => setForm((f) => ({ ...f, scheduleDate: e.target.value }))}
                />
              </CourseFormField>

              <CourseFormField label="Duration (mins)">
                <CourseInput
                  type="number"
                  min={1}
                  value={form.durationMins || 60}
                  onChange={(e) => setForm((f) => ({ ...f, durationMins: Number(e.target.value) }))}
                />
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
          createLabel="Save Integration"
          updateLabel="Update Integration"
        />
      </form>
    </Modal>
  )
}

