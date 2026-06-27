import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Monitor, Upload } from 'lucide-react'
import { toast } from '@/utils/toast'
import TestManagementPageShell from '../../../components/test-management/TestManagementPageShell'
import CbtTestSheetErrors from '../../../components/test-management/cbt-tests/CbtTestSheetErrors'
import CbtTestsDataTable from '../../../components/test-management/cbt-tests/CbtTestsDataTable'
import { CourseFileInput, CourseFormField, CourseSelect } from '../../../components/courses/CourseFormField'
import { TEST_MANAGEMENT_ROUTES } from '../../../constants/testManagementNav'
import { useCBTTest } from '../../../hooks/useCBTTest'
import cbtTestService from '../../../services/cbtTestService'
import { cbtTestKeys } from '../../../hooks/cbtTestKeys'
import { parseCbtApiError } from '../../../utils/cbtApiError'

export default function CbtTestQuestionsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: test, isLoading: testLoading } = useCBTTest(id)

  const [language, setLanguage] = useState('')
  const [uploadFile, setUploadFile] = useState(null)
  const [duplicateMode, setDuplicateMode] = useState('SKIP')
  const [reuploadMode, setReuploadMode] = useState('MERGE')
  const [uploading, setUploading] = useState(false)
  const [sheetErrors, setSheetErrors] = useState([])

  const languages = test?.languages || []

  const { data: questionsData, isLoading: questionsLoading, refetch } = useQuery({
    queryKey: [...cbtTestKeys.detail(id), 'questions', language],
    queryFn: () =>
      cbtTestService.listQuestions({
        prelimsTestId: id,
        language: language || undefined,
        page: 1,
        limit: 100,
      }),
    enabled: Boolean(id),
  })

  const questionRows = Array.isArray(questionsData?.data)
    ? questionsData.data
    : Array.isArray(questionsData?.questions)
      ? questionsData.questions
      : []

  const handleUpload = async (mode) => {
    if (!language) {
      toast.error('Select a language')
      return
    }
    if (!uploadFile) {
      toast.error('Select a question sheet file')
      return
    }

    setUploading(true)
    setSheetErrors([])
    try {
      const fd = new FormData()
      fd.append('prelimsTestId', id)
      fd.append('language', language)
      fd.append('questionFile', uploadFile)
      if (mode === 'reupload') {
        fd.append('reuploadMode', reuploadMode)
        await cbtTestService.reuploadQuestions(fd)
        toast.success('Question sheet re-uploaded')
      } else {
        fd.append('duplicateMode', duplicateMode)
        await cbtTestService.uploadQuestions(fd)
        toast.success('Questions uploaded')
      }
      setUploadFile(null)
      queryClient.invalidateQueries({ queryKey: cbtTestKeys.detail(id) })
      await refetch()
    } catch (err) {
      const parsed = parseCbtApiError(err)
      setSheetErrors(parsed.sheetErrors)
      toast.error(parsed.message)
    } finally {
      setUploading(false)
    }
  }

  if (testLoading) {
    return (
      <TestManagementPageShell icon={Monitor} title="Manage Questions">
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#55ace7] border-t-transparent" />
        </div>
      </TestManagementPageShell>
    )
  }

  return (
    <TestManagementPageShell
      icon={Monitor}
      title={`Questions — ${test?.testName || 'CBT Test'}`}
      actions={
        <button
          type="button"
          onClick={() => navigate(TEST_MANAGEMENT_ROUTES.cbtTestsView(id))}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/30 bg-white/90 px-4 text-sm font-semibold text-[#1a3a5c] shadow-sm hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to test
        </button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-slate-100">
          <h3 className="mb-4 text-sm font-bold text-[#1a3a5c]">Upload question sheet</h3>
          <div className="grid gap-4">
            <CourseFormField label="Language" required>
              <CourseSelect
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={uploading}
              >
                <option value="">Select language</option>
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </CourseSelect>
            </CourseFormField>
            <CourseFormField label="Question file" required>
              <CourseFileInput
                accept=".xlsx,.xls,.csv"
                disabled={uploading}
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
            </CourseFormField>
            <CourseFormField label="Upload mode">
              <CourseSelect
                value={duplicateMode}
                onChange={(e) => setDuplicateMode(e.target.value)}
                disabled={uploading}
              >
                <option value="SKIP">Skip duplicates</option>
                <option value="REPLACE">Replace duplicates</option>
                <option value="ALLOW">Allow duplicates</option>
              </CourseSelect>
            </CourseFormField>
            <button
              type="button"
              disabled={uploading}
              onClick={() => handleUpload('upload')}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#55ace7] text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <CourseFormField label="Re-upload mode">
              <CourseSelect
                value={reuploadMode}
                onChange={(e) => setReuploadMode(e.target.value)}
                disabled={uploading}
              >
                <option value="REPLACE_ALL">Replace all</option>
                <option value="MERGE">Merge</option>
                <option value="REPLACE">Replace matching</option>
              </CourseSelect>
            </CourseFormField>
            <button
              type="button"
              disabled={uploading}
              onClick={() => handleUpload('reupload')}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Re-upload sheet
            </button>
          </div>
          <CbtTestSheetErrors errors={sheetErrors} />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <CbtTestsDataTable
            columns={[
              { key: 'questionNo', label: 'No.', width: 60, align: 'center' },
              {
                key: 'questionText',
                label: 'Question',
                render: (row) => (
                  <span className="line-clamp-2 max-w-md text-sm">{row.questionText}</span>
                ),
              },
              { key: 'language', label: 'Language', width: 100 },
              {
                key: 'correctAnswer',
                label: 'Answer',
                width: 80,
                align: 'center',
              },
            ]}
            data={questionRows.map((q) => ({ ...q, id: q._id || q.questionNo }))}
            loading={questionsLoading}
            emptyMessage="No questions loaded. Upload a sheet to get started."
            initialPageSize={20}
          />
        </div>
      </div>
    </TestManagementPageShell>
  )
}
