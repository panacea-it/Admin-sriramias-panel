/** @typedef {'ACTIVE' | 'INACTIVE'} RoleStatus */

/**
 * @typedef {Object} RoleListParams
 * @property {number} [page]
 * @property {number} [limit]
 * @property {string} [search]
 * @property {'ALL' | 'ACTIVE' | 'INACTIVE'} [status]
 * @property {'createdAt' | 'roleTitle' | 'roleCode' | 'status'} [sortBy]
 * @property {'asc' | 'desc'} [sortOrder]
 */

export const ROLE_ACCESS_STATUS_OPTIONS = [
  { value: 'all', label: 'All status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

export const ROLE_ACCESS_SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'roleTitle:asc', label: 'Title A–Z' },
  { value: 'roleTitle:desc', label: 'Title Z–A' },
  { value: 'roleCode:asc', label: 'Code A–Z' },
  { value: 'roleCode:desc', label: 'Code Z–A' },
  { value: 'status:asc', label: 'Status A–Z' },
  { value: 'status:desc', label: 'Status Z–A' },
]

const SORTABLE_COLUMNS = new Set(['createdAt', 'roleTitle', 'roleCode', 'status'])

export function mapStatusFilterToApi(statusFilter) {
  const value = String(statusFilter || '').trim()
  if (value === 'ACTIVE' || value === 'INACTIVE') return value
  return 'ALL'
}

export function parseSortPreset(preset) {
  const [rawBy, rawOrder] = String(preset || 'createdAt:desc').split(':')
  const sortBy = SORTABLE_COLUMNS.has(rawBy) ? rawBy : 'createdAt'
  const sortOrder = rawOrder === 'asc' ? 'asc' : 'desc'
  return { sortBy, sortOrder }
}

export function buildRoleListParams({
  page = 1,
  limit = 10,
  search = '',
  statusFilter = 'all',
  sortPreset = 'createdAt:desc',
}) {
  const { sortBy, sortOrder } = parseSortPreset(sortPreset)
  /** @type {RoleListParams} */
  const params = {
    page,
    limit,
    sortBy,
    sortOrder,
    status: mapStatusFilterToApi(statusFilter),
  }

  const trimmed = String(search || '').trim()
  if (trimmed) params.search = trimmed

  return params
}

export function mapRoleRecordToRow(record) {
  if (!record || typeof record !== 'object') return null

  const id = String(record._id || record.id || '').trim()
  if (!id) return null

  const status = String(record.status || 'ACTIVE').toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'

  return {
    id,
    title: String(record.roleTitle || '').trim(),
    label: String(record.roleTitle || '').trim(),
    code: String(record.roleCode || '').trim(),
    roleCode: String(record.roleCode || '').trim(),
    status,
    enabled: status === 'ACTIVE',
    createdBy: record.createdBy ?? null,
    createdAt: record.createdAt || null,
    updatedAt: record.updatedAt || null,
  }
}

export function normalizeRoleListResponse(data, { page = 1, limit = 10 } = {}) {
  const items = (Array.isArray(data?.data) ? data.data : [])
    .map((row) => mapRoleRecordToRow(row))
    .filter(Boolean)

  const total = data?.total ?? items.length
  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(total / limit) || 1)
  const currentPage = data?.page ?? page

  return {
    items,
    total,
    totalPages,
    page: currentPage,
    limit: data?.limit ?? limit,
    count: data?.count ?? items.length,
  }
}

export function unwrapRoleDetail(data) {
  return data?.data ?? data
}

export function mapRolesDropdownResponse(data) {
  const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []

  return list
    .map((item) => ({
      value: String(item._id || item.id || '').trim(),
      label: String(item.roleTitle || item.label || '').trim(),
      roleCode: String(item.roleCode || '').trim(),
    }))
    .filter((opt) => opt.value && opt.label)
}

export function mapJoiErrorsToRoleForm(errorPayload) {
  const list = errorPayload?.error?.errors || errorPayload?.errors
  if (!Array.isArray(list)) return {}

  return list.reduce((acc, item) => {
    const field = item?.field
    if (field && item?.message) {
      acc[field] = item.message
    }
    return acc
  }, {})
}

export function buildCreateRolePayload({ roleTitle, roleCode, status }) {
  const payload = {
    roleTitle: String(roleTitle || '').trim(),
    roleCode: String(roleCode || '').trim().toUpperCase(),
  }
  if (status === 'ACTIVE' || status === 'INACTIVE') {
    payload.status = status
  }
  return payload
}

export function buildUpdateRolePayload({ roleTitle, roleCode, status }) {
  /** @type {Record<string, string>} */
  const payload = {}

  if (roleTitle !== undefined) {
    payload.roleTitle = String(roleTitle || '').trim()
  }
  if (roleCode !== undefined) {
    payload.roleCode = String(roleCode || '').trim().toUpperCase()
  }
  if (status === 'ACTIVE' || status === 'INACTIVE') {
    payload.status = status
  }

  return payload
}
