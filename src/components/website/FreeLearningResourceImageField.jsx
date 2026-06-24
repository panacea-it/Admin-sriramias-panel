import { useEffect, useMemo, useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { UploadValidationMessage } from '../common/UploadFieldHint'
import { cn } from '../../utils/cn'
import { validateUploadFile } from '../../utils/uploadValidation'
import { isResolvableRankerImageUrl } from '../../utils/rankerImageUtils'

const COMPACT_WIDTH = 220
const COMPACT_HEIGHT = 140

export default function FreeLearningResourceImageField({
  label,
  value,
  file,
  onChange,
  onFileChange,
  id,
  invalid,
  compact = false,
}) {
  const [uploadError, setUploadError] = useState(null)
  const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  const previewUrl = objectUrl || value
  const hasPreview = isResolvableRankerImageUrl(previewUrl)

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  const openFilePicker = () => {
    document.getElementById(`${id}-file`)?.click()
  }

  const handleFile = async (event) => {
    const nextFile = event.target.files?.[0]
    if (!nextFile) return

    const result = await validateUploadFile(nextFile, 'IMAGE_STANDARD')
    if (!result.valid) {
      setUploadError(result.message)
      event.target.value = ''
      return
    }

    setUploadError(null)
    onFileChange?.(nextFile)
    onChange?.('')
    event.target.value = ''
  }

  const boxStyle = compact
    ? { width: COMPACT_WIDTH, height: COMPACT_HEIGHT, maxWidth: '100%' }
    : undefined

  return (
    <div className="min-w-0">
      <p className="mb-2 text-xs font-semibold text-[#667085]">
        {label}
        <span className="text-[#dc2626]"> *</span>
      </p>

      <div
        className={cn(
          'relative overflow-hidden rounded-lg border border-[#E7ECF5] bg-[#f8fafc]',
          !compact && 'w-full',
        )}
        style={boxStyle}
      >
        {hasPreview ? (
          <img
            src={previewUrl}
            alt={label}
            className="h-full w-full object-cover"
            style={compact ? { height: COMPACT_HEIGHT, width: COMPACT_WIDTH } : { height: 140 }}
          />
        ) : (
          <button
            type="button"
            onClick={openFilePicker}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#686868] transition hover:bg-[#eef6fc]"
            style={compact ? { height: COMPACT_HEIGHT, width: COMPACT_WIDTH } : { height: 140 }}
          >
            <ImageIcon className="h-6 w-6 text-[#55ace7]" />
            <span className="text-xs font-medium">Upload</span>
          </button>
        )}
      </div>

      {hasPreview && (
        <button
          type="button"
          onClick={openFilePicker}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#246392] transition hover:text-[#1a4d73]"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          Replace
        </button>
      )}

      <input
        id={`${id}-file`}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFile}
      />

      <UploadValidationMessage message={uploadError} />

      {invalid && (
        <p className="mt-1.5 text-xs font-medium text-[#EF4444]">Image is required</p>
      )}
    </div>
  )
}
