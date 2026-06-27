import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Monitor, Pencil, FileQuestion } from 'lucide-react'
import TestManagementPageShell from '../../../components/test-management/TestManagementPageShell'
import CbtTestStatusBadge from '../../../components/test-management/cbt-tests/CbtTestStatusBadge'
import { TEST_MANAGEMENT_ROUTES } from '../../../constants/testManagementNav'
import { useCBTTest } from '../../../hooks/useCBTTest'
import { handleCbtApiError } from '../../../utils/cbtApiError'
import { formatCbtScheduleDisplay } from '../../../utils/cbtTestFormHelpers'
import { formatBookstoreDate, formatCategoryDateTime } from '../../../utils/formatDateTime'

function DetailRow({ label, children }) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-3 sm:grid-cols-[200px_1fr]">
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-[#111]">{children}</dd>
    </div>
  )
}

export default function ViewCbtTestPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: test, isLoading, error } = useCBTTest(id)

  if (isLoading) {
    return (
      <TestManagementPageShell icon={Monitor} title="View CBT Test">
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#55ace7] border-t-transparent" />
        </div>
      </TestManagementPageShell>
    )
  }

  if (error || !test) {
    return (
      <TestManagementPageShell icon={Monitor} title="View CBT Test">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
          {handleCbtApiError(error)}
        </div>
      </TestManagementPageShell>
    )
  }

  return (
    <TestManagementPageShell
      icon={Monitor}
      title={test.testName}
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate(TEST_MANAGEMENT_ROUTES.cbt)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/30 bg-white/90 px-4 text-sm font-semibold text-[#1a3a5c] shadow-sm hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            type="button"
            onClick={() => navigate(TEST_MANAGEMENT_ROUTES.cbtTestQuestions(id))}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/30 bg-white/90 px-4 text-sm font-semibold text-[#1a3a5c] shadow-sm hover:bg-white"
          >
            <FileQuestion className="h-4 w-4" />
            Questions
          </button>
          <button
            type="button"
            onClick={() => navigate(TEST_MANAGEMENT_ROUTES.cbtTestsEdit(id))}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-[#1a3a5c] shadow-sm hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        </div>
      }
    >
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5 sm:px-8">
          <div>
            <p className="font-mono text-xs font-bold text-[#55ace7]">{test.prelimsTestId}</p>
            <h2 className="mt-1 text-xl font-bold text-[#1a3a5c]">{test.testName}</h2>
          </div>
          <CbtTestStatusBadge status={test.publishStatus} />
        </div>
        <dl className="px-6 py-2 sm:px-8">
          <DetailRow label="Faculty Subject">{test.facultySubjectName || '—'}</DetailRow>
          <DetailRow label="Topic">{test.folderName || '—'}</DetailRow>
          <DetailRow label="Batches">{test.batchNamesLabel || '—'}</DetailRow>
          <DetailRow label="Languages">{(test.languages || []).join(', ') || '—'}</DetailRow>
          <DetailRow label="Total Questions">{test.totalQuestions ?? 0}</DetailRow>
          <DetailRow label="Duration">{test.durationLabel || `${test.durationMinutes} min`}</DetailRow>
          <DetailRow label="Total Marks">{test.totalMarks}</DetailRow>
          <DetailRow label="Marks per Correct">{test.marksPerCorrectAnswer}</DetailRow>
          <DetailRow label="Schedule">
            {formatCbtScheduleDisplay(test.scheduleDate, test.scheduleTime)}
          </DetailRow>
          <DetailRow label="Result Date">{formatBookstoreDate(test.resultDate)}</DetailRow>
          <DetailRow label="Negative Marking">
            {test.negativeMarking?.enabled
              ? `${test.negativeMarking.preset} (${test.negativeMarking.value})`
              : 'Disabled'}
          </DetailRow>
          <DetailRow label="Attempts">
            {test.attemptSettings?.enabled
              ? `${test.attemptSettings.attempts} (${test.attemptSettings.restrictionType})`
              : 'Unlimited'}
          </DetailRow>
          <DetailRow label="Ranking">{test.rankingEnabled ? 'Enabled' : 'Disabled'}</DetailRow>
          <DetailRow label="Shuffle">
            Questions: {test.shuffleQuestions ? 'Yes' : 'No'} · Options:{' '}
            {test.shuffleOptions ? 'Yes' : 'No'}
          </DetailRow>
          {test.examPattern && (
            <DetailRow label="Exam Pattern">
              {test.examPattern.instructionDescription || test.examPattern.instructionId}
            </DetailRow>
          )}
          <DetailRow label="Created">{formatCategoryDateTime(test.createdAt)}</DetailRow>
          <DetailRow label="Updated">{formatCategoryDateTime(test.updatedAt)}</DetailRow>
        </dl>
        {test.instructionsHtml && (
          <div className="border-t border-slate-100 px-6 py-5 sm:px-8">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Instructions
            </h3>
            <div
              className="prose prose-sm max-w-none text-slate-700"
              dangerouslySetInnerHTML={{ __html: test.instructionsHtml }}
            />
          </div>
        )}
      </div>
    </TestManagementPageShell>
  )
}
