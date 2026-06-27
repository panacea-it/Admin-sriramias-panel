import { useMemo, useRef, useState } from 'react'
import { Film, Loader2, RefreshCw, Upload, X } from 'lucide-react'
import { UploadFieldHint, UploadValidationMessage } from '../common/UploadFieldHint'
import { cn } from '../../utils/cn'
import { UPLOAD_PROFILES } from '../../constants/uploadConstraints'
import { formatBytesLabel, validateUploadFile } from '../../utils/uploadValidation'
import { resolveCourseMediaUrl } from '../../utils/courseMediaPrefill'

const PROFILE = 'BATCH_DEMO_VIDEO'
const ACCEPT = UPLOAD_PROFILES.BATCH_DEMO_VIDEO.accept

export default function DemoVideoUpload({
  videoUrl = '',
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

  const displayVideoUrl = useMemo(() => resolveCourseMediaUrl(videoUrl), [videoUrl])
  const hasVideo = Boolean(displayVideoUrl)
  const displayName = fileName || (hasVideo ? 'Demo video' : '')

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
    setUploadStatus('Processing video…')

    try {
      const objectUrl = URL.createObjectURL(file)
      setUploadStatus('Ready')
      onChange?.({
        file,
        videoUrl: objectUrl,
        fileName: file.name,
        fileSize: file.size,
      })
    } catch {
      setValidationError('Failed to process demo video. Please try again.')
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
    if (videoUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(videoUrl)
    }
    setValidationError(null)
    setUploadStatus('')
    onChange?.({
      file: null,
      videoUrl: '',
      fileName: '',
      fileSize: null,
    })
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleReplace = () => {
    if (disabled || uploading) return
    inputRef.current?.click()
  }

  const openFilePicker = () => {
    if (disabled || uploading) return
    inputRef.current?.click()
  }

  return (
    <div className="w-full">
      {hasVideo ? (
        <div
          className={cn(
            'overflow-hidden rounded-2xl border border-[#55ace7]/20 bg-[#f8fbff] shadow-sm',
            error && 'border-red-300 bg-red-50/30',
          )}
        >
          <div className="border-b border-[#55ace7]/10 bg-[#1a3a5c] p-2 sm:p-3">
            <video
              src={displayVideoUrl}
              controls
              playsInline
              preload="metadata"
              className="mx-auto max-h-[220px] w-full max-w-full rounded-xl object-contain sm:max-h-[250px]"
            >
              Your browser does not support video playback.
            </video>
          </div>

          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-[#55ace7]/15">
                <Film className="h-6 w-6 text-[#246392]" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#111]">{displayName}</p>
                {fileSize != null ? (
                  <p className="mt-0.5 text-xs text-[#686868]">{formatBytesLabel(fileSize)}</p>
                ) : null}
                <p className="mt-1 text-xs font-medium text-emerald-600">
                  {uploading ? uploadStatus || 'Processing…' : uploadStatus || 'Ready'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <ActionButton
                icon={RefreshCw}
                label="Replace Video"
                onClick={handleReplace}
                disabled={disabled || uploading}
              />
              <ActionButton
                icon={X}
                label="Remove Video"
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
            (disabled || uploading) && 'opacity-70',
          )}
        >
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={openFilePicker}
            className={cn(
              'flex min-h-[180px] w-full flex-col items-center justify-center gap-3 px-6 py-8 text-center transition',
              (disabled || uploading) && 'cursor-not-allowed',
              !disabled && !uploading && 'cursor-pointer hover:bg-[#f0f7fc]',
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-[#55ace7]" aria-hidden />
                <p className="text-sm font-semibold text-[#246392]">
                  {uploadStatus || 'Processing demo video…'}
                </p>
              </>
            ) : (
              <>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef6fc]">
                  <Upload className="h-7 w-7 text-[#55ace7]" />
                </span>
                <span className="text-base font-semibold text-[#246392]">
                  Drag & Drop Demo Video Here
                </span>
                <span className="max-w-sm text-sm text-gray-500">or click to browse</span>
              </>
            )}
          </button>
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
