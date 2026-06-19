export const EXAM_PATTERN_SORT_OPTIONS = [
  { value: 'createdOn_newest', label: 'Created On (Newest)' },
  { value: 'createdOn_oldest', label: 'Created On (Oldest)' },
  { value: 'modifiedOn_newest', label: 'Modified On (Newest)' },
  { value: 'modifiedOn_oldest', label: 'Modified On (Oldest)' },
]

export function mapExamPatternStatusFilterToApi(statusFilter) {
  if (statusFilter === 'Active') return 'ACTIVE'
  if (statusFilter === 'Deactivated') return 'INACTIVE'
  return undefined
}

export function mapApiExamPatternStatusToUi(status) {
  const raw = String(status || 'ACTIVE').toUpperCase().replace(/\s+/g, '_')
  if (raw === 'INACTIVE' || raw === 'IN_ACTIVE' || raw === 'DISABLED') return 'Deactivated'
  return 'Active'
}

export function mapUiExamPatternStatusToApi(status) {
  const raw = String(status || 'Active').toUpperCase().replace(/\s+/g, '_')
  if (raw === 'INACTIVE' || raw === 'IN_ACTIVE' || raw === 'IN ACTIVE') return 'INACTIVE'
  return 'ACTIVE'
}

/** Format ISO date as "01 Mar 2026, 09:06 PM" */
export function formatExamPatternDateTime(iso) {
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

export function mapApiExamPatternToLocal(data) {
  const row =
    data?.data?.examPattern ??
    data?.data ??
    data?.examPattern ??
    (data && typeof data === 'object' && !Array.isArray(data) ? data : null)

  if (!row || typeof row !== 'object') return null

  // API routes require MongoDB _id; instructionId is display-only (e.g. INS-1008).
  const mongoId = row._id ?? row.id
  const instructionId = row.instructionId ?? ''
  if (!mongoId && !instructionId) return null

  return {
    id: String(mongoId ?? instructionId),
    instructionId: String(instructionId || mongoId),
    instructionDescription: String(row.instructionDescription ?? row.instructions ?? '').trim(),
    status: mapApiExamPatternStatusToUi(row.status),
    createdAt: row.createdAt || row.createdOn || null,
    updatedAt: row.updatedAt || row.modifiedAt || row.modifiedOn || null,
  }
}

export function normalizeExamPatternsListResponse(data, { page = 1, limit = 10 } = {}) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === 'object' ? data.data : data
  const itemsRaw =
    payload?.examPatterns ??
    payload?.items ??
    payload?.results ??
    data?.examPatterns ??
    (Array.isArray(payload) ? payload : Array.isArray(data?.data) ? data.data : [])

  const items = (Array.isArray(itemsRaw) ? itemsRaw : [])
    .map((row) => mapApiExamPatternToLocal(row))
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

export function buildCreateExamPatternPayload({ instructionDescription, status }) {
  return {
    instructionDescription: String(instructionDescription || '').trim(),
    status: mapUiExamPatternStatusToApi(status),
  }
}

export function buildUpdateExamPatternPayload({ instructionDescription, status }) {
  return buildCreateExamPatternPayload({ instructionDescription, status })
}

export function normalizeExamPatternDropdownResponse(data) {
  const payload = data?.data ?? data
  const itemsRaw = payload?.items ?? payload?.examPatterns ?? (Array.isArray(payload) ? payload : [])

  return (Array.isArray(itemsRaw) ? itemsRaw : [])
    .map((row) => mapApiExamPatternToLocal(row))
    .filter(Boolean)
}
