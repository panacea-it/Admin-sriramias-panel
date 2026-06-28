import {
  appendBatchIds,
  normalizePaginatedResponse,
  resolveRowId,
  unwrapApiData,
} from './facultySubjectChildApiHelpers'

export const MAINS_PUBLISH_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'UNPUBLISHED', label: 'Unpublished' },
]

export const MAINS_DURATION_PRESETS = [
  { value: '30', label: '30 min' },
  { value: '60', label: '1 hr' },
  { value: '90', label: '1.5 hr' },
  { value: '120', label: '2 hr' },
  { value: '180', label: '3 hr' },
  { value: 'CUSTOM', label: 'Custom' },
]

export function normalizeMainsAnswerWritingsListResponse(data, { page = 1, limit = 10 } = {}) {
  const paginated = normalizePaginatedResponse(data, { page, limit })
  return {
    ...paginated,
    rows: paginated.rows.map(mapMainsAnswerWritingRowToLocal).filter(Boolean),
  }
}

export function mapMainsAnswerWritingRowToLocal(row) {
  if (!row || typeof row !== 'object') return null
  const id = resolveRowId(row)
  if (!id) return null
  return {
    id,
    mainsAnswerWritingId: row.mainsAnswerWritingId || '',
    testName: row.testName || '',
    topicName: row.topicName || '—',
    scheduleDate: row.scheduleDate || '',
    durationLabel: row.durationLabel || '',
    publishStatus: row.publishStatus || 'DRAFT',
    batchNamesLabel: row.batchNamesLabel || '',
    pdfUrl: row.pdf?.url || '',
    raw: row,
  }
}

export function mapMainsAnswerWritingDetailToLocal(response) {
  const row = unwrapApiData(response)
  return mapMainsAnswerWritingRowToLocal(row)?.raw || row
}

export function normalizeMainsDashboardSummary(response) {
  const data = unwrapApiData(response) || {}
  return {
    totalEntries: Number(data.totalEntries ?? 0),
    publishedCount: Number(data.publishedCount ?? 0),
    draftCount: Number(data.draftCount ?? 0),
    unpublishedCount: Number(data.unpublishedCount ?? 0),
  }
}

export function normalizeMainsTopicsDropdown(response) {
  const data = Array.isArray(response?.data) ? response.data : []
  return data.map((row) => ({
    value: String(row._id || ''),
    label: row.topicName || row.topicId || 'Topic',
  }))
}

/**
 * @param {Record<string, unknown>} form
 * @param {File=} pdfFile
 */
export function buildMainsAnswerWritingFormData(form, pdfFile) {
  const fd = new FormData()
  fd.append('facultySubjectId', String(form.facultySubjectId || ''))
  fd.append('folderId', String(form.folderId || ''))
  appendBatchIds(fd, form.batchIds)
  fd.append('testName', String(form.testName || '').trim())
  fd.append('scheduleDate', String(form.scheduleDate || ''))
  fd.append('durationPreset', String(form.durationPreset || '60'))
  fd.append('durationMinutes', String(form.durationMinutes ?? form.durationPreset ?? '60'))
  fd.append('totalMarks', String(form.totalMarks ?? ''))
  fd.append('resultDate', String(form.resultDate || ''))
  fd.append('questionsText', String(form.questionsText || '').trim())

  if (form.topicId) fd.append('topicId', String(form.topicId))
  if (form.passMarks != null && form.passMarks !== '') fd.append('passMarks', String(form.passMarks))
  if (form.publishStatus) fd.append('publishStatus', String(form.publishStatus))
  if (pdfFile) fd.append('pdf', pdfFile)

  return fd
}

export function mapMainsFormToApiValues(form) {
  return {
    facultySubjectId: form.facultySubjectId,
    folderId: form.folderId,
    batchIds: form.batchIds,
    testName: form.testName,
    scheduleDate: form.scheduleDate,
    durationPreset: form.durationPreset || '60',
    durationMinutes: form.durationMinutes || form.durationPreset || 60,
    totalMarks: form.totalMarks,
    passMarks: form.passMarks,
    resultDate: form.resultDate,
    questionsText: form.questionsText,
    topicId: form.topicId || undefined,
    publishStatus: form.publishStatus || 'DRAFT',
  }
}
