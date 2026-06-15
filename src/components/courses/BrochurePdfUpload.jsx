import { useRef, useState } from 'react'
import {
  Download,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react'
import { UploadFieldHint, UploadValidationMessage } from '../common/UploadFieldHint'
import { cn } from '../../utils/cn'
import { validateUploadFile } from '../../utils/uploadValidation'
import {
  downloadBrochurePdf,
  formatBrochureFileSize,
  readFileAsDataUrl,
  viewBrochurePdf,
} from '../../utils/batchBrochure'

const ACCEPT = '.pdf,application/pdf'
const PROFILE = 'PDF_STANDARD'

export default function BrochurePdfUpload({
  brochureUrl = '',
  fileName = '',
  fileSize = null,
  onChange,
  error,
  disabled = false,
  onUploadingChange,
}) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [validationError, setValidationError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')

  const hasBrochure = Boolean(brochureUrl && fileName)

  const applyFile = async (file) => {
    if (!file || disabled || uploading) return
    const result = await validateUploadFile(file, PROFILE)
    if (!result.valid) {
      setValidationError(result.message)
      setUploadStatus('')
      return
    }

    setValidationError(null)
    setUploading(true)
    onUploadingChange?.(true)
    setUploadStatus('Reading PDF…')

    try {
      const dataUrl = await readFileAsDataUrl(file)
      setUploadStatus('Upload ready')
      onChange?.({
        file,
        brochureUrl: dataUrl,
        fileName: file.name,
        fileSize: file.size,
      })
    } catch {
      setValidationError('Failed to process brochure PDF. Please try again.')
      setUploadStatus('')
    } finally {
      setUploading(false)
      onUploadingChange?.(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (disabled || uploading) return
    applyFile(e.dataTransfer.files?.[0])
  }

  const handleRemove = () => {
    if (disabled || uploading) return
    setValidationError(null)
    setUploadStatus('')
    onChange?.({
      file: null,
      brochureUrl: '',
      fileName: '',
      fileSize: null,
    })
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleReplace = () => {
    if (disabled || uploading) return
    inputRef.current?.click()
  }

  return (
    <div className="w-full">
      {hasBrochure ? (
        <div
          className={cn(
            'rounded-2xl border border-[#55ace7]/20 bg-[#f8fbff] p-4 shadow-sm sm:p-5',
            error && 'border-red-300 bg-red-50/30',
          )}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-[#55ace7]/15">
                <FileText className="h-6 w-6 text-[#246392]" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#111]">{fileName}</p>
                {fileSize != null ? (
                  <p className="mt-0.5 text-xs text-[#686868]">
                    {formatBrochureFileSize(fileSize)}
                  </p>
                ) : null}
                <p className="mt-1 text-xs font-medium text-emerald-600">
                  {uploading ? uploadStatus || 'Processing…' : uploadStatus || 'Ready'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <ActionButton
                icon={Eye}
                label="View Brochure"
                onClick={() => viewBrochurePdf(brochureUrl)}
                disabled={disabled || uploading}
              />
              <ActionButton
                icon={Download}
                label="Download"
                onClick={() => downloadBrochurePdf(brochureUrl, fileName)}
                disabled={disabled || uploading}
              />
              <ActionButton
                icon={RefreshCw}
                label="Replace Brochure"
                onClick={handleReplace}
                disabled={disabled || uploading}
              />
              <ActionButton
                icon={Trash2}
                label="Remove Brochure"
                onClick={handleRemove}
                disabled={disabled || uploading}
                danger
              />
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            if (!disabled && !uploading) setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'relative overflow-hidden rounded-2xl border-2 border-dashed transition duration-200',
            dragOver
              ? 'border-[#55ace7] bg-[#eef6fc] shadow-inner'
              : 'border-gray-200 bg-[#fafcff]',
            (error || validationError) && 'border-red-300 bg-red-50/30',
            (disabled || uploading) && 'cursor-not-allowed opacity-70',
          )}
        >
          <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 px-6 py-8 text-center">
            {uploading ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-[#55ace7]" aria-hidden />
                <p className="text-sm font-semibold text-[#246392]">
                  {uploadStatus || 'Uploading brochure…'}
                </p>
              </>
            ) : (
              <>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef6fc]">
                  <Upload className="h-7 w-7 text-[#55ace7]" />
                </span>
                <span className="text-base font-semibold text-[#246392]">
                  Drag & drop brochure PDF here
                </span>
                <span className="max-w-sm text-sm text-gray-500">
                  Upload batch brochure in PDF format (required)
                </span>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={disabled}
                  className="mt-1 inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#55ace7] to-[#246392] px-5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(85,172,231,0.35)] transition hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Browse File
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        disabled={disabled || uploading}
        onChange={(e) => {
          applyFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      <UploadFieldHint profile={PROFILE} className="mt-2" />
      <UploadValidationMessage message={validationError || error} />
    </div>
  )
}

function ActionButton({ icon: Icon, label, onClick, disabled, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition sm:text-sm',
        danger
          ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
          : 'border border-[#55ace7]/20 bg-white text-[#246392] hover:bg-[#eef6fc]',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  )
}
