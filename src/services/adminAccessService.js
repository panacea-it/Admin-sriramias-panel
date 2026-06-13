import api from '../config/api'
import { throwApiError } from '../utils/apiError'
import { normalizeCentersDropdown } from './centerService'
import { normalizeRolesDropdown } from './roleService'

export function mapAdminStatusFilterToApi(statusFilter) {
  const normalized = String(statusFilter || '').toLowerCase()
  if (normalized === 'all') return 'ALL'
  if (normalized === 'in active' || normalized === 'inactive' || normalized === 'disabled') {
    return 'INACTIVE'
  }
  return 'ACTIVE'
}

export function mapApiAdminToRow(data) {
  if (!data || typeof data !== 'object') return null

  const id = data._id || data.id || data.adminAccessId || null
  const accountStatus =
    data.accountStatus !== undefined
      ? Boolean(data.accountStatus)
      : String(data.status || 'ACTIVE').toUpperCase() === 'ACTIVE'

  const role =
    data.role && typeof data.role === 'object'
      ? data.role
      : data.roleId && typeof data.roleId === 'object'
        ? data.roleId
        : null

  const center =
    data.center && typeof data.center === 'object'
      ? data.center
      : data.centerId && typeof data.centerId === 'object'
        ? data.centerId
        : Array.isArray(data.centers) && data.centers.length > 0
          ? data.centers[0]
          : null

  const roleId = String(role?._id || role?.id || data.roleId || '')
  const centerId = String(
    center?._id || center?.id || center?.centerId || data.centerId || '',
  )
  const centerNames = Array.isArray(data.centers)
    ? data.centers
        .map((c) => String(c?.centerName || c?.name || '').trim())
        .filter(Boolean)
    : []

  return {
    id: String(id || ''),
    employeeName: String(data.fullName || data.name || '').trim() || '—',
    employeeId: String(data.employeeId || '').trim() || '—',
    roleId,
    roleTitle: String(role?.roleTitle || role?.label || data.roleTitle || '').trim() || '—',
    centerId,
    centerName:
      centerNames.length > 0
        ? centerNames.join(', ')
        : String(center?.centerName || data.centerName || '').trim(),
    status: accountStatus ? 'Active' : 'In Active',
    createdAt: data.createdAt || data.createdOn || null,
    officialEmail: String(data.officialEmail || data.email || '').trim(),
    contactNumber: String(data.contactNumber || data.phone || '').trim(),
    accountStatus,
    twoFactorEnabled: Boolean(data.twoFactorEnabled),
    loginAlertEnabled: Boolean(data.loginAlertEnabled),
    sessionTimeout: data.sessionTimeout || null,
    _raw: data,
  }
}

export function normalizeAdminUsersListResponse(data, { page = 1, limit = 10 } = {}) {
  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === 'object' ? data.data : data

  const itemsRaw =
    payload?.adminAccess ||
    payload?.adminAccessRecords ||
    payload?.adminUsers ||
    payload?.users ||
    payload?.items ||
    payload?.results ||
    data?.adminAccess ||
    data?.adminAccessRecords ||
    data?.items ||
    (Array.isArray(payload) ? payload : Array.isArray(data?.data) ? data.data : [])

  const items = (Array.isArray(itemsRaw) ? itemsRaw : [])
    .map((row) => mapApiAdminToRow(row))
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

export function unwrapAdminUserResponse(data) {
  return data?.data ?? data?.adminAccess ?? data?.user ?? data
}

export function mapSessionTimeoutToApi(uiValue) {
  const map = {
    '15': '15_MINUTES',
    '30': '30_MINUTES',
    '60': '1_HOUR',
    '120': '2_HOURS',
    '480': '8_HOURS',
  }
  return map[String(uiValue)] || '1_HOUR'
}

export function mapSessionTimeoutFromApi(apiValue) {
  const map = {
    '15_MINUTES': '15',
    '30_MINUTES': '30',
    '1_HOUR': '60',
    '2_HOURS': '120',
    '8_HOURS': '480',
  }
  return map[String(apiValue)] || '60'
}

export function buildAdminAccessPayload(form, { isEdit = false, includePassword = true } = {}) {
  const payload = {
    fullName: form.fullName.trim(),
    officialEmail: form.email.trim(),
    contactNumber: String(form.mobile || '').replace(/\D/g, ''),
    employeeId: form.employeeId.trim(),
    roleId: form.roleId,
    centerId: form.centerId,
    accountStatus: Boolean(form.active),
    twoFactorEnabled: Boolean(form.twoFactor),
    loginAlertEnabled: Boolean(form.loginAlert),
    sessionTimeout: mapSessionTimeoutToApi(form.sessionTimeout),
  }

  if (includePassword && (!isEdit || form.password)) {
    payload.password = form.password
    payload.confirmPassword = form.confirmPassword
  }

  return payload
}

export function mapAdminUserToForm(data, defaults = {}) {
  const user = unwrapAdminUserResponse(data) || {}
  const role =
    user.role && typeof user.role === 'object'
      ? user.role
      : user.roleId && typeof user.roleId === 'object'
        ? user.roleId
        : null
  const center =
    user.center && typeof user.center === 'object'
      ? user.center
      : user.centerId && typeof user.centerId === 'object'
        ? user.centerId
        : null

  const accountStatus =
    user.accountStatus !== undefined
      ? Boolean(user.accountStatus)
      : String(user.status || 'ACTIVE').toUpperCase() === 'ACTIVE'

  return {
    fullName: user.fullName || user.name || '',
    email: user.officialEmail || user.email || '',
    mobile: user.contactNumber || user.phone || '',
    employeeId: user.employeeId || '',
    roleId: String(role?._id || role?.id || user.roleId || defaults.roleId || ''),
    centerId: String(center?._id || center?.id || user.centerId || defaults.centerId || ''),
    password: '',
    confirmPassword: '',
    active: accountStatus,
    twoFactor: Boolean(user.twoFactorEnabled),
    sessionTimeout: mapSessionTimeoutFromApi(user.sessionTimeout),
    loginAlert: user.loginAlertEnabled !== undefined ? Boolean(user.loginAlertEnabled) : true,
  }
}

export const getAdminUsers = async (params = {}) => {
  try {
    const response = await api.get('/api/admin/admin-access', { params })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export const createAdminUser = async (payload) => {
  try {
    const response = await api.post('/api/admin/admin-access', payload)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export const getAdminUserById = async (adminAccessId) => {
  try {
    const response = await api.get(`/api/admin/admin-access/${adminAccessId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export const updateAdminUser = async (adminAccessId, payload) => {
  try {
    const response = await api.put(`/api/admin/admin-access/${adminAccessId}`, payload)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export const updateAdminStatus = async (adminAccessId, status) => {
  try {
    const response = await api.patch(`/api/admin/admin-access/${adminAccessId}/status`, {
      status: Boolean(status),
    })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export const deleteAdminUser = async (adminAccessId) => {
  try {
    const response = await api.delete(`/api/admin/admin-access/${adminAccessId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export const getRolesDropdown = async () => {
  try {
    const response = await api.get('/api/admin/user-roles')
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export const getCentersDropdown = async () => {
  try {
    const response = await api.get('/api/admin/centers/dropdown')
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function fetchRolesDropdownOptions() {
  const data = await getRolesDropdown()
  return normalizeRolesDropdown(data)
}

export async function fetchCentersDropdownOptions() {
  const data = await getCentersDropdown()
  return normalizeCentersDropdown(data)
}
