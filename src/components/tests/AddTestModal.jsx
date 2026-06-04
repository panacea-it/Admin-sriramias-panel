import { useEffect, useState } from 'react'
import { ClipboardList, FileQuestion } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import BatchFormCard from '../courses/batch-form/BatchFormCard'
import BatchFormStickyFooter from '../courses/batch-form/BatchFormStickyFooter'
import BatchQuestionPaperSection from '../courses/exam/BatchQuestionPaperSection'
import TestSeriesDetailsFields from '../courses/exam/TestSeriesDetailsFields'
import { CourseFormField, CourseSelect } from '../courses/CourseFormField'
import { TEST_CENTERS, TEST_STATUSES } from '../../data/testsData'
import {
  createEmptyTestForm,
  testRowToForm,
  validateTestForm,
} from '../../utils/testFormUtils'
import {
  normalizeTestSeriesBlock,
  patchTestSeriesBlock,
} from '../../utils/batchTestSeriesForm'
import { cn } from '../../utils/cn'
import { useModalForm } from '../../hooks/useModalForm'

export default function AddTestModal({ open, onClose, item, onSubmit }) {
  const { form, setForm, isEditMode, reset } = useModalForm(
    open,
    item,
    testRowToForm,
    createEmptyTestForm,
  )
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) setErrors({})
  }, [open])

  const testSeries = normalizeTestSeriesBlock(form.testSeries || {})

  const setTestSeries = (updater) => {
    setForm((f) => {
      const prev = normalizeTestSeriesBlock(f.testSeries || {})
      const next = typeof updater === 'function' ? updater(prev) : updater
      return { ...f, testSeries: normalizeTestSeriesBlock(next) }
    })
  }

  const updateTestSeries = (patch) => {
    setForm((f) => ({
      ...f,
      testSeries: patchTestSeriesBlock(f.testSeries || {}, patch),
    }))
  }

  const handleClose = () => onClose()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validateTestForm(form)
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors)
      toast.error('Please fix the highlighted fields')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit?.(form, { isEdit: isEditMode, id: item?.id })
      toast.success(isEditMode ? 'Test updated successfully' : 'Test created successfully')
      handleClose()
    } catch (err) {
      toast.error(err?.message || 'Failed to save test')
    } finally {
      setSubmitting(false)
    }
  }

  const modalTitle = isEditMode ? 'Edit Test' : 'Create Test'

  return (
    <Modal open={open} onClose={handleClose} size="full" title={modalTitle}>
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[min(92vh,900px)] flex-col overflow-hidden rounded-2xl bg-[#eef2f7] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader title={modalTitle} onBack={handleClose} icon={ClipboardList} />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:#c5d9eb_transparent]">
          <div className="space-y-6 px-4 py-6 sm:space-y-8 sm:px-8 sm:py-8">
            <BatchFormCard
              step={1}
              icon={ClipboardList}
              title="Test Details"
              description="Configure exam metadata, schedule, instructions, and ranking."
            >
              <TestSeriesDetailsFields
                testSeries={testSeries}
                onTestSeriesChange={updateTestSeries}
                errors={errors}
              />

              <div className="mt-6 grid gap-5 border-t border-[#eef2fc] pt-6 sm:grid-cols-2">
                <CourseFormField label="Center" required>
                  <CourseSelect
                    value={form.center}
                    onChange={(e) => setForm((f) => ({ ...f, center: e.target.value }))}
                    className={cn(errors.center && 'ring-2 ring-red-400')}
                  >
                    {TEST_CENTERS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </CourseSelect>
                  {errors.center ? (
                    <p className="mt-1 text-xs font-medium text-red-600">{errors.center}</p>
                  ) : null}
                </CourseFormField>

                <CourseFormField label="Status" required>
                  <CourseSelect
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    {TEST_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </CourseSelect>
                </CourseFormField>
              </div>
            </BatchFormCard>

            <BatchFormCard
              step={2}
              icon={FileQuestion}
              title="Question Paper"
              description="Set the number of questions, fill each block, or bulk upload from files."
            >
              <BatchQuestionPaperSection
                testSeries={testSeries}
                setTestSeries={setTestSeries}
                errors={errors}
              />
            </BatchFormCard>
          </div>
        </div>

        <BatchFormStickyFooter
          isEditMode={isEditMode}
          saving={submitting}
          onReset={() => {
            reset()
            setErrors({})
            toast.message('Form reset')
          }}
          createLabel="Create Test"
          updateLabel="Update Test"
        />
      </form>
    </Modal>
  )
}
