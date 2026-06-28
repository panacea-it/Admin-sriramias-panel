import { useEffect, useState } from 'react'
import SubjectContentFormModal from '../../../../../components/subject-content/SubjectContentFormModal'
import BatchMultiSearchSelect from '../../../../../components/subjects/BatchMultiSearchSelect'
import { useFacultySubjectBatchesDropdown } from '../../../../../hooks/useFacultySubjectBatchesDropdown'
import {
  buildSubjectPdfFormData,
  parseTagsInput,
  SUBJECT_PDF_VISIBILITY_OPTIONS,
} from '../../../../../utils/subjectPdfApiHelpers'
import { mapChildModuleFormErrors } from '../../../../../utils/facultySubjectChildApiHelpers'
import { getApiErrorMessage } from '../../../../../utils/apiError'
import { toast } from '../../../../../utils/toast'
import { examInputClass } from '../../../../../components/courses/exam/examFormStyles'
import { validateUploadFile } from '../../../../../utils/uploadValidation'

function FieldLabel({ children, required }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-[#333]">
      {children}
      {required ? <span className="text-red-500"> *</span> : null}
    </label>
  )
}

const EMPTY_FORM = {
  pdfTitle: '',
  visibility: 'DRAFT',
  tags: '',
  description: '',
  batchIds: [],
}

export default function SubjectPdfFormModal({
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

  const { batches, loading: batchesLoading } = useFacultySubjectBatchesDropdown({
    facultySubjectId,
    requireCenter: false,
    enabled: open && Boolean(facultySubjectId),
  })

  useEffect(() => {
    if (!open) return
    if (editDetail) {
      setForm({
        pdfTitle: editDetail.pdfTitle || '',
        visibility: editDetail.visibility || 'DRAFT',
        tags: Array.isArray(editDetail.tags) ? editDetail.tags.join(', ') : '',
        description: editDetail.description || '',
        batchIds: editDetail.batchIds || [],
      })
    } else {
      setForm(EMPTY_FORM)
      setPdfFile(null)
    }
    setFieldErrors({})
  }, [open, editDetail])

  const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const validate = async () => {
    const errors = {}
    if (!form.pdfTitle.trim()) errors.pdfTitle = 'Title is required'
    if (!form.batchIds.length) errors.batchIds = 'Select at least one batch'
    if (!isEdit && !pdfFile) errors.pdf = 'PDF file is required'

    if (pdfFile) {
      if (pdfFile.size > 10 * 1024 * 1024) {
        errors.pdf = 'File size exceeds 10 MB'
      } else {
        const result = await validateUploadFile(pdfFile, 'PDF_STANDARD', {
          checkDimensions: false,
        })
        if (!result.valid) errors.pdf = result.message
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!(await validate())) return

    const payload = {
      ...form,
      facultySubjectId,
      folderId,
      tags: parseTagsInput(form.tags),
    }

    const formData = buildSubjectPdfFormData(payload, pdfFile || undefined)

    try {
      await onSave?.(formData, isEdit)
    } catch (error) {
      const mapped = mapChildModuleFormErrors(error)
      if (mapped.field) {
        setFieldErrors((prev) => ({ ...prev, [mapped.field]: mapped.message }))
      }
      toast.error(getApiErrorMessage(error, 'Failed to save PDF'))
    }
  }

  return (
    <SubjectContentFormModal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit PDF' : 'Upload PDF'}
      saving={saving || loading}
      onSave={handleSubmit}
    >
      <div className="space-y-4">
        <div>
          <FieldLabel required>PDF Title</FieldLabel>
          <input
            value={form.pdfTitle}
            onChange={(e) => updateForm({ pdfTitle: e.target.value })}
            className={examInputClass}
          />
          {fieldErrors.pdfTitle ? <p className="mt-1 text-xs text-red-600">{fieldErrors.pdfTitle}</p> : null}
        </div>

        <div>
          <FieldLabel required>Visibility</FieldLabel>
          <select
            value={form.visibility}
            onChange={(e) => updateForm({ visibility: e.target.value })}
            className={examInputClass}
          >
            {SUBJECT_PDF_VISIBILITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel required>Batches</FieldLabel>
          <BatchMultiSearchSelect
            batches={batches}
            loading={batchesLoading}
            value={form.batchIds}
            onChange={(batchIds) => updateForm({ batchIds })}
          />
          {fieldErrors.batchIds ? <p className="mt-1 text-xs text-red-600">{fieldErrors.batchIds}</p> : null}
        </div>

        <div>
          <FieldLabel>Tags</FieldLabel>
          <input
            value={form.tags}
            onChange={(e) => updateForm({ tags: e.target.value })}
            placeholder="notes, polity"
            className={examInputClass}
          />
        </div>

        <div>
          <FieldLabel>Description</FieldLabel>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => updateForm({ description: e.target.value })}
            className={examInputClass}
          />
        </div>

        <div>
          <FieldLabel required={!isEdit}>PDF file (max 10 MB)</FieldLabel>
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
            className="block w-full text-sm"
          />
          {editDetail?.pdf?.url && !pdfFile ? (
            <p className="mt-1 text-xs text-slate-500">Current file will be kept unless replaced.</p>
          ) : null}
          {fieldErrors.pdf ? <p className="mt-1 text-xs text-red-600">{fieldErrors.pdf}</p> : null}
        </div>
      </div>
    </SubjectContentFormModal>
  )
}
