import BlogRichEditor from '../../blogs/BlogRichEditor'
import { cn } from '../../../utils/cn'
import {
  BATCH_DURATION_PRESETS,
  getTestSeriesFlat,
  normalizeTestSeriesBlock,
} from '../../../utils/batchTestSeriesForm'
import { ACADEMIC_TEST_TYPES, NEGATIVE_MARK_PRESETS } from '../../../data/testsData'
import ExamToggleSwitch from './ExamToggleSwitch'
import ExamFormSelect from './ExamFormSelect'
import { examInputClass } from './examFormStyles'

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

export default function TestSeriesDetailsFields({
  testSeries,
  onTestSeriesChange,
  errors = {},
  testTypes = ACADEMIC_TEST_TYPES,
  disabled = false,
  showTestType = true,
  showMarksPerCorrectAnswer = false,
  instructionOptions = [],
  instructionsLoading = false,
}) {
  const flat = getTestSeriesFlat(normalizeTestSeriesBlock(testSeries))

  const selectedInstruction = instructionOptions.find(
    (row) => String(row.id) === String(flat.instructionId || ''),
  )

  /** Pass flat field patches only — parent applies patchTestSeriesBlock. */
  const updateFlat = (patch) => {
    onTestSeriesChange(patch)
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <div className="sm:col-span-2">
        <FieldLabel required>Test Name</FieldLabel>
        <input
          disabled={disabled}
          value={flat.testName}
          onChange={(e) => updateFlat({ testName: e.target.value })}
          placeholder="Enter test name"
          className={cn(examInputClass, errors.testSeries_testName && 'ring-2 ring-red-400')}
        />
        {fieldErr(errors, 'testSeries_testName')}
      </div>

      {showTestType ? (
        <div>
          <FieldLabel required>Test Type</FieldLabel>
          <select
            disabled={disabled}
            value={flat.testType}
            onChange={(e) => updateFlat({ testType: e.target.value })}
            className={cn(
              examInputClass,
              'appearance-none',
              errors.testSeries_testType && 'ring-2 ring-red-400',
            )}
          >
            <option value="">Select type</option>
            {testTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {fieldErr(errors, 'testSeries_testType')}
        </div>
      ) : null}

      <div>
        <FieldLabel required>Duration</FieldLabel>
        <select
          disabled={disabled}
          value={flat.durationMinutes}
          onChange={(e) => updateFlat({ durationMinutes: e.target.value })}
          className={cn(examInputClass, 'appearance-none', errors.testSeries_duration && 'ring-2 ring-red-400')}
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
          onChange={(e) => updateFlat({ totalMarks: e.target.value.replace(/[^\d.]/g, '') })}
          placeholder="e.g. 200"
          className={cn(examInputClass, errors.testSeries_totalMarks && 'ring-2 ring-red-400')}
        />
        {fieldErr(errors, 'testSeries_totalMarks')}
      </div>

      {showMarksPerCorrectAnswer ? (
        <div>
          <FieldLabel required>Marks Per Correct Answer</FieldLabel>
          <input
            disabled={disabled}
            inputMode="decimal"
            value={flat.marksPerCorrectAnswer}
            onChange={(e) =>
              updateFlat({ marksPerCorrectAnswer: e.target.value.replace(/[^\d.]/g, '') })
            }
            placeholder="e.g. 2 or 2.5"
            className={cn(
              examInputClass,
              errors.testSeries_marksPerCorrectAnswer && 'ring-2 ring-red-400',
            )}
          />
          {fieldErr(errors, 'testSeries_marksPerCorrectAnswer')}
        </div>
      ) : null}

      <div className="sm:col-span-2 lg:col-span-3">
        <FieldLabel>Negative Marking</FieldLabel>
        <div className="space-y-4 rounded-xl border border-[#eef2fc] bg-[#fafcff] p-4 sm:p-5">
          <ExamToggleSwitch
            checked={Boolean(flat.negativeMarkingEnabled)}
            onChange={(v) => updateFlat({ negativeMarkingEnabled: v })}
            label="Enable Negative Marking"
            disabled={disabled}
          />
          {flat.negativeMarkingEnabled ? (
            <div className="grid gap-3 sm:max-w-md">
              <FieldLabel>Deduction per wrong answer</FieldLabel>
              <select
                disabled={disabled}
                value={flat.negativeMarkPerQuestion}
                onChange={(e) => updateFlat({ negativeMarkPerQuestion: e.target.value })}
                className={cn(examInputClass, 'appearance-none')}
              >
                <option value="">Select value</option>
                {NEGATIVE_MARK_PRESETS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <input
                disabled={disabled}
                inputMode="decimal"
                value={flat.negativeMarkPerQuestion}
                onChange={(e) =>
                  updateFlat({ negativeMarkPerQuestion: e.target.value.replace(/[^\d.]/g, '') })
                }
                placeholder="Or enter custom (e.g. 0.33)"
                className={examInputClass}
              />
            </div>
          ) : null}
          {fieldErr(errors, 'testSeries_negativeMark')}
        </div>
      </div>

      <div>
        <FieldLabel required>Schedule Date</FieldLabel>
        <input
          type="date"
          disabled={disabled}
          value={flat.scheduleDate}
          onChange={(e) => updateFlat({ scheduleDate: e.target.value })}
          className={cn(examInputClass, errors.testSeries_scheduleDate && 'ring-2 ring-red-400')}
        />
        {fieldErr(errors, 'testSeries_scheduleDate')}
      </div>

      <div>
        <FieldLabel required>Schedule Time</FieldLabel>
        <input
          type="time"
          disabled={disabled}
          value={flat.scheduleTime}
          onChange={(e) => updateFlat({ scheduleTime: e.target.value })}
          className={cn(examInputClass, errors.testSeries_scheduleTime && 'ring-2 ring-red-400')}
        />
        {fieldErr(errors, 'testSeries_scheduleTime')}
      </div>

      <div>
        <FieldLabel required>Result Date</FieldLabel>
        <input
          type="date"
          disabled={disabled}
          value={flat.resultDate}
          onChange={(e) => updateFlat({ resultDate: e.target.value })}
          className={cn(examInputClass, errors.testSeries_resultDate && 'ring-2 ring-red-400')}
        />
        {fieldErr(errors, 'testSeries_resultDate')}
      </div>

      <div className="sm:col-span-2 lg:col-span-3">
        <FieldLabel>Ranking</FieldLabel>
        <div className="rounded-xl border border-[#eef2fc] bg-[#fafcff] p-4 sm:p-5">
          <ExamToggleSwitch
            checked={Boolean(flat.rankingEnabled)}
            onChange={(v) => updateFlat({ rankingEnabled: v })}
            label="Enable ranking on result publish"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="sm:col-span-2 lg:col-span-3">
        <FieldLabel>Instructions</FieldLabel>
        {instructionOptions.length > 0 || instructionsLoading ? (
          <div className="mb-3 space-y-2">
            <label className="text-xs font-medium text-[#555]">Use saved instruction template</label>
            <ExamFormSelect
              value={flat.instructionId || ''}
              onChange={(id) => {
                const inst = instructionOptions.find((row) => String(row.id) === String(id))
                updateFlat({
                  instructionId: id,
                  ...(inst ? { instructions: inst.description } : {}),
                })
              }}
              options={instructionOptions.map((inst) => ({
                value: inst.id,
                label: inst.label || inst.description,
              }))}
              placeholder="Select instruction template…"
              loading={instructionsLoading}
              disabled={disabled}
              emptyMessage="Add instructions in Test Configuration → Exam Pattern."
            />
            {flat.instructionId && !selectedInstruction ? (
              <p className="text-xs text-amber-700">
                The linked instruction is no longer active. You can keep the text below or choose
                another template.
              </p>
            ) : null}
            {selectedInstruction ? (
              <p className="rounded-lg bg-[#f8fbff] px-3 py-2 text-xs text-[#555]">
                {selectedInstruction.description}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mb-3 text-xs text-[#686868]">
            Add instruction templates in Test Configuration → Exam Pattern, or enter custom text
            below.
          </p>
        )}
        <div className="mt-1 overflow-hidden rounded-xl border border-[#eef2fc] bg-white">
          <div className="hidden sm:block">
            <BlogRichEditor
              value={flat.instructions}
              onChange={(html) => updateFlat({ instructions: html })}
              placeholder="Enter instructions for students…"
              minHeight={160}
            />
          </div>
          <textarea
            disabled={disabled}
            className="min-h-[8rem] w-full rounded-xl border-0 bg-[#fafcff] px-4 py-3 text-sm sm:hidden"
            rows={5}
            value={
              typeof flat.instructions === 'string'
                ? flat.instructions.replace(/<[^>]+>/g, '')
                : ''
            }
            onChange={(e) => updateFlat({ instructions: e.target.value })}
            placeholder="Enter test instructions"
          />
        </div>
      </div>
    </div>
  )
}
