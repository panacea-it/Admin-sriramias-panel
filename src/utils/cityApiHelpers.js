export function mapCityStatusFilterToApi(statusFilter) {
  if (statusFilter === 'Active') return 'ACTIVE'
  if (statusFilter === 'Inactive') return 'INACTIVE'
  return undefined
}

export function mapApiCityStatusToUi(status) {
  const raw = String(status || 'ACTIVE').toUpperCase().replace(/\s+/g, '_')
  if (raw === 'INACTIVE' || raw === 'IN_ACTIVE' || raw === 'DISABLED') return 'Inactive'
  return 'Active'
}

export function mapUiCityStatusToApi(status) {
  const raw = String(status || 'Active').toUpperCase().replace(/\s+/g, '_')
  if (raw === 'INACTIVE' || raw === 'IN_ACTIVE' || raw === 'IN ACTIVE') return 'INACTIVE'
  return 'ACTIVE'
}

/** Format ISO date as "26 May 2026, 09:06 PM" */
export function formatCityDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'

  const date = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const time = d
    .toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .replace(/\s(am|pm)$/i, (_, meridiem) => ` ${meridiem.toUpperCase()}`)

  return `${date}, ${time}`
}

function resolveCenterId(row) {
  if (row?.centerId) return String(row.centerId)
  if (row?.center && typeof row.center === 'object') {
    return String(row.center._id ?? row.center.id ?? row.center.centerId ?? '')
  }
  return ''
}

function resolveCenterName(row) {
  if (typeof row?.centerName === 'string') return row.centerName.trim()
  if (row?.center && typeof row.center === 'object') {
    return String(row.center.centerName ?? row.center.name ?? '').trim()
  }
  return ''
}

export function mapApiCityToLocal(data) {
  const row =
    data?.data?.city ??
    data?.data ??
    data?.city ??
    (data && typeof data === 'object' && !Array.isArray(data) ? data : null)

  if (!row || typeof row !== 'object') return null

  const id = row._id ?? row.id ?? row.cityId
  if (!id) return null

  return {
    id: String(id),
    code: String(row.cityCode ?? row.code ?? '').trim(),
    centerId: resolveCenterId(row),
    centerName: resolveCenterName(row),
    placeName: String(row.cityAddress ?? row.placeName ?? '').trim(),
    status: mapApiCityStatusToUi(row.status),
    createdAt: row.createdAt || row.createdOn || null,
    modifiedAt: row.updatedAt || row.modifiedAt || row.createdAt || null,
  }
}

export function normalizeCitiesListResponse(data, { page = 1, limit = 10 } = {}) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === 'object' ? data.data : data
  const itemsRaw =
    payload?.cities ??
    payload?.items ??
    payload?.results ??
    data?.cities ??
    (Array.isArray(payload) ? payload : Array.isArray(data?.data) ? data.data : [])

  const items = (Array.isArray(itemsRaw) ? itemsRaw : [])
    .map((row) => mapApiCityToLocal(row))
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

export function buildCreateCityPayload({ centerId, placeName, code }) {
  const normalizedCode = String(code || '')
    .trim()
    .toUpperCase()
  return {
    centerId: String(centerId || '').trim(),
    cityAddress: String(placeName || '').trim(),
    cityCode: normalizedCode,
    status: 'ACTIVE',
  }
}

export function buildUpdateCityPayload({ placeName, status, code }) {
  const normalizedCode = String(code || '')
    .trim()
    .toUpperCase()
  return {
    cityAddress: String(placeName || '').trim(),
    cityCode: normalizedCode,
    status: mapUiCityStatusToApi(status),
  }
}
