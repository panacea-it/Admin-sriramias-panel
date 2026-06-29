import { useRef, useState } from 'react'
import { Check, FileSpreadsheet } from 'lucide-react'
import { UploadValidationMessage } from '../../common/UploadFieldHint'
import { examInputClass } from '../../courses/exam/examFormStyles'
import { cn } from '../../../utils/cn'
import { validateUploadFileSync } from '../../../utils/uploadValidation'

const ACCEPT = '.xlsx,.csv'
const UPLOAD_PROFILE = 'EXCEL_BULK'

export default function PrelimsQuestionSheetUploadField({ language, file, onChange, error }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [localError, setLocalError] = useState(null)
  const [focused, setFocused] = useState(false)

  const hasFile = Boolean(file)
  const displayError = error || localError

  const openPicker = () => inputRef.current?.click()

  const applyFile = (nextFile) => {
    if (!nextFile) return
    const result = validateUploadFileSync(nextFile, UPLOAD_PROFILE)
    if (!result.valid) {
      setLocalError(result.message)
      return
    }
    setLocalError(null)
    onChange?.(nextFile)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openPicker()
    }
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label={`Upload ${language} question sheet`}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          applyFile(e.dataTransfer.files?.[0])
        }}
        className={cn(
          examInputClass,
          'relative flex cursor-pointer items-center gap-3 border border-transparent px-4 transition-colors',
          'hover:bg-[#c5e3f4]',
          hasFile ? 'h-12' : 'min-h-12 py-2.5',
          dragOver && 'border-[#55ace7] bg-[#c5e3f4] ring-2 ring-[#55ace7]/45',
          focused && !dragOver && 'ring-2 ring-[#55ace7]/45',
          displayError && 'border-red-300 ring-2 ring-red-200/60',
        )}
      >
        <FileSpreadsheet
          className="h-5 w-5 shrink-0 text-[#246392]"
          aria-hidden
        />

        {hasFile ? (
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#1a3a5c]">
            {file.name}
          </span>
        ) : (
          <span className="min-w-0 flex-1 text-left">
            <span className="block text-sm font-medium leading-snug text-[#1a3a5c]">
              Upload {language} Question Sheet (.xlsx / .csv)
            </span>
            <span className="mt-0.5 block text-xs font-normal text-[#7a8a9a]">
              Click to browse or drag &amp; drop
            </span>
          </span>
        )}

        {hasFile ? (
          <Check className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
        ) : null}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => {
            applyFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      {hasFile ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            openPicker()
          }}
          className="mt-1 text-xs font-medium text-[#246392] transition hover:text-[#1a3a5c] hover:underline"
        >
          Change File
        </button>
      ) : null}

      <UploadValidationMessage message={displayError} />
    </div>
  )
}
