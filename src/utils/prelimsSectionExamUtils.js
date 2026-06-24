import {
  normalizePrelimsSections,
  normalizeTestSeriesBlock,
  resolvePrelimsSectionDurationMinutes,
} from './batchTestSeriesForm'
import { normalizePrelimsSectionQuestions } from './prelimsSectionQuestions'
import {
  applyQuestionRandomization,
  buildPrelimsExamRuntimeConfig,
  seededShuffle,
} from './prelimsExamRuntimeUtils'

/** Build contiguous question ranges per section (1-based question numbers). */
export function buildSectionQuestionRanges(sections = []) {
  const sorted = normalizePrelimsSections(sections)
  let cursor = 1
  return sorted.map((section) => {
    const count = parseInt(String(section.totalQuestions), 10) || 0
    const start = cursor
    const end = count > 0 ? cursor + count - 1 : cursor - 1
    cursor += count
    return {
      sectionId: section.sectionId,
      sectionName: section.sectionName,
      startQuestionNo: start,
      endQuestionNo: end,
      totalQuestions: count,
      order: section.order,
    }
  })
}

export function getActiveSections(sections = []) {
  return normalizePrelimsSections(sections).filter((s) => s.status !== 'inactive')
}

export function getQuestionsForSection(questions = [], sectionRange) {
  if (!sectionRange) return []
  return (questions || []).filter((q) => {
    const no = parseInt(String(q.questionNo), 10)
    return (
      Number.isFinite(no) &&
      no >= sectionRange.startQuestionNo &&
      no <= sectionRange.endQuestionNo
    )
  })
}

/** Whether a student may navigate to a target section index. */
export function canNavigateToSection({
  currentSectionIndex = 0,
  targetSectionIndex = 0,
  sections = [],
  completedSectionIds = [],
}) {
  const active = getActiveSections(sections)
  if (targetSectionIndex < 0 || targetSectionIndex >= active.length) return false
  if (targetSectionIndex <= currentSectionIndex) return true

  for (let i = 0; i < targetSectionIndex; i += 1) {
    const section = active[i]
    if (section.lockSection && !completedSectionIds.includes(section.sectionId)) {
      return false
    }
  }
  return true
}

/** Config consumed by student prelims exam player when section-wise mode is on. */
export function buildSectionExamConfig(testSeriesRaw = {}, { studentSeed = '' } = {}) {
  const ts = normalizeTestSeriesBlock(testSeriesRaw)
  const runtime = buildPrelimsExamRuntimeConfig(ts, { studentSeed })

  if (!ts.sectionWiseEnabled) {
    const questions = applyQuestionRandomization(ts.questions || [], {
      shuffleQuestions: runtime.shuffleQuestions,
      shuffleOptions: runtime.shuffleOptions,
      seed: studentSeed,
    })
    return {
      sectionWiseEnabled: false,
      languages: ts.languages,
      sections: [],
      sectionTimerExpiryAction: 'moveNext',
      questions,
      ...runtime,
    }
  }

  const activeSections = getActiveSections(ts.sections)
  let orderedSections = [...activeSections]
  if (runtime.shuffleSections) {
    orderedSections = seededShuffle(orderedSections, `${studentSeed}-sections`)
  }

  const ranges = buildSectionQuestionRanges(orderedSections)

  return {
    sectionWiseEnabled: true,
    languages: ts.languages,
    sectionTimerExpiryAction: ts.sectionTimerExpiryAction || 'moveNext',
    ...runtime,
    sections: orderedSections.map((section, index) => {
      const range = ranges[index]
      const baseQuestions =
        section.questions?.length > 0
          ? normalizePrelimsSectionQuestions(section.questions)
          : getQuestionsForSection(ts.questions, range)
      const questions = applyQuestionRandomization(baseQuestions, {
        shuffleQuestions: runtime.shuffleQuestions,
        shuffleOptions: runtime.shuffleOptions,
        seed: `${studentSeed}-${section.sectionId}`,
      })
      return {
        ...section,
        durationMinutes: section.timerEnabled
          ? resolvePrelimsSectionDurationMinutes(section)
          : null,
        questionRange: range,
        questions,
      }
    }),
  }
}

/** Handle section timer expiry — returns next section index or submit action. */
export function resolveSectionTimerExpiry({
  currentSectionIndex = 0,
  sections = [],
  action = 'moveNext',
}) {
  const active = getActiveSections(sections)
  const isLast = currentSectionIndex >= active.length - 1

  if (action === 'submitSection') {
    return { type: 'submitSection', nextSectionIndex: currentSectionIndex }
  }

  if (isLast) {
    return { type: 'submitExam', nextSectionIndex: currentSectionIndex }
  }

  return { type: 'moveNext', nextSectionIndex: currentSectionIndex + 1 }
}
