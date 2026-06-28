import { useCallback, useEffect, useRef, useState } from 'react'
import { FileText } from 'lucide-react'
import SubjectContentFormModal from '../../../../../components/subject-content/SubjectContentFormModal'
import BatchMultiSearchSelect from '../../../../../components/subjects/BatchMultiSearchSelect'
import { UploadFieldHint } from '../../../../../components/common/UploadFieldHint'
import { useFacultySubjectBatchesDropdown } from '../../../../../hooks/useFacultySubjectBatchesDropdown'
import { useMainsTopicsDropdown } from '../../../../../hooks/useSubjectMainsAnswerWriting'
import {
  buildMainsAnswerWritingFormData,
  MAINS_DURATION_PRESETS,
} from '../../../../../utils/mainsAnswerWritingApiHelpers'
import { mapChildModuleFormErrors } from '../../../../../utils/facultySubjectChildApiHelpers'
import { getApiErrorMessage } from '../../../../../utils/apiError'
import { toast } from '../../../../../utils/toast'
import { examInputClass } from '../../../../../components/courses/exam/examFormStyles'
import { validateUploadFile } from '../../../../../utils/uploadValidation'
import { cn } from '../../../../../utils/cn'

const FORM_ID = 'mains-answer-writing-form'

function FieldLabel({ children, required }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-[#333]">
      {children}
      {required ? <span className="text-red-500"> *</span> : null}
    </label>
  )
}

const EMPTY_FORM = {
  testName: '',
  topicId: '',
  scheduleDate: '',
  durationPreset: '60',
  durationMinutes: '60',
  totalMarks: '200',
  passMarks: '',
  resultDate: '',
  questionsText: '',
  batchIds: [],
}

const FIELD_FOCUS_ORDER = [
  'testName',
  'batchIds',
  'scheduleDate',
  'resultDate',
  'questionsText',
  'pdf',
]

function focusFirstInvalidField(errors) {
  const firstKey = FIELD_FOCUS_ORDER.find((key) => errors[key])
  if (!firstKey) return
  requestAnimationFrame(() => {
    document.querySelector(`[data-field="${firstKey}"]`)?.focus?.()
  })
}

export default function MainsAnswerWritingFormModal({
  open,
  onClose,
  facultySubjectId,
  folderId,
  editDetail,
  loading = false,
  saving = false,
  onSave,
}) {
  const isEdit = Boolean(editDetail?._id)
  const [form, setForm] = useState(EMPTY_FORM)
  const [pdfFile, setPdfFile] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const pdfInputRef = useRef(null)
  const isBusy = saving || loading

  const { batches, loading: batchesLoading } = useFacultySubjectBatchesDropdown({
    facultySubjectId,
    requireCenter: false,
    enabled: open && Boolean(facultySubjectId),
  })

  const { data: topicOptions = [] } = useMainsTopicsDropdown(facultySubjectId, {
    enabled: open && Boolean(facultySubjectId),
  })

  const resetFormState = useCallback(() => {
    setForm(EMPTY_FORM)
    setPdfFile(null)
    setFieldErrors({})
    if (pdfInputRef.current) pdfInputRef.current.value = ''
  }, [])

  const populateEditForm = useCallback(() => {
    setForm({
      testName: editDetail.testName || '',
      topicId: editDetail.topicId || '',
      scheduleDate: editDetail.scheduleDate?.slice?.(0, 10) || '',
      durationPreset: editDetail.durationPreset || '60',
      durationMinutes: String(editDetail.durationMinutes ?? editDetail.durationPreset ?? '60'),
      totalMarks: String(editDetail.totalMarks ?? ''),
      passMarks: editDetail.passMarks != null ? String(editDetail.passMarks) : '',
      resultDate: editDetail.resultDate?.slice?.(0, 10) || '',
      questionsText: editDetail.questionsText || '',
      batchIds: editDetail.batchIds || [],
    })
    setPdfFile(null)
    setFieldErrors({})
    if (pdfInputRef.current) pdfInputRef.current.value = ''
  }, [editDetail])

  useEffect(() => {
    if (!open) {
      resetFormState()
      return
    }
    if (editDetail) {
      populateEditForm()
    } else {
      resetFormState()
    }
  }, [open, editDetail, populateEditForm, resetFormState])

  const handleClose = useCallback(() => {
    if (isBusy) return
    resetFormState()
    onClose?.()
  }, [isBusy, onClose, resetFormState])

  const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const validate = async () => {
    const errors = {}
    if (!form.testName.trim()) errors.testName = 'Test name is required'
    if (!form.batchIds.length) errors.batchIds = 'Select at least one batch'
    if (!form.scheduleDate) errors.scheduleDate = 'Schedule date is required'
    if (!form.resultDate) errors.resultDate = 'Result date is required'
    if (!form.questionsText.trim()) errors.questionsText = 'Questions text is required'
    if (!isEdit && !pdfFile) errors.pdf = 'PDF is required'

    if (pdfFile) {
      if (pdfFile.size > 20 * 1024 * 1024) {
        errors.pdf = 'File size exceeds 20 MB'
      } else {
        const result = await validateUploadFile(pdfFile, 'PDF_STANDARD', {
          checkDimensions: false,
        })
        if (!result.valid) errors.pdf = result.message
      }
    }

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      focusFirstInvalidField(errors)
      return false
    }
    return true
  }

  const handleSubmit = async (event) => {
    event?.preventDefault?.()
    if (isBusy) return
    if (!(await validate())) return

    const payload = {
      ...form,
      facultySubjectId,
      folderId,
      durationMinutes:
        form.durationPreset === 'CUSTOM'
          ? Number(form.durationMinutes)
          : Number(form.durationPreset),
    }

    const formData = buildMainsAnswerWritingFormData(payload, pdfFile || undefined)

    try {
      await onSave?.(formData, isEdit)
    } catch (error) {
      const mapped = mapChildModuleFormErrors(error)
      if (mapped.field) {
        setFieldErrors((prev) => ({ ...prev, [mapped.field]: mapped.message }))
        focusFirstInvalidField({ [mapped.field]: mapped.message })
      }
      toast.error(getApiErrorMessage(error, 'Failed to save entry'))
    }
  }

  const inputClass = (field) =>
    cn(examInputClass, fieldErrors[field] && 'ring-2 ring-red-400')

  return (
    <SubjectContentFormModal
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Edit Mains Entry' : 'Create Mains Entry'}
      saving={isBusy}
      formId={FORM_ID}
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <FieldLabel required>Test Name</FieldLabel>
          <input
            data-field="testName"
            value={form.testName}
            onChange={(e) => updateForm({ testName: e.target.value })}
            className={inputClass('testName')}
          />
          {fieldErrors.testName ? <p className="mt-1 text-xs text-red-600">{fieldErrors.testName}</p> : null}
        </div>

        <div>
          <FieldLabel>Topic</FieldLabel>
          <select
            value={form.topicId}
            onChange={(e) => updateForm({ topicId: e.target.value })}
            className={examInputClass}
          >
            <option value="">Select topic (optional)</option>
            {topicOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div data-field="batchIds">
          <FieldLabel required>Batches</FieldLabel>
          <BatchMultiSearchSelect
            batches={batches}
            loading={batchesLoading}
            value={form.batchIds}
            onChange={(batchIds) => updateForm({ batchIds })}
            error={fieldErrors.batchIds}
            hideLabel
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel required>Schedule Date</FieldLabel>
            <input
              type="date"
              data-field="scheduleDate"
              value={form.scheduleDate}
              onChange={(e) => updateForm({ scheduleDate: e.target.value })}
              className={inputClass('scheduleDate')}
            />
            {fieldErrors.scheduleDate ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.scheduleDate}</p>
            ) : null}
          </div>
          <div>
            <FieldLabel required>Result Date</FieldLabel>
            <input
              type="date"
              data-field="resultDate"
              value={form.resultDate}
              onChange={(e) => updateForm({ resultDate: e.target.value })}
              className={inputClass('resultDate')}
            />
            {fieldErrors.resultDate ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.resultDate}</p>
            ) : null}
          </div>
          <div>
            <FieldLabel required>Duration</FieldLabel>
            <select
              value={form.durationPreset}
              onChange={(e) =>
                updateForm({ durationPreset: e.target.value, durationMinutes: e.target.value })
              }
              className={examInputClass}
            >
              {MAINS_DURATION_PRESETS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel required>Total Marks</FieldLabel>
            <input
              type="number"
              min="1"
              value={form.totalMarks}
              onChange={(e) => updateForm({ totalMarks: e.target.value })}
              className={examInputClass}
            />
          </div>
          <div>
            <FieldLabel>Pass Marks</FieldLabel>
            <input
              type="number"
              min="0"
              value={form.passMarks}
              onChange={(e) => updateForm({ passMarks: e.target.value })}
              className={examInputClass}
            />
          </div>
        </div>

        <div>
          <FieldLabel required>Questions Text</FieldLabel>
          <textarea
            rows={5}
            data-field="questionsText"
            value={form.questionsText}
            onChange={(e) => updateForm({ questionsText: e.target.value })}
            className={inputClass('questionsText')}
          />
          {fieldErrors.questionsText ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.questionsText}</p>
          ) : null}
        </div>

        <div>
          <FieldLabel required={!isEdit}>PDF</FieldLabel>
          <input
            ref={pdfInputRef}
            id="mains-answer-writing-pdf-upload"
            type="file"
            data-field="pdf"
            accept="application/pdf,.pdf"
            onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
            className="sr-only"
          />
          <label
            htmlFor="mains-answer-writing-pdf-upload"
            className={cn(
              'flex h-11 cursor-pointer items-center justify-between rounded-xl bg-[#d1e9f6] px-4 text-sm text-[#7a8a9a] outline-none focus-within:ring-2 focus-within:ring-[#55ace7]/40',
              fieldErrors.pdf && 'ring-2 ring-red-400',
            )}
          >
            <span className="truncate">
              {pdfFile?.name ||
                (editDetail?.pdf?.url && !pdfFile ? 'Current PDF on file' : 'Choose PDF file')}
            </span>
            <FileText className="h-5 w-5 shrink-0 text-[#55ace7]" />
          </label>
          <UploadFieldHint profile="PDF_STANDARD" />
          {editDetail?.pdf?.url && !pdfFile ? (
            <p className="mt-1 text-xs text-slate-500">Current file will be kept unless replaced.</p>
          ) : null}
          {fieldErrors.pdf ? <p className="mt-1 text-xs text-red-600">{fieldErrors.pdf}</p> : null}
        </div>
      </form>
    </SubjectContentFormModal>
  )
}
