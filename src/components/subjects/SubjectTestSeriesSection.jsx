import { AnimatePresence, motion } from 'framer-motion'
import { FileQuestion } from 'lucide-react'
import BatchQuestionPaperSection from '../courses/exam/BatchQuestionPaperSection'
import TestSeriesDetailsFields from '../courses/exam/TestSeriesDetailsFields'
import PrelimsLanguageMultiSelect from './prelims/PrelimsLanguageMultiSelect'
import PrelimsSectionManagement from './prelims/PrelimsSectionManagement'
import PrelimsAttemptSettings from './prelims/PrelimsAttemptSettings'
import PrelimsRandomizationSettings from './prelims/PrelimsRandomizationSettings'
import useTestConfigurationMaster from '../../hooks/useTestConfigurationMaster'
import {
  createEmptyTestSeriesBlock,
  normalizeTestSeriesBlock,
  patchTestSeriesBlock,
} from '../../utils/batchTestSeriesForm'

function SectionTitle({ children }) {
  return (
    <div className="rounded-xl bg-white px-4 py-3 text-center shadow-[0_4px_14px_rgba(15,23,42,0.08)]">
      <h3 className="text-base font-bold text-[#246392] sm:text-lg">{children}</h3>
    </div>
  )
}

export default function SubjectTestSeriesSection({ watch, setValue, errors = {} }) {
  const {
    loading: masterLoading,
    error: masterError,
    languageOptions,
    sectionOptions,
    instructionOptions,
  } = useTestConfigurationMaster()

  const raw = watch('testSeries') || createEmptyTestSeriesBlock()
  const testSeries = normalizeTestSeriesBlock(raw)

  const updateTestSeries = (patch) => {
    const prev = normalizeTestSeriesBlock(watch('testSeries') || {})
    const next =
      typeof patch === 'function'
        ? patch(prev)
        : patchTestSeriesBlock(prev, patch)
    setValue('testSeries', normalizeTestSeriesBlock(next), { shouldDirty: true })
  }

  const setTestSeries = (updater) => {
    const prev = normalizeTestSeriesBlock(watch('testSeries') || {})
    const next = typeof updater === 'function' ? updater(prev) : updater
    setValue('testSeries', normalizeTestSeriesBlock(next), { shouldDirty: true })
  }

  return (
    <AnimatePresence initial={false}>
      <motion.section
        key="subject-test-series"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-5 overflow-hidden"
      >
        {masterError ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Could not refresh test configuration master data. Using last loaded values.
          </p>
        ) : null}

        <div className="rounded-2xl border border-[#e5eaf2] bg-white p-4 shadow-sm sm:p-6">
          <label className="mb-1.5 block text-sm font-medium text-[#333]">
            Languages<span className="text-red-500"> *</span>
          </label>
          <div className="max-w-md">
            <PrelimsLanguageMultiSelect
              value={testSeries.languages}
              onChange={(languages) => updateTestSeries({ languages })}
              options={languageOptions}
              loading={masterLoading}
              error={errors.testSeries_languages}
            />
          </div>
        </div>

        <SectionTitle>Test Series Details</SectionTitle>

        <div className="rounded-2xl border border-[#e5eaf2] bg-white p-4 shadow-sm sm:p-6">
          <TestSeriesDetailsFields
            testSeries={testSeries}
            onTestSeriesChange={updateTestSeries}
            errors={errors}
            showTestType={false}
            showMarksPerCorrectAnswer
            instructionOptions={instructionOptions}
            instructionsLoading={masterLoading}
          />
        </div>

        <PrelimsSectionManagement
          testSeries={testSeries}
          onTestSeriesChange={updateTestSeries}
          errors={errors}
          sectionOptions={sectionOptions}
        />

        <PrelimsAttemptSettings
          testSeries={testSeries}
          onTestSeriesChange={updateTestSeries}
          errors={errors}
        />

        <PrelimsRandomizationSettings
          testSeries={testSeries}
          onTestSeriesChange={updateTestSeries}
          errors={errors}
        />

        {!testSeries.sectionWiseEnabled ? (
          <div className="rounded-2xl border border-[#e5eaf2] bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef6fc] ring-1 ring-[#cfe8f8]/80"
                aria-hidden
              >
                <FileQuestion className="h-5 w-5 text-[#246392]" strokeWidth={2.1} />
              </span>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[#1a3a5c] sm:text-base">Question Paper</h4>
                <p className="text-xs text-[#686868]">
                  Set question count and add or upload questions
                </p>
              </div>
            </div>
            <BatchQuestionPaperSection
              testSeries={testSeries}
              setTestSeries={setTestSeries}
              errors={errors}
            />
          </div>
        ) : null}
      </motion.section>
    </AnimatePresence>
  )
}
