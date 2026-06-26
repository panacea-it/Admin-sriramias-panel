import api from '../config/api'
import { throwApiError } from '../utils/apiError'

async function request(promise) {
  try {
    const response = await promise
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

const BASE = '/api/admin/roles'
const PERM_BASE = '/api/admin/permissions'

export const roleAccessService = {
  /** GET /api/admin/roles */
  getRoleAccessList: (params = {}) => request(api.get(BASE, { params })),

  /** GET /api/admin/roles/:id */
  getRoleAccessById: (id) => request(api.get(`${BASE}/${id}`)),

  /** POST /api/admin/roles */
  createRoleAccess: (payload) => request(api.post(BASE, payload)),

  /** PUT /api/admin/roles/:id */
  updateRoleAccess: (id, payload) => request(api.put(`${BASE}/${id}`, payload)),

  /** PATCH /api/admin/roles/:id/status */
  updateRoleAccessStatus: (id, status) =>
    request(api.patch(`${BASE}/${id}/status`, { status })),

  /** DELETE /api/admin/roles/:id */
  deleteRoleAccess: (id) => request(api.delete(`${BASE}/${id}`)),

  /** GET /api/admin/roles/dropdown — ACTIVE roles only */
  getRoleDropdown: () => request(api.get(`${BASE}/dropdown`)),

  /** GET /api/admin/permissions/modules */
  getPermissionModules: () => request(api.get(`${PERM_BASE}/modules`)),

  /** GET /api/admin/permissions/role/:roleId */
  getPermissionMatrixByRole: (roleId) => request(api.get(`${PERM_BASE}/role/${roleId}`)),

  /** GET /api/admin/permissions */
  getPermissionMatrixAll: (params = {}) => request(api.get(PERM_BASE, { params })),

  /** PATCH /api/admin/permissions/:permissionId */
  updateFeaturePermission: (permissionId, payload) =>
    request(api.patch(`${PERM_BASE}/${permissionId}`, payload)),

  /** PATCH /api/admin/permissions/:permissionId/enable-all */
  enableAllModulePermissions: (permissionId) =>
    request(api.patch(`${PERM_BASE}/${permissionId}/enable-all`)),

  /** PATCH /api/admin/permissions/:permissionId/restrict-all */
  restrictAllModulePermissions: (permissionId) =>
    request(api.patch(`${PERM_BASE}/${permissionId}/restrict-all`)),

  /** PATCH /api/admin/permissions/:permissionId/reset */
  resetModulePermissions: (permissionId) =>
    request(api.patch(`${PERM_BASE}/${permissionId}/reset`)),

  /** POST /api/admin/permissions/sync-bulk */
  syncPermissionMatrixBulk: (payload) =>
    request(api.post(`${PERM_BASE}/sync-bulk`, payload)),
}

export default roleAccessService
