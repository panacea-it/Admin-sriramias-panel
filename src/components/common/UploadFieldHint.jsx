import { cn } from '../../utils/cn'
import { formatUploadHint, resolveUploadProfile } from '../../utils/uploadValidation'

const hintClass = 'mt-1 text-[11px] leading-relaxed text-gray-500'
const errorClass = 'mt-1 text-xs font-medium text-red-600'

export function UploadFieldHint({ profile, className }) {
  const text = formatUploadHint(resolveUploadProfile(profile))
  if (!text) return null
  return <p className={cn(hintClass, className)}>{text}</p>
}

export function UploadValidationMessage({ message, className }) {
  if (!message) return null
  return <p className={cn(errorClass, className)} role="alert">{message}</p>
}
