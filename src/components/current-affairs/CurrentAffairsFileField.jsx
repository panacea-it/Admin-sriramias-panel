import { useRef } from 'react'
import { FileText } from 'lucide-react'
import { CourseFormField, CourseInput } from '../courses/CourseFormField'
import { CURRENT_AFFAIRS_PDF_ACCEPT } from '../../constants/currentAffairsForm'
import { UploadFieldHint } from '../common/UploadFieldHint'
import { validateCurrentAffairsPdfFile } from '../../utils/currentAffairsValidation'

export default function CurrentAffairsFileField({
  label,
  required,
  value,
  onChange,
  error,
  className,
  inputKey,
  onClearError,
}) {
  const fileRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const check = validateCurrentAffairsPdfFile(file)
    if (!check.valid) {
      onChange({ fileName: '', file: null, errorMessage: check.message })
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    onClearError?.()
    onChange({ fileName: file.name, file })
  }

  return (
    <CourseFormField label={label} required={required} className={className}>
      <div className="relative">
        <CourseInput
          readOnly
          value={value}
          placeholder="Choose PDF to upload"
          className="pr-12"
        />
        <input
          key={inputKey}
          ref={fileRef}
          type="file"
          accept={CURRENT_AFFAIRS_PDF_ACCEPT}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={handleFile}
        />
        <FileText className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#55ace7]" />
      </div>
      <UploadFieldHint profile="PDF_STANDARD" />
      {value ? (
        <p className="mt-1 truncate text-[11px] text-[#246392]">Current: {value}</p>
      ) : null}
      {error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : null}
    </CourseFormField>
  )
}
