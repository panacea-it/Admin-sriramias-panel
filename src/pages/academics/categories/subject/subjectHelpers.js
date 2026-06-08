import { mapApiStatusToUi, mapUiStatusToApi } from '../../../../utils/programHelpers'

export function mapSubjectStatusFilterToApi(statusFilter) {
  if (statusFilter === 'Active') return 'ACTIVE'
  if (statusFilter === 'In Active') return 'INACTIVE'
  return undefined
}

export function buildSubjectApiPayload(form) {
  return {
    subjectName: String(form.name || '').trim(),
    description: String(form.description || '').trim(),
    status: mapUiStatusToApi(form.status),
  }
}

function formatDisplayId(row, fallbackId) {
  const raw = row?.subjectId ?? row?.code ?? row?.displayId ?? fallbackId
  if (raw == null || raw === '') return '—'
  const num = parseInt(String(raw).replace(/\D/g, ''), 10)
  if (!Number.isNaN(num) && num > 0) return String(num).padStart(3, '0')
  return String(raw)
}

export function mapApiSubjectToLocal(data) {
  const row =
    data?.data?.subject ??
    data?.data ??
    data?.subject ??
    (data && typeof data === 'object' && !Array.isArray(data) ? data : null)

  if (!row || typeof row !== 'object') return null

  const id = row._id ?? row.id ?? row.subjectId
  if (!id) return null

  return {
    id: String(id),
    subjectId: row.subjectId != null ? String(row.subjectId) : formatDisplayId(row, id),
    displayId: formatDisplayId(row, id),
    name: String(row.subjectName || row.name || '').trim(),
    description: String(row.description || '').trim(),
    status: mapApiStatusToUi(row.status),
    createdAt: row.createdAt || row.createdOn || null,
    modifiedAt: row.updatedAt || row.modifiedAt || row.createdAt || null,
  }
}

export function normalizeSubjectsListResponse(data, { page = 1, limit = 10 } = {}) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === 'object' ? data.data : data
  const itemsRaw =
    payload?.subjects ??
    payload?.items ??
    payload?.results ??
    data?.subjects ??
    (Array.isArray(payload) ? payload : Array.isArray(data?.data) ? data.data : [])

  const items = (Array.isArray(itemsRaw) ? itemsRaw : [])
    .map((row) => mapApiSubjectToLocal(row))
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

export function normalizeSubjectsDropdownResponse(data) {
  const list = Array.isArray(data)
    ? data
    : data?.data?.subjects ??
      data?.data ??
      data?.subjects ??
      data?.items ??
      []

  return (Array.isArray(list) ? list : [])
    .map((row) => {
      if (typeof row === 'string') {
        return { value: row, label: row }
      }
      const value = String(row._id ?? row.id ?? row.subjectId ?? row.value ?? '')
      const label = String(row.subjectName ?? row.name ?? row.label ?? value)
      if (!value) return null
      return { value, label }
    })
    .filter(Boolean)
}
