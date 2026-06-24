import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CourseDateInput,
  CourseFormField,
  CourseInput,
  CourseSelect,
} from '../../courses/CourseFormField'
import { cbtDropdownService } from '../../../services/cbtDropdownService'
import { cbtTestKeys } from '../../../hooks/cbtTestKeys'
import {
  DURATION_PRESET_MINUTES,
  PUBLISH_STATUS_OPTIONS,
  unwrapDropdownItems,
} from '../../../utils/cbtTestFormHelpers'
import CbtTestQuestionUpload from './CbtTestQuestionUpload'
import { cn } from '../../../utils/cn'

function MultiSelectChips({ options, selected, onChange, disabled, error }) {
  const toggle = (value) => {
    if (disabled) return
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => toggle(opt.value)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition',
                active
                  ? 'bg-[#55ace7] text-white ring-[#55ace7]'
                  : 'bg-white text-slate-700 ring-slate-200 hover:ring-[#55ace7]/50',
                disabled && 'opacity-60',
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
      {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  )
}

export default function CbtTestFormFields({
  form,
  setForm,
  errors = {},
  disabled = false,
  mode = 'create',
  questionFiles = {},
  onQuestionFileChange,
  enums = {},
}) {
  const facultySubjectId = form.facultySubjectId

  const { data: facultyData } = useQuery({
    queryKey: cbtTestKeys.dropdowns.facultySubjects(''),
    queryFn: () => cbtDropdownService.facultySubjects(),
    staleTime: 5 * 60 * 1000,
  })

  const { data: folderData } = useQuery({
    queryKey: cbtTestKeys.dropdowns.folders(facultySubjectId),
    queryFn: () => cbtDropdownService.folders(facultySubjectId),
    enabled: Boolean(facultySubjectId),
  })

  const { data: batchData } = useQuery({
    queryKey: cbtTestKeys.dropdowns.batches(facultySubjectId),
    queryFn: () => cbtDropdownService.batches(facultySubjectId),
    enabled: Boolean(facultySubjectId),
  })

  const { data: languageData } = useQuery({
    queryKey: cbtTestKeys.dropdowns.languages(),
    queryFn: () => cbtDropdownService.languages(),
    staleTime: 10 * 60 * 1000,
  })

  const { data: examPatternData } = useQuery({
    queryKey: cbtTestKeys.dropdowns.examPatterns(),
    queryFn: () => cbtDropdownService.examPatterns(),
    staleTime: 10 * 60 * 1000,
  })

  const facultyOptions = unwrapDropdownItems(facultyData)
  const folderOptions = unwrapDropdownItems(folderData)
  const batchOptions = unwrapDropdownItems(batchData)
  const languageOptions = unwrapDropdownItems(languageData).map((item) => ({
    value: item.languageName,
    label: item.languageName,
  }))
  const examPatternOptions = unwrapDropdownItems(examPatternData)

  const negativePresets = enums?.negativeMarkingPresets || ['0.25', '0.50', '1.00', 'CUSTOM']
  const restrictionTypes = enums?.attemptRestrictionTypes || ['LIFETIME', 'DAILY', 'WEEKLY']

  useEffect(() => {
    if (!facultySubjectId) {
      setForm((prev) => ({ ...prev, folderId: '', batchIds: [] }))
    }
  }, [facultySubjectId, setForm])

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const updateNested = (parent, key, value) => {
    setForm((prev) => ({
      ...prev,
      [parent]: { ...prev[parent], [key]: value },
    }))
  }

  const durationOptions = useMemo(() => {
    const presets = enums?.durationMinutesPresets || DURATION_PRESET_MINUTES
    return presets.map((m) => ({ value: Number(m), label: `${m} min` }))
  }, [enums])

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 sm:grid-cols-2">
        <CourseFormField label="Faculty Subject" required>
          <CourseSelect
            value={form.facultySubjectId}
            onChange={(e) => update('facultySubjectId', e.target.value)}
            disabled={disabled || mode === 'edit'}
            className={errors.facultySubjectId ? 'ring-2 ring-red-400' : undefined}
          >
            <option value="">Select faculty subject</option>
            {facultyOptions.map((item) => (
              <option key={item._id} value={item._id}>
                {item.teacherName
                  ? `${item.subjectName} — ${item.teacherName}`
                  : item.subjectName}
              </option>
            ))}
          </CourseSelect>
          {errors.facultySubjectId && (
            <p className="mt-1 text-xs font-semibold text-red-600">{errors.facultySubjectId}</p>
          )}
        </CourseFormField>

        <CourseFormField label="Topic" required>
          <CourseSelect
            value={form.folderId}
            onChange={(e) => update('folderId', e.target.value)}
            disabled={disabled || !facultySubjectId || mode === 'edit'}
            className={errors.folderId ? 'ring-2 ring-red-400' : undefined}
          >
            <option value="">Select topic</option>
            {folderOptions.map((item) => (
              <option key={item._id} value={item._id}>
                {item.folderName}
              </option>
            ))}
          </CourseSelect>
          {errors.folderId && (
            <p className="mt-1 text-xs font-semibold text-red-600">{errors.folderId}</p>
          )}
        </CourseFormField>
      </section>

      <CourseFormField label="Batches" required>
        <MultiSelectChips
          options={batchOptions.map((b) => ({ value: b._id, label: b.batchName }))}
          selected={form.batchIds}
          onChange={(vals) => update('batchIds', vals)}
          disabled={disabled || !facultySubjectId}
          error={errors.batchIds}
        />
      </CourseFormField>

      <CourseFormField label="Test Name" required>
        <CourseInput
          value={form.testName}
          onChange={(e) => update('testName', e.target.value)}
          disabled={disabled}
          placeholder="e.g. GS Paper I — Mock 1"
          className={errors.testName ? 'ring-2 ring-red-400' : undefined}
        />
        {errors.testName && (
          <p className="mt-1 text-xs font-semibold text-red-600">{errors.testName}</p>
        )}
      </CourseFormField>

      <CourseFormField label="Languages" required>
        <MultiSelectChips
          options={languageOptions}
          selected={form.languages}
          onChange={(vals) => update('languages', vals)}
          disabled={disabled}
          error={errors.languages}
        />
      </CourseFormField>

      <section className="grid gap-4 sm:grid-cols-3">
        <CourseFormField label="Schedule Date" required>
          <CourseDateInput
            value={form.scheduleDate}
            onChange={(e) => update('scheduleDate', e.target.value)}
            disabled={disabled}
            className={errors.scheduleDate ? 'ring-2 ring-red-400' : undefined}
          />
          {errors.scheduleDate && (
            <p className="mt-1 text-xs font-semibold text-red-600">{errors.scheduleDate}</p>
          )}
        </CourseFormField>

        <CourseFormField label="Schedule Time" required>
          <CourseInput
            type="time"
            value={form.scheduleTime}
            onChange={(e) => update('scheduleTime', e.target.value)}
            disabled={disabled}
            className={errors.scheduleTime ? 'ring-2 ring-red-400' : undefined}
          />
          {errors.scheduleTime && (
            <p className="mt-1 text-xs font-semibold text-red-600">{errors.scheduleTime}</p>
          )}
        </CourseFormField>

        <CourseFormField label="Result Date" required>
          <CourseDateInput
            value={form.resultDate}
            onChange={(e) => update('resultDate', e.target.value)}
            disabled={disabled}
            className={errors.resultDate ? 'ring-2 ring-red-400' : undefined}
          />
          {errors.resultDate && (
            <p className="mt-1 text-xs font-semibold text-red-600">{errors.resultDate}</p>
          )}
        </CourseFormField>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <CourseFormField label="Duration" required>
          <CourseSelect
            value={form.durationMinutes}
            onChange={(e) => update('durationMinutes', Number(e.target.value))}
            disabled={disabled}
          >
            {durationOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
            {!durationOptions.some((o) => o.value === form.durationMinutes) && (
              <option value={form.durationMinutes}>{form.durationMinutes} min (custom)</option>
            )}
          </CourseSelect>
        </CourseFormField>

        <CourseFormField label="Total Marks" required>
          <CourseInput
            type="number"
            min={1}
            value={form.totalMarks}
            onChange={(e) => update('totalMarks', e.target.value)}
            disabled={disabled}
            className={errors.totalMarks ? 'ring-2 ring-red-400' : undefined}
          />
        </CourseFormField>

        <CourseFormField label="Marks per Correct" required>
          <CourseInput
            type="number"
            min={0}
            step="0.01"
            value={form.marksPerCorrectAnswer}
            onChange={(e) => update('marksPerCorrectAnswer', e.target.value)}
            disabled={disabled}
            className={errors.marksPerCorrectAnswer ? 'ring-2 ring-red-400' : undefined}
          />
        </CourseFormField>
      </section>

      <section className="grid gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-2">
        <CourseFormField label="Negative Marking">
          <label className="mb-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.negativeMarking?.enabled}
              onChange={(e) => updateNested('negativeMarking', 'enabled', e.target.checked)}
              disabled={disabled}
            />
            Enable negative marking
          </label>
          {form.negativeMarking?.enabled && (
            <div className="grid gap-2">
              <CourseSelect
                value={form.negativeMarking.preset}
                onChange={(e) => updateNested('negativeMarking', 'preset', e.target.value)}
                disabled={disabled}
              >
                {negativePresets.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </CourseSelect>
              {form.negativeMarking.preset === 'CUSTOM' && (
                <CourseInput
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.negativeMarking.value}
                  onChange={(e) => updateNested('negativeMarking', 'value', Number(e.target.value))}
                  disabled={disabled}
                  placeholder="Custom value"
                />
              )}
            </div>
          )}
        </CourseFormField>

        <CourseFormField label="Attempt Settings">
          <label className="mb-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.attemptSettings?.enabled}
              onChange={(e) => updateNested('attemptSettings', 'enabled', e.target.checked)}
              disabled={disabled}
            />
            Limit attempts
          </label>
          {form.attemptSettings?.enabled && (
            <div className="grid gap-2 sm:grid-cols-2">
              <CourseInput
                type="number"
                min={1}
                value={form.attemptSettings.attempts}
                onChange={(e) => updateNested('attemptSettings', 'attempts', Number(e.target.value))}
                disabled={disabled}
              />
              <CourseSelect
                value={form.attemptSettings.restrictionType}
                onChange={(e) => updateNested('attemptSettings', 'restrictionType', e.target.value)}
                disabled={disabled}
              >
                {restrictionTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </CourseSelect>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.attemptSettings.showRemainingAttempts}
                  onChange={(e) =>
                    updateNested('attemptSettings', 'showRemainingAttempts', e.target.checked)
                  }
                  disabled={disabled}
                />
                Show remaining attempts to students
              </label>
            </div>
          )}
        </CourseFormField>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <CourseFormField label="Exam Pattern">
          <CourseSelect
            value={form.examPatternId}
            onChange={(e) => update('examPatternId', e.target.value)}
            disabled={disabled}
          >
            <option value="">None</option>
            {examPatternOptions.map((item) => (
              <option key={item._id} value={item._id}>
                {item.instructionDescription || item.instructionId}
              </option>
            ))}
          </CourseSelect>
        </CourseFormField>

        <CourseFormField label="Publish Status">
          <CourseSelect
            value={form.publishStatus}
            onChange={(e) => update('publishStatus', e.target.value)}
            disabled={disabled}
          >
            {(enums.publishStatuses || PUBLISH_STATUS_OPTIONS.map((o) => o.value)).map((status) => (
              <option key={status} value={status}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </option>
            ))}
          </CourseSelect>
        </CourseFormField>
      </section>

      <CourseFormField label="Instructions (HTML)">
        <textarea
          value={form.instructionsHtml}
          onChange={(e) => update('instructionsHtml', e.target.value)}
          disabled={disabled}
          rows={4}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-[#55ace7]"
          placeholder="Optional custom instructions"
        />
      </CourseFormField>

      <section className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={form.rankingEnabled}
            onChange={(e) => update('rankingEnabled', e.target.checked)}
            disabled={disabled}
          />
          Ranking enabled
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={form.shuffleQuestions}
            onChange={(e) => update('shuffleQuestions', e.target.checked)}
            disabled={disabled}
          />
          Shuffle questions
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={form.shuffleOptions}
            onChange={(e) => update('shuffleOptions', e.target.checked)}
            disabled={disabled}
          />
          Shuffle options
        </label>
      </section>

      {mode === 'create' && onQuestionFileChange && (
        <section className="rounded-xl border border-slate-200 p-4">
          <h3 className="mb-3 text-sm font-bold text-[#1a3a5c]">Question sheets</h3>
          <CbtTestQuestionUpload
            languages={form.languages}
            files={questionFiles}
            onFileChange={onQuestionFileChange}
            errors={errors}
            disabled={disabled}
          />
        </section>
      )}
    </div>
  )
}
