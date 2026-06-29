import { useRef, useState } from 'react'
import { Film, RefreshCw, Upload, X } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { createVideoAsset } from '../../../utils/bookstoreProductForm'
import { UploadFieldHint, UploadValidationMessage } from '../../common/UploadFieldHint'
import { UPLOAD_PROFILES } from '../../../constants/uploadConstraints'
import { validateUploadFile } from '../../../utils/uploadValidation'
import { BOOKSTORE_ERROR_CLASS, BOOKSTORE_HELPER_CLASS } from '../modal/bookstoreFormStyles'

const VIDEO_PROFILE = UPLOAD_PROFILES.BATCH_DEMO_VIDEO

export default function PreviewVideoUpload({ value, onChange, onUploadStart, error }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [validationError, setValidationError] = useState(null)

  const applyFile = async (file) => {
    if (!file) return
    const result = await validateUploadFile(file, 'BATCH_DEMO_VIDEO')
    if (!result.valid) {
      setValidationError(result.message)
      return
    }
    setValidationError(null)
    const asset = createVideoAsset(file)
    onChange(asset)
    onUploadStart?.([asset.id])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (e.dataTransfer.files?.length > 1) return
    applyFile(file)
  }

  const handleRemove = () => {
    if (value?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(value.previewUrl)
    }
    onChange(null)
  }

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'relative overflow-hidden rounded-2xl border-2 border-dashed transition duration-200',
          dragOver
            ? 'border-[#7c5cbf] bg-[#f3f0fa] shadow-inner'
            : 'border-[#d8dce3] bg-[#fafbff] hover:border-[#7c5cbf]/50 hover:bg-[#f7f5fc]',
          error && 'border-red-300 bg-red-50/40',
        )}
      >
        {value?.previewUrl ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 p-6">
            <div className="w-full overflow-hidden rounded-xl bg-[#1a3a5c] p-2">
              <video
                src={value.previewUrl}
                controls
                playsInline
                preload="metadata"
                className="mx-auto max-h-52 w-full rounded-lg object-contain"
              >
                Your browser does not support video playback.
              </video>
            </div>

            {value.uploading ? (
              <div className="w-full max-w-md">
                <div className="h-1.5 overflow-hidden rounded-full bg-[#e8ecf2]">
                  <div
                    className="h-full rounded-full bg-[#7c5cbf] transition-all"
                    style={{ width: `${value.progress}%` }}
                  />
                </div>
                <p className="mt-1 text-center text-xs font-medium text-[#686868]">
                  Uploading… {Math.round(value.progress)}%
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-[#d8dce3] bg-white px-3 py-2 text-sm font-semibold text-[#444] shadow-sm transition hover:bg-[#f7f7f9]"
              >
                <RefreshCw className="h-4 w-4" />
                Change video
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                <X className="h-4 w-4" />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex min-h-[220px] w-full flex-col items-center justify-center gap-3 px-6 py-10 text-center transition"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ede8f8]">
              <Upload className="h-8 w-8 text-[#7c5cbf]" strokeWidth={1.8} />
            </span>
            <span className="text-base font-semibold text-[#3d2d6b]">Drop overview video here</span>
            <span className="max-w-md text-sm text-[#686868]">or click to browse</span>
            <span className="text-xs font-medium text-[#9ca0a8]">Single video only</span>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={VIDEO_PROFILE.accept}
          className="sr-only"
          onChange={(e) => {
            applyFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      {value?.fileName ? (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-[#5a4a8a]">
          <Film className="h-4 w-4 shrink-0" />
          {value.fileName}
        </p>
      ) : null}

      <UploadFieldHint profile={VIDEO_PROFILE} className={BOOKSTORE_HELPER_CLASS} />
      <p className={BOOKSTORE_HELPER_CLASS}>
        Optional overview or promotional video shown on the book detail page.
      </p>
      <UploadValidationMessage message={validationError} className={BOOKSTORE_ERROR_CLASS} />
      {error ? <p className={BOOKSTORE_ERROR_CLASS}>{error}</p> : null}
    </div>
  )
}
