import { useCallback, useEffect, useRef, useState } from 'react'
import { FileSpreadsheet, ScanLine, UploadCloud } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import OmrTableSkeleton from './OmrTableSkeleton'
import { CourseFormField } from '../../courses/CourseFormField'
import { UploadFieldHint, UploadValidationMessage } from '../../common/UploadFieldHint'
import { useAuth } from '../../../contexts/AuthContext'
import { useOmrPermissions } from '../../../hooks/useOmrPermissions'
import {
  getOmrExamById,
  replaceOmrResultSheet,
  uploadOmrResultSheet,
} from '../../../services/omrService'
import {
  OMR_RESULT_UPLOAD_PROFILE,
  inferOmrFileType,
  mapApiOmrExamToLocal,
} from '../../../utils/omrApiHelpers'
import { validateUploadFileSync } from '../../../utils/uploadValidation'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { getApiErrorMessage } from '../../../utils/apiError'
import { toast } from '../../../utils/toast'
import { cn } from '../../../utils/cn'

export default function OmrUploadResultModal({ open, onClose, examId, examName, onSuccess }) {
  const { user } = useAuth()
  const { canUploadResult } = useOmrPermissions()

  const [exam, setExam] = useState(null)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const loadExam = useCallback(async () => {
    if (!examId) return
    setLoading(true)
    try {
      const data = await getOmrExamById(examId)
      setExam(mapApiOmrExamToLocal(data) || data)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load OMR exam'))
      onClose?.()
    } finally {
      setLoading(false)
    }
  }, [examId, onClose])

  useEffect(() => {
    if (!open) {
      setFile(null)
      setFileError('')
      setExam(null)
      return
    }
    loadExam()
  }, [open, loadExam])

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

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload')
      return
    }
    setUploading(true)
    try {
      const uploadedBy = user?.name || user?.email || 'Admin'
      const alreadyUploaded = Boolean(exam?.resultSheetUploaded)
      const updated = alreadyUploaded
        ? await replaceOmrResultSheet(examId, file, uploadedBy)
        : await uploadOmrResultSheet(examId, file, uploadedBy)
      const mapped = mapApiOmrExamToLocal(updated) || updated
      toast.success(alreadyUploaded ? 'Result sheet replaced' : 'Result sheet uploaded')
      onSuccess?.(mapped)
      onClose?.()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to upload result sheet'))
    } finally {
      setUploading(false)
    }
  }

  const hasExisting = Boolean(exam?.resultSheetUploaded)
  const displayName = exam?.examName || examName || 'OMR Exam'

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!uploading) onClose?.()
      }}
      size="md"
      title={hasExisting ? 'Replace Result Sheet' : 'Upload Result Sheet'}
      showCloseButton={false}
    >
      <div className="flex max-h-[min(90vh,760px)] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-slate-200/80">
        <ModalPanelHeader
          icon={ScanLine}
          iconClassName="text-[#246392]"
          title={hasExisting ? 'Replace Result Sheet' : 'Upload Result Sheet'}
          subtitle={displayName}
          onClose={() => {
            if (!uploading) onClose?.()
          }}
          closeVariant="icon"
          plainCloseIcon
        />

        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          {loading ? (
            <OmrTableSkeleton />
          ) : (
            <div className="grid gap-5">
              <p className="text-sm text-slate-500">
                Upload or manage the offline result sheet for this OMR exam. Supported formats: .xlsx,
                .csv, .pdf (max 10 MB).
              </p>

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
                    {file?.name || (hasExisting ? 'Drop a file to replace' : 'Drop file or click to browse')}
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

              {hasExisting && (
                <>
                  <CourseFormField label="File Type">
                    <div className="flex h-12 items-center gap-2 rounded-xl border border-gray-200 bg-slate-50 px-4 text-sm font-medium text-[#444]">
                      <FileSpreadsheet className="h-4 w-4 text-[#246392]" />
                      {(exam.resultSheet?.fileType || inferOmrFileType(exam.resultSheet?.fileName)).toUpperCase()}
                      <span className="text-slate-400">·</span>
                      {exam.resultSheet?.fileName}
                    </div>
                  </CourseFormField>

                  <CourseFormField label="Uploaded By">
                    <div className="flex h-12 items-center rounded-xl border border-gray-200 bg-slate-50 px-4 text-sm font-medium text-[#444]">
                      {exam.resultSheet?.uploadedBy || '—'}
                    </div>
                  </CourseFormField>

                  <CourseFormField label="Upload Date">
                    <div className="flex h-12 items-center rounded-xl border border-gray-200 bg-slate-50 px-4 text-sm font-medium text-[#444]">
                      {formatCategoryDateTime(exam.resultSheet?.uploadedAt)}
                    </div>
                  </CourseFormField>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-[#fafbfc] px-6 py-4 sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="inline-flex h-11 min-w-[120px] items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-[#686868] shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          {canUploadResult && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || uploading || loading}
              className="inline-flex h-11 min-w-[120px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-6 text-sm font-bold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
            >
              <UploadCloud className="h-4 w-4" />
              {uploading ? 'Uploading…' : hasExisting ? 'Replace File' : 'Upload'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
