export const TEST_CONFIG_LANGUAGE_SORT_OPTIONS = [
  { value: 'createdOn_newest', label: 'Created On (Newest)' },
  { value: 'createdOn_oldest', label: 'Created On (Oldest)' },
  { value: 'modifiedOn_newest', label: 'Modified On (Newest)' },
  { value: 'modifiedOn_oldest', label: 'Modified On (Oldest)' },
  { value: 'languageName_az', label: 'Language Name (A–Z)' },
  { value: 'languageName_za', label: 'Language Name (Z–A)' },
]

export function mapTestConfigLanguageStatusFilterToApi(statusFilter) {
  if (statusFilter === 'Active') return 'ACTIVE'
  if (statusFilter === 'Deactivated') return 'INACTIVE'
  return undefined
}

export function mapApiTestConfigLanguageStatusToUi(status) {
  const raw = String(status || 'ACTIVE').toUpperCase().replace(/\s+/g, '_')
  if (raw === 'INACTIVE' || raw === 'IN_ACTIVE' || raw === 'DISABLED') return 'Deactivated'
  return 'Active'
}

export function mapUiTestConfigLanguageStatusToApi(status) {
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

export function mapApiTestConfigLanguageToLocal(data) {
  const row =
    data?.data?.language ??
    data?.data ??
    data?.language ??
    (data && typeof data === 'object' && !Array.isArray(data) ? data : null)

  if (!row || typeof row !== 'object') return null

  const mongoId = row._id ?? row.id
  const languageId = row.languageId ?? ''
  if (!mongoId && !languageId) return null

  const createdAt = row.createdAt || row.createdOn || null
  const updatedAt = row.updatedAt || row.modifiedAt || row.modifiedOn || null

  return {
    id: String(mongoId ?? languageId),
    languageId: String(languageId || mongoId),
    languageName: String(row.languageName ?? row.language ?? row.name ?? '').trim(),
    status: mapApiTestConfigLanguageStatusToUi(row.status),
    createdAt,
    updatedAt,
    createdOn: resolveDisplayDate(createdAt, row.createdOn),
    modifiedOn: resolveDisplayDate(updatedAt || createdAt, row.modifiedOn),
  }
}

export function normalizeTestConfigLanguagesListResponse(data, { page = 1, limit = 10 } = {}) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === 'object' ? data.data : data
  const itemsRaw =
    payload?.languages ??
    payload?.items ??
    payload?.results ??
    data?.languages ??
    (Array.isArray(payload) ? payload : Array.isArray(data?.data) ? data.data : [])

  const items = (Array.isArray(itemsRaw) ? itemsRaw : [])
    .map((row) => mapApiTestConfigLanguageToLocal(row))
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

export function normalizeTestConfigLanguagesDropdownResponse(data) {
  const payload = data?.data ?? data
  const itemsRaw = payload?.languages ?? payload?.items ?? (Array.isArray(payload) ? payload : [])

  return (Array.isArray(itemsRaw) ? itemsRaw : [])
    .map((row) => mapApiTestConfigLanguageToLocal(row))
    .filter(Boolean)
}

export function buildCreateTestConfigLanguagePayload({ languageName, status }) {
  return {
    languageName: String(languageName || '').trim(),
    status: mapUiTestConfigLanguageStatusToApi(status),
  }
}

export function buildUpdateTestConfigLanguagePayload({ languageName, status }) {
  return buildCreateTestConfigLanguagePayload({ languageName, status })
}
