export function mapCityStatusFilterToApi(statusFilter) {
  if (statusFilter === 'Active') return 'ACTIVE'
  if (statusFilter === 'In Active' || statusFilter === 'Deactivated') return 'INACTIVE'
  return undefined
}

export function mapApiCityStatusToUi(status) {
  const raw = String(status || 'ACTIVE').toUpperCase().replace(/\s+/g, '_')
  if (raw === 'INACTIVE' || raw === 'IN_ACTIVE' || raw === 'DISABLED') return 'In Active'
  return 'Active'
}

export function mapUiCityStatusToApi(status) {
  const raw = String(status || 'Active').toUpperCase().replace(/\s+/g, '_')
  if (raw === 'INACTIVE' || raw === 'IN_ACTIVE' || raw === 'IN ACTIVE' || raw === 'DEACTIVATED') {
    return 'INACTIVE'
  }
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

function unwrapCityRecord(data) {
  const row =
    data?.data?.city ??
    data?.data ??
    data?.city ??
    (data && typeof data === 'object' && !Array.isArray(data) ? data : null)

  if (!row || typeof row !== 'object') return null

  const base = row._doc && typeof row._doc === 'object' ? { ...row._doc, ...row } : row
  if (base.city && typeof base.city === 'object' && !Array.isArray(base.city)) {
    return {
      ...base.city,
      _id: base._id ?? base.city._id ?? base.city.id,
      id: base.id ?? base.city.id,
      center: base.center ?? base.city.center,
      centerId: base.centerId ?? base.city.centerId,
      centerName: base.centerName ?? base.city.centerName,
    }
  }

  return base
}

export function mapApiCityToLocal(data) {
  const row = unwrapCityRecord(data)
  if (!row) return null

  const id = row._id ?? row.id
  if (!id) return null

  const cityAddress = String(row.cityAddress ?? row.placeName ?? row.address ?? '').trim()

  return {
    id: String(id),
    centerId: resolveCenterId(row),
    centerName: resolveCenterName(row),
    cityAddress,
    placeName: cityAddress,
    status: mapApiCityStatusToUi(row.status),
    createdAt: row.createdAt || row.createdOn || null,
    updatedAt: row.updatedAt || row.modifiedAt || row.createdAt || null,
    modifiedAt: row.updatedAt || row.modifiedAt || row.createdAt || null,
  }
}

export function normalizeCitiesListResponse(data, { page = 1, limit = 10 } = {}) {
  const itemsRaw = Array.isArray(data?.data) ? data.data : []

  const items = itemsRaw.map((row) => mapApiCityToLocal(row)).filter(Boolean)

  const total = data?.total ?? items.length
  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(total / limit) || 1)
  const currentPage = data?.page ?? page

  return {
    items,
    total,
    totalPages,
    page: currentPage,
    count: data?.count ?? items.length,
    limit: data?.limit ?? limit,
  }
}

export function normalizeCitiesByCenterDropdown(data) {
  const list = Array.isArray(data) ? data : data?.data || []

  return (Array.isArray(list) ? list : [])
    .map((item) => ({
      label: item.cityAddress || item.cityName || item.placeName || '',
      value: String(item._id || item.id || ''),
      centerId: String(item.centerId || ''),
    }))
    .filter((opt) => opt.label && opt.value)
}

export function buildCreateCityPayload({ centerId, cityAddress, placeName, status }) {
  const payload = {
    centerId: String(centerId || '').trim(),
    cityAddress: String(cityAddress ?? placeName ?? '').trim(),
  }

  const apiStatus = mapUiCityStatusToApi(status)
  if (apiStatus) payload.status = apiStatus

  return payload
}

export function buildUpdateCityPayload({ centerId, cityAddress, placeName, status }) {
  /** @type {import('../types/city.types').UpdateCityPayload} */
  const payload = {}

  if (centerId != null && String(centerId).trim()) {
    payload.centerId = String(centerId).trim()
  }

  const address = cityAddress ?? placeName
  if (address != null && String(address).trim()) {
    payload.cityAddress = String(address).trim()
  }

  if (status != null && String(status).trim()) {
    payload.status = mapUiCityStatusToApi(status)
  }

  return payload
}

export function mergeCityWithSource(source, detail) {
  if (!detail) return source
  return { ...source, ...detail }
}
