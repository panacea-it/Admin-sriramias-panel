import { mapApiStatusToUi, mapUiStatusToApi } from '../../../../utils/programHelpers'

export function mapTopicStatusFilterToApi(statusFilter) {
  if (statusFilter === 'Active') return 'ACTIVE'
  if (statusFilter === 'In Active') return 'INACTIVE'
  return undefined
}

export function buildCreateTopicPayload(form) {
  return {
    subjectId: String(form.subjectId || '').trim(),
    topicName: String(form.name || '').trim(),
    description: String(form.description || '').trim(),
    status: mapUiStatusToApi(form.status),
  }
}

export function buildUpdateTopicPayload(form) {
  return {
    topicName: String(form.name || '').trim(),
    description: String(form.description || '').trim(),
    status: mapUiStatusToApi(form.status),
  }
}

function formatDisplayId(row, fallbackId) {
  const raw = row?.topicId ?? row?.code ?? row?.displayId ?? fallbackId
  if (raw == null || raw === '') return '—'
  const num = parseInt(String(raw).replace(/\D/g, ''), 10)
  if (!Number.isNaN(num) && num > 0) return String(num).padStart(3, '0')
  return String(raw)
}

function resolveSubjectLabel(row) {
  if (typeof row?.subject === 'string') return row.subject
  if (row?.subject && typeof row.subject === 'object') {
    return String(row.subject.subjectName ?? row.subject.name ?? '').trim()
  }
  return String(row?.subjectName ?? '').trim()
}

function resolveSubjectId(row) {
  if (row?.subjectId) return String(row.subjectId)
  if (row?.subject && typeof row.subject === 'object') {
    return String(row.subject._id ?? row.subject.id ?? '')
  }
  return ''
}

export function mapApiTopicToLocal(data) {
  const row =
    data?.data?.topic ??
    data?.data ??
    data?.topic ??
    (data && typeof data === 'object' && !Array.isArray(data) ? data : null)

  if (!row || typeof row !== 'object') return null

  const id = row._id ?? row.id ?? row.topicId
  if (!id) return null

  const subjectId = resolveSubjectId(row)
  const subjectLabel = resolveSubjectLabel(row)

  return {
    id: String(id),
    topicId: row.topicId != null ? String(row.topicId) : formatDisplayId(row, id),
    displayId: formatDisplayId(row, id),
    name: String(row.topicName ?? row.name ?? '').trim(),
    description: String(row.description || '').trim(),
    subject: subjectLabel,
    subjectId,
    status: mapApiStatusToUi(row.status),
    createdAt: row.createdAt || row.createdOn || null,
    modifiedAt: row.updatedAt || row.modifiedAt || row.createdAt || null,
  }
}

export function normalizeTopicsListResponse(data, { page = 1, limit = 10 } = {}) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === 'object' ? data.data : data
  const itemsRaw =
    payload?.topics ??
    payload?.items ??
    payload?.results ??
    data?.topics ??
    (Array.isArray(payload) ? payload : Array.isArray(data?.data) ? data.data : [])

  const items = (Array.isArray(itemsRaw) ? itemsRaw : [])
    .map((row) => mapApiTopicToLocal(row))
    .filter(Boolean)

  const pagination = payload?.pagination || data?.pagination || payload?.meta || data?.meta || {}
  const total =
    pagination.total ??
    payload?.total ??
    data?.total ??
    payload?.totalCount ??
    data?.totalCount ??
    items.length
  const totalPages =
    pagination.totalPages ??
    payload?.totalPages ??
    data?.totalPages ??
    Math.max(1, Math.ceil(total / limit) || 1)
  const currentPage = pagination.page ?? payload?.page ?? data?.page ?? page

  return {
    items,
    total,
    totalPages,
    page: currentPage,
  }
}
