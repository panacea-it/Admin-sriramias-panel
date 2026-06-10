import { useRef, useState } from 'react'
import { ImageIcon, Upload, X } from 'lucide-react'
import { UploadFieldHint, UploadValidationMessage } from '../common/UploadFieldHint'
import { cn } from '../../utils/cn'
import { validateUploadFile } from '../../utils/uploadValidation'

const ACCEPT = 'image/jpeg,image/png,image/webp'
const PROFILE = 'IMAGE_BANNER'

export default function BannerImageUpload({
  previewUrl,
  fileName,
  onChange,
  error,
}) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [validationError, setValidationError] = useState(null)

  const applyFile = async (file) => {
    if (!file) return
    const result = await validateUploadFile(file, PROFILE)
    if (!result.valid) {
      setValidationError(result.message)
      return
    }
    setValidationError(null)
    const url = URL.createObjectURL(file)
    onChange({ file, previewUrl: url, fileName: file.name })
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    applyFile(file)
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
            ? 'border-[#55ace7] bg-[#eef6fc] shadow-inner'
            : 'border-gray-200 bg-[#fafcff]',
          error && 'border-red-300 bg-red-50/30',
        )}
      >
        {previewUrl ? (
          <div className="relative flex min-h-[200px] items-center justify-center p-8">
            <img
              src={previewUrl}
              alt="Banner preview"
              className="max-h-52 max-w-full rounded-xl object-contain shadow-md"
            />
            <button
              type="button"
              onClick={() => onChange({ file: null, previewUrl: '', fileName: '' })}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md transition hover:bg-gray-50"
              aria-label="Remove banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex min-h-[200px] w-full flex-col items-center justify-center gap-3 px-6 py-10 text-center transition hover:bg-[#f0f7fc]"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef6fc]">
              <Upload className="h-7 w-7 text-[#55ace7]" />
            </span>
            <span className="text-base font-semibold text-[#246392]">
              Drag & drop banner image here
            </span>
            <span className="max-w-sm text-sm text-gray-500">or click to browse</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => applyFile(e.target.files?.[0])}
        />
      </div>
      {fileName ? (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-[#246392]">
          <ImageIcon className="h-4 w-4 shrink-0" />
          {fileName}
        </p>
      ) : null}
      <UploadFieldHint profile={PROFILE} className="mt-2" />
      <UploadValidationMessage message={validationError || error} />
    </div>
  )
}
