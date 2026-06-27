import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Monitor } from 'lucide-react'
import { toast } from '@/utils/toast'
import TestManagementPageShell from '../../../components/test-management/TestManagementPageShell'
import CbtTestFormFields from '../../../components/test-management/cbt-tests/CbtTestFormFields'
import { TEST_MANAGEMENT_ROUTES } from '../../../constants/testManagementNav'
import { useCBTTest } from '../../../hooks/useCBTTest'
import { useCBTCreateForm } from '../../../hooks/useCBTCreateForm'
import { useUpdateCBTTest } from '../../../hooks/useUpdateCBTTest'
import { handleCbtApiError, parseCbtApiError } from '../../../utils/cbtApiError'
import {
  buildUpdatePayload,
  mapApiTestToForm,
  validateCbtTestForm,
} from '../../../utils/cbtTestFormHelpers'
import PaginatedFigmaTable from '../../../components/figma/PaginatedFigmaTable'

export default function EditCbtTestPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: test, isLoading, error } = useCBTTest(id)
  const { data: createFormData } = useCBTCreateForm(test?.facultySubjectId)
  const updateMutation = useUpdateCBTTest()

  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})

  const enums = createFormData?.enums || createFormData?.data?.enums || {}

  useEffect(() => {
    if (test) setForm(mapApiTestToForm(test))
  }, [test])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form) return
    const validation = validateCbtTestForm(form)
    setErrors(validation)
    if (Object.keys(validation).length) {
      toast.error('Please fix the highlighted fields')
      return
    }

    try {
      const payload = buildUpdatePayload(form)
      const result = await updateMutation.mutateAsync({ id, payload })
      toast.success(result?.message || 'CBT test updated successfully')
      navigate(TEST_MANAGEMENT_ROUTES.cbtTestsView(id))
    } catch (err) {
      const parsed = parseCbtApiError(err)
      setErrors(parsed.fieldErrors)
      toast.error(parsed.message)
    }
  }

  if (isLoading || !form) {
    return (
      <TestManagementPageShell icon={Monitor} title="Edit CBT Test">
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#55ace7] border-t-transparent" />
        </div>
      </TestManagementPageShell>
    )
  }

  if (error) {
    return (
      <TestManagementPageShell icon={Monitor} title="Edit CBT Test">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
          {handleCbtApiError(error)}
        </div>
      </TestManagementPageShell>
    )
  }

  return (
    <TestManagementPageShell
      icon={Monitor}
      title={`Edit — ${test.testName}`}
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
          <h2 className="text-lg font-bold text-[#1a3a5c]">Update test metadata</h2>
          <p className="mt-1 text-sm text-slate-500">
            Question sheets are managed separately. Faculty subject and topic cannot be changed.
          </p>
        </div>
        <div className="px-6 py-6 sm:px-8">
          <CbtTestFormFields
            form={form}
            setForm={setForm}
            errors={errors}
            disabled={updateMutation.isPending}
            mode="edit"
            enums={enums}
          />
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-[#fafbfc] px-6 py-4 sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={() => navigate(TEST_MANAGEMENT_ROUTES.cbtTestsView(id))}
            disabled={updateMutation.isPending}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#58A8DF] to-[#1F5E99] px-6 text-sm font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-60"
          >
            {updateMutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      {test.languageStats?.length > 0 && (
        <div className="mx-auto mt-6 max-w-4xl overflow-hidden rounded-2xl bg-white p-6 shadow ring-1 ring-slate-100">
          <h3 className="mb-4 text-sm font-bold text-[#1a3a5c]">Uploaded question sheets</h3>
          <PaginatedFigmaTable
            columns={[
              { key: 'language', label: 'Language' },
              { key: 'questionCount', label: 'Questions', align: 'center' },
              {
                key: 'file',
                label: 'Sheet',
                render: (row) =>
                  row.uploadFile?.originalName ? (
                    <a
                      href={row.uploadFile.downloadUrl || row.uploadFile.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-[#55ace7] hover:underline"
                    >
                      {row.uploadFile.originalName}
                    </a>
                  ) : (
                    '—'
                  ),
              },
            ]}
            data={test.languageStats.map((s) => ({ ...s, id: s.language }))}
            initialPageSize={5}
            density="compact"
          />
        </div>
      )}
    </TestManagementPageShell>
  )
}
