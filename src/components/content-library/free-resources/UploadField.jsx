import { useRef, useState } from 'react'
import { FileText, Image as ImageIcon, Video, BookMarked } from 'lucide-react'
import { CourseFormField, CourseInput } from '../../courses/CourseFormField'
import { UploadFieldHint, UploadValidationMessage } from '../../common/UploadFieldHint'
import { validateUploadFile } from '../../../utils/uploadValidation'

const ICONS = {
  pdf: FileText,
  book: BookMarked,
  image: ImageIcon,
  video: Video,
}

export default function UploadField({
  label,
  required,
  profile,
  accept,
  fileName = '',
  onFileNameChange,
  placeholder = 'Choose file to upload',
  icon = 'pdf',
  className,
  error: externalError,
  bypassValidation = false,
}) {
  const inputRef = useRef(null)
  const [error, setError] = useState(null)
  const Icon = ICONS[icon] || FileText

  const handleChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!bypassValidation) {
      const result = await validateUploadFile(file, profile)
      if (!result.valid) {
        setError(result.message)
        e.target.value = ''
        return
      }
    }
    setError(null)
    onFileNameChange?.(file.name, file)
    e.target.value = ''
  }

  const message = externalError || error

  return (
    <CourseFormField label={label} required={required} className={className}>
      <div className="relative">
        <CourseInput readOnly value={fileName} placeholder={placeholder} className="pr-12" />
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={handleChange}
        />
        <Icon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#55ace7]" />
      </div>
      <UploadFieldHint profile={profile} />
      <UploadValidationMessage message={message} />
      {fileName ? (
        <p className="mt-1 truncate text-[11px] text-[#246392]">Current: {fileName}</p>
      ) : null}
    </CourseFormField>
  )
}
