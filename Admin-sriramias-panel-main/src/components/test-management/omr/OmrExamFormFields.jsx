import { useState } from 'react'
import { CourseDateInput, CourseFormField, CourseInput, CourseSelect } from '../../courses/CourseFormField'
import { toast } from '../../../utils/toast'
import { validateOmrExamForm } from '../../../utils/omrApiHelpers'

export function buildOmrForm(item) {
  if (item) {
    return {
      examName: item.examName || '',
      examDate: item.examDate || '',
      status: item.status || 'Active',
    }
  }
  return { examName: '', examDate: '', status: 'Active' }
}

export default function OmrExamFormFields({ form, setForm, errors, setErrors, disabled = false }) {
  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  return (
    <div className="grid gap-5">
      <CourseFormField label="Exam Name" required>
        <CourseInput
          value={form.examName}
          onChange={(e) => update('examName', e.target.value)}
          disabled={disabled}
          placeholder="Enter offline OMR exam name"
          className={errors.examName ? 'ring-2 ring-red-400' : undefined}
        />
        {errors.examName && (
          <p className="mt-1 text-xs font-semibold text-red-600">{errors.examName}</p>
        )}
      </CourseFormField>

      <CourseFormField label="Exam Date" required>
        <CourseDateInput
          value={form.examDate}
          onChange={(e) => update('examDate', e.target.value)}
          disabled={disabled}
          className={errors.examDate ? 'ring-2 ring-red-400' : undefined}
        />
        {errors.examDate && (
          <p className="mt-1 text-xs font-semibold text-red-600">{errors.examDate}</p>
        )}
      </CourseFormField>

      <CourseFormField label="Status" required>
        <CourseSelect
          value={form.status}
          onChange={(e) => update('status', e.target.value)}
          disabled={disabled}
          className={errors.status ? 'ring-2 ring-red-400' : undefined}
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </CourseSelect>
        {errors.status && (
          <p className="mt-1 text-xs font-semibold text-red-600">{errors.status}</p>
        )}
      </CourseFormField>
    </div>
  )
}

export function useOmrExamFormValidation() {
  const [errors, setErrors] = useState({})

  const validate = (form) => {
    const next = validateOmrExamForm(form)
    setErrors(next)
    if (Object.keys(next).length) {
      toast.error('Please fix the highlighted fields')
      return false
    }
    return true
  }

  return { errors, setErrors, validate }
}
