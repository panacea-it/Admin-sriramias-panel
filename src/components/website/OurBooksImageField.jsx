import { useEffect, useMemo, useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { UploadFieldHint, UploadValidationMessage } from '../common/UploadFieldHint'
import { validateUploadFile } from '../../utils/uploadValidation'
import { isResolvableRankerImageUrl } from '../../utils/rankerImageUtils'
import { OUR_BOOKS_IMAGE_SPECS } from '../../constants/quickLinksConstants'

export default function OurBooksImageField({
  specs = OUR_BOOKS_IMAGE_SPECS,
  label = 'Book Cover Image',
  uploadButtonLabel = 'Upload image',
  requiredMessage = 'Image is required',
  value,
  file,
  onFileChange,
  id,
  invalid,
  errorMessage,
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
    event.target.value = ''
  }

  return (
    <div className="min-w-0 sm:col-span-2">
      <p className="mb-2 text-xs font-semibold text-[#667085]">
        {label}
        <span className="text-[#dc2626]"> *</span>
      </p>

      <div
        className="relative mx-auto w-full max-w-[340px] overflow-hidden rounded-lg border border-[#E7ECF5] bg-[#111111]"
        style={{ aspectRatio: `${specs.displayWidth} / ${specs.displayHeight}` }}
      >
        {hasPreview ? (
          <img
            src={previewUrl}
            alt={label}
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <button
            type="button"
            onClick={openFilePicker}
            className="flex h-full min-h-[180px] w-full flex-col items-center justify-center gap-2 bg-[#f8fafc] text-[#686868] transition hover:bg-[#eef6fc]"
          >
            <ImageIcon className="h-7 w-7 text-[#55ace7]" />
            <span className="text-sm font-medium">{uploadButtonLabel}</span>
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
          Replace image
        </button>
      )}

      <input
        id={`${id}-file`}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={handleFile}
      />

      <UploadFieldHint className="mt-3">
        Recommended size: {specs.recommendedWidth}×{specs.recommendedHeight}px ({specs.formats}).
        Display area on student panel is {specs.displayWidth}×{specs.displayHeight}px with object-fit
        cover. {specs.hint}
      </UploadFieldHint>

      <UploadValidationMessage message={uploadError || errorMessage} />

      {invalid && !uploadError && !errorMessage && (
        <p className="mt-1.5 text-xs font-medium text-[#EF4444]">{requiredMessage}</p>
      )}
    </div>
  )
}

export function OurBooksImageSpecsBanner({ specs = OUR_BOOKS_IMAGE_SPECS, title = 'Image size guide (from student panel)' }) {
  const bullets = specs.bannerBullets || [
    `Sidebar display: ${specs.displayWidth}×${specs.displayHeight}px`,
    `Recommended upload: ${specs.recommendedWidth}×${specs.recommendedHeight}px for sharp rendering`,
  ]

  return (
    <div className="rounded-xl border border-[#dbeafe] bg-[#f0f7ff] px-4 py-3 text-sm text-[#475569]">
      <p className="font-semibold text-[#14213D]">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed">
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
        <li>Format: {specs.formats}</li>
      </ul>
    </div>
  )
}
