import { useState } from 'react'
import { UploadFieldHint, UploadValidationMessage } from '../common/UploadFieldHint'
import { cn } from '../../utils/cn'
import { CourseInput } from '../courses/CourseFormField'
import {
  inferUploadProfileFromAccept,
  validateUploadFile,
} from '../../utils/uploadValidation'

export default function FileInputWithIcon({
  icon: Icon,
  value,
  onChange,
  accept,
  uploadProfile,
  placeholder,
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
      <div className="relative">
        <CourseInput readOnly value={value} placeholder={placeholder} className={cn('pr-12', className)} />
        <input
          type="file"
          accept={accept || profile.accept}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={handleChange}
        />
        <Icon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#55ace7]" />
      </div>
      <UploadFieldHint profile={profile} />
      <UploadValidationMessage message={error} />
    </>
  )
}
