import { mapApiStatusToUi, mapUiStatusToApi } from './programHelpers'

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

export function mapOmrStatusFilterToApi(statusFilter) {
  if (statusFilter === 'Active') return 'ACTIVE'
  if (statusFilter === 'Inactive') return 'INACTIVE'
  return undefined
}

export function buildOmrExamApiPayload(form) {
  return {
    examName: String(form.examName || '').trim(),
    examDate: form.examDate,
    status: mapUiStatusToApi(form.status === 'Inactive' ? 'In Active' : form.status),
  }
}

export function mapApiOmrExamToLocal(data) {
  const row =
    data?.data?.exam ??
    data?.data?.omrExam ??
    data?.data ??
    data?.exam ??
    data?.omrExam ??
    (data && typeof data === 'object' && !Array.isArray(data) ? data : null)

  if (!row || typeof row !== 'object') return null
  if (row.deletedAt) return null

  const id = row._id ?? row.id ?? row.omrExamId
  if (!id) return null

  const resultSheet = row.resultSheet || row.resultFile || null
  const uploaded = Boolean(resultSheet?.fileName || row.resultSheetUploaded)

  return {
    id: String(id),
    examName: String(row.examName || row.name || '').trim(),
    examDate: row.examDate || row.exam_date || '',
    status: mapApiStatusToUi(row.status) === 'In Active' ? 'Inactive' : mapApiStatusToUi(row.status) || 'Active',
    resultSheetUploaded: uploaded,
    resultSheet: resultSheet
      ? {
          fileName: resultSheet.fileName || resultSheet.name || '',
          fileType: resultSheet.fileType || resultSheet.extension || '',
          mimeType: resultSheet.mimeType || resultSheet.contentType || '',
          uploadedBy: resultSheet.uploadedBy || resultSheet.uploaded_by || '—',
          uploadedAt: resultSheet.uploadedAt || resultSheet.uploaded_at || resultSheet.uploadDate || null,
        }
      : null,
    createdAt: row.createdAt || row.createdOn || null,
    updatedAt: row.updatedAt || row.modifiedAt || row.createdAt || null,
  }
}

export function normalizeOmrExamsListResponse(data) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === 'object' ? data.data : data
  const itemsRaw =
    payload?.exams ??
    payload?.omrExams ??
    payload?.items ??
    payload?.results ??
    data?.exams ??
    data?.omrExams ??
    (Array.isArray(payload) ? payload : Array.isArray(data?.data) ? data.data : [])

  return (Array.isArray(itemsRaw) ? itemsRaw : [])
    .map((row) => mapApiOmrExamToLocal(row))
    .filter(Boolean)
}

export function sortOmrExams(rows, sortKey, sortDirection) {
  const dir = sortDirection === 'asc' ? 1 : -1
  const list = [...rows]

  list.sort((a, b) => {
    let av = a[sortKey]
    let bv = b[sortKey]

    if (sortKey === 'resultSheetUploaded') {
      av = a.resultSheetUploaded ? 1 : 0
      bv = b.resultSheetUploaded ? 1 : 0
    }

    if (sortKey === 'uploadDate') {
      av = a.resultSheet?.uploadedAt || ''
      bv = b.resultSheet?.uploadedAt || ''
    }

    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1

    if (typeof av === 'string' && typeof bv === 'string') {
      return av.localeCompare(bv, undefined, { sensitivity: 'base' }) * dir
    }

    if (av < bv) return -1 * dir
    if (av > bv) return 1 * dir
    return 0
  })

  return list
}

export function inferOmrFileType(fileName = '') {
  const ext = String(fileName).split('.').pop()?.toLowerCase()
  if (ext === 'xlsx') return 'xlsx'
  if (ext === 'csv') return 'csv'
  if (ext === 'pdf') return 'pdf'
  return ext || 'unknown'
}

export function validateOmrExamForm(form) {
  const errors = {}
  if (!String(form.examName || '').trim()) errors.examName = 'Exam name is required'
  if (!form.examDate) errors.examDate = 'Exam date is required'
  if (!form.status) errors.status = 'Status is required'
  return errors
}
