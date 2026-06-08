import { useEffect, useMemo, useState } from 'react'
import { FileQuestion } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import BatchFormStickyFooter from '../courses/batch-form/BatchFormStickyFooter'
import {
  CourseFormField,
  CourseInput,
  CourseSelect,
  CourseTextarea,
  CourseFileInput,
} from '../courses/CourseFormField'
import { cn } from '../../utils/cn'
import { useModalForm } from '../../hooks/useModalForm'
import {
  createEmptyQuestionForm,
  questionRowToForm,
  validateQuestionForm,
  inferCategoryFromRow,
} from '../../utils/testManagementQuestionForm'
import {
  QUESTION_BANK_TYPES,
  QUESTION_CATEGORIES,
  QUESTION_DIFFICULTIES,
  QUESTION_STATUSES,
  QUESTION_TAG_SUGGESTIONS,
} from '../../data/testManagementSeed'

function ErrorHint({ message }) {
  if (!message) return null
  return <p className="mt-1 text-xs font-semibold text-red-600">{message}</p>
}

export default function QuestionFormModal({ open, onClose, item, duplicateSource, onSubmit }) {
  const forceCreateMode = Boolean(duplicateSource)
  const baseItem = duplicateSource ? { ...duplicateSource, id: '' } : item
  const { form, setForm, isEditMode, reset } = useModalForm(
    open,
    baseItem,
    questionRowToForm,
    createEmptyQuestionForm,
    { forceCreateMode },
  )

  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setErrors({})
  }, [open])

  const content = form.content || {}
  const category = form.category || 'Prelims'
  const type = form.type || (category === 'Prelims' ? 'MCQ' : 'Descriptive')

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('Failed to read image'))
      reader.readAsDataURL(file)
    })

  const modalTitle = useMemo(() => {
    if (duplicateSource) return 'Duplicate Question'
    return isEditMode ? 'Edit Question' : 'Add Question'
  }, [duplicateSource, isEditMode])

  const close = () => onClose?.()

  const setContent = (patch) => setForm((f) => ({ ...f, content: { ...(f.content || {}), ...patch } }))
  const setOption = (idx, value) => {
    const list = Array.isArray(content.options) ? content.options : []
    const normalized = [...list.map((o) => String(o ?? '')), '', '', '', ''].slice(0, 4)
    const next = normalized.map((o, i) => (i === idx ? value : o))
    setContent({ options: next })
  }

  const submit = async (e) => {
    e.preventDefault()
    const nextErrors = validateQuestionForm(form)
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      toast.error('Please fix the highlighted fields')
      return
    }
    setSaving(true)
    try {
      const resolvedCategory = inferCategoryFromRow({ ...form, category })
      const payload = {
        ...form,
        category: resolvedCategory,
        type,
        status: form.status === 'In Active' ? 'Inactive' : form.status,
        content: {
          question: String(content.question || ''),
          explanation: String(content.explanation || ''),
          imageDataUrl: String(content.imageDataUrl || ''),
          ...(type === 'MCQ'
            ? {
                options: [...(Array.isArray(content.options) ? content.options : []), '', '', '', ''].slice(0, 4),
                correctOptionIndex: Number(content.correctOptionIndex ?? 0) || 0,
              }
            : {}),
          ...(type === 'Numerical' ? { numericalAnswer: String(content.numericalAnswer || '') } : {}),
          ...(type === 'Match the Following'
            ? {
                prompt: String(content.prompt || ''),
                left: Array.isArray(content.left) ? content.left : ['', '', '', ''],
                right: Array.isArray(content.right) ? content.right : ['', '', '', ''],
                mapping: Array.isArray(content.mapping) ? content.mapping : [0, 1, 2, 3],
              }
            : {}),
          ...(type === 'Assertion Reason'
            ? {
                assertion: String(content.assertion || ''),
                reason: String(content.reason || ''),
                correctAnswer: String(content.correctAnswer || ''),
              }
            : {}),
        },
      }
      await onSubmit?.(payload, { isEdit: isEditMode, id: item?.id })
      toast.success(isEditMode ? 'Question updated successfully' : 'Question saved successfully')
      close()
    } catch (err) {
      toast.error(err?.message || 'Failed to save question')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={close} size="full" title={modalTitle} showCloseButton={false}>
      <form
        onSubmit={submit}
        className="flex max-h-[min(92vh,920px)] flex-col overflow-hidden rounded-2xl bg-[#eef2f7] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader title={modalTitle} onClose={close} icon={FileQuestion} closeVariant="icon" plainCloseIcon />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-8 sm:py-8">
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#1a3a5c]">
                Question Type
              </h3>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <CourseFormField label="Category" required>
                  <CourseSelect
                    value={form.category}
                    onChange={(e) => {
                      const next = e.target.value
                      setForm((f) => ({
                        ...f,
                        category: next,
                        content:
                          next === 'Mains'
                            ? { ...(f.content || {}), options: ['', '', '', ''], correctOptionIndex: 0 }
                            : {
                                ...(f.content || {}),
                                options: [...(Array.isArray((f.content || {}).options) ? (f.content || {}).options : []), '', '', '', ''].slice(0, 4),
                                correctOptionIndex: 0,
                              },
                      }))
                    }}
                    className={cn(errors.category && 'ring-2 ring-red-400')}
                  >
                    <option value={QUESTION_CATEGORIES[0]}>Prelims</option>
                    <option value={QUESTION_CATEGORIES[1]}>Mains</option>
                  </CourseSelect>
                  <ErrorHint message={errors.category} />
                </CourseFormField>

                <CourseFormField label="Type" required>
                  <CourseSelect
                    value={form.type || ''}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className={cn(errors.type && 'ring-2 ring-red-400')}
                  >
                    {QUESTION_BANK_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </CourseSelect>
                  <ErrorHint message={errors.type} />
                </CourseFormField>

                <CourseFormField label="Status" required>
                  <CourseSelect
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className={cn(errors.status && 'ring-2 ring-red-400')}
                  >
                    {QUESTION_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </CourseSelect>
                  <ErrorHint message={errors.status} />
                </CourseFormField>

                <CourseFormField label="Subject" required>
                  <CourseInput
                    value={form.subject || ''}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    className={cn(errors.subject && 'ring-2 ring-red-400')}
                    placeholder="e.g., Polity"
                  />
                  <ErrorHint message={errors.subject} />
                </CourseFormField>

                <CourseFormField label="Topic" required>
                  <CourseInput
                    value={form.topic || ''}
                    onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                    className={cn(errors.topic && 'ring-2 ring-red-400')}
                    placeholder="e.g., Constitution"
                  />
                  <ErrorHint message={errors.topic} />
                </CourseFormField>

                <CourseFormField label="Difficulty" required>
                  <CourseSelect
                    value={form.difficulty}
                    onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                    className={cn(errors.difficulty && 'ring-2 ring-red-400')}
                  >
                    {QUESTION_DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </CourseSelect>
                  <ErrorHint message={errors.difficulty} />
                </CourseFormField>

                <CourseFormField label="Tags (comma separated)">
                  <CourseInput
                    value={Array.isArray(form.tags) ? form.tags.join(', ') : ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        tags: String(e.target.value || '')
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean),
                      }))
                    }
                    placeholder={QUESTION_TAG_SUGGESTIONS.slice(0, 6).join(', ')}
                  />
                </CourseFormField>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#1a3a5c]">
                Question Content
              </h3>
              <div className="mt-5">
                <CourseFormField label={type === 'Descriptive' ? 'Descriptive Question' : 'Question Text'} required>
                  <CourseTextarea
                    rows={type === 'Descriptive' ? 10 : 6}
                    value={content.question}
                    onChange={(e) => setContent({ question: e.target.value })}
                    className={cn(errors.question && 'ring-2 ring-red-400')}
                    placeholder="Enter question"
                  />
                  <ErrorHint message={errors.question} />
                </CourseFormField>
              </div>

              {type === 'MCQ' && (
                <div className="mt-5 space-y-5">
                  <div>
                    <h4 className="text-sm font-extrabold uppercase tracking-wide text-[#1a3a5c]">Options</h4>
                    <p className="mt-1 text-xs font-semibold text-slate-500">All options A–D are required.</p>
                  </div>
                  <ErrorHint message={errors.options} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    {['A', 'B', 'C', 'D'].map((label, idx) => (
                      <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Option {label}</p>
                        <div className="mt-2">
                          <textarea
                            rows={2}
                            value={(Array.isArray(content.options) ? content.options[idx] : '') || ''}
                            onChange={(e) => setOption(idx, e.target.value)}
                            className="h-auto w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-[#55ace7]"
                            placeholder={`Enter option ${label}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <CourseFormField label="Correct Answer" required>
                      <CourseSelect
                        value={String(content.correctOptionIndex ?? 0)}
                        onChange={(e) => setContent({ correctOptionIndex: Number(e.target.value) })}
                        className={cn(errors.correctOptionIndex && 'ring-2 ring-red-400')}
                      >
                        <option value={0}>A</option>
                        <option value={1}>B</option>
                        <option value={2}>C</option>
                        <option value={3}>D</option>
                      </CourseSelect>
                      <ErrorHint message={errors.correctOptionIndex} />
                    </CourseFormField>
                  </div>
                </div>
              )}

              {type === 'Numerical' && (
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <CourseFormField label="Numerical Answer" required>
                    <CourseInput
                      value={content.numericalAnswer || ''}
                      onChange={(e) => setContent({ numericalAnswer: e.target.value })}
                      className={cn(errors.numericalAnswer && 'ring-2 ring-red-400')}
                      placeholder="e.g., 8"
                    />
                    <ErrorHint message={errors.numericalAnswer} />
                  </CourseFormField>
                </div>
              )}

              {type === 'Assertion Reason' && (
                <div className="mt-5 grid gap-5">
                  <CourseFormField label="Assertion" required>
                    <CourseTextarea
                      rows={3}
                      value={content.assertion || ''}
                      onChange={(e) => setContent({ assertion: e.target.value })}
                      className={cn(errors.assertion && 'ring-2 ring-red-400')}
                      placeholder="Enter assertion"
                    />
                    <ErrorHint message={errors.assertion} />
                  </CourseFormField>
                  <CourseFormField label="Reason" required>
                    <CourseTextarea
                      rows={3}
                      value={content.reason || ''}
                      onChange={(e) => setContent({ reason: e.target.value })}
                      className={cn(errors.reason && 'ring-2 ring-red-400')}
                      placeholder="Enter reason"
                    />
                    <ErrorHint message={errors.reason} />
                  </CourseFormField>
                  <CourseFormField label="Correct Answer" required>
                    <CourseSelect
                      value={content.correctAnswer || ''}
                      onChange={(e) => setContent({ correctAnswer: e.target.value })}
                      className={cn(errors.correctAnswer && 'ring-2 ring-red-400')}
                    >
                      <option value="">Select</option>
                      <option value="Both A and R are true, and R is the correct explanation of A">Both true & R explains A</option>
                      <option value="Both A and R are true, but R is not the correct explanation of A">Both true but R not explanation</option>
                      <option value="A is true, but R is false">A true, R false</option>
                      <option value="A is false, but R is true">A false, R true</option>
                    </CourseSelect>
                    <ErrorHint message={errors.correctAnswer} />
                  </CourseFormField>
                </div>
              )}

              {type === 'Match the Following' && (
                <div className="mt-5 space-y-5">
                  <CourseFormField label="Prompt">
                    <CourseTextarea
                      rows={3}
                      value={content.prompt || ''}
                      onChange={(e) => setContent({ prompt: e.target.value })}
                      placeholder="Instructions for matching"
                    />
                  </CourseFormField>
                  <ErrorHint message={errors.left || errors.right} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <p className="text-sm font-extrabold uppercase tracking-wide text-slate-500">Left</p>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <CourseInput
                          key={`l-${i}`}
                          value={(Array.isArray(content.left) ? content.left[i] : '') || ''}
                          onChange={(e) => {
                            const left = Array.isArray(content.left) ? [...content.left] : ['', '', '', '']
                            left[i] = e.target.value
                            setContent({ left })
                          }}
                          placeholder={`Left ${i + 1}`}
                        />
                      ))}
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm font-extrabold uppercase tracking-wide text-slate-500">Right</p>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <CourseInput
                          key={`r-${i}`}
                          value={(Array.isArray(content.right) ? content.right[i] : '') || ''}
                          onChange={(e) => {
                            const right = Array.isArray(content.right) ? [...content.right] : ['', '', '', '']
                            right[i] = e.target.value
                            setContent({ right })
                          }}
                          placeholder={`Right ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <CourseFormField label="Explanation">
                  <CourseTextarea
                    rows={4}
                    value={content.explanation || ''}
                    onChange={(e) => setContent({ explanation: e.target.value })}
                    placeholder="Optional explanation"
                  />
                </CourseFormField>
                <CourseFormField label="Image (optional)">
                  <CourseFileInput
                    accept="image/*"
                    uploadProfile="IMAGE_STANDARD"
                    placeholder={content.imageDataUrl ? 'Image attached' : 'Choose image'}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        const dataUrl = await readFileAsDataUrl(file)
                        setContent({ imageDataUrl: dataUrl })
                      } catch (err) {
                        toast.error(err?.message || 'Failed to attach image')
                      }
                    }}
                  />
                </CourseFormField>
              </div>
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
          createLabel={duplicateSource ? 'Create Duplicate' : 'Save Question'}
          updateLabel="Update Question"
          resetLabel="Reset"
        />
      </form>
    </Modal>
  )
}

