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

function looksLikeObjectId(value) {
  return /^[a-f0-9]{24}$/i.test(String(value || '').trim())
}

function looksLikeSubjectCode(value) {
  const s = String(value || '').trim()
  if (!s || looksLikeObjectId(s)) return false
  if (/^SUB[-_]?\d+$/i.test(s)) return true
  if (/^SUB[-_][A-Z0-9]+$/i.test(s)) return true
  if (/^[A-Z]{2,6}\d{2,}$/.test(s)) return true
  return false
}

function resolveSubjectLabel(row) {
  const explicitName = String(row?.subjectName ?? '').trim()
  if (explicitName && !looksLikeObjectId(explicitName) && !looksLikeSubjectCode(explicitName)) {
    return explicitName
  }

  if (row?.subject && typeof row.subject === 'object') {
    const name = String(row.subject.subjectName ?? row.subject.name ?? '').trim()
    if (name && !looksLikeObjectId(name) && !looksLikeSubjectCode(name)) return name
  }

  if (typeof row?.subject === 'string') {
    const label = row.subject.trim()
    if (label && !looksLikeObjectId(label) && !looksLikeSubjectCode(label)) return label
  }

  return ''
}

export function buildSubjectNameLookup(data) {
  const list = Array.isArray(data)
    ? data
    : data?.data?.subjects ??
      data?.data ??
      data?.subjects ??
      data?.items ??
      []

  const map = {}
  for (const row of Array.isArray(list) ? list : []) {
    if (typeof row === 'string') continue
    const name = String(row.subjectName ?? row.name ?? row.label ?? '').trim()
    if (!name || looksLikeSubjectCode(name)) continue

    const keys = [row._id, row.id, row.subjectId, row.value].filter(Boolean).map(String)
    for (const key of keys) {
      map[key] = name
    }
  }
  return map
}

export function resolveTopicSubjectDisplay(row, subjectNameById = {}) {
  const mapped = resolveSubjectLabel(row)
  if (mapped) return mapped

  const candidates = [
    row?.subjectId,
    resolveSubjectId(row),
    typeof row?.subject === 'string' ? row.subject : null,
  ]
    .filter(Boolean)
    .map(String)

  for (const id of candidates) {
    const name = subjectNameById[id]
    if (name) return name
  }

  return '—'
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
