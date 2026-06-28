import { useEffect, useMemo, useRef, useState } from 'react'
import { Edit3, Globe, ImageIcon } from 'lucide-react'
import { StatusBadge } from '../academics/AcademicsUi'
import { UploadFieldHint, UploadValidationMessage } from '../common/UploadFieldHint'
import { cn } from '../../utils/cn'
import { validateUploadFile } from '../../utils/uploadValidation'
import {
  isResolvableRankerImageUrl,
  optimizeRankerThumbnailUrl,
  PLACEHOLDER_IMAGE_LABEL,
  resolveRankerImagePreviewSrc,
} from '../../utils/rankerImageUtils'

export const websiteInputClass =
  'h-11 w-full rounded-lg border-0 bg-[#eef6fc] px-4 text-sm text-[#111] outline-none transition focus:ring-2 focus:ring-[#55ace7]/40'

/** Single-line date per Figma: "10 AM , 14 May 2026" */
export function DateTimeInline({ time, date }) {
  return (
    <span className="whitespace-nowrap text-sm text-[#111]">
      {time}
      <span className="text-[#9ca0a8]"> , </span>
      {date}
    </span>
  )
}

export function DateTimeCell({ time, date }) {
  return <DateTimeInline time={time} date={date} />
}

export function YoutubeUrlLink({ url }) {
  return (
    <a
      href={`https://${url.replace(/^https?:\/\//, '')}`}
      target="_blank"
      rel="noreferrer"
      className="block max-w-[220px] truncate text-sm text-[#55ace7] underline decoration-[#55ace7]/50 underline-offset-2 transition hover:text-[#246392] hover:decoration-[#246392]"
      title={url}
    >
      {url}
    </a>
  )
}

export function TableRowActions({ onEdit, onDelete, compact = false }) {
  return (
    <div
      className={cn(
        'flex items-center',
        compact ? 'gap-4' : 'flex-wrap gap-3 sm:gap-4',
      )}
    >
      </div>
  )
}

export function WebsiteField({ label, required, children, className }) {
  return (
    <div className={cn('min-w-0', className)}>
      <label className="mb-2 block text-sm font-medium text-[#333]">
        {label}
        {required && <span className="text-[#dc2626]"> *</span>}
      </label>
      {children}
    </div>
  )
}

export function WebsiteUrlInput({ value, onChange, id }) {
  return (
    <div className="relative">
      <input
        id={id}
        type="url"
        value={value}
        onChange={onChange}
        className={cn(websiteInputClass, 'pr-11')}
        placeholder="https://youtube.com/..."
      />
      <span className="pointer-events-none absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[#69df66]">
        <Globe className="h-4 w-4 text-white" strokeWidth={2.2} />
      </span>
    </div>
  )
}

export function WebsiteImageInput({ value, onChange, id, invalid }) {
  const [uploadError, setUploadError] = useState(null)
  const [fileLabel, setFileLabel] = useState('')
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
    if (!value) {
      setFileLabel('')
      revokeLocalPreview()
    }
    setPreviewError(false)
  }, [value])

  const hasPreview = Boolean(localPreviewUrl) || isResolvableRankerImageUrl(value)

  const previewSrc = useMemo(() => {
    if (localPreviewUrl) return localPreviewUrl
    return resolveRankerImagePreviewSrc(value)
  }, [localPreviewUrl, value])

  const openFilePicker = () => document.getElementById(`${id}-file`)?.click()

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await validateUploadFile(file, 'IMAGE_STANDARD')
    if (!result.valid) {
      setUploadError(result.message)
      e.target.value = ''
      return
    }

    setUploadError(null)
    setPreviewError(false)
    setFileLabel(file.name)
    revokeLocalPreview()

    const blobUrl = URL.createObjectURL(file)
    localPreviewRef.current = blobUrl
    setLocalPreviewUrl(blobUrl)

    const reader = new FileReader()
    reader.onload = () => {
      onChange(reader.result)
    }
    reader.onerror = () => {
      setUploadError('Could not read image file.')
      revokeLocalPreview()
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const inputClassName = cn(
    websiteInputClass,
    'cursor-pointer pr-11',
    invalid && 'ring-2 ring-[#EF4444]/60 bg-red-50/40',
  )

  return (
    <div>
      <div className="relative">
        {hasPreview && previewSrc && !previewError ? (
          <button
            type="button"
            id={id}
            onClick={openFilePicker}
            className={cn(
              'block w-full rounded-lg bg-[#eef6fc] text-left transition focus:outline-none focus:ring-2 focus:ring-[#55ace7]/40',
              invalid && 'ring-2 ring-[#EF4444]/60 bg-red-50/40',
            )}
          >
            <div className="flex min-h-[240px] max-h-[360px] items-center justify-center p-4">
              <img
                key={previewSrc}
                src={previewSrc}
                alt={fileLabel || 'Uploaded image preview'}
                onError={() => setPreviewError(true)}
                onLoad={() => setPreviewError(false)}
                className="max-h-[320px] w-full object-contain object-bottom"
              />
            </div>
          </button>
        ) : hasPreview && previewError ? (
          <button
            type="button"
            id={id}
            onClick={openFilePicker}
            className={cn(inputClassName, 'flex min-h-[240px] items-center justify-center text-sm text-[#686868]')}
          >
            Preview unavailable. Click to choose another image.
          </button>
        ) : (
          <input
            id={id}
            type="text"
            readOnly
            value={
              value && value !== PLACEHOLDER_IMAGE_LABEL ? value : PLACEHOLDER_IMAGE_LABEL
            }
            className={inputClassName}
            onClick={openFilePicker}
          />
        )}
        <input
          id={`${id}-file`}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleFile}
        />
        <ImageIcon
          className={cn(
            'pointer-events-none absolute h-5 w-5 text-[#55ace7]',
            hasPreview && previewSrc && !previewError
              ? 'right-3 top-3'
              : 'right-3 top-1/2 -translate-y-1/2',
          )}
        />
      </div>
      {fileLabel ? (
        <p className="mt-2 text-xs font-medium text-[#246392]">{fileLabel}</p>
      ) : null}
      <UploadFieldHint profile="IMAGE_STANDARD" />
      <UploadValidationMessage message={uploadError} />
    </div>
  )
}

export function WebsiteStatusBadge({ status }) {
  return <StatusBadge status={status} />
}

export function WebsiteStatusSelect({ value, onChange, id, required, className, disabled }) {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={cn(websiteInputClass, 'cursor-pointer', className)}
    >
      <option value="Active">Active</option>
      <option value="Deactivated">Inactive</option>
    </select>
  )
}

function rankerPlaceholderSrc(name) {
  const safeName = encodeURIComponent(name?.trim() || 'Ranker')
  return `https://ui-avatars.com/api/?name=${safeName}&background=55ace7&color=ffffff&size=96&bold=true&format=png`
}

function isResolvableImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return false
  const trimmed = imageUrl.trim()
  if (!trimmed || trimmed === '312×214 Kb') return false
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('/')
  )
}

export function RankerImageCell({ name, imageUrl }) {
  const [uploadFailed, setUploadFailed] = useState(false)
  const placeholderSrc = useMemo(() => rankerPlaceholderSrc(name), [name])
  const canUseUpload = isResolvableImageUrl(imageUrl) && !uploadFailed
  const rawSrc = canUseUpload ? imageUrl.trim() : placeholderSrc
  const src =
    canUseUpload && !imageUrl.trim().startsWith('data:') && !imageUrl.trim().startsWith('blob:')
      ? optimizeRankerThumbnailUrl(rawSrc)
      : rawSrc

  return (
    <img
      src={src}
      alt={name ? `${name} profile` : 'Ranker'}
      loading="lazy"
      onError={() => {
        if (canUseUpload) setUploadFailed(true)
      }}
      className="h-12 w-12 rounded-lg border border-slate-200/80 object-cover object-[center_20%] shadow-sm"
    />
  )
}
