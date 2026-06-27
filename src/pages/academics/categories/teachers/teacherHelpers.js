import { mapApiStatusToUi, mapUiStatusToApi } from '../../../../utils/programHelpers'

export function mapTeacherStatusFilterToApi(statusFilter) {
  if (statusFilter === 'Active') return 'ACTIVE'
  if (statusFilter === 'In Active') return 'INACTIVE'
  return undefined
}

export function buildCreateTeacherPayload(form) {
  const subjectIds = Array.isArray(form.subjectIds)
    ? form.subjectIds.filter(Boolean)
    : form.subjectId
      ? [String(form.subjectId).trim()]
      : []

  return {
    centerId: String(form.centerId || '').trim(),
    teacherName: String(form.name || '').trim(),
    subjects: subjectIds,
    description: String(form.description || '').trim(),
    status: mapUiStatusToApi(form.status),
  }
}

export function buildUpdateTeacherPayload(form) {
  const subjectIds = Array.isArray(form.subjectIds)
    ? form.subjectIds.filter(Boolean)
    : form.subjectId
      ? [String(form.subjectId).trim()]
      : []

  return {
    centerId: String(form.centerId || '').trim(),
    teacherName: String(form.name || '').trim(),
    subjects: subjectIds,
    description: String(form.description || '').trim(),
    status: mapUiStatusToApi(form.status),
  }
}

function formatDisplayId(row, fallbackId) {
  const raw = row?.teacherId ?? row?.code ?? row?.displayId ?? fallbackId
  if (raw == null || raw === '') return '—'
  const num = parseInt(String(raw).replace(/\D/g, ''), 10)
  if (!Number.isNaN(num) && num > 0) return String(num).padStart(3, '0')
  return String(raw)
}

function resolveCenterLabel(row) {
  if (typeof row?.centerName === 'string' && row.centerName.trim()) return row.centerName.trim()
  if (row?.center && typeof row.center === 'object') {
    return String(row.center.centerName ?? row.center.name ?? '').trim()
  }
  return String(row?.centreName ?? '').trim()
}

function resolveCenterId(row) {
  if (row?.centerId) return String(row.centerId)
  if (row?.center && typeof row.center === 'object') {
    return String(row.center._id ?? row.center.id ?? row.center.centerId ?? '')
  }
  return ''
}

function resolveSubjectIds(row) {
  const raw = row?.subjects ?? row?.subjectIds ?? row?.subject ?? []
  if (!Array.isArray(raw)) {
    if (typeof raw === 'string' && raw) return [raw]
    if (raw && typeof raw === 'object') {
      return [String(raw._id ?? raw.id ?? raw.subjectId ?? '')].filter(Boolean)
    }
    return []
  }
  return raw
    .map((item) => {
      if (item == null) return ''
      if (typeof item === 'string') return item
      return String(item._id ?? item.id ?? item.subjectId ?? '')
    })
    .filter(Boolean)
}

function resolveSubjectLabel(row) {
  const raw = row?.subjects ?? row?.subject ?? []
  if (typeof row?.subject === 'string') return row.subject
  if (!Array.isArray(raw)) {
    if (raw && typeof raw === 'object') {
      return String(raw.subjectName ?? raw.name ?? '').trim()
    }
    return String(row?.subjectName ?? '').trim()
  }
  const labels = raw
    .map((item) => {
      if (item == null) return ''
      if (typeof item === 'string') return item
      return String(item.subjectName ?? item.name ?? '').trim()
    })
    .filter(Boolean)
  return labels.join(', ')
}

function rawSubjectNames(row) {
  const raw = row?.subjects ?? row?.subject ?? []
  if (!Array.isArray(raw)) {
    if (raw && typeof raw === 'object') {
      const label = String(raw.subjectName ?? raw.name ?? '').trim()
      return label ? [label] : []
    }
    if (typeof raw === 'string' && raw) return [raw]
    return []
  }
  return raw
    .map((item) => {
      if (item == null) return ''
      if (typeof item === 'string') return item
      return String(item.subjectName ?? item.name ?? '').trim()
    })
    .filter(Boolean)
}

export function mapApiTeacherToLocal(data) {
  const row =
    data?.data?.teacher ??
    data?.data ??
    data?.teacher ??
    (data && typeof data === 'object' && !Array.isArray(data) ? data : null)

  if (!row || typeof row !== 'object') return null

  const id = row._id ?? row.id ?? row.teacherId
  if (!id) return null

  const subjectIds = resolveSubjectIds(row)
  const subjectLabel = resolveSubjectLabel(row)
  const subjectNames = rawSubjectNames(row)

  return {
    id: String(id),
    teacherId: row.teacherId != null ? String(row.teacherId) : formatDisplayId(row, id),
    displayId: formatDisplayId(row, id),
    name: String(row.teacherName ?? row.name ?? '').trim(),
    description: String(row.description || '').trim(),
    subject: subjectLabel,
    subjectNames,
    subjectId: subjectIds[0] || '',
    subjectIds,
    centerId: resolveCenterId(row),
    centerName: resolveCenterLabel(row),
    status: mapApiStatusToUi(row.status),
    createdAt: row.createdAt || row.createdOn || null,
    modifiedAt: row.updatedAt || row.modifiedAt || row.createdAt || null,
  }
}

export function normalizeTeachersListResponse(data, { page = 1, limit = 10 } = {}) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === 'object' ? data.data : data
  const itemsRaw =
    payload?.teachers ??
    payload?.items ??
    payload?.results ??
    data?.teachers ??
    (Array.isArray(payload) ? payload : Array.isArray(data?.data) ? data.data : [])

  const items = (Array.isArray(itemsRaw) ? itemsRaw : [])
    .map((row) => mapApiTeacherToLocal(row))
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
