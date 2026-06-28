import {
  appendBatchIds,
  appendJsonField,
  normalizePaginatedResponse,
  resolveRowId,
  unwrapApiData,
} from './facultySubjectChildApiHelpers'

export const SUBJECT_PDF_VISIBILITY_OPTIONS = [
  { value: 'VISIBILITY', label: 'Visibility' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PRIVATE', label: 'Private' },
]

export function normalizeSubjectPdfsListResponse(data, { page = 1, limit = 10 } = {}) {
  const paginated = normalizePaginatedResponse(data, { page, limit })
  return {
    ...paginated,
    rows: paginated.rows.map(mapSubjectPdfRowToLocal).filter(Boolean),
  }
}

export function mapSubjectPdfRowToLocal(row) {
  if (!row || typeof row !== 'object') return null
  const id = resolveRowId(row)
  if (!id) return null
  return {
    id,
    subjectPdfId: row.subjectPdfId || '',
    pdfTitle: row.pdfTitle || '',
    visibility: row.visibility || 'DRAFT',
    viewCount: Number(row.viewCount ?? 0),
    batchNamesLabel: row.batchNamesLabel || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    pdfUrl: row.pdf?.url || '',
    raw: row,
  }
}

export function mapSubjectPdfDetailToLocal(response) {
  const row = unwrapApiData(response)
  return mapSubjectPdfRowToLocal(row)?.raw || row
}

export function normalizeSubjectPdfDashboardSummary(response) {
  const data = unwrapApiData(response) || {}
  return {
    totalPdfs: Number(data.totalPdfs ?? 0),
    totalViews: Number(data.totalViews ?? 0),
    visibilityCount: Number(data.visibilityCount ?? 0),
    publishedCount: Number(data.publishedCount ?? 0),
    draftCount: Number(data.draftCount ?? 0),
    privateCount: Number(data.privateCount ?? 0),
  }
}

/**
 * @param {Record<string, unknown>} form
 * @param {File=} pdfFile
 */
export function buildSubjectPdfFormData(form, pdfFile) {
  const fd = new FormData()
  fd.append('facultySubjectId', String(form.facultySubjectId || ''))
  fd.append('folderId', String(form.folderId || ''))
  appendBatchIds(fd, form.batchIds)
  fd.append('pdfTitle', String(form.pdfTitle || '').trim())
  fd.append('visibility', String(form.visibility || 'DRAFT'))

  if (form.description != null) fd.append('description', String(form.description))
  if (form.tags) appendJsonField(fd, 'tags', form.tags)
  if (pdfFile) fd.append('pdf', pdfFile)

  return fd
}

export function parseTagsInput(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  const raw = String(value || '').trim()
  if (!raw) return []
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter(Boolean) : []
    } catch {
      // fall through
    }
  }
  return raw.split(',').map((t) => t.trim()).filter(Boolean)
}
