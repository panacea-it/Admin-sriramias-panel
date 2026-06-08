import { useEffect, useState } from 'react'
import { Settings2 } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import BatchFormStickyFooter from '../courses/batch-form/BatchFormStickyFooter'
import { CourseFormField, CourseInput, CourseSelect } from '../courses/CourseFormField'
import { useModalForm } from '../../hooks/useModalForm'
import { TEST_CONFIG_STATUSES } from '../../data/testManagementSeed'

function emptyForm() {
  return {
    id: '',
    testName: '',
    subject: '',
    totalQuestions: 0,
    totalMarks: 0,
    difficultyMix: '',
    status: 'Draft',
    tags: { topics: [], category: '' },
  }
}

function rowToForm(row) {
  const base = emptyForm()
  return { ...base, ...row, tags: { ...base.tags, ...(row?.tags || {}) } }
}

function validate(form) {
  const errors = {}
  if (!String(form.testName || '').trim()) errors.testName = 'Test name is required'
  if (!String(form.subject || '').trim()) errors.subject = 'Subject is required'
  return errors
}

export default function TestConfigFormModal({ open, onClose, item, onSubmit }) {
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
          subject: String(form.subject || '').trim(),
        },
        { isEdit: isEditMode, id: item?.id },
      )
      toast.success(isEditMode ? 'Configuration updated' : 'Configuration created')
      close()
    } catch (err) {
      toast.error(err?.message || 'Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={close} size="lg" title={isEditMode ? 'Edit Configuration' : 'Create Configuration'}>
      <form
        onSubmit={submit}
        className="flex max-h-[min(88vh,760px)] flex-col overflow-hidden rounded-2xl bg-[#eef2f7] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader
          title={isEditMode ? 'Edit Configuration' : 'Create Configuration'}
          onBack={close}
          icon={Settings2}
        />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="grid gap-5 sm:grid-cols-2">
              <CourseFormField label="Config ID">
                <CourseInput
                  value={form.id}
                  onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                  placeholder="Auto-generated if left blank"
                />
              </CourseFormField>
              <CourseFormField label="Status">
                <CourseSelect value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                  {TEST_CONFIG_STATUSES.map((s) => (
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
                  placeholder="e.g., Polity Full Length Test 1"
                />
                {errors.testName && <p className="mt-1 text-xs font-semibold text-red-600">{errors.testName}</p>}
              </CourseFormField>

              <CourseFormField label="Subject" required>
                <CourseInput
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className={errors.subject ? 'ring-2 ring-red-400' : undefined}
                  placeholder="e.g., Polity"
                />
                {errors.subject && <p className="mt-1 text-xs font-semibold text-red-600">{errors.subject}</p>}
              </CourseFormField>

              <CourseFormField label="Category Tag">
                <CourseInput
                  value={form.tags?.category || ''}
                  onChange={(e) => setForm((f) => ({ ...f, tags: { ...(f.tags || {}), category: e.target.value } }))}
                  placeholder="e.g., Mains / Prelims / Mini Test"
                />
              </CourseFormField>

              <CourseFormField label="Difficulty Mix (label)">
                <CourseInput
                  value={form.difficultyMix}
                  onChange={(e) => setForm((f) => ({ ...f, difficultyMix: e.target.value }))}
                  placeholder="e.g., E:10 / M:8 / H:2"
                />
              </CourseFormField>

              <CourseFormField label="Total Questions">
                <CourseInput
                  type="number"
                  min={0}
                  value={form.totalQuestions || 0}
                  onChange={(e) => setForm((f) => ({ ...f, totalQuestions: Number(e.target.value) }))}
                />
              </CourseFormField>

              <CourseFormField label="Total Marks">
                <CourseInput
                  type="number"
                  min={0}
                  value={form.totalMarks || 0}
                  onChange={(e) => setForm((f) => ({ ...f, totalMarks: Number(e.target.value) }))}
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
          createLabel="Save Configuration"
          updateLabel="Update Configuration"
        />
      </form>
    </Modal>
  )
}

