import { isRecordStatusActive } from '../constants/recordStatus'

export const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/
export const OBJECT_ID_RE = /^[a-f0-9]{24}$/i

/**
 * @typedef {Object} AdminRecord
 * @property {string} _id
 * @property {string} fullName
 * @property {string} officialEmail
 * @property {string} contactNumber
 * @property {string} employeeId
 * @property {string} roleId
 * @property {string|null} roleTitle
 * @property {string|null} roleCode
 * @property {string} centerId
 * @property {string|null} centerName
 * @property {string|null} centerCode
 * @property {boolean} accountStatus
 * @property {'ACTIVE'|'INACTIVE'} status
 * @property {string|null} lastLoginAt
 * @property {string|null} createdBy
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} AdminListParams
 * @property {string} [search]
 * @property {string} [roleId]
 * @property {string} [centerId]
 * @property {number} [page]
 * @property {number} [limit]
 * @property {'createdAt'|'fullName'|'officialEmail'|'employeeId'} [sortBy]
 * @property {'asc'|'desc'} [sortOrder]
 */

/**
 * @typedef {Object} CreateAdminPayload
 * @property {string} fullName
 * @property {string} officialEmail
 * @property {string} contactNumber
 * @property {string} employeeId
 * @property {string} roleId
 * @property {string} centerId
 * @property {string} password
 * @property {string} confirmPassword
 */

/**
 * @typedef {Object} UpdateAdminPayload
 * @property {string} [fullName]
 * @property {string} [officialEmail]
 * @property {string} [contactNumber]
 * @property {string} [employeeId]
 * @property {string} [roleId]
 * @property {string} [centerId]
 * @property {string} [password]
 * @property {string} [confirmPassword]
 */

export const ADMIN_SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest first', sortBy: 'createdAt', sortOrder: 'desc' },
  { value: 'createdAt:asc', label: 'Oldest first', sortBy: 'createdAt', sortOrder: 'asc' },
  { value: 'fullName:asc', label: 'Name (A–Z)', sortBy: 'fullName', sortOrder: 'asc' },
  { value: 'fullName:desc', label: 'Name (Z–A)', sortBy: 'fullName', sortOrder: 'desc' },
  { value: 'officialEmail:asc', label: 'Email (A–Z)', sortBy: 'officialEmail', sortOrder: 'asc' },
  { value: 'employeeId:asc', label: 'Employee ID (A–Z)', sortBy: 'employeeId', sortOrder: 'asc' },
]

export function parseAdminSortPreset(preset = 'createdAt:desc') {
  const match = ADMIN_SORT_OPTIONS.find((opt) => opt.value === preset)
  if (match) {
    return { sortBy: match.sortBy, sortOrder: match.sortOrder }
  }
  const [sortBy, sortOrder] = String(preset).split(':')
  return {
    sortBy: sortBy || 'createdAt',
    sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
  }
}

export function buildAdminListParams({
  page = 1,
  limit = 10,
  search = '',
  roleId = 'all',
  centerId = 'all',
  sortPreset = 'createdAt:desc',
} = {}) {
  const { sortBy, sortOrder } = parseAdminSortPreset(sortPreset)
  /** @type {AdminListParams} */
  const params = { page, limit, sortBy, sortOrder }

  const trimmedSearch = String(search || '').trim()
  if (trimmedSearch) {
    params.search = trimmedSearch
  }
  if (roleId && roleId !== 'all') {
    params.roleId = roleId
  }
  if (centerId && centerId !== 'all') {
    params.centerId = centerId
  }

  return params
}

export function unwrapAdminRecord(data) {
  return data?.data ?? data
}

export function mapApiAdminToRow(data) {
  if (!data || typeof data !== 'object') return null

  const id = data._id || data.id || null
  const accountStatus =
    data.accountStatus !== undefined
      ? Boolean(data.accountStatus)
      : String(data.status || 'ACTIVE').toUpperCase() === 'ACTIVE'

  const status = String(data.status || (accountStatus ? 'ACTIVE' : 'INACTIVE')).toUpperCase()

  return {
    id: String(id || ''),
    fullName: String(data.fullName || '').trim() || '—',
    employeeName: String(data.fullName || '').trim() || '—',
    employeeId: String(data.employeeId || '').trim() || '—',
    officialEmail: String(data.officialEmail || '').trim() || '—',
    contactNumber: String(data.contactNumber || '').trim() || '—',
    roleId: String(data.roleId || ''),
    roleTitle: String(data.roleTitle || '').trim() || '—',
    roleCode: String(data.roleCode || '').trim().toUpperCase() || '',
    centerId: String(data.centerId || ''),
    centerName: String(data.centerName || '').trim() || '—',
    centerCode: String(data.centerCode || '').trim() || '',
    status,
    accountStatus,
    lastLoginAt: data.lastLoginAt ?? null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    createdBy: data.createdBy || null,
    _raw: data,
  }
}

export function normalizeAdminListResponse(data, { page = 1, limit = 10 } = {}) {
  const rows = (Array.isArray(data?.data) ? data.data : [])
    .map((row) => mapApiAdminToRow(row))
    .filter(Boolean)

  return {
    items: rows,
    total: data?.total ?? rows.length,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
    totalPages: data?.totalPages ?? Math.max(1, Math.ceil((data?.total ?? rows.length) / limit) || 1),
    count: data?.count ?? rows.length,
  }
}

export function filterAdminsByStatus(items, statusFilter) {
  if (!statusFilter || statusFilter === 'all') return items

  return items.filter((row) => {
    const active = isRecordStatusActive(row.status)
    if (statusFilter === 'Active') return active
    if (statusFilter === 'In Active' || statusFilter === 'INACTIVE') return !active
    return true
  })
}

/**
 * Build role filter dropdown options from admin list rows (not roles master API).
 * Dedupes by roleId; ignores empty/null/placeholder values.
 * @param {Array<{ roleId?: string, roleTitle?: string, roleName?: string, roleCode?: string }>} admins
 * @returns {Array<{ value: string, label: string, roleCode?: string }>}
 */
export function buildRoleFilterOptionsFromAdmins(admins = []) {
  const roleMap = new Map()

  for (const admin of admins) {
    if (!admin || typeof admin !== 'object') continue

    const roleId = String(admin.roleId || '').trim()
    const roleTitle = String(admin.roleTitle || admin.roleName || '').trim()

    if (!roleId || roleId === '—') continue
    if (!roleTitle || roleTitle === '—') continue

    if (!roleMap.has(roleId)) {
      roleMap.set(roleId, {
        value: roleId,
        label: roleTitle,
        roleCode: String(admin.roleCode || '').trim(),
      })
    }
  }

  return Array.from(roleMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }),
  )
}

export function buildCreateAdminPayload(form) {
  return {
    fullName: String(form.fullName || '').trim(),
    officialEmail: String(form.email || form.officialEmail || '').trim(),
    contactNumber: String(form.mobile || form.contactNumber || '').replace(/\D/g, ''),
    employeeId: String(form.employeeId || '').trim(),
    roleId: form.roleId,
    centerId: form.centerId,
    password: form.password,
    confirmPassword: form.confirmPassword,
  }
}

export function buildUpdateAdminPayload(form, { includePassword = false } = {}) {
  /** @type {import('./adminManagementHelpers').UpdateAdminPayload} */
  const payload = {
    fullName: String(form.fullName || '').trim(),
    officialEmail: String(form.email || form.officialEmail || '').trim(),
    contactNumber: String(form.mobile || form.contactNumber || '').replace(/\D/g, ''),
    employeeId: String(form.employeeId || '').trim(),
    roleId: form.roleId,
    centerId: form.centerId,
  }

  if (includePassword && form.password) {
    payload.password = form.password
    payload.confirmPassword = form.confirmPassword
  }

  return payload
}

export function mapAdminUserToForm(data, defaults = {}) {
  const user = unwrapAdminRecord(data) || {}
  const accountStatus =
    user.accountStatus !== undefined
      ? Boolean(user.accountStatus)
      : String(user.status || 'ACTIVE').toUpperCase() === 'ACTIVE'

  return {
    fullName: user.fullName || '',
    email: user.officialEmail || '',
    mobile: user.contactNumber || '',
    employeeId: user.employeeId || '',
    roleId: String(user.roleId || defaults.roleId || ''),
    centerId: String(user.centerId || defaults.centerId || ''),
    password: '',
    confirmPassword: '',
    active: accountStatus,
  }
}

export function mapRolesDropdownResponse(data) {
  const list = Array.isArray(data?.data) ? data.data : []
  return list
    .map((item) => {
      const label = String(item?.roleTitle || '').trim()
      const value = String(item?._id || '').trim()
      const roleCode = String(item?.roleCode || '').trim().toUpperCase()
      if (!label || !value) return null
      return { label, value, roleCode, raw: item }
    })
    .filter(Boolean)
}

export function mapCentersDropdownResponse(data) {
  const list = Array.isArray(data?.data) ? data.data : []
  return list
    .map((item) => {
      const label = String(item?.centerName || '').trim()
      const value = String(item?._id || '').trim()
      if (!label || !value) return null
      return {
        label,
        value,
        centerCode: String(item?.centerCode || '').trim(),
        city: String(item?.city || '').trim(),
        state: String(item?.state || '').trim(),
        raw: item,
      }
    })
    .filter(Boolean)
}

const FORM_FIELD_ALIASES = {
  officialEmail: 'email',
  contactNumber: 'mobile',
}

export function mapJoiErrorsToForm(errorPayload) {
  const errors = errorPayload?.error?.errors
  if (!Array.isArray(errors)) return {}

  return errors.reduce((acc, item) => {
    const field = FORM_FIELD_ALIASES[item?.field] || item?.field
    if (field && item?.message) {
      acc[field] = item.message
    }
    return acc
  }, {})
}
