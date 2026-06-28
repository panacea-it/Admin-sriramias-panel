import {
  appendBatchIds,
  appendJsonField,
  normalizePaginatedResponse,
  resolveRowId,
  unwrapApiData,
} from './facultySubjectChildApiHelpers'

export const PRELIMS_PUBLISH_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'UNPUBLISHED', label: 'Unpublished' },
]

export function normalizePrelimsTestsListResponse(data, { page = 1, limit = 10 } = {}) {
  const paginated = normalizePaginatedResponse(data, { page, limit })
  return {
    ...paginated,
    rows: paginated.rows.map(mapPrelimsTestRowToLocal).filter(Boolean),
  }
}

export function mapPrelimsTestRowToLocal(row) {
  if (!row || typeof row !== 'object') return null
  const id = resolveRowId(row)
  if (!id) return null
  return {
    id,
    prelimsTestId: row.prelimsTestId || '',
    testName: row.testName || '',
    languages: Array.isArray(row.languages) ? row.languages : [],
    totalQuestions: Number(row.totalQuestions ?? 0),
    scheduleDate: row.scheduleDate || '',
    scheduleTime: row.scheduleTime || '',
    publishStatus: row.publishStatus || 'DRAFT',
    batchNamesLabel: row.batchNamesLabel || '',
    durationLabel: row.durationLabel || '',
    languageStats: Array.isArray(row.languageStats) ? row.languageStats : [],
    raw: row,
  }
}

export function mapPrelimsTestDetailToLocal(response) {
  const row = unwrapApiData(response)
  return mapPrelimsTestRowToLocal(row)?.raw || row
}

export function normalizePrelimsDashboardSummary(response) {
  const data = unwrapApiData(response) || {}
  return {
    totalTests: Number(data.totalTests ?? 0),
    publishedCount: Number(data.publishedCount ?? 0),
    draftCount: Number(data.draftCount ?? 0),
    unpublishedCount: Number(data.unpublishedCount ?? 0),
    totalQuestions: Number(data.totalQuestions ?? 0),
  }
}

export function normalizePrelimsQuestionsListResponse(data, { page = 1, limit = 10 } = {}) {
  return normalizePaginatedResponse(data, { page, limit })
}

/**
 * Build multipart FormData for POST /api/prelims-tests
 * @param {Record<string, unknown>} form
 * @param {{ questionFiles?: File[] }} [options]
 */
export function buildPrelimsTestCreateFormData(form, { questionFiles = [] } = {}) {
  const fd = new FormData()
  fd.append('facultySubjectId', String(form.facultySubjectId || ''))
  fd.append('folderId', String(form.folderId || ''))
  appendBatchIds(fd, form.batchIds)
  fd.append('testName', String(form.testName || '').trim())
  appendJsonField(fd, 'languages', form.languages || [])
  fd.append('scheduleDate', String(form.scheduleDate || ''))
  fd.append('scheduleTime', String(form.scheduleTime || ''))
  fd.append('durationMinutes', String(form.durationMinutes ?? ''))
  fd.append('totalMarks', String(form.totalMarks ?? ''))
  fd.append('marksPerCorrectAnswer', String(form.marksPerCorrectAnswer ?? ''))
  fd.append('resultDate', String(form.resultDate || ''))

  if (form.publishStatus) fd.append('publishStatus', String(form.publishStatus))
  if (form.examPatternId) fd.append('examPatternId', String(form.examPatternId))
  if (form.instructionsHtml != null) fd.append('instructionsHtml', String(form.instructionsHtml))
  if (form.rankingEnabled != null) fd.append('rankingEnabled', String(Boolean(form.rankingEnabled)))
  if (form.shuffleQuestions != null) fd.append('shuffleQuestions', String(Boolean(form.shuffleQuestions)))
  if (form.shuffleOptions != null) fd.append('shuffleOptions', String(Boolean(form.shuffleOptions)))
  if (form.duplicateMode) fd.append('duplicateMode', String(form.duplicateMode))

  if (form.negativeMarking) appendJsonField(fd, 'negativeMarking', form.negativeMarking)
  if (form.attemptSettings) appendJsonField(fd, 'attemptSettings', form.attemptSettings)

  for (const file of questionFiles) {
    if (file) fd.append('questionFile', file)
  }

  return fd
}

export function buildPrelimsTestUpdatePayload(form) {
  const payload = {}
  if (form.testName != null) payload.testName = String(form.testName).trim()
  if (form.batchIds) payload.batchIds = form.batchIds
  if (form.languages) payload.languages = form.languages
  if (form.scheduleDate != null) payload.scheduleDate = form.scheduleDate
  if (form.scheduleTime != null) payload.scheduleTime = form.scheduleTime
  if (form.durationMinutes != null) payload.durationMinutes = Number(form.durationMinutes)
  if (form.totalMarks != null) payload.totalMarks = Number(form.totalMarks)
  if (form.marksPerCorrectAnswer != null) payload.marksPerCorrectAnswer = Number(form.marksPerCorrectAnswer)
  if (form.resultDate != null) payload.resultDate = form.resultDate
  if (form.publishStatus != null) payload.publishStatus = form.publishStatus
  if (form.examPatternId != null) payload.examPatternId = form.examPatternId || null
  if (form.instructionsHtml != null) payload.instructionsHtml = form.instructionsHtml
  if (form.negativeMarking) payload.negativeMarking = form.negativeMarking
  if (form.attemptSettings) payload.attemptSettings = form.attemptSettings
  if (form.rankingEnabled != null) payload.rankingEnabled = Boolean(form.rankingEnabled)
  if (form.shuffleQuestions != null) payload.shuffleQuestions = Boolean(form.shuffleQuestions)
  if (form.shuffleOptions != null) payload.shuffleOptions = Boolean(form.shuffleOptions)
  return payload
}

export function buildPrelimsQuestionUploadFormData({ prelimsTestId, language, file, duplicateMode }) {
  const fd = new FormData()
  fd.append('prelimsTestId', String(prelimsTestId))
  fd.append('language', String(language))
  if (file) fd.append('questionFile', file)
  if (duplicateMode) fd.append('duplicateMode', duplicateMode)
  return fd
}

export function buildPrelimsQuestionReuploadFormData({
  prelimsTestId,
  language,
  file,
  duplicateMode,
  reuploadMode,
}) {
  const fd = buildPrelimsQuestionUploadFormData({ prelimsTestId, language, file, duplicateMode })
  if (reuploadMode) fd.append('reuploadMode', reuploadMode)
  return fd
}

export function canPublishPrelimsTest(row) {
  const languages = Array.isArray(row?.languages) ? row.languages : []
  const stats = Array.isArray(row?.languageStats) ? row.languageStats : []
  if (!languages.length) return false
  return languages.every((lang) => {
    const stat = stats.find((s) => s.language === lang)
    return Number(stat?.questionCount ?? 0) > 0
  })
}
