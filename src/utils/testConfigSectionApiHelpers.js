export const TEST_CONFIG_SECTION_SORT_OPTIONS = [
  { value: 'createdOn_newest', label: 'Created On (Newest)' },
  { value: 'createdOn_oldest', label: 'Created On (Oldest)' },
  { value: 'modifiedOn_newest', label: 'Modified On (Newest)' },
  { value: 'modifiedOn_oldest', label: 'Modified On (Oldest)' },
  { value: 'sectionName_az', label: 'Section Name (A–Z)' },
  { value: 'sectionName_za', label: 'Section Name (Z–A)' },
]

export function mapTestConfigSectionStatusFilterToApi(statusFilter) {
  if (statusFilter === 'Active') return 'ACTIVE'
  if (statusFilter === 'Deactivated') return 'INACTIVE'
  return undefined
}

export function mapApiTestConfigSectionStatusToUi(status) {
  const raw = String(status || 'ACTIVE').toUpperCase().replace(/\s+/g, '_')
  if (raw === 'INACTIVE' || raw === 'IN_ACTIVE' || raw === 'DISABLED') return 'Deactivated'
  return 'Active'
}

export function mapUiTestConfigSectionStatusToApi(status) {
  const raw = String(status || 'Active').toUpperCase().replace(/\s+/g, '_')
  if (raw === 'INACTIVE' || raw === 'IN_ACTIVE' || raw === 'IN ACTIVE') return 'INACTIVE'
  return 'ACTIVE'
}

function friendlyDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function resolveDisplayDate(isoValue, dateOnlyValue) {
  if (dateOnlyValue) {
    const parsed = new Date(dateOnlyValue)
    if (!Number.isNaN(parsed.getTime())) {
      return friendlyDate(parsed)
    }
    return String(dateOnlyValue)
  }
  return isoValue ? friendlyDate(isoValue) : '—'
}

export function mapApiTestConfigSectionToLocal(data) {
  const row =
    data?.data?.section ??
    data?.data ??
    data?.section ??
    (data && typeof data === 'object' && !Array.isArray(data) ? data : null)

  if (!row || typeof row !== 'object') return null

  const mongoId = row._id ?? row.id
  const sectionId = row.sectionId ?? ''
  if (!mongoId && !sectionId) return null

  const createdAt = row.createdAt || row.createdOn || null
  const updatedAt = row.updatedAt || row.modifiedAt || row.modifiedOn || null

  return {
    id: String(mongoId ?? sectionId),
    sectionId: String(sectionId || mongoId),
    sectionName: String(row.sectionName ?? row.configurationName ?? '').trim(),
    status: mapApiTestConfigSectionStatusToUi(row.status),
    createdAt,
    updatedAt,
    createdOn: resolveDisplayDate(createdAt, row.createdOn),
    modifiedOn: resolveDisplayDate(updatedAt || createdAt, row.modifiedOn),
  }
}

export function normalizeTestConfigSectionsListResponse(data, { page = 1, limit = 10 } = {}) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === 'object' ? data.data : data
  const itemsRaw =
    payload?.sections ??
    payload?.items ??
    payload?.results ??
    data?.sections ??
    (Array.isArray(payload) ? payload : Array.isArray(data?.data) ? data.data : [])

  const items = (Array.isArray(itemsRaw) ? itemsRaw : [])
    .map((row) => mapApiTestConfigSectionToLocal(row))
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

export function normalizeTestConfigSectionsDropdownResponse(data) {
  const payload = data?.data ?? data
  const itemsRaw = payload?.sections ?? payload?.items ?? (Array.isArray(payload) ? payload : [])

  return (Array.isArray(itemsRaw) ? itemsRaw : [])
    .map((row) => mapApiTestConfigSectionToLocal(row))
    .filter(Boolean)
}

export function buildCreateTestConfigSectionPayload({ sectionName, status }) {
  return {
    sectionName: String(sectionName || '').trim(),
    status: mapUiTestConfigSectionStatusToApi(status),
  }
}

export function buildUpdateTestConfigSectionPayload({ sectionName, status }) {
  return buildCreateTestConfigSectionPayload({ sectionName, status })
}
