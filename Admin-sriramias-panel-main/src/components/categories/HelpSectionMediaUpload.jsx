import { useCallback, useRef, useState } from 'react'
import { ImageIcon, RefreshCw, Upload, Video, X } from 'lucide-react'
import { UploadFieldHint, UploadValidationMessage } from '../common/UploadFieldHint'
import { cn } from '../../utils/cn'
import { validateUploadFile } from '../../utils/uploadValidation'

export function revokeBlobUrl(url) {
  if (typeof url === 'string' && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

export default function HelpSectionMediaUpload({
  variant = 'image',
  label,
  sublabel,
  fileName = '',
  preview = '',
  onSelect,
  onRemove,
  className,
}) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [validationError, setValidationError] = useState(null)
  const profile = variant === 'video' ? 'VIDEO_STANDARD' : 'IMAGE_BANNER'
  const hasPreview = Boolean(preview || fileName)

  const applyFile = useCallback(
    async (nextFile) => {
      if (!nextFile) return
      const result = await validateUploadFile(nextFile, profile)
      if (!result.valid) {
        setValidationError(result.message)
        return
      }
      setValidationError(null)
      const url = URL.createObjectURL(nextFile)
      onSelect?.({ file: nextFile, fileName: nextFile.name, preview: url })
    },
    [onSelect, profile],
  )

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    applyFile(e.dataTransfer.files?.[0])
  }

  const handleRemove = () => {
    revokeBlobUrl(preview)
    setValidationError(null)
    onRemove?.()
    if (inputRef.current) inputRef.current.value = ''
  }

  const Icon = variant === 'video' ? Video : ImageIcon

  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <div>
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        {sublabel ? <p className="text-xs text-gray-500">{sublabel}</p> : null}
      </div>

      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border-2 border-dashed transition duration-200',
          dragOver
            ? 'border-[#55ace7] bg-[#eef6fc] shadow-inner'
            : 'border-gray-200 bg-[#fafcff]',
          validationError && 'border-red-300 bg-red-50/30',
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {hasPreview ? (
          <div className="p-4">
            {variant === 'video' ? (
              <div className="overflow-hidden rounded-xl bg-black/5">
                {preview ? (
                  <video
                    src={preview}
                    controls
                    className="max-h-44 w-full rounded-xl bg-black object-contain"
                    aria-label="Video preview"
                  />
                ) : (
                  <div className="flex max-h-44 min-h-[120px] items-center justify-center rounded-xl bg-[#eef6fc]">
                    <Video className="h-10 w-10 text-[#55ace7]" aria-hidden />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex min-h-[140px] items-center justify-center rounded-xl bg-white p-3">
                {preview ? (
                  <img
                    src={preview}
                    alt=""
                    className="max-h-36 max-w-full rounded-lg object-contain shadow-sm"
                  />
                ) : (
                  <ImageIcon className="h-10 w-10 text-[#93c5fd]" aria-hidden />
                )}
              </div>
            )}

            {fileName ? (
              <p className="mt-3 truncate text-xs font-medium text-gray-600" title={fileName}>
                {fileName}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-[#246392] shadow-sm transition hover:border-[#55ace7] hover:bg-[#f8fbff]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-100"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <label className="flex min-h-[160px] w-full cursor-pointer flex-col items-center justify-center gap-3 px-4 py-8 text-center transition hover:bg-[#f0f7fc] focus-within:ring-2 focus-within:ring-[#55ace7]/35">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef6fc]">
              <Upload className="h-6 w-6 text-[#55ace7]" aria-hidden />
            </span>
            <span className="flex items-center gap-2 text-sm font-semibold text-[#246392]">
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {label}
            </span>
            <span className="max-w-[220px] text-xs text-gray-500">
              Drag & drop or click to browse
            </span>
            <span className="text-xs text-gray-400">Upload video and supporting images</span>
          </label>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={profile.accept}
          className="sr-only"
          aria-label={label}
          onChange={(e) => {
            applyFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      <UploadFieldHint profile={profile} />
      <UploadValidationMessage message={validationError} />
    </div>
  )
}
