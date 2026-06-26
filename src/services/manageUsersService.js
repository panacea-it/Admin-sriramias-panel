/**
 * Manage Users helpers — re-exports from centralized user layer.
 * @deprecated Import from userService / userHelpers directly for new code.
 */
import userService from './userService'
import {
  buildUserListParams,
  getRecordTypeQuery,
  isAdminRow,
  isStudentRow,
  mapApiStatusToUi,
  mapApiUserListRow,
  normalizeCenterFilterOptions,
  normalizeCenterFormDropdown,
  normalizeCreateRoleOptions,
  normalizeRoleDropdownOptions,
  normalizeUserDetailResponse,
  normalizeUserListResponse,
} from '../utils/userHelpers'

export {
  isStudentRow,
  isAdminRow,
  getRecordTypeQuery,
  mapApiStatusToUi,
  mapApiUserListRow,
  normalizeUserListResponse,
  normalizeUserDetailResponse,
  normalizeRoleDropdownOptions,
  normalizeCenterFilterOptions,
  normalizeCenterFormDropdown,
  normalizeCreateRoleOptions,
  buildUserListParams,
}

/** @deprecated Use isStudentRow */
export const isStaffRow = (row) => Boolean(row) && !isStudentRow(row)

/** @deprecated Use getRecordTypeQuery */
export function getStudentTypeQuery(row) {
  return getRecordTypeQuery(row) === 'STUDENT' ? 'STUDENT' : 'USER'
}

export function mapManageUserStatusFilterToApi(statusFilter) {
  const normalized = String(statusFilter || '').toLowerCase()
  if (normalized === 'all') return ''
  if (normalized === 'in active' || normalized === 'inactive' || normalized === 'disabled') {
    return 'INACTIVE'
  }
  return 'ACTIVE'
}

export function normalizeManageUsersListResponse(data, options) {
  return normalizeUserListResponse(data, options)
}

export function normalizeUserRolesDropdown(data) {
  return normalizeRoleDropdownOptions(data)
}

export function normalizeUserCentersDropdown(data) {
  return normalizeCenterFilterOptions(data)
}

export function unwrapStudentSummary(data) {
  return data?.summary ?? data?.data?.summary ?? data?.data ?? data
}

export function mapStudentSummaryToForm(summary, centerOptions = []) {
  const row = mapApiUserListRow(summary) || {}
  const centerMatch =
    centerOptions.find((c) => c.value === row.centerId) ||
    centerOptions.find(
      (c) =>
        String(c.label).trim().toLowerCase() ===
        String(row.assignedCenter).trim().toLowerCase(),
    )

  return {
    fullName: row.fullName === '—' ? '' : row.fullName,
    email: row.email,
    phone: row.phoneNumber || row.phone,
    parentName: row.parentName,
    parentPhone: row.parentMobile || row.parentPhone,
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
  const row = mapApiUserListRow(data) || {}
  return {
    ...row,
    userId: row.userId || row._raw?.employeeId || '—',
    role: row.role || row._raw?.roleTitle || '—',
  }
}

function buildListParams(options = {}) {
  return buildUserListParams({
    page: options.page,
    limit: options.pageSize,
    search: options.debouncedSearch,
    roleFilter: options.roleFilter,
    centerFilter: options.centerFilter,
    statusFilter: options.statusFilter,
    recordTypeFilter: options.recordTypeFilter,
  })
}

export const getManageUsers = (params) => userService.getUsers(params)

export async function fetchManageUsersList(options = {}) {
  const params = buildListParams(options)
  const data = await userService.getUsers(params)
  return normalizeUserListResponse(data, {
    page: options.page,
    limit: options.pageSize,
  })
}

export const getStudentUserById = (id, row) =>
  userService.getUserById(id, getRecordTypeQuery(row))

export const updateStudentUser = (id, row, body) =>
  userService.updateUser(id, body, getRecordTypeQuery(row))

export const deleteStudentUser = (id, row) =>
  userService.deleteUser(id, getRecordTypeQuery(row))

export const updateStudentUserStatus = (id, row, status) => {
  const recordType = getRecordTypeQuery(row)
  if (recordType === 'ADMIN') {
    return userService.updateAdminStatus(id, status)
  }
  return userService.updateUserStatus(id, status, recordType)
}

export const getUserRolesDropdown = () => userService.getRoleDropdown()

export const getUserCentersDropdown = () => userService.getCenterDropdown()
