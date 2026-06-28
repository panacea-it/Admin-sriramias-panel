import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  ScanLine,
  UploadCloud,
} from 'lucide-react'
import TestManagementPageShell from '../../../components/test-management/TestManagementPageShell'
import OmrTableSkeleton from '../../../components/test-management/omr/OmrTableSkeleton'
import ResultSheetViewer from '../../../components/test-management/omr/ResultSheetViewer'
import { CourseFormField } from '../../../components/courses/CourseFormField'
import { UploadFieldHint, UploadValidationMessage } from '../../../components/common/UploadFieldHint'
import { TEST_MANAGEMENT_ROUTES } from '../../../constants/testManagementNav'
import { useOmrPermissions } from '../../../hooks/useOmrPermissions'
import {
  useOmrExamDetail,
  useReplaceResultSheet,
  useUploadResultSheet,
  getOmrMutationErrorMessage,
} from '../../../hooks/useOmrExams'
import { downloadOmrResultSheet } from '../../../services/omrExamService'
import { OMR_RESULT_UPLOAD_PROFILE, inferOmrFileType } from '../../../utils/omrApiHelpers'
import { validateUploadFileSync } from '../../../utils/uploadValidation'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { getApiErrorMessage } from '../../../utils/apiError'
import { toast } from '../../../utils/toast'
import { cn } from '../../../utils/cn'

export default function UploadOmrResultsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canUploadResult, canReplaceResult, canDownloadResult } = useOmrPermissions()

  const { data: exam, isLoading: loading, error } = useOmrExamDetail(id, { enabled: Boolean(id) })
  const uploadMutation = useUploadResultSheet()
  const replaceMutation = useReplaceResultSheet()

  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load OMR exam'))
      navigate(TEST_MANAGEMENT_ROUTES.omr)
    }
  }, [error, navigate])

  const acceptFile = (nextFile) => {
    if (!nextFile) return
    const result = validateUploadFileSync(nextFile, OMR_RESULT_UPLOAD_PROFILE)
    if (!result.valid) {
      setFileError(result.message)
      toast.error(result.message)
      return
    }
    setFile(nextFile)
    setFileError('')
  }

  const hasExisting = Boolean(exam?.resultSheetUploaded)
  const canSubmit = hasExisting ? canReplaceResult : canUploadResult
  const uploading = uploadMutation.isPending || replaceMutation.isPending

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload')
      return
    }
    if (hasExisting && !canReplaceResult) {
      toast.error('Only Super Admin can replace an existing result sheet')
      return
    }

    try {
      const response = hasExisting
        ? await replaceMutation.mutateAsync({ id, file })
        : await uploadMutation.mutateAsync({ id, file })
      setFile(null)
      toast.success(
        response?.message ||
          (hasExisting ? 'Result sheet replaced successfully' : 'Result sheet uploaded successfully'),
      )
    } catch (err) {
      toast.error(getOmrMutationErrorMessage(err, 'Failed to upload result sheet'))
    }
  }

  const handleDownload = async () => {
    try {
      await downloadOmrResultSheet(id, { fileName: exam?.resultSheet?.fileName })
      toast.success('Download started')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to download result sheet'))
    }
  }

  return (
    <TestManagementPageShell
      icon={ScanLine}
      title="Upload Result Sheet"
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
        <div className="mx-auto max-w-2xl space-y-5">
          <div className="rounded-2xl bg-white px-6 py-5 shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80 sm:px-8">
            <h2 className="text-lg font-bold text-[#1a3a5c]">{exam?.examName}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Upload or manage the offline result sheet for this OMR exam. Supported formats: .xlsx,
              .csv, .pdf (max 10 MB).
            </p>
          </div>

          <div className="rounded-2xl bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80">
            <div className="grid gap-5 px-6 py-6 sm:px-8">
              <CourseFormField label="Selected File">
                <div
                  role="button"
                  tabIndex={0}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOver(false)
                    acceptFile(e.dataTransfer.files?.[0])
                  }}
                  onClick={() => inputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
                  }}
                  className={cn(
                    'flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition',
                    dragOver
                      ? 'border-[#55ace7] bg-[#eef6fc]'
                      : 'border-slate-200 bg-[#fafbfc] hover:border-[#55ace7]/50',
                  )}
                >
                  <UploadCloud className="mb-3 h-8 w-8 text-[#246392]" />
                  <p className="text-sm font-semibold text-[#1a3a5c]">
                    {file?.name ||
                      (hasExisting ? 'Drop a file to replace' : 'Drop file or click to browse')}
                  </p>
                  <UploadFieldHint profile={OMR_RESULT_UPLOAD_PROFILE} className="mt-2" />
                  <input
                    ref={inputRef}
                    type="file"
                    accept={OMR_RESULT_UPLOAD_PROFILE.accept}
                    className="hidden"
                    onChange={(e) => acceptFile(e.target.files?.[0])}
                  />
                </div>
                {fileError && <UploadValidationMessage message={fileError} />}
              </CourseFormField>

              {hasExisting && exam?.resultSheet && (
                <>
                  <CourseFormField label="File Type">
                    <div className="flex h-12 items-center gap-2 rounded-xl border border-gray-200 bg-slate-50 px-4 text-sm font-medium text-[#444]">
                      <FileSpreadsheet className="h-4 w-4 text-[#246392]" />
                      {(exam.resultSheet.fileType || inferOmrFileType(exam.resultSheet.fileName)).toUpperCase()}
                      <span className="text-slate-400">·</span>
                      {exam.resultSheet.fileName}
                    </div>
                  </CourseFormField>

                  <CourseFormField label="Uploaded By">
                    <div className="flex h-12 items-center rounded-xl border border-gray-200 bg-slate-50 px-4 text-sm font-medium text-[#444]">
                      {exam.resultSheet.uploadedBy || '—'}
                    </div>
                  </CourseFormField>

                  <CourseFormField label="Upload Date">
                    <div className="flex h-12 items-center rounded-xl border border-gray-200 bg-slate-50 px-4 text-sm font-medium text-[#444]">
                      {formatCategoryDateTime(exam.resultSheet.uploadedAt)}
                    </div>
                  </CourseFormField>

                  {canDownloadResult && (
                    <ResultSheetViewer
                      examId={id}
                      fileName={exam.resultSheet.fileName}
                      fileType={exam.resultSheet.fileType}
                    />
                  )}
                </>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 bg-[#fafbfc] px-6 py-4 sm:flex-row sm:flex-wrap sm:justify-end sm:px-8">
              <button
                type="button"
                onClick={() => navigate(TEST_MANAGEMENT_ROUTES.omr)}
                disabled={uploading}
                className="inline-flex h-11 min-w-[120px] items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-[#686868] shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>

              {canDownloadResult && hasExisting && (
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={uploading}
                  className="inline-flex h-11 min-w-[120px] items-center justify-center gap-2 rounded-xl border border-[#55ace7]/30 bg-white px-6 text-sm font-semibold text-[#246392] shadow-sm transition hover:bg-[#eef6fc] disabled:opacity-60"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              )}

              {canSubmit && (
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="inline-flex h-11 min-w-[120px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-6 text-sm font-bold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
                >
                  <UploadCloud className="h-4 w-4" />
                  {uploading ? 'Uploading…' : hasExisting ? 'Replace File' : 'Upload'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </TestManagementPageShell>
  )
}
