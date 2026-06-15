import { useRef } from 'react'
import { FileText } from 'lucide-react'
import { CourseFormField, CourseInput } from '../courses/CourseFormField'
import { validateCurrentAffairsSampleFile } from '../../utils/currentAffairsValidation'

const SAMPLE_ACCEPT = '.pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export default function CurrentAffairsSampleFileField({
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
    const check = validateCurrentAffairsSampleFile(file)
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
          placeholder="Choose sample PDF or Excel file"
          className="pr-12"
        />
        <input
          key={inputKey}
          ref={fileRef}
          type="file"
          accept={SAMPLE_ACCEPT}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={handleFile}
        />
        <FileText className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#55ace7]" />
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-gray-500">Allowed: PDF, XLS, XLSX</p>
      {value ? (
        <p className="mt-1 truncate text-[11px] text-[#246392]">Current: {value}</p>
      ) : null}
      {error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : null}
    </CourseFormField>
  )
}
