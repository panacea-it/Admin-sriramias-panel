import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Monitor } from 'lucide-react'
import { toast } from '@/utils/toast'
import TestManagementPageShell from '../../../components/test-management/TestManagementPageShell'
import CbtTestFormFields from '../../../components/test-management/cbt-tests/CbtTestFormFields'
import CbtTestSheetErrors from '../../../components/test-management/cbt-tests/CbtTestSheetErrors'
import { TEST_MANAGEMENT_ROUTES } from '../../../constants/testManagementNav'
import { useCBTCreateForm } from '../../../hooks/useCBTCreateForm'
import { useCreateCBTTest } from '../../../hooks/useCreateCBTTest'
import { parseCbtApiError } from '../../../utils/cbtApiError'
import {
  buildCreateFormData,
  buildDefaultCbtForm,
  validateCbtTestForm,
} from '../../../utils/cbtTestFormHelpers'

export default function CreateCbtTestPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(buildDefaultCbtForm())
  const [questionFiles, setQuestionFiles] = useState({})
  const [errors, setErrors] = useState({})
  const [sheetErrors, setSheetErrors] = useState([])

  const { data: createFormData } = useCBTCreateForm(form.facultySubjectId || undefined)
  const enums = createFormData?.enums || createFormData?.data?.enums || {}
  const createMutation = useCreateCBTTest()

  useEffect(() => {
    if (createFormData && !form.facultySubjectId) {
      setForm(buildDefaultCbtForm(enums))
    }
  }, [createFormData, enums, form.facultySubjectId])

  const handleQuestionFileChange = (lang, file) => {
    setQuestionFiles((prev) => {
      const next = { ...prev }
      if (file) next[lang] = file
      else delete next[lang]
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSheetErrors([])
    const validation = validateCbtTestForm(form, {
      requireQuestionFiles: true,
      files: questionFiles,
    })
    setErrors(validation)
    if (Object.keys(validation).length) {
      toast.error('Please fix the highlighted fields')
      return
    }

    try {
      const fd = buildCreateFormData(form, questionFiles)
      const result = await createMutation.mutateAsync(fd)
      toast.success(result?.message || 'CBT test created successfully')
      const createdId = result?.data?._id
      if (createdId) {
        navigate(TEST_MANAGEMENT_ROUTES.cbtTestsView(createdId))
      } else {
        navigate(TEST_MANAGEMENT_ROUTES.cbt)
      }
    } catch (err) {
      const parsed = parseCbtApiError(err)
      setErrors(parsed.fieldErrors)
      setSheetErrors(parsed.sheetErrors)
      toast.error(parsed.message)
    }
  }

  return (
    <TestManagementPageShell
      icon={Monitor}
      title="Create CBT Test"
      actions={
        <button
          type="button"
          onClick={() => navigate(TEST_MANAGEMENT_ROUTES.cbt)}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/30 bg-white/90 px-4 text-sm font-semibold text-[#1a3a5c] shadow-sm hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to CBT Tests
        </button>
      }
    >
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80"
      >
        <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
          <h2 className="text-lg font-bold text-[#1a3a5c]">New prelims test</h2>
          <p className="mt-1 text-sm text-slate-500">
            Configure test metadata and upload one question sheet per selected language.
          </p>
        </div>
        <div className="px-6 py-6 sm:px-8">
          <CbtTestFormFields
            form={form}
            setForm={setForm}
            errors={errors}
            disabled={createMutation.isPending}
            mode="create"
            questionFiles={questionFiles}
            onQuestionFileChange={handleQuestionFileChange}
            enums={enums}
          />
          <CbtTestSheetErrors errors={sheetErrors} />
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-[#fafbfc] px-6 py-4 sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={() => navigate(TEST_MANAGEMENT_ROUTES.cbt)}
            disabled={createMutation.isPending}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#58A8DF] to-[#1F5E99] px-6 text-sm font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-60"
          >
            {createMutation.isPending ? 'Creating…' : 'Create CBT Test'}
          </button>
        </div>
      </form>
    </TestManagementPageShell>
  )
}
