import { useMemo, useState } from 'react'
import { Edit3, Globe, ImageIcon, Trash2 } from 'lucide-react'
import { StatusBadge } from '../academics/AcademicsUi'
import { UploadFieldHint, UploadValidationMessage } from '../common/UploadFieldHint'
import { cn } from '../../utils/cn'
import { validateUploadFile } from '../../utils/uploadValidation'

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
      <button
        type="button"
        onClick={onEdit}
        className="group inline-flex items-center gap-1.5 text-sm font-medium text-[#686868] transition-colors hover:text-[#246392]"
      >
        <Edit3
          className="h-4 w-4 transition-transform group-hover:scale-110"
          strokeWidth={2.35}
        />
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="group inline-flex items-center gap-1.5 text-sm font-medium text-[#c96565] transition-colors hover:text-[#b94b4b]"
      >
        <Trash2
          className="h-4 w-4 transition-transform group-hover:scale-110"
          strokeWidth={2.1}
        />
        Delete
      </button>
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
    onChange(file.name)
  }

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          type="text"
          readOnly
          value={value || '312×214 Kb'}
          className={cn(
            websiteInputClass,
            'cursor-pointer pr-11',
            invalid && 'ring-2 ring-[#EF4444]/60 bg-red-50/40',
          )}
          onClick={() => document.getElementById(`${id}-file`)?.click()}
        />
        <input
          id={`${id}-file`}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFile}
        />
        <ImageIcon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#55ace7]" />
      </div>
      <UploadFieldHint profile="IMAGE_STANDARD" />
      <UploadValidationMessage message={uploadError} />
    </div>
  )
}

export function WebsiteStatusBadge({ status }) {
  return <StatusBadge status={status} />
}

export function WebsiteStatusSelect({ value, onChange, id, required, className }) {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      required={required}
      className={cn(websiteInputClass, 'cursor-pointer', className)}
    >
      <option value="Active">Active</option>
      <option value="Inactive">Inactive</option>
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
  const src = canUseUpload ? imageUrl.trim() : placeholderSrc

  return (
    <img
      src={src}
      alt={name ? `${name} profile` : 'Ranker'}
      loading="lazy"
      onError={() => {
        if (canUseUpload) setUploadFailed(true)
      }}
      className="h-12 w-12 rounded-lg border border-slate-200/80 object-cover shadow-sm"
    />
  )
}
