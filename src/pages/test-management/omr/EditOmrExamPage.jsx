import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ScanLine } from 'lucide-react'
import TestManagementPageShell from '../../../components/test-management/TestManagementPageShell'
import OmrExamFormFields, {
  buildOmrForm,
  useOmrExamFormValidation,
} from '../../../components/test-management/omr/OmrExamFormFields'
import OmrTableSkeleton from '../../../components/test-management/omr/OmrTableSkeleton'
import { TEST_MANAGEMENT_ROUTES } from '../../../constants/testManagementNav'
import { getOmrExamById, updateOmrExam } from '../../../services/omrService'
import { mapApiOmrExamToLocal } from '../../../utils/omrApiHelpers'
import { getApiErrorMessage } from '../../../utils/apiError'
import { toast } from '../../../utils/toast'

export default function EditOmrExamPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(buildOmrForm(null))
  const { errors, setErrors, validate } = useOmrExamFormValidation()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      try {
        const data = await getOmrExamById(id)
        if (ignore) return
        const mapped = mapApiOmrExamToLocal(data) || data
        setForm(buildOmrForm(mapped))
      } catch (err) {
        if (!ignore) {
          toast.error(getApiErrorMessage(err, 'Failed to load OMR exam'))
          navigate(TEST_MANAGEMENT_ROUTES.omr)
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [id, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate(form)) return

    setSubmitting(true)
    try {
      await updateOmrExam(id, form)
      toast.success('OMR exam updated')
      navigate(TEST_MANAGEMENT_ROUTES.omr)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update OMR exam'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <TestManagementPageShell
      icon={ScanLine}
      title="Edit OMR Exam"
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
      {loading ? (
        <OmrTableSkeleton />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-2xl overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80"
        >
          <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
            <h2 className="text-lg font-bold text-[#1a3a5c]">Update offline OMR exam</h2>
            <p className="mt-1 text-sm text-slate-500">
              Edit exam name, date, or status. Result sheets are managed separately.
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
              {submitting ? 'Updating…' : 'Update'}
            </button>
          </div>
        </form>
      )}
    </TestManagementPageShell>
  )
}
