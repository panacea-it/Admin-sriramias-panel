import { CourseFileInput, CourseFormField } from '../../courses/CourseFormField'

const ACCEPT = '.xlsx,.xls,.csv'

export default function CbtTestQuestionUpload({
  languages = [],
  files = {},
  onFileChange,
  errors,
  disabled = false,
  showPerLanguage = true,
}) {
  if (!languages.length) {
    return (
      <p className="text-sm text-slate-500">Select languages above to upload question sheets.</p>
    )
  }

  return (
    <div className="grid gap-4">
      {languages.map((lang) => (
        <CourseFormField key={lang} label={`Question sheet — ${lang}`} required={showPerLanguage}>
          <CourseFileInput
            accept={ACCEPT}
            placeholder="XLSX or CSV (max 10 MB)"
            disabled={disabled}
            onChange={(e) => onFileChange(lang, e.target.files?.[0] || null)}
          />
          {files[lang] && (
            <p className="mt-1 text-xs font-medium text-emerald-700">{files[lang].name}</p>
          )}
        </CourseFormField>
      ))}
      {errors?.questionFiles && (
        <p className="text-xs font-semibold text-red-600">{errors.questionFiles}</p>
      )}
    </div>
  )
}
