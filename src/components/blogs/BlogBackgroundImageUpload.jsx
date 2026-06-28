import { useEffect, useMemo, useRef, useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import { UploadFieldHint, UploadValidationMessage } from '../common/UploadFieldHint'
import { cn } from '../../utils/cn'
import { validateUploadFile } from '../../utils/uploadValidation'

const ACCEPT = 'image/jpeg,image/png,image/webp'
const PROFILE = 'IMAGE_STANDARD'

function isRemoteImageUrl(value) {
  if (!value || typeof value !== 'string') return false
  const trimmed = value.trim()
  if (!trimmed) return false
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/')
  )
}

function withCacheBust(url, cacheKey) {
  if (!cacheKey || !isRemoteImageUrl(url)) return url
  const trimmed = url.trim()
  const separator = trimmed.includes('?') ? '&' : '?'
  return `${trimmed}${separator}v=${encodeURIComponent(String(cacheKey))}`
}

export default function BlogBackgroundImageUpload({
  file,
  imageUrl = '',
  fileName = '',
  cacheKey = '',
  onFileChange,
  className,
}) {
  const inputRef = useRef(null)
  const [error, setError] = useState(null)
  const [previewError, setPreviewError] = useState(false)
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null)
  const localPreviewRef = useRef(null)

  const revokeLocalPreview = () => {
    if (localPreviewRef.current) {
      URL.revokeObjectURL(localPreviewRef.current)
      localPreviewRef.current = null
    }
    setLocalPreviewUrl(null)
  }

  useEffect(() => () => revokeLocalPreview(), [])

  useEffect(() => {
    if (!(file instanceof File)) {
      revokeLocalPreview()
      return undefined
    }

    revokeLocalPreview()
    const blobUrl = URL.createObjectURL(file)
    localPreviewRef.current = blobUrl
    setLocalPreviewUrl(blobUrl)
    setPreviewError(false)

    return () => revokeLocalPreview()
  }, [file])

  const previewSrc = useMemo(() => {
    if (localPreviewUrl) return localPreviewUrl
    if (isRemoteImageUrl(imageUrl)) {
      return withCacheBust(imageUrl, cacheKey)
    }
    return ''
  }, [localPreviewUrl, imageUrl, cacheKey])

  const hasPreview = Boolean(previewSrc)

  const handleChange = async (e) => {
    const selected = e.target.files?.[0]
    e.target.value = ''
    if (!selected) return

    const result = await validateUploadFile(selected, PROFILE)
    if (!result.valid) {
      setError(result.message)
      return
    }

    setError(null)
    setPreviewError(false)
    onFileChange?.(selected)
  }

  const openPicker = () => inputRef.current?.click()

  return (
    <>
      <div className={cn('w-full', className)}>
        {hasPreview && !previewError ? (
          <button
            type="button"
            onClick={openPicker}
            className="block w-full rounded-xl border border-gray-200 bg-[#eef6fc] text-left transition focus:outline-none focus:ring-2 focus:ring-[#55ace7]/40"
          >
            <div className="flex min-h-[200px] max-h-[360px] items-center justify-center p-4">
              <img
                key={previewSrc}
                src={previewSrc}
                alt={fileName || 'Background image preview'}
                onError={() => setPreviewError(true)}
                onLoad={() => setPreviewError(false)}
                className="max-h-[320px] w-full object-contain object-center"
              />
            </div>
          </button>
        ) : hasPreview && previewError ? (
          <button
            type="button"
            onClick={openPicker}
            className="flex min-h-[120px] w-full items-center justify-center rounded-xl border border-gray-200 bg-[#fafcff] px-4 text-sm text-[#686868]"
          >
            Preview unavailable. Click to choose another image.
          </button>
        ) : (
          <button
            type="button"
            onClick={openPicker}
            className="flex min-h-[48px] w-full cursor-pointer items-center rounded-xl border border-gray-200 bg-white px-4 text-sm shadow-sm transition hover:border-[#93c5fd] hover:bg-[#fafcff]"
          >
            <span className="min-w-0 flex-1 truncate text-left text-gray-400">
              {fileName || '312*214 Kb'}
            </span>
            <ImageIcon className="ml-2 h-5 w-5 shrink-0 text-[#246392]" />
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={handleChange}
        />
      </div>

      {fileName ? (
        <p className="mt-2 text-xs font-medium text-[#246392]">{fileName}</p>
      ) : null}

      <UploadFieldHint profile={PROFILE} />
      <UploadValidationMessage message={error} />
    </>
  )
}
