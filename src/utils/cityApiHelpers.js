import { buildPlaceholderCityCode, getCachedCityCode } from './cityCodeCache'

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

function looksLikeMongoId(value) {
  return /^[a-f0-9]{24}$/i.test(String(value || '').trim())
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

function formatCityCodeFromId(row) {
  const raw = row?.cityId ?? row?.displayId ?? row?.serialNumber
  if (raw == null || raw === '') return ''
  const str = String(raw).trim()
  if (looksLikeMongoId(str)) return ''
  if (/^CTY/i.test(str)) return str.toUpperCase()
  if (/^[A-Z0-9-]+$/i.test(str) && /[A-Z]/i.test(str) && /\d/.test(str)) return str.toUpperCase()
  if (/^\d+$/.test(str)) {
    const num = parseInt(str, 10)
    if (!Number.isNaN(num) && num > 0) return `CTY${String(num).padStart(3, '0')}`
  }
  return ''
}

export function resolveCityCode(row) {
  if (!row || typeof row !== 'object') return ''

  const candidates = [
    row.cityCode,
    row.code,
    row.city_code,
    row.city_id,
    row.branchCode,
    row.placeCode,
    row.city?.cityCode,
    row.city?.code,
    row.city?.city_code,
  ]

  for (const raw of candidates) {
    const value = String(raw ?? '').trim()
    if (!value || looksLikeMongoId(value)) continue
    return value.toUpperCase()
  }

  const businessId = String(row.cityId ?? '').trim()
  if (businessId && !looksLikeMongoId(businessId)) {
    return businessId.toUpperCase()
  }

  return formatCityCodeFromId(row)
}

export function getCityDisplayCode(city) {
  if (!city || typeof city !== 'object') return ''
  const resolved = resolveCityCode(city)
  if (resolved) return resolved
  const stored = String(city.code ?? city.cityCode ?? '').trim()
  if (stored && !looksLikeMongoId(stored)) return stored.toUpperCase()
  return getCachedCityCode(city)
}

export function mergeCityWithSource(source, detail) {
  if (!detail) return applyCityCodeFields(source)
  const code =
    getCityDisplayCode(detail) ||
    getCityDisplayCode(source) ||
    getCachedCityCode(source) ||
    getCachedCityCode(detail)
  return applyCityCodeFields({
    ...source,
    ...detail,
    code,
    cityCode: code,
  })
}

function applyCityCodeFields(city) {
  if (!city || typeof city !== 'object') return city
  const code = getCityDisplayCode(city) || getCachedCityCode(city)
  if (!code) return city
  return { ...city, code, cityCode: code }
}

export function mapApiCityToLocal(data) {
  const row = unwrapCityRecord(data)
  if (!row) return null

  const id = row._id ?? row.id ?? row.cityId
  if (!id) return null

  const code = resolveCityCode(row)
  const localId = String(row._id ?? row.id ?? id)
  const placeName = String(row.cityAddress ?? row.placeName ?? row.address ?? '').trim()
  const resolvedCode =
    code ||
    getCachedCityCode({
      id: localId,
      centerId: resolveCenterId(row),
      placeName,
    })

  return {
    id: localId,
    code: resolvedCode,
    cityCode: resolvedCode,
    centerId: resolveCenterId(row),
    centerName: resolveCenterName(row),
    placeName,
    status: mapApiCityStatusToUi(row.status),
    createdAt: row.createdAt || row.createdOn || null,
    modifiedAt: row.updatedAt || row.modifiedAt || row.createdAt || null,
  }
}

export async function enrichCitiesWithMissingCodes(items, _fetchCityById, options = {}) {
  return applyCityCodesToList(items, options)
}

export function applyCityCodesToList(items, { page = 1, limit = 10 } = {}) {
  if (!Array.isArray(items) || !items.length) {
    return items
  }

  return items.map((item, index) => {
    const existingCode = resolveCityCode(item)
    if (existingCode) return { ...item, code: existingCode, cityCode: existingCode }

    const cachedCode = getCachedCityCode(item)
    if (cachedCode) return { ...item, code: cachedCode, cityCode: cachedCode }

    const placeholderCode = buildPlaceholderCityCode((page - 1) * limit + index + 1)
    return { ...item, code: placeholderCode, cityCode: placeholderCode }
  })
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
