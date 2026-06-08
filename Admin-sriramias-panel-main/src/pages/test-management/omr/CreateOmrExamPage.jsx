import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ScanLine } from 'lucide-react'
import TestManagementPageShell from '../../../components/test-management/TestManagementPageShell'
import OmrExamFormFields, {
  buildOmrForm,
  useOmrExamFormValidation,
} from '../../../components/test-management/omr/OmrExamFormFields'
import { TEST_MANAGEMENT_ROUTES } from '../../../constants/testManagementNav'
import { createOmrExam } from '../../../services/omrService'
import { getApiErrorMessage } from '../../../utils/apiError'
import { toast } from '../../../utils/toast'

export default function CreateOmrExamPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(buildOmrForm(null))
  const { errors, setErrors, validate } = useOmrExamFormValidation()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate(form)) return

    setSubmitting(true)
    try {
      await createOmrExam(form)
      toast.success('OMR exam created')
      navigate(TEST_MANAGEMENT_ROUTES.omr)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create OMR exam'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <TestManagementPageShell
      icon={ScanLine}
      title="Create OMR Exam"
      actions={
        <button
          type="button"
          onClick={() => navigate(TEST_MANAGEMENT_ROUTES.omr)}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/30 bg-white/90 px-4 text-sm font-semibold text-[#1a3a5c] shadow-sm hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to OMR
        </button>
      }
    >
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-2xl overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80"
      >
        <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
          <h2 className="text-lg font-bold text-[#1a3a5c]">Offline OMR exam details</h2>
          <p className="mt-1 text-sm text-slate-500">
            Record an offline OMR exam. Students cannot attempt exams from this module.
          </p>
        </div>
        <div className="px-6 py-6 sm:px-8">
          <OmrExamFormFields
            form={form}
            setForm={setForm}
            errors={errors}
            setErrors={setErrors}
            disabled={submitting}
          />
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-[#fafbfc] px-6 py-4 sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={() => navigate(TEST_MANAGEMENT_ROUTES.omr)}
            disabled={submitting}
            className="inline-flex h-11 min-w-[120px] items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-[#686868] shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-11 min-w-[120px] items-center justify-center rounded-xl bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-6 text-sm font-bold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </TestManagementPageShell>
  )
}
