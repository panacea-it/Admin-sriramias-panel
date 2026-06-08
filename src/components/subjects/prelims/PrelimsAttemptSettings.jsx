import ExamToggleSwitch from '../../courses/exam/ExamToggleSwitch'
import { examInputClass } from '../../courses/exam/examFormStyles'
import { cn } from '../../../utils/cn'
import { PRELIMS_ATTEMPT_RESTRICTION_TYPES } from '../../../utils/batchTestSeriesForm'

function FieldLabel({ children, required }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-[#333]">
      {children}
      {required ? <span className="text-red-500"> *</span> : null}
    </label>
  )
}

export default function PrelimsAttemptSettings({ testSeries, onTestSeriesChange, errors = {} }) {
  const enabled = Boolean(testSeries.attemptLimitEnabled)

  const update = (patch) => onTestSeriesChange(patch)

  return (
    <div className="rounded-2xl border border-[#e5eaf2] bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4">
        <h4 className="text-sm font-bold text-[#1a3a5c] sm:text-base">Attempt Settings</h4>
        <p className="mt-0.5 text-xs text-[#686868]">
          Control how many times a student can attempt this prelims test
        </p>
      </div>

      <div className="space-y-5">
        <div className="rounded-xl border border-[#eef2fc] bg-[#fafcff] p-4 sm:p-5">
          <ExamToggleSwitch
            checked={enabled}
            onChange={(v) => update({ attemptLimitEnabled: v })}
            label="Enable Attempt Limit"
            description={
              enabled
                ? 'Students are restricted to the configured number of attempts'
                : 'Unlimited attempts allowed'
            }
          />
        </div>

        {enabled ? (
          <>
            <div className="max-w-xs">
              <FieldLabel required>Number of Attempts Allowed</FieldLabel>
              <input
                type="text"
                inputMode="numeric"
                value={testSeries.maxAttempts ?? 1}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '')
                  update({ maxAttempts: digits === '' ? '' : parseInt(digits, 10) })
                }}
                placeholder="e.g. 3"
                className={cn(
                  examInputClass,
                  errors.testSeries_maxAttempts && 'ring-2 ring-red-400',
                )}
              />
              {errors.testSeries_maxAttempts ? (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {errors.testSeries_maxAttempts}
                </p>
              ) : null}
            </div>

            <div>
              <FieldLabel required>Attempt Restriction Type</FieldLabel>
              <div className="space-y-2 rounded-xl border border-[#eef2fc] bg-[#fafcff] p-4">
                {PRELIMS_ATTEMPT_RESTRICTION_TYPES.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-white"
                  >
                    <input
                      type="radio"
                      name="prelimsAttemptRestrictionType"
                      value={opt.value}
                      checked={(testSeries.attemptRestrictionType || 'lifetime') === opt.value}
                      onChange={() => update({ attemptRestrictionType: opt.value })}
                      className="accent-[#246392]"
                    />
                    <span className="text-sm font-medium text-[#1a3a5c]">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#eef2fc] bg-white p-4">
              <ExamToggleSwitch
                checked={Boolean(testSeries.showRemainingAttempts)}
                onChange={(v) => update({ showRemainingAttempts: v })}
                label="Show Remaining Attempts to Student"
                description={
                  testSeries.showRemainingAttempts
                    ? 'Students can see how many attempts they have left'
                    : 'Remaining attempt count is hidden from students'
                }
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
