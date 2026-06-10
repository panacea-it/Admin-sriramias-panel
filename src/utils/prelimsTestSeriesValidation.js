import {
  normalizeTestSeriesBlock,
  resolvePrelimsSectionDurationMinutes,
} from './batchTestSeriesForm'
import { validateLanguageQuestionPapers } from './prelimsLanguageQuestionPapers'
import {
  countCompletedSectionQuestions,
  deriveSectionQuestionCount,
  isPrelimsSectionQuestionComplete,
  normalizePrelimsSectionQuestions,
} from './prelimsSectionQuestions'

/** Validation for Faculty Subjects → Prelims Test only. */
export function validatePrelimsTestSeriesExtras(
  testSeriesRaw = {},
  { errorPrefix = 'testSeries_' } = {},
) {
  const errors = {}
  const ts = normalizeTestSeriesBlock(testSeriesRaw)
  const p = errorPrefix

  if (!ts.languages?.length) {
    errors[`${p}languages`] = 'Select at least one language'
  } else {
    Object.assign(
      errors,
      validateLanguageQuestionPapers(ts.languages, ts.details?.languageQuestionPapers, {
        errorPrefix: p,
      }),
    )
  }

  if (ts.attemptLimitEnabled) {
    const max = parseInt(String(ts.maxAttempts), 10)
    if (!Number.isFinite(max) || max < 1) {
      errors[`${p}maxAttempts`] = 'Enter at least 1 attempt'
    }
  }

  if (ts.shuffleSections && !ts.sectionWiseEnabled) {
    errors[`${p}shuffle`] = 'Enable section-wise questions to shuffle sections'
  }

  if (!ts.sectionWiseEnabled) return errors

  const sections = ts.sections || []
  if (!sections.length) {
    errors[`${p}sections`] = 'Add at least one section when section-wise mode is enabled'
    return errors
  }

  const activeSections = sections.filter((s) => s.status !== 'inactive')
  if (!activeSections.length) {
    errors[`${p}sections`] = 'At least one section must be active'
  }

  sections.forEach((section, index) => {
    const key = `${p}section_${section.sectionId || index}`
    if (!section.sectionName?.trim()) {
      errors[`${key}_name`] = 'Section name is required'
    }

    const qCount = parseInt(String(section.totalQuestions), 10)
    if (!Number.isFinite(qCount) || qCount <= 0) {
      errors[`${key}_questions`] = 'Enter valid total questions'
    }

    const marks = parseFloat(String(section.totalMarks))
    if (!Number.isFinite(marks) || marks <= 0) {
      errors[`${key}_marks`] = 'Enter valid total marks'
    }

    const perQ = parseFloat(String(section.marksPerQuestion))
    if (!Number.isFinite(perQ) || perQ <= 0) {
      errors[`${key}_marksPerQuestion`] = 'Enter valid marks per correct answer'
    }

    const neg = parseFloat(String(section.negativeMarks))
    if (section.negativeMarks !== '' && section.negativeMarks != null) {
      if (!Number.isFinite(neg) || neg < 0) {
        errors[`${key}_negativeMarks`] = 'Enter valid negative marks'
      }
    }

    if (section.timerEnabled) {
      const duration = resolvePrelimsSectionDurationMinutes(section)
      if (!duration) {
        errors[`${key}_duration`] = 'Section duration is required when timer is enabled'
      }
    }

    const order = parseInt(String(section.order), 10)
    if (!Number.isFinite(order) || order <= 0) {
      errors[`${key}_order`] = 'Enter valid section order'
    }

    const expectedCount = deriveSectionQuestionCount(section)
    const sectionQuestions = normalizePrelimsSectionQuestions(section.questions || [])
    const activeQuestions = sectionQuestions.filter((q) => q.status !== 'inactive')

    if (section.status !== 'inactive') {
      if (expectedCount <= 0) {
        errors[`${key}_paper`] = 'Add questions for this section'
      } else if (sectionQuestions.length !== expectedCount) {
        errors[`${key}_paper`] =
          `Question count (${sectionQuestions.length}) must match configured total (${expectedCount})`
      } else {
        const incomplete = activeQuestions.filter((q) => !isPrelimsSectionQuestionComplete(q))
        if (incomplete.length) {
          errors[`${key}_paper`] = 'Complete all active questions in this section'
        }
        const completed = countCompletedSectionQuestions(sectionQuestions)
        if (completed < expectedCount && !incomplete.length) {
          errors[`${key}_paper`] = 'Save all question blocks in this section'
        }
      }
    }
  })

  return errors
}
