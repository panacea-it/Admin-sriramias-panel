export function mapClassroomStatusFilterToApi(statusFilter) {
  if (statusFilter === 'Active') return 'ACTIVE'
  if (statusFilter === 'Deactivated') return 'INACTIVE'
  return undefined
}

export function mapApiClassroomStatusToUi(status) {
  const raw = String(status || 'ACTIVE').toUpperCase().replace(/\s+/g, '_')
  if (raw === 'INACTIVE' || raw === 'IN_ACTIVE' || raw === 'DISABLED') return 'Deactivated'
  return 'Active'
}

export function mapUiClassroomStatusToApi(status) {
  const raw = String(status || 'Active').toUpperCase().replace(/\s+/g, '_')
  if (raw === 'INACTIVE' || raw === 'IN_ACTIVE' || raw === 'IN ACTIVE') return 'INACTIVE'
  return 'ACTIVE'
}

/** Format ISO date as "26 May 2026, 09:06 PM" */
export function formatClassroomDateTime(iso) {
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
  if (typeof row?.center === 'string') return String(row.center)
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

function resolveCityId(row) {
  if (row?.cityId) return String(row.cityId)
  if (typeof row?.city === 'string') return String(row.city)
  if (row?.city && typeof row.city === 'object') {
    return String(row.city._id ?? row.city.id ?? row.city.cityId ?? '')
  }
  return ''
}

function resolveCityName(row) {
  if (typeof row?.cityAddress === 'string') return row.cityAddress.trim()
  if (row?.city && typeof row.city === 'object') {
    return String(row.city.cityAddress ?? row.city.placeName ?? row.city.name ?? '').trim()
  }
  return ''
}

export function mapApiClassroomToLocal(data) {
  const row =
    data?.data?.classroom ??
    data?.data ??
    data?.classroom ??
    (data && typeof data === 'object' && !Array.isArray(data) ? data : null)

  if (!row || typeof row !== 'object') return null

  const id = row._id ?? row.id ?? row.classroomId
  if (!id) return null

  return {
    id: String(id),
    code: String(row.classroomCode ?? row.code ?? '').trim(),
    name: String(row.classroomName ?? row.name ?? '').trim(),
    centerId: resolveCenterId(row),
    centerName: resolveCenterName(row),
    cityPlaceId: resolveCityId(row),
    placeName: resolveCityName(row),
    capacity: row.capacity != null && row.capacity !== '' ? Number(row.capacity) : null,
    status: mapApiClassroomStatusToUi(row.status),
    description: String(row.description ?? '').trim(),
    color: row.color || '#246392',
    createdAt: row.createdAt || row.createdOn || null,
    modifiedAt: row.updatedAt || row.modifiedAt || row.createdAt || null,
  }
}

export function normalizeClassroomsListResponse(data, { page = 1, limit = 10 } = {}) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === 'object' ? data.data : data
  const itemsRaw =
    payload?.classrooms ??
    payload?.items ??
    payload?.results ??
    data?.classrooms ??
    (Array.isArray(payload) ? payload : Array.isArray(data?.data) ? data.data : [])

  const items = (Array.isArray(itemsRaw) ? itemsRaw : [])
    .map((row) => mapApiClassroomToLocal(row))
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

export function normalizeCentersDropdown(data) {
  const list = Array.isArray(data)
    ? data
    : data?.data || data?.centers || data?.items || []

  return (Array.isArray(list) ? list : [])
    .map((item) => ({
      label: item.label || item.centerName || String(item.name || ''),
      value: String(item.value || item._id || item.id || item.centerId || ''),
    }))
    .filter((opt) => opt.label && opt.value)
}

export function normalizeCitiesByCenter(data) {
  const list = Array.isArray(data)
    ? data
    : data?.data || data?.cities || data?.items || []

  return (Array.isArray(list) ? list : [])
    .map((item) => ({
      label: item.label || item.cityAddress || String(item.placeName || ''),
      value: String(item.value || item._id || item.id || item.cityId || ''),
    }))
    .filter((opt) => opt.label && opt.value)
}

export function buildCreateClassroomPayload(form) {
  return {
    center: String(form.centerId || '').trim(),
    city: String(form.cityPlaceId || '').trim(),
    classroomName: String(form.name || '').trim(),
    classroomCode: String(form.code || '').trim(),
    capacity: Number(form.capacity),
    status: mapUiClassroomStatusToApi(form.status),
  }
}

export function buildUpdateClassroomPayload(form) {
  return buildCreateClassroomPayload(form)
}
