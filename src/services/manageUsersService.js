import api from '../config/api'
import { throwApiError } from '../utils/apiError'
import { normalizeCentersDropdown } from './centerService'

/** Student row → Student APIs */
export function isStudentRow(row) {
  if (!row) return false
  if (row.roleType) {
    return String(row.roleType).trim().toUpperCase() === 'STUDENT'
  }
  return String(row.role ?? '').trim().toLowerCase() === 'student'
}

/** Any staff/admin role → Admin Access APIs */
export function isStaffRow(row) {
  return Boolean(row) && !isStudentRow(row)
}

export function getStudentTypeQuery(row) {
  return row?.recordType === 'STUDENT' ? 'STUDENT' : 'USER'
}

export function mapManageUserStatusFilterToApi(statusFilter) {
  const normalized = String(statusFilter || '').toLowerCase()
  if (normalized === 'all') return 'ALL'
  if (normalized === 'in active' || normalized === 'inactive' || normalized === 'disabled') {
    return 'INACTIVE'
  }
  return 'ACTIVE'
}

export function mapApiStatusToUi(status) {
  if (typeof status === 'boolean') return status ? 'Active' : 'In Active'
  const normalized = String(status ?? '').trim().toUpperCase()
  if (normalized === 'ACTIVE' || normalized === 'ENABLED') return 'Active'
  if (normalized === 'INACTIVE' || normalized === 'DISABLED') return 'In Active'
  return 'In Active'
}

function resolveCenterLabel(data) {
  if (!data || typeof data !== 'object') return ''
  if (typeof data.center === 'string') return data.center.trim()
  if (data.center && typeof data.center === 'object') {
    return String(data.center.centerName || data.center.name || data.center.label || '').trim()
  }
  if (data.centerId && typeof data.centerId === 'object') {
    return String(data.centerId.centerName || data.centerId.name || data.centerId.label || '').trim()
  }
  return String(data.centerName || data.assignedCenter || '').trim()
}

function resolveCenterId(data) {
  if (!data || typeof data !== 'object') return ''
  if (typeof data.centerId === 'string') return data.centerId
  if (data.centerId && typeof data.centerId === 'object') {
    return String(data.centerId._id || data.centerId.id || '')
  }
  if (data.center && typeof data.center === 'object') {
    return String(data.center._id || data.center.id || '')
  }
  return ''
}

export function mapApiManageUserToRow(data) {
  if (!data || typeof data !== 'object') return null

  const id = data.id || data._id
  if (!id) return null

  const permissions = data.permissions || {}
  const statusUi = mapApiStatusToUi(data.status ?? data.isActive ?? data.accountStatus)

  return {
    id: String(id),
    userId: String(
      data.userId ||
        data.employeeId ||
        data.studentId ||
        data.studentRecordId ||
        data.referenceId ||
        '',
    ).trim(),
    fullName: String(data.fullName || data.name || '').trim() || '—',
    email: String(data.email || data.officialEmail || '').trim(),
    phone: String(data.mobile || data.phoneNumber || data.phone || data.contactNumber || '').trim(),
    role: String(data.role || data.roleTitle || '').trim() || '—',
    roleType: String(data.roleType || '').trim().toUpperCase(),
    recordType: String(data.recordType || '').trim().toUpperCase(),
    roleId: String(data.roleId || '').trim(),
    assignedCenter: resolveCenterLabel(data) || '—',
    centerId: resolveCenterId(data),
    status: statusUi,
    joinedAt: data.joinedAt || data.createdAt || data.createdOn || null,
    updatedAt: data.updatedAt || null,
    parentName: String(data.parentName || '').trim(),
    parentPhone: String(data.parentMobile || data.parentPhone || '').trim(),
    profileImage: data.profileImage || data.avatar || '',
    permissions: {
      canView: permissions.canView !== false,
      canEdit: Boolean(permissions.canEdit),
      canDelete: Boolean(permissions.canDelete),
    },
    editDisabledReason: data.editDisabledReason || '',
    deleteDisabledReason: data.deleteDisabledReason || '',
    studentRecordId: data.studentRecordId ? String(data.studentRecordId) : '',
    _raw: data,
  }
}

export function normalizeManageUsersListResponse(data, { page = 1, limit = 10 } = {}) {
  const itemsRaw = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.users)
        ? data.users
        : []

  const items = itemsRaw.map((row) => mapApiManageUserToRow(row)).filter(Boolean)
  const total = data?.total ?? items.length
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1)

  return {
    items,
    total,
    totalPages,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
  }
}

export function normalizeUserRolesDropdown(data) {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : data?.data?.roles || data?.roles || data?.items || []

  const options = (Array.isArray(list) ? list : [])
    .map((item) => ({
      label: String(item.label || item.roleTitle || item.name || '').trim(),
      value: String(item.value || item._id || item.id || item.roleId || '').trim(),
    }))
    .filter((opt) => opt.label && opt.value)

  const hasStudent = options.some((opt) => opt.value.toUpperCase() === 'STUDENT')
  return hasStudent ? options : [{ value: 'STUDENT', label: 'Student' }, ...options]
}

export function normalizeUserCentersDropdown(data) {
  return normalizeCentersDropdown(data)
}

export function unwrapStudentSummary(data) {
  return data?.summary ?? data?.data?.summary ?? data?.data ?? data
}

export function mapStudentSummaryToForm(summary, centerOptions = []) {
  const row = mapApiManageUserToRow(summary) || {}
  const centerMatch =
    centerOptions.find((c) => c.value === row.centerId) ||
    centerOptions.find(
      (c) => String(c.label).trim().toLowerCase() === String(row.assignedCenter).trim().toLowerCase(),
    )

  return {
    fullName: row.fullName === '—' ? '' : row.fullName,
    email: row.email,
    phone: row.phone,
    parentName: row.parentName,
    parentPhone: row.parentPhone,
    role: 'student',
    assignedCenter: centerMatch?.value || row.centerId || row.assignedCenter || '',
    status: row.status,
    profileImage: row.profileImage,
  }
}

export function buildStudentUpdatePayload(form, centerOptions = []) {
  const centerMatch = centerOptions.find((c) => c.value === form.assignedCenter)
  const centerId = centerMatch?.value || form.assignedCenter || undefined

  return {
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    mobile: form.phone.trim(),
    parentName: form.parentName?.trim() || '',
    parentMobile: form.parentPhone?.trim() || '',
    centerId,
    status: form.status === 'Active',
  }
}

export function mapAdminAccessToViewUser(data) {
  const row = mapApiManageUserToRow(data) || {}
  return {
    ...row,
    userId: row.userId || row._raw?.employeeId || '—',
    role: row.role || row._raw?.roleTitle || '—',
  }
}

function buildListParams({
  page,
  pageSize,
  statusFilter,
  debouncedSearch,
  roleFilter,
  centerFilter,
}) {
  const params = {
    page,
    limit: pageSize,
    status: mapManageUserStatusFilterToApi(statusFilter),
    role: 'ALL',
    centerId: 'ALL',
  }

  const search = debouncedSearch.trim()
  if (search) params.search = search

  if (roleFilter && roleFilter !== 'all') {
    params.role = roleFilter
  }

  if (centerFilter && centerFilter !== 'all') {
    params.centerId = centerFilter
  }

  return params
}

export const getManageUsers = async (params = {}) => {
  try {
    const response = await api.get('/api/admin/users', { params })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function fetchManageUsersList(options = {}) {
  const params = buildListParams(options)
  const data = await getManageUsers(params)
  return normalizeManageUsersListResponse(data, {
    page: options.page,
    limit: options.pageSize,
  })
}

export const getStudentUserById = async (id, row) => {
  try {
    const type = getStudentTypeQuery(row)
    const response = await api.get(`/api/admin/users/${id}`, { params: { type } })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export const updateStudentUser = async (id, row, body) => {
  try {
    const type = getStudentTypeQuery(row)
    const response = await api.put(`/api/admin/users/${id}`, body, { params: { type } })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export const deleteStudentUser = async (id, row) => {
  try {
    const type = getStudentTypeQuery(row)
    const response = await api.delete(`/api/admin/users/${id}`, { params: { type } })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export const updateStudentUserStatus = async (id, row, status) => {
  try {
    const type = getStudentTypeQuery(row)
    const response = await api.patch(
      `/api/admin/users/${id}/status`,
      { status: Boolean(status) },
      { params: { type } },
    )
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export const getUserRolesDropdown = async () => {
  try {
    const response = await api.get('/api/admin/user-roles')
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export const getUserCentersDropdown = async () => {
  try {
    const response = await api.get('/api/admin/user-centers')
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}
