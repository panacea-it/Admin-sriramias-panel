import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { FileText } from 'lucide-react'
import { cn } from '../../utils/cn'
import { validateUploadFile } from '../../utils/uploadValidation'
import BatchSearchSelect from './BatchSearchSelect'
import {
  BATCH_DURATION_PRESETS,
  getTestSeriesFlat,
  normalizeTestSeriesBlock,
} from '../../utils/batchTestSeriesForm'
import { examInputClass } from '../courses/exam/examFormStyles'

function FieldLabel({ children, required }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-[#333]">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  )
}

function fieldErr(errors, key) {
  return errors[key] ? (
    <p className="mt-1 text-xs font-medium text-red-600">{errors[key]}</p>
  ) : null
}

function SectionTitle({ children }) {
  return (
    <div className="rounded-xl bg-white px-4 py-3 text-center shadow-[0_4px_14px_rgba(15,23,42,0.08)]">
      <h3 className="text-base font-bold text-[#246392] sm:text-lg">{children}</h3>
    </div>
  )
}

export default function SubjectMainsAnswerWritingSection({
  testSeries,
  onTestSeriesChange,
  errors = {},
  disabled = false,
  batches = [],
  batchesLoading = false,
  batchId = '',
  onBatchChange,
}) {
  const inputId = useId()
  const [uploadError, setUploadError] = useState(null)
  const fileInputRef = useRef(null)

  const flat = useMemo(
    () => getTestSeriesFlat(normalizeTestSeriesBlock(testSeries)),
    [testSeries],
  )

  const updateFlat = useCallback(
    (patch) => onTestSeriesChange(patch),
    [onTestSeriesChange],
  )

  useEffect(() => {
    if (flat.mode !== 'mainsAnswerWriting') updateFlat({ mode: 'mainsAnswerWriting' })
  }, [flat.mode, updateFlat])

  const pickFile = () => fileInputRef.current?.click?.()

  const handleFile = async (file) => {
    if (!file) return
    const result = await validateUploadFile(file, 'PDF_STANDARD', { checkDimensions: false })
    if (!result.valid) {
      setUploadError(result.message || 'Invalid file')
      updateFlat({ pdfFileName: '' })
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setUploadError(null)
    updateFlat({ pdfFileName: file.name })
  }

  return (
    <div className={cn(disabled && 'pointer-events-none opacity-70')}>
      <div className="space-y-5 overflow-hidden">
        <SectionTitle>Mains Answer Writing Details</SectionTitle>

        <div className="rounded-2xl border border-[#e5eaf2] bg-white p-4 shadow-sm sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2">
              <FieldLabel required>Test Name</FieldLabel>
              <input
                disabled={disabled}
                value={flat.testName}
                onChange={(e) => updateFlat({ testName: e.target.value })}
                placeholder="Enter test name"
                className={cn(
                  examInputClass,
                  errors.testSeries_testName && 'ring-2 ring-red-400',
                )}
              />
              {fieldErr(errors, 'testSeries_testName')}
            </div>

            <div>
              <FieldLabel required>Schedule Date</FieldLabel>
              <input
                type="date"
                disabled={disabled}
                value={flat.scheduleDate}
                onChange={(e) => updateFlat({ scheduleDate: e.target.value })}
                className={cn(
                  examInputClass,
                  errors.testSeries_scheduleDate && 'ring-2 ring-red-400',
                )}
              />
              {fieldErr(errors, 'testSeries_scheduleDate')}
            </div>

            <div>
              <FieldLabel required>Duration</FieldLabel>
              <select
                disabled={disabled}
                value={flat.durationMinutes}
                onChange={(e) => updateFlat({ durationMinutes: e.target.value })}
                className={cn(
                  examInputClass,
                  'appearance-none',
                  errors.testSeries_duration && 'ring-2 ring-red-400',
                )}
              >
                {BATCH_DURATION_PRESETS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              {flat.durationMinutes === 'custom' ? (
                <input
                  disabled={disabled}
                  className={cn(examInputClass, 'mt-2')}
                  value={flat.durationCustom}
                  onChange={(e) => updateFlat({ durationCustom: e.target.value })}
                  placeholder="e.g. 150 mins"
                />
              ) : null}
              {fieldErr(errors, 'testSeries_duration')}
            </div>

            <div>
              <FieldLabel required>Total Marks</FieldLabel>
              <input
                disabled={disabled}
                inputMode="decimal"
                value={flat.totalMarks}
                onChange={(e) =>
                  updateFlat({ totalMarks: e.target.value.replace(/[^\d.]/g, '') })
                }
                placeholder="e.g. 200"
                className={cn(
                  examInputClass,
                  errors.testSeries_totalMarks && 'ring-2 ring-red-400',
                )}
              />
              {fieldErr(errors, 'testSeries_totalMarks')}
            </div>

            <div>
              <FieldLabel required>Result Date</FieldLabel>
              <input
                type="date"
                disabled={disabled}
                value={flat.resultDate}
                onChange={(e) => updateFlat({ resultDate: e.target.value })}
                className={cn(
                  examInputClass,
                  errors.testSeries_resultDate && 'ring-2 ring-red-400',
                )}
              />
              {fieldErr(errors, 'testSeries_resultDate')}
            </div>

            <div>
              <FieldLabel required>Batch</FieldLabel>
              <BatchSearchSelect
                batches={batches}
                loading={batchesLoading}
                value={batchId}
                onChange={onBatchChange}
                disabled={disabled}
                error={errors.batchId}
                required
                placeholder="Select Batch"
              />
              {fieldErr(errors, 'batchId')}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e5eaf2] bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <FieldLabel required>Write Questions Manually</FieldLabel>
          </div>
          <textarea
            disabled={disabled}
            value={flat.manualQuestions}
            onChange={(e) => updateFlat({ manualQuestions: e.target.value })}
            rows={6}
            className={cn(
              'w-full resize-y rounded-xl bg-[#d1e9f6] px-4 py-3 text-sm text-[#222] outline-none focus:ring-2 focus:ring-[#55ace7]/40',
              errors.testSeries_manualQuestions && 'ring-2 ring-red-400',
            )}
            placeholder={'Type your questions here...\n\n1) ...\n2) ...'}
          />
          <p className="mt-2 text-xs text-[#686868]">
            You can paste multiple questions. New lines will be preserved.
          </p>
          {fieldErr(errors, 'testSeries_manualQuestions')}
        </div>

        <div className="rounded-2xl border border-[#e5eaf2] bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <FieldLabel required>Upload PDF</FieldLabel>
              <p className="mt-1 text-xs text-[#686868]">PDF files only.</p>
            </div>
            {flat.pdfFileName ? (
              <button
                type="button"
                onClick={() => {
                  setUploadError(null)
                  updateFlat({ pdfFileName: '' })
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="shrink-0 text-xs font-semibold text-[#246392] underline-offset-2 hover:underline"
              >
                Remove
              </button>
            ) : null}
          </div>

          <input
            ref={fileInputRef}
            id={`${inputId}-mains-pdf`}
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          <div
            role="button"
            tabIndex={0}
            onClick={pickFile}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') pickFile()
            }}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              const file = e.dataTransfer?.files?.[0]
              handleFile(file)
            }}
            className={cn(
              'flex h-11 cursor-pointer items-center justify-between rounded-xl bg-[#d1e9f6] px-4 text-sm text-[#7a8a9a]',
              errors.testSeries_pdfFileName && 'ring-2 ring-red-400',
            )}
          >
            <span className="truncate">{flat.pdfFileName || 'Choose PDF file'}</span>
            <FileText className="h-5 w-5 shrink-0 text-[#55ace7]" />
          </div>

          {uploadError ? (
            <p className="mt-1 text-xs font-medium text-red-600">{uploadError}</p>
          ) : null}
          {fieldErr(errors, 'testSeries_pdfFileName')}
        </div>
      </div>
    </div>
  )
}

