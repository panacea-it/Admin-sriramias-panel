/**
 * Backward-compatible re-exports. New code should use adminManagementService + hooks/admin/*.
 */
import adminManagementService from './adminManagementService'
import {
  buildCreateAdminPayload,
  buildUpdateAdminPayload,
  mapAdminUserToForm,
  mapApiAdminToRow,
  mapCentersDropdownResponse,
  mapRolesDropdownResponse,
  normalizeAdminListResponse,
  unwrapAdminRecord,
} from '../utils/adminManagementHelpers'

export {
  mapApiAdminToRow,
  normalizeAdminListResponse,
  normalizeAdminListResponse as normalizeAdminUsersListResponse,
  mapAdminUserToForm,
  unwrapAdminRecord as unwrapAdminUserResponse,
  buildCreateAdminPayload as buildAdminAccessPayload,
  buildUpdateAdminPayload,
  mapRolesDropdownResponse,
  mapCentersDropdownResponse,
}

/** @deprecated Status filter is not supported by list API — kept for callers that still pass it */
export function mapAdminStatusFilterToApi(statusFilter) {
  const normalized = String(statusFilter || '').toLowerCase()
  if (normalized === 'all') return 'ALL'
  if (
    normalized === 'in active' ||
    normalized === 'inactive' ||
    normalized === 'disabled'
  ) {
    return 'INACTIVE'
  }
  return 'ACTIVE'
}

export const getAdminUsers = (params) => adminManagementService.getAdmins(params)
export const createAdminUser = (payload) => adminManagementService.createAdmin(payload)
export const getAdminUserById = (id) => adminManagementService.getAdminById(id)
export const updateAdminUser = (id, payload) => adminManagementService.updateAdmin(id, payload)
export const updateAdminStatus = (id, status) => adminManagementService.updateAdminStatus(id, status)
export const deleteAdminUser = (id) => adminManagementService.deleteAdmin(id)
export const getRolesDropdown = () => adminManagementService.getRolesDropdown()
export const getCentersDropdown = () => adminManagementService.getCentersDropdown()

export async function fetchRolesDropdownOptions() {
  const data = await getRolesDropdown()
  return mapRolesDropdownResponse(data)
}

export async function fetchCentersDropdownOptions() {
  const data = await getCentersDropdown()
  return mapCentersDropdownResponse(data)
}
