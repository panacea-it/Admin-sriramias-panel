import ExamToggleSwitch from '../../courses/exam/ExamToggleSwitch'
import { cn } from '../../../utils/cn'

export default function PrelimsRandomizationSettings({
  testSeries,
  onTestSeriesChange,
  errors = {},
  showShuffleSections = true,
}) {
  const sectionWise = Boolean(testSeries.sectionWiseEnabled)

  const update = (patch) => onTestSeriesChange(patch)

  return (
    <div className="rounded-2xl border border-[#e5eaf2] bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4">
        <h4 className="text-sm font-bold text-[#1a3a5c] sm:text-base">
          Exam Randomization Settings
        </h4>
        <p className="mt-0.5 text-xs text-[#686868]">
          Randomize questions or options independently per student
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-[#eef2fc] bg-[#fafcff] p-4 sm:p-5">
          <ExamToggleSwitch
            checked={Boolean(testSeries.shuffleQuestions)}
            onChange={(v) => update({ shuffleQuestions: v })}
            label="Shuffle Questions"
            description={
              testSeries.shuffleQuestions
                ? 'Questions appear in random order for each student'
                : 'Questions appear in fixed order'
            }
          />
        </div>

        <div className="rounded-xl border border-[#eef2fc] bg-[#fafcff] p-4 sm:p-5">
          <ExamToggleSwitch
            checked={Boolean(testSeries.shuffleOptions)}
            onChange={(v) => update({ shuffleOptions: v })}
            label="Shuffle Options"
            description={
              testSeries.shuffleOptions
                ? 'MCQ options appear in random order; correct answer mapping is preserved'
                : 'Options remain in fixed order'
            }
          />
        </div>

        {showShuffleSections ? (
          <div
            className={cn(
              'rounded-xl border border-[#eef2fc] bg-[#fafcff] p-4 sm:p-5',
              !sectionWise && 'opacity-70',
            )}
          >
            <ExamToggleSwitch
              checked={Boolean(testSeries.shuffleSections) && sectionWise}
              onChange={(v) => update({ shuffleSections: sectionWise ? v : false })}
              label="Shuffle Sections"
              disabled={!sectionWise}
              description={
                !sectionWise
                  ? 'Enable section-wise questions to shuffle section order'
                  : testSeries.shuffleSections
                    ? 'Section sequence is randomized per student; timers and locks still apply'
                    : 'Section order remains fixed'
              }
            />
          </div>
        ) : null}

        {errors.testSeries_shuffle ? (
          <p className="text-xs font-medium text-red-600">{errors.testSeries_shuffle}</p>
        ) : null}
      </div>
    </div>
  )
}
