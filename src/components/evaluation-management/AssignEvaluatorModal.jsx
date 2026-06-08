import { useEffect, useMemo, useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import BatchFormStickyFooter from '../courses/batch-form/BatchFormStickyFooter'
import { CourseFormField, CourseSelect, CourseInput } from '../courses/CourseFormField'

function emptyForm() {
  return {
    studentId: 'all',
    studentIds: [],
    testId: 'all',
    evaluatorId: 'all',
    deadline: '',
    priority: 'Normal',
    bulk: false,
  }
}

function validate(form) {
  const errors = {}
  if (form.bulk) {
    if (!Array.isArray(form.studentIds) || form.studentIds.length === 0) errors.studentIds = 'Select students'
  } else if (!form.studentId || form.studentId === 'all') {
    errors.studentId = 'Select student'
  }
  if (!form.testId || form.testId === 'all') errors.testId = 'Select test'
  if (!form.evaluatorId || form.evaluatorId === 'all') errors.evaluatorId = 'Select evaluator'
  if (!String(form.deadline || '').trim()) errors.deadline = 'Deadline is required'
  return errors
}

export default function AssignEvaluatorModal({ open, onClose, lookups, onAssign, initialSelectedStudentIds = [] }) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const students = lookups?.students || []
  const tests = lookups?.tests || []
  const evaluators = lookups?.evaluators || []

  useEffect(() => {
    if (!open) return
    const base = emptyForm()
    const today = new Date().toISOString().slice(0, 10)
    setForm((f) => ({
      ...base,
      deadline: today,
      bulk: Array.isArray(initialSelectedStudentIds) && initialSelectedStudentIds.length > 0,
      studentIds: Array.isArray(initialSelectedStudentIds) ? initialSelectedStudentIds : [],
    }))
    setErrors({})
  }, [open, initialSelectedStudentIds])

  const studentOptions = useMemo(() => students.slice().sort((a, b) => String(a.name).localeCompare(String(b.name))), [students])

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
      await onAssign?.({
        studentId: form.bulk ? undefined : form.studentId,
        studentIds: form.bulk ? form.studentIds : undefined,
        testId: form.testId,
        evaluatorId: form.evaluatorId,
        deadline: form.deadline,
        priority: form.priority,
      })
      toast.success('Evaluator assigned')
      close()
    } catch (err) {
      toast.error(err?.message || 'Failed to assign evaluator')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={close} size="lg" title="Assign Evaluator">
      <form
        onSubmit={submit}
        className="flex max-h-[min(88vh,820px)] flex-col overflow-hidden rounded-2xl bg-[#eef2f7] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader title="Assign Evaluator" onBack={close} icon={ClipboardCheck} />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-[#1a3a5c]">Assignment Details</p>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={!!form.bulk}
                  onChange={(e) => setForm((f) => ({ ...f, bulk: e.target.checked }))}
                  className="h-4 w-4 accent-[#246392]"
                />
                Bulk assignment
              </label>
            </div>

            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {!form.bulk ? (
                <CourseFormField label="Select Student" required>
                  <CourseSelect
                    value={form.studentId}
                    onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
                    className={errors.studentId ? 'ring-2 ring-red-400' : undefined}
                  >
                    <option value="all">Select</option>
                    {studentOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </CourseSelect>
                  {errors.studentId && <p className="mt-1 text-xs font-semibold text-red-600">{errors.studentId}</p>}
                </CourseFormField>
              ) : (
                <CourseFormField label="Select Students" required className="sm:col-span-2">
                  <div className={`rounded-xl bg-[#eef2fc] p-3 ${errors.studentIds ? 'ring-2 ring-red-400' : ''}`}>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {studentOptions.map((s) => {
                        const checked = (form.studentIds || []).includes(s.id)
                        return (
                          <label key={s.id} className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                setForm((f) => {
                                  const prev = Array.isArray(f.studentIds) ? f.studentIds : []
                                  const next = e.target.checked ? Array.from(new Set([...prev, s.id])) : prev.filter((id) => id !== s.id)
                                  return { ...f, studentIds: next }
                                })
                              }}
                              className="h-4 w-4 accent-[#246392]"
                            />
                            <span className="truncate">{s.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                  {errors.studentIds && <p className="mt-1 text-xs font-semibold text-red-600">{errors.studentIds}</p>}
                </CourseFormField>
              )}

              <CourseFormField label="Select Test" required>
                <CourseSelect
                  value={form.testId}
                  onChange={(e) => setForm((f) => ({ ...f, testId: e.target.value }))}
                  className={errors.testId ? 'ring-2 ring-red-400' : undefined}
                >
                  <option value="all">Select</option>
                  {tests.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </CourseSelect>
                {errors.testId && <p className="mt-1 text-xs font-semibold text-red-600">{errors.testId}</p>}
              </CourseFormField>

              <CourseFormField label="Select Evaluator" required>
                <CourseSelect
                  value={form.evaluatorId}
                  onChange={(e) => setForm((f) => ({ ...f, evaluatorId: e.target.value }))}
                  className={errors.evaluatorId ? 'ring-2 ring-red-400' : undefined}
                >
                  <option value="all">Select</option>
                  {evaluators.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.speciality})
                    </option>
                  ))}
                </CourseSelect>
                {errors.evaluatorId && <p className="mt-1 text-xs font-semibold text-red-600">{errors.evaluatorId}</p>}
              </CourseFormField>

              <CourseFormField label="Deadline" required>
                <CourseInput
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                  className={errors.deadline ? 'ring-2 ring-red-400' : undefined}
                />
                {errors.deadline && <p className="mt-1 text-xs font-semibold text-red-600">{errors.deadline}</p>}
              </CourseFormField>

              <CourseFormField label="Priority">
                <CourseSelect value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                </CourseSelect>
              </CourseFormField>
            </div>
          </div>
        </div>

        <BatchFormStickyFooter
          isEditMode={false}
          saving={saving}
          onReset={() => {
            setForm(emptyForm())
            setErrors({})
            toast.message('Form reset')
          }}
          createLabel="Assign"
          updateLabel="Assign"
        />
      </form>
    </Modal>
  )
}

