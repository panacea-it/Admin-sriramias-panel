import { mapUiStatusToApi } from './programHelpers'

export const OMR_RESULT_UPLOAD_PROFILE = {
  id: 'OMR_RESULT_SHEET',
  labelFormats: ['XLSX', 'CSV', 'PDF'],
  extensions: ['xlsx', 'csv', 'pdf'],
  mimeTypes: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/csv',
    'application/pdf',
  ],
  accept:
    '.xlsx,.csv,.pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/pdf',
  maxBytes: 10 * 1024 * 1024,
}

export const OMR_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Deactivated', label: 'Inactive' },
]

export const OMR_SORT_OPTIONS = [
  { value: 'createdAt_desc', sortBy: 'createdAt', sortOrder: 'desc', label: 'Created (Newest)' },
  { value: 'createdAt_asc', sortBy: 'createdAt', sortOrder: 'asc', label: 'Created (Oldest)' },
  { value: 'examName_asc', sortBy: 'examName', sortOrder: 'asc', label: 'Exam Name (A–Z)' },
  { value: 'examName_desc', sortBy: 'examName', sortOrder: 'desc', label: 'Exam Name (Z–A)' },
  { value: 'examDate_desc', sortBy: 'examDate', sortOrder: 'desc', label: 'Exam Date (Newest)' },
  { value: 'examDate_asc', sortBy: 'examDate', sortOrder: 'asc', label: 'Exam Date (Oldest)' },
  { value: 'uploadDate_desc', sortBy: 'uploadDate', sortOrder: 'desc', label: 'Upload Date (Newest)' },
  { value: 'uploadDate_asc', sortBy: 'uploadDate', sortOrder: 'asc', label: 'Upload Date (Oldest)' },
]

export function resolveOmrSortPreset(preset) {
  const match = OMR_SORT_OPTIONS.find((opt) => opt.value === preset)
  return match || OMR_SORT_OPTIONS[0]
}

export function mapOmrStatusFilterToApi(statusFilter) {
  if (statusFilter === 'Active') return 'ACTIVE'
  if (statusFilter === 'Deactivated') return 'INACTIVE'
  if (statusFilter === 'all') return 'ALL'
  return 'ALL'
}

export function mapApiOmrStatusToUi(status) {
  const raw = String(status || 'ACTIVE').toUpperCase().replace(/\s+/g, '_')
  if (raw === 'INACTIVE' || raw === 'IN_ACTIVE' || raw === 'DEACTIVATED') return 'Deactivated'
  return 'Active'
}

export function buildOmrExamApiPayload(form) {
  return {
    examName: String(form.examName || '').trim(),
    examDate: form.examDate,
    status: mapUiStatusToApi(form.status === 'Deactivated' ? 'In Active' : form.status),
  }
}

export function buildUpdateOmrExamPayload(form, original) {
  const payload = {}
  const next = buildOmrExamApiPayload(form)
  const prev = original ? buildOmrExamApiPayload(original) : null

  const normalizeDate = (value) => {
    if (!value) return ''
    const str = String(value)
    return str.includes('T') ? str.slice(0, 10) : str
  }

  if (!prev || next.examName !== prev.examName) payload.examName = next.examName
  if (!prev || normalizeDate(next.examDate) !== normalizeDate(prev.examDate)) {
    payload.examDate = normalizeDate(next.examDate)
  }
  if (!prev || next.status !== prev.status) payload.status = next.status
  return payload
}

function mapResultSheet(rawSheet, rowUploadDate) {
  if (!rawSheet?.fileName && !rawSheet?.name) return null
  const uploadedAt =
    rawSheet?.uploadedAt ||
    rawSheet?.uploadedDate ||
    rawSheet?.uploaded_at ||
    rowUploadDate ||
    null

  return {
    fileName: rawSheet?.fileName || rawSheet?.name || '',
    fileType: rawSheet?.fileType || rawSheet?.extension || '',
    fileSize: rawSheet?.fileSize ?? null,
    mimeType: rawSheet?.mimeType || rawSheet?.contentType || '',
    uploadedBy: rawSheet?.uploadedBy || rawSheet?.uploaded_by || '—',
    uploadedAt,
    downloadUrl: rawSheet?.downloadUrl || rawSheet?.url || '',
  }
}

export function mapApiOmrExamToLocal(data) {
  const row =
    data?.data?.exam ??
    data?.data?.omrExam ??
    data?.data ??
    data?.exam ??
    data?.omrExam ??
    (data && typeof data === 'object' && !Array.isArray(data) && !('success' in data && 'total' in data)
      ? data
      : null)

  if (!row || typeof row !== 'object') return null

  const id = row._id ?? row.id ?? row.omrExamId
  if (!id) return null

  const hasResultSheet = Boolean(
    row.hasResultSheet ?? row.resultSheetUploaded ?? row.resultSheet?.fileName,
  )
  const uploadDate = row.uploadDate || row.resultSheet?.uploadedDate || null

  return {
    id: String(id),
    examName: String(row.examName || row.name || '').trim(),
    examDate: row.examDate || row.exam_date || '',
    status: mapApiOmrStatusToUi(row.status),
    resultSheetUploaded: hasResultSheet,
    uploadDate,
    createdDate: row.createdDate || row.createdAt || row.createdOn || null,
    createdAt: row.createdAt || row.createdDate || row.createdOn || null,
    updatedAt: row.updatedAt || row.modifiedAt || row.createdAt || row.createdDate || null,
    resultSheet: hasResultSheet
      ? mapResultSheet(row.resultSheet || row.resultFile, uploadDate)
      : null,
  }
}

export function normalizeOmrExamsListResponse(data, { page = 1, limit = 10 } = {}) {
  const itemsRaw = Array.isArray(data?.data)
    ? data.data
    : data?.data?.exams ??
      data?.data?.omrExams ??
      data?.data?.items ??
      data?.exams ??
      data?.omrExams ??
      []

  const items = (Array.isArray(itemsRaw) ? itemsRaw : [])
    .map((row) => mapApiOmrExamToLocal(row))
    .filter(Boolean)

  const total = Number(data?.total ?? items.length)
  const resolvedPage = Number(data?.page ?? page)
  const resolvedLimit = Number(data?.limit ?? limit)
  const totalPages = Number(data?.totalPages ?? Math.max(1, Math.ceil(total / resolvedLimit)))

  return {
    items,
    total,
    page: resolvedPage,
    limit: resolvedLimit,
    totalPages,
  }
}

export function inferOmrFileType(fileName = '') {
  const ext = String(fileName).split('.').pop()?.toLowerCase()
  if (ext === 'xlsx') return 'XLSX'
  if (ext === 'csv') return 'CSV'
  if (ext === 'pdf') return 'PDF'
  return ext?.toUpperCase() || 'unknown'
}

export function isOmrPdfFile(fileName = '', fileType = '') {
  const type = String(fileType || inferOmrFileType(fileName)).toUpperCase()
  return type === 'PDF' || String(fileName).toLowerCase().endsWith('.pdf')
}

export function validateOmrExamForm(form) {
  const errors = {}
  const name = String(form.examName || '').trim()
  if (!name) errors.examName = 'Exam name is required'
  else if (name.length < 2) errors.examName = 'Exam name must be at least 2 characters'
  else if (name.length > 200) errors.examName = 'Exam name must not exceed 200 characters'
  if (!form.examDate) errors.examDate = 'Exam date is required'
  if (!form.status) errors.status = 'Status is required'
  return errors
}
