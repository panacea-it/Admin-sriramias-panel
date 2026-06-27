import { formatBookstoreDate } from './formatDateTime'

export const PUBLISH_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'UNPUBLISHED', label: 'Unpublished' },
]

export const DURATION_PRESET_MINUTES = [30, 60, 90, 120, 180]

export const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest first', sortBy: 'createdAt', sortOrder: 'desc' },
  { value: 'createdAt:asc', label: 'Oldest first', sortBy: 'createdAt', sortOrder: 'asc' },
  { value: 'testName:asc', label: 'Name A–Z', sortBy: 'testName', sortOrder: 'asc' },
  { value: 'scheduleDate:desc', label: 'Schedule (latest)', sortBy: 'scheduleDate', sortOrder: 'desc' },
  { value: 'totalQuestions:desc', label: 'Most questions', sortBy: 'totalQuestions', sortOrder: 'desc' },
]

const DEFAULT_NEGATIVE_MARKING = { enabled: false, preset: '0.25', value: 0 }
const DEFAULT_ATTEMPT_SETTINGS = {
  enabled: false,
  attempts: 1,
  restrictionType: 'LIFETIME',
  showRemainingAttempts: false,
}

export function buildDefaultCbtForm(enums = {}) {
  const defaults = enums?.defaults || {}
  return {
    facultySubjectId: '',
    folderId: '',
    batchIds: [],
    testName: '',
    languages: [],
    scheduleDate: '',
    scheduleTime: '10:00',
    resultDate: '',
    durationMinutes: defaults.durationMinutes ?? 120,
    totalMarks: defaults.totalMarks ?? 100,
    marksPerCorrectAnswer: defaults.marksPerCorrectAnswer ?? 2,
    publishStatus: defaults.publishStatus ?? 'DRAFT',
    negativeMarking: defaults.negativeMarking ?? { ...DEFAULT_NEGATIVE_MARKING },
    attemptSettings: defaults.attemptSettings ?? { ...DEFAULT_ATTEMPT_SETTINGS },
    rankingEnabled: Boolean(defaults.rankingEnabled),
    examPatternId: defaults.examPatternId ?? '',
    instructionsHtml: defaults.instructionsHtml ?? '',
    shuffleQuestions: Boolean(defaults.shuffleQuestions),
    shuffleOptions: Boolean(defaults.shuffleOptions),
    duplicateMode: defaults.duplicateMode ?? 'SKIP',
  }
}

export function mapApiPrelimsTestToRow(item) {
  if (!item) return null
  return {
    ...item,
    id: item._id,
    prelimsTestId: item.prelimsTestId,
    testName: item.testName,
    folderName: item.folderName,
    facultySubjectName: item.facultySubjectName,
    batchNamesLabel: item.batchNamesLabel,
    languages: item.languages || [],
    totalQuestions: item.totalQuestions ?? 0,
    durationLabel: item.durationLabel || (item.durationMinutes ? `${item.durationMinutes} min` : '—'),
    scheduleDate: item.scheduleDate,
    scheduleTime: item.scheduleTime,
    resultDate: item.resultDate,
    publishStatus: item.publishStatus,
    updatedAt: item.updatedAt,
    createdAt: item.createdAt,
  }
}

export function normalizeCbtTestsListResponse(data, { page = 1, limit = 10 } = {}) {
  const rows = Array.isArray(data?.data) ? data.data : []
  return {
    items: rows.map(mapApiPrelimsTestToRow).filter(Boolean),
    total: data?.total ?? rows.length,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
    totalPages: data?.totalPages ?? Math.max(1, Math.ceil((data?.total ?? rows.length) / limit)),
    count: data?.count ?? rows.length,
  }
}

export function mapApiTestToForm(test) {
  if (!test) return buildDefaultCbtForm()
  const scheduleDate = test.scheduleDate ? String(test.scheduleDate).slice(0, 10) : ''
  const resultDate = test.resultDate ? String(test.resultDate).slice(0, 10) : ''
  return {
    facultySubjectId: test.facultySubjectId || '',
    folderId: test.folderId || '',
    batchIds: Array.isArray(test.batchIds) ? [...test.batchIds] : [],
    testName: test.testName || '',
    languages: Array.isArray(test.languages) ? [...test.languages] : [],
    scheduleDate,
    scheduleTime: test.scheduleTime || '10:00',
    resultDate,
    durationMinutes: test.durationMinutes ?? 120,
    totalMarks: test.totalMarks ?? 100,
    marksPerCorrectAnswer: test.marksPerCorrectAnswer ?? 2,
    publishStatus: test.publishStatus || 'DRAFT',
    negativeMarking: test.negativeMarking || { ...DEFAULT_NEGATIVE_MARKING },
    attemptSettings: test.attemptSettings || { ...DEFAULT_ATTEMPT_SETTINGS },
    rankingEnabled: Boolean(test.rankingEnabled),
    examPatternId: test.examPatternId || '',
    instructionsHtml: test.instructionsHtml || '',
    shuffleQuestions: Boolean(test.shuffleQuestions),
    shuffleOptions: Boolean(test.shuffleOptions),
    duplicateMode: 'SKIP',
  }
}

export function formatCbtScheduleDisplay(scheduleDate, scheduleTime) {
  if (!scheduleDate) return '—'
  const date = formatBookstoreDate(scheduleDate)
  return scheduleTime ? `${date} ${scheduleTime}` : date
}

export function unwrapDropdownItems(body) {
  if (Array.isArray(body)) return body
  if (Array.isArray(body?.data)) return body.data
  return []
}

export function buildCreateFormData(values, files = {}) {
  const fd = new FormData()
  fd.append('facultySubjectId', values.facultySubjectId)
  fd.append('folderId', values.folderId)
  fd.append('batchIds', JSON.stringify(values.batchIds))
  fd.append('testName', values.testName.trim())
  fd.append('languages', JSON.stringify(values.languages))
  fd.append('scheduleDate', values.scheduleDate)
  fd.append('scheduleTime', values.scheduleTime)
  fd.append('resultDate', values.resultDate)
  fd.append('durationMinutes', String(values.durationMinutes))
  fd.append('totalMarks', String(values.totalMarks))
  fd.append('marksPerCorrectAnswer', String(values.marksPerCorrectAnswer))
  fd.append('publishStatus', values.publishStatus ?? 'DRAFT')
  fd.append('negativeMarking', JSON.stringify(values.negativeMarking))
  fd.append('attemptSettings', JSON.stringify(values.attemptSettings))
  if (values.examPatternId) fd.append('examPatternId', values.examPatternId)
  if (values.instructionsHtml) fd.append('instructionsHtml', values.instructionsHtml)
  fd.append('rankingEnabled', String(Boolean(values.rankingEnabled)))
  fd.append('shuffleQuestions', String(Boolean(values.shuffleQuestions)))
  fd.append('shuffleOptions', String(Boolean(values.shuffleOptions)))
  if (values.duplicateMode) fd.append('duplicateMode', values.duplicateMode)

  values.languages.forEach((lang) => {
    const file = files[lang]
    if (file) fd.append('questionFile', file)
  })

  return fd
}

export function buildUpdatePayload(values) {
  const payload = {
    testName: values.testName.trim(),
    scheduleDate: values.scheduleDate,
    scheduleTime: values.scheduleTime,
    resultDate: values.resultDate,
    durationMinutes: Number(values.durationMinutes),
    totalMarks: Number(values.totalMarks),
    marksPerCorrectAnswer: Number(values.marksPerCorrectAnswer),
    batchIds: values.batchIds,
    languages: values.languages,
    negativeMarking: values.negativeMarking,
    attemptSettings: values.attemptSettings,
    rankingEnabled: Boolean(values.rankingEnabled),
    shuffleQuestions: Boolean(values.shuffleQuestions),
    shuffleOptions: Boolean(values.shuffleOptions),
    publishStatus: values.publishStatus,
    instructionsHtml: values.instructionsHtml || '',
  }
  if (values.examPatternId) payload.examPatternId = values.examPatternId
  else payload.examPatternId = null
  return payload
}

export function validateCbtTestForm(values, { requireQuestionFiles = false, files = {} } = {}) {
  const errors = {}
  if (!values.facultySubjectId) errors.facultySubjectId = 'Faculty subject is required'
  if (!values.folderId) errors.folderId = 'Topic is required'
  if (!values.batchIds?.length) errors.batchIds = 'Select at least one batch'
  if (!values.testName?.trim()) errors.testName = 'Test name is required'
  if (!values.languages?.length) errors.languages = 'Select at least one language'
  if (!values.scheduleDate) errors.scheduleDate = 'Schedule date is required'
  if (!values.scheduleTime) errors.scheduleTime = 'Schedule time is required'
  if (!values.resultDate) errors.resultDate = 'Result date is required'
  if (values.scheduleDate && values.resultDate && values.resultDate < values.scheduleDate) {
    errors.resultDate = 'Result date must be on or after schedule date'
  }
  if (!values.durationMinutes || Number(values.durationMinutes) < 1) {
    errors.durationMinutes = 'Duration must be at least 1 minute'
  }
  if (!values.totalMarks || Number(values.totalMarks) < 1) {
    errors.totalMarks = 'Total marks must be at least 1'
  }
  if (values.marksPerCorrectAnswer == null || Number(values.marksPerCorrectAnswer) < 0) {
    errors.marksPerCorrectAnswer = 'Marks per correct answer must be 0 or more'
  }

  if (requireQuestionFiles) {
    const missing = (values.languages || []).filter((lang) => !files[lang])
    if (missing.length) {
      errors.questionFiles = `Upload question sheet for: ${missing.join(', ')}`
    }
  }

  return errors
}

export function buildListFilters({
  page,
  limit,
  search,
  facultySubjectId,
  folderId,
  batchId,
  language,
  publishStatus,
  scheduleDateFrom,
  scheduleDateTo,
  sortPreset,
}) {
  const filters = {
    page,
    limit,
    search: search?.trim() || '',
  }
  if (facultySubjectId && facultySubjectId !== 'all') filters.facultySubjectId = facultySubjectId
  if (folderId && folderId !== 'all') filters.folderId = folderId
  if (batchId && batchId !== 'all') filters.batchId = batchId
  if (language && language !== 'all') filters.language = language
  if (publishStatus && publishStatus !== 'all') filters.publishStatus = publishStatus
  if (scheduleDateFrom) filters.scheduleDateFrom = scheduleDateFrom
  if (scheduleDateTo) filters.scheduleDateTo = scheduleDateTo

  const sort = SORT_OPTIONS.find((o) => o.value === sortPreset) || SORT_OPTIONS[0]
  filters.sortBy = sort.sortBy
  filters.sortOrder = sort.sortOrder
  return filters
}
