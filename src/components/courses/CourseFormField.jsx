import { useState } from 'react'
import { Calendar, ChevronDown, FileText, Image as ImageIcon, Video } from 'lucide-react'
import { UploadFieldHint, UploadValidationMessage } from '../common/UploadFieldHint'
import { cn } from '../../utils/cn'
import {
  inferUploadProfileFromAccept,
  validateUploadFile,
} from '../../utils/uploadValidation'

export const courseFieldShell = cn(
  'h-12 min-h-[48px] w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800',
  'shadow-sm outline-none transition duration-150',
  'placeholder:text-gray-400',
  'hover:border-[#93c5fd] hover:bg-[#fafcff]',
  'focus:border-[#55ace7] focus:bg-white focus:ring-2 focus:ring-blue-400/35',
)

export function CourseFormField({ label, required, children, className }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <label className="block text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  )
}

export function CourseInput({ className, ...props }) {
  return <input className={cn(courseFieldShell, className)} {...props} />
}

export function CourseSelect({ children, className, ...props }) {
  return (
    <div className={cn('relative', className)}>
      <select className={cn(courseFieldShell, 'appearance-none pr-10')} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#246392]" />
    </div>
  )
}

const dateInputClass = cn(
  courseFieldShell,
  'pr-11',
  '[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0',
  '[&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full',
  '[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0',
)

export function CourseDateInput({ className, ...props }) {
  return (
    <div className={cn('relative', className)}>
      <input type="date" className={dateInputClass} {...props} />
      <Calendar
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#246392]"
        aria-hidden
      />
    </div>
  )
}

export function CourseFileInput({
  accept = 'image/*',
  uploadProfile,
  placeholder = '360 to 480 kb',
  onChange,
  className,
}) {
  const profile = uploadProfile || inferUploadProfileFromAccept(accept)
  const [error, setError] = useState(null)

  const handleChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      onChange?.(e)
      return
    }
    const result = await validateUploadFile(file, profile)
    if (!result.valid) {
      setError(result.message)
      e.target.value = ''
      return
    }
    setError(null)
    onChange?.(e)
  }

  return (
    <>
      <label
        className={cn(
          courseFieldShell,
          'relative flex cursor-pointer items-center',
          className,
        )}
      >
        <span className="min-w-0 flex-1 truncate text-gray-400">{placeholder}</span>
        <ImageIcon className="ml-2 h-5 w-5 shrink-0 text-[#246392]" />
        <input type="file" accept={accept || profile.accept} className="sr-only" onChange={handleChange} />
      </label>
      <UploadFieldHint profile={profile} />
      <UploadValidationMessage message={error} />
    </>
  )
}

export function CourseTextarea({ className, rows = 8, ...props }) {
  return (
    <textarea
      rows={rows}
      className={cn(
        'min-h-[12rem] w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-4 text-sm text-gray-800 shadow-sm outline-none transition duration-150',
        'placeholder:text-gray-400',
        'hover:border-[#93c5fd] hover:bg-[#fafcff]',
        'focus:border-[#55ace7] focus:ring-2 focus:ring-blue-400/35',
        className,
      )}
      {...props}
    />
  )
}

export function CourseMediaSlot({
  placeholder,
  icon = 'image',
  fileName,
  className,
  onFileChange,
  accept,
  uploadProfile,
}) {
  const Icon = icon === 'video' ? Video : ImageIcon
  const profile =
    uploadProfile ||
    (icon === 'video' ? 'VIDEO_STANDARD' : inferUploadProfileFromAccept(accept))
  const [error, setError] = useState(null)

  const handleChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      onFileChange?.(e)
      return
    }
    const result = await validateUploadFile(file, profile)
    if (!result.valid) {
      setError(result.message)
      e.target.value = ''
      return
    }
    setError(null)
    onFileChange?.(e)
  }

  if (onFileChange) {
    return (
      <>
        <label
          className={cn(
            courseFieldShell,
            'relative flex min-h-[48px] cursor-pointer items-center text-xs sm:text-sm',
            className,
          )}
        >
          <span className="min-w-0 flex-1 truncate text-gray-400">{fileName || placeholder}</span>
          <Icon className="ml-2 h-5 w-5 shrink-0 text-[#246392]" />
          <input type="file" accept={accept || profile.accept} className="sr-only" onChange={handleChange} />
        </label>
        <UploadFieldHint profile={profile} />
        <UploadValidationMessage message={error} />
      </>
    )
  }

  return (
    <div
      className={cn(
        courseFieldShell,
        'flex min-h-[48px] items-center text-xs sm:text-sm',
        className,
      )}
    >
      <span className="min-w-0 flex-1 truncate text-gray-400">{fileName || placeholder}</span>
      <Icon className="ml-2 h-5 w-5 shrink-0 text-[#246392]" />
    </div>
  )
}

export function CourseIconSlot({ onClick, className }) {
  return (
    <div
      className={cn(
        'flex min-h-[48px] w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-3 shadow-sm',
        className,
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="rounded-lg border border-[#d4e4f4] bg-[#f8fbff] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#246392] transition hover:border-[#55ace7] hover:bg-white hover:shadow-sm"
      >
        ADD ICON
      </button>
    </div>
  )
}

export function CourseAddMoreLink({ onClick, className, children = 'ADD MORE', variant = 'link' }) {
  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-2 rounded-xl border border-[#55ace7]/30 bg-[#eef6fc] px-5 py-2.5 text-sm font-semibold text-[#246392] shadow-sm transition',
          'hover:border-[#55ace7] hover:bg-white hover:shadow-md active:scale-[0.98]',
          className,
        )}
      >
        {children}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-sm font-bold uppercase tracking-wide text-[#246392] underline underline-offset-4 transition hover:text-[#1a4d6d]',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function CoursePdfInput({
  fileName,
  onChange,
  placeholder = 'Upload sample PDF',
  className,
  uploadProfile = 'PDF_STANDARD',
}) {
  const [error, setError] = useState(null)
  const profile = uploadProfile

  const handleChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      onChange?.(e)
      return
    }
    const result = await validateUploadFile(file, profile)
    if (!result.valid) {
      setError(result.message)
      e.target.value = ''
      return
    }
    setError(null)
    onChange?.(e)
  }

  return (
    <>
      <label
        className={cn(courseFieldShell, 'relative flex cursor-pointer items-center', className)}
      >
        <span className="min-w-0 flex-1 truncate text-gray-400">{fileName || placeholder}</span>
        <FileText className="ml-2 h-5 w-5 shrink-0 text-[#246392]" />
        <input
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={handleChange}
        />
      </label>
      <UploadFieldHint profile={profile} />
      <UploadValidationMessage message={error} />
    </>
  )
}

export function CourseFeeInput({ variant = 'online', className, ...props }) {
  return (
    <div className="relative">
      <input className={cn(courseFieldShell, 'pr-14', className)} {...props} />
      <span
        className="pointer-events-none absolute right-3 top-1/2 flex h-8 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-[#f0f7fc] text-lg"
        aria-hidden
      >
        {variant === 'online' ? '💻' : '👨‍🏫'}
      </span>
    </div>
  )
}
